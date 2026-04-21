const redis = require('redis');

// Initialize Redis Client (v4 syntax)
const client = redis.createClient({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379
});

client.on('error', (err) => console.error('Redis Error:', err));
client.connect().catch(console.error);

/**
 * STEP 2: Triage (Priority Assignment)
 */
const getPriority = (type) => {
  if (type === "emergency") return 1;
  if (type === "urgent") return 2;
  return 3;
};

/**
 * STEP 3: Department Routing
 */
const getDepartment = (symptom) => {
  const s = symptom.toLowerCase();
  if (s.includes("heart") || s.includes("chest")) return "cardiology";
  if (s.includes("fever") || s.includes("cold")) return "general";
  if (s.includes("bone") || s.includes("fracture")) return "orthopedic";
  return "general";
};

/**
 * STEP 4: Doctor Assignment
 */
const assignDoctor = async (doctors) => {
  let bestDoctor = null;
  let minQueue = Infinity;

  for (let doc of doctors) {
    const len = await client.zCard(`queue:doctor:${doc}`);
    if (len < minQueue) {
      minQueue = len;
      bestDoctor = doc;
    }
  }
  return bestDoctor;
};

/**
 * STEP 5 & 6: Token Generation & Add to Queue
 */
const addToQueue = async (doctorId, patient, priority) => {
  const token = await client.incr("token:counter");
  const key = `queue:doctor:${doctorId}`;
  const timestamp = Date.now();
  
  // Priority scoring: lower score = higher priority. 
  // Priority 1 (Emergency) < Priority 2 < Priority 3
  const score = priority * 1e13 + timestamp;

  const data = JSON.stringify({
    token: `TKN-${token}`,
    patientId: patient.id,
    priority,
    doctorId,
    time: timestamp
  });

  await client.zAdd(key, { score, value: data });
  return `TKN-${token}`;
};

/**
 * STEP 8: Doctor Calls Next Patient
 */
const getNextPatient = async (doctorId) => {
  // Check emergency queue first
  let result = await client.zPopMin("queue:emergency");
  
  // If no emergency, check doctor's normal queue
  if (!result || result.length === 0) {
    result = await client.zPopMin(`queue:doctor:${doctorId}`);
  }

  if (!result || result.length === 0) return null;

  return JSON.parse(result.value);
};

/**
 * STEP 11: Lab / Pharmacy Handling
 */
const routeToLab = async (patientData, priority) => {
  const timestamp = Date.now();
  const score = priority * 1e13 + timestamp;
  await client.zAdd("queue:lab", { score, value: JSON.stringify(patientData) });
};

module.exports = {
  getPriority,
  getDepartment,
  assignDoctor,
  addToQueue,
  getNextPatient,
  routeToLab,
  client
};
