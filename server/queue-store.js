const redis = require('redis');
const { randomUUID } = require('crypto');

const QUEUE_ACTIVE_KEY = 'queue:active';
const TOKEN_COUNTER_KEY = 'queue:token:counter';

const createRedisClient = () => {
  if (process.env.REDIS_URL) {
    return redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        tls: process.env.REDIS_TLS === 'true',
      },
    });
  }

  return redis.createClient({
    socket: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT || 6379),
      tls: process.env.REDIS_TLS === 'true',
    },
    password: process.env.REDIS_PASSWORD || undefined,
  });
};

const client = createRedisClient();
let connectPromise;

client.on('error', (err) => {
  console.error('Redis queue store error:', err.message);
});

const connectQueueStore = async () => {
  if (client.isOpen) return client;
  if (!connectPromise) {
    connectPromise = client.connect().then(() => {
      console.log('✅ Redis/Memorystore queue connected');
      return client;
    });
  }
  return connectPromise;
};

const ensureQueueStore = async () => {
  await connectQueueStore();
  if (!client.isReady) {
    throw new Error('Queue store is not ready');
  }
};

const doctorQueueKey = (doctorId) => `queue:doctor:${doctorId}`;
const entryKey = (entryId) => `queue:entry:${entryId}`;

const queueScore = (priority, createdAt) => Number(priority) * 1e13 + new Date(createdAt).getTime();

const normalizeEntry = (entry) => ({
  ...entry,
  priority: Number(entry.priority),
  age: entry.age === undefined || entry.age === null || entry.age === '' ? undefined : Number(entry.age),
  createdAt: entry.createdAt || new Date().toISOString(),
  calledAt: entry.calledAt || null,
  completedAt: entry.completedAt || null,
});

const readEntry = async (entryId) => {
  const raw = await client.get(entryKey(entryId));
  return raw ? normalizeEntry(JSON.parse(raw)) : null;
};

const writeEntry = async (entry) => {
  const normalized = normalizeEntry(entry);
  await client.set(entryKey(normalized._id), JSON.stringify(normalized));
  return normalized;
};

const readEntries = async (ids) => {
  if (!ids.length) return [];
  const rawEntries = await client.mGet(ids.map(entryKey));
  return rawEntries
    .filter(Boolean)
    .map((raw) => normalizeEntry(JSON.parse(raw)));
};

const nextToken = async () => {
  await ensureQueueStore();
  const value = await client.incr(TOKEN_COUNTER_KEY);
  return `TKN-${String(value).padStart(4, '0')}`;
};

const enqueuePatient = async (entryData) => {
  await ensureQueueStore();
  const createdAt = new Date().toISOString();
  const entry = normalizeEntry({
    _id: randomUUID(),
    token: await nextToken(),
    status: 'waiting',
    createdAt,
    ...entryData,
  });
  const score = queueScore(entry.priority, entry.createdAt);

  await writeEntry(entry);
  await Promise.all([
    client.zAdd(doctorQueueKey(entry.doctorId), { score, value: entry._id }),
    client.zAdd(QUEUE_ACTIVE_KEY, { score, value: entry._id }),
  ]);

  return entry;
};

const getDoctorQueue = async (doctorId) => {
  await ensureQueueStore();
  const [waitingIds, activeIds] = await Promise.all([
    client.zRange(doctorQueueKey(doctorId), 0, -1),
    client.zRange(QUEUE_ACTIVE_KEY, 0, -1),
  ]);
  const entries = await readEntries([...new Set([...waitingIds, ...activeIds])]);
  return entries
    .filter((entry) => String(entry.doctorId) === String(doctorId))
    .filter((entry) => ['waiting', 'in_consultation'].includes(entry.status))
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'in_consultation' ? -1 : 1;
      return queueScore(a.priority, a.createdAt) - queueScore(b.priority, b.createdAt);
    });
};

const getDoctorWaitingQueue = async (doctorId) => {
  await ensureQueueStore();
  const ids = await client.zRange(doctorQueueKey(doctorId), 0, -1);
  const entries = await readEntries(ids);
  return entries
    .filter((entry) => entry.status === 'waiting')
    .sort((a, b) => queueScore(a.priority, a.createdAt) - queueScore(b.priority, b.createdAt));
};

const countDoctorWaiting = async (doctorId) => {
  await ensureQueueStore();
  return client.zCard(doctorQueueKey(doctorId));
};

const getActiveEntries = async () => {
  await ensureQueueStore();
  const ids = await client.zRange(QUEUE_ACTIVE_KEY, 0, -1);
  const entries = await readEntries(ids);
  return entries
    .filter((entry) => ['waiting', 'in_consultation'].includes(entry.status))
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'in_consultation' ? -1 : 1;
      return queueScore(a.priority, a.createdAt) - queueScore(b.priority, b.createdAt);
    });
};

const getQueueOverview = async (doctorStats = {}) => {
  const activeEntries = await getActiveEntries();
  const queueLength = activeEntries.filter((entry) => entry.status === 'waiting').length;
  const inConsultation = activeEntries.filter((entry) => entry.status === 'in_consultation').length;

  return {
    queueLength,
    activePatients: activeEntries.length,
    inConsultation,
    totalDoctors: doctorStats.totalDoctors || 0,
    availableDoctors: doctorStats.availableDoctors || 0,
    concurrentOps: inConsultation,
    processingQueueSize: queueLength,
    message: 'Live queue status',
  };
};

const callNextPatient = async (doctorId) => {
  await ensureQueueStore();
  const queueKey = doctorQueueKey(doctorId);
  const ids = await client.zRange(queueKey, 0, 0);
  if (!ids.length) return null;

  const entry = await readEntry(ids[0]);
  await client.zRem(queueKey, ids[0]);
  if (!entry || entry.status !== 'waiting') {
    return callNextPatient(doctorId);
  }

  const updatedEntry = await writeEntry({
    ...entry,
    status: 'in_consultation',
    calledAt: new Date().toISOString(),
  });
  await client.zAdd(QUEUE_ACTIVE_KEY, {
    score: queueScore(updatedEntry.priority, updatedEntry.createdAt),
    value: updatedEntry._id,
  });

  return updatedEntry;
};

const completeEntry = async ({ queueEntryId, patientId, doctorId }) => {
  await ensureQueueStore();
  let entry = queueEntryId ? await readEntry(queueEntryId) : null;

  if (!entry && patientId && doctorId) {
    const activeEntries = await getActiveEntries();
    entry = activeEntries.find((item) => (
      item.patientId === patientId &&
      String(item.doctorId) === String(doctorId) &&
      item.status === 'in_consultation'
    ));
  }

  if (!entry) return null;

  const completed = await writeEntry({
    ...entry,
    status: 'completed',
    completedAt: new Date().toISOString(),
  });

  await Promise.all([
    client.zRem(QUEUE_ACTIVE_KEY, completed._id),
    client.zRem(doctorQueueKey(completed.doctorId), completed._id),
  ]);

  return completed;
};

module.exports = {
  client,
  connectQueueStore,
  ensureQueueStore,
  enqueuePatient,
  getDoctorQueue,
  getDoctorWaitingQueue,
  countDoctorWaiting,
  getActiveEntries,
  getQueueOverview,
  callNextPatient,
  completeEntry,
};
