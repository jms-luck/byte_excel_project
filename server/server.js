require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const socketIo = require('socket.io');
const http = require('http');

const {
  PatientHistory,
  Report,
  Appointment,
  Inventory,
  Bed,
  Doctor
} = require('./models');

const {
  connectQueueStore,
  enqueuePatient,
  getDoctorQueue,
  countDoctorWaiting,
  getActiveEntries,
  getQueueOverview: getRedisQueueOverview,
  callNextPatient,
  completeEntry,
} = require('./queue-store');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital-queue', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ MongoDB connected');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
});

connectQueueStore().catch((err) => {
  console.error('❌ Redis/Memorystore connection error:', err.message);
});

const normalizeDepartment = (department) => {
  const key = String(department || '').toLowerCase();
  if (key.includes('card')) return 'Cardiology';
  if (key.includes('ortho') || key.includes('bone')) return 'Orthopedics';
  if (key.includes('neuro') || key.includes('brain')) return 'Neurology';
  if (key.includes('emergency')) return 'Emergency';
  return 'General Medicine';
};

const getPriorityInfo = (symptoms = '') => {
  const s = symptoms.toLowerCase();
  if (s.includes('chest pain') || s.includes('breathing') || s.includes('emergency') || s.includes('bleeding')) {
    return { priority: 1, priorityLabel: 'Emergency' };
  }
  if ((s.includes('fever') && s.includes('high')) || s.includes('pain')) {
    return { priority: 2, priorityLabel: 'Urgent' };
  }
  return { priority: 3, priorityLabel: 'Normal' };
};

const getDepartmentFromSymptoms = (symptoms = '') => {
  const s = symptoms.toLowerCase();
  if (s.includes('heart') || s.includes('chest')) return 'Cardiology';
  if (s.includes('bone') || s.includes('fracture') || s.includes('joint')) return 'Orthopedics';
  if (s.includes('headache') || s.includes('brain')) return 'Neurology';
  return 'General Medicine';
};

const serializeQueueEntry = (entry) => ({
  _id: entry._id,
  token: entry.token,
  patientId: entry.patientId,
  patientName: entry.patientName,
  name: entry.patientName,
  age: entry.age,
  symptoms: entry.symptoms,
  priority: entry.priority,
  priorityLabel: entry.priorityLabel,
  department: entry.department,
  doctorId: entry.doctorId,
  doctorName: entry.doctorName,
  status: entry.status,
  time: entry.createdAt,
  createdAt: entry.createdAt,
  calledAt: entry.calledAt,
  completedAt: entry.completedAt
});

const getQueueOverview = async () => {
  const [totalDoctors, availableDoctors] = await Promise.all([
    Doctor.countDocuments(),
    Doctor.countDocuments({ availability: true })
  ]);

  return getRedisQueueOverview({ totalDoctors, availableDoctors });
};

const emitQueueUpdates = async (doctorId, extra = {}) => {
  const queryDoctorId = doctorId?.toString();
  const [queueLength, overview] = await Promise.all([
    queryDoctorId ? countDoctorWaiting(queryDoctorId) : Promise.resolve(0),
    getQueueOverview()
  ]);

  if (queryDoctorId) {
    io.emit('queue_update', { doctorId: queryDoctorId, queueLength, ...extra });
  }
  io.emit('queue_overview_update', overview);
};

const emitDoctorsUpdated = async () => {
  const doctors = await Doctor.find().sort({ department: 1, name: 1 });
  io.emit('doctors_updated', doctors);
  io.emit('available_doctors_updated', doctors.filter((doctor) => doctor.availability));
  io.emit('queue_overview_update', await getQueueOverview());
};

const emitAppointmentsUpdated = async () => {
  const appointments = await Appointment.find().sort({ date: 1 });
  io.emit('appointments_updated', appointments);
};

const assignDoctorFromDb = async (department) => {
  const normalizedDepartment = normalizeDepartment(department);
  let candidates = await Doctor.find({ availability: true, department: normalizedDepartment });

  if (!candidates.length) {
    candidates = await Doctor.find({ availability: true });
  }

  if (!candidates.length) {
    return null;
  }

  const queueCounts = await Promise.all(candidates.map(async (doctor) => ({
    doctor,
    count: await countDoctorWaiting(doctor._id.toString())
  })));

  return queueCounts
    .sort((a, b) => a.count - b.count || a.doctor.name.localeCompare(b.doctor.name))[0].doctor;
};

// --- CORE HOSPITAL WORKFLOW ENDPOINTS (README STEPS) ---

/**
 * STEP 1-6: Patient Entry, Triage, Routing, and Token Generation
 */
app.post('/api/queue/token', async (req, res) => {
  try {
    const { id, patientId, name, patientName, age, symptoms } = req.body;

    if (!symptoms || !(name || patientName)) {
      return res.status(400).json({ error: 'Patient name and symptoms are required' });
    }

    const department = getDepartmentFromSymptoms(symptoms);
    const { priority, priorityLabel } = getPriorityInfo(symptoms);
    const doctor = await assignDoctorFromDb(department);

    if (!doctor) {
      return res.status(409).json({ error: 'No available doctors. Please ask admin to add or enable doctors.' });
    }

    const queueEntry = await enqueuePatient({
      patientId: patientId || id || Date.now().toString(),
      patientName: patientName || name,
      age: Number(age) || undefined,
      symptoms,
      priority,
      priorityLabel,
      department,
      doctorId: doctor._id.toString(),
      doctorName: doctor.name
    });

    const queueLength = await countDoctorWaiting(doctor._id.toString());
    io.emit('queue_entry_created', serializeQueueEntry(queueEntry));
    await emitQueueUpdates(doctor._id, { entry: serializeQueueEntry(queueEntry) });

    res.json({
      success: true,
      token,
      priority,
      priorityLabel,
      department,
      doctorId: doctor._id.toString(),
      doctorName: doctor.name,
      queueLength,
      entry: serializeQueueEntry(queueEntry)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

/**
 * STEP 8: Doctor Calls Next Patient
 */
app.post('/api/queue/next', async (req, res) => {
  try {
    const { doctorId } = req.body;
    if (!doctorId) {
      return res.status(400).json({ error: 'doctorId is required' });
    }

    const nextPatient = await callNextPatient(doctorId);
    
    if (!nextPatient) {
      return res.json({ success: true, message: 'Queue is empty' });
    }

    const patient = serializeQueueEntry(nextPatient);
    io.emit('queue_entry_updated', patient);
    await emitQueueUpdates(doctorId, { entry: patient });

    res.json({ success: true, patient });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch next patient' });
  }
});

/**
 * STEP 10-12: Post Consultation & Patient History
 */
app.post('/api/doctor/complete', async (req, res) => {
  try {
    const { queueEntryId, patientId, patientName, doctorId, diagnosis, prescription, symptoms, needsLab } = req.body;
    
    // Step 12: Store Patient History
    const history = new PatientHistory({
      patientId,
      patientName,
      doctorId,
      diagnosis,
      prescription,
      symptoms
    });
    await history.save();

    const queueEntry = await completeEntry({ queueEntryId, patientId, doctorId });
    
    if (queueEntry) {
      io.emit('queue_entry_updated', serializeQueueEntry(queueEntry));
      await emitQueueUpdates(doctorId, { entry: serializeQueueEntry(queueEntry) });
    }

    if (needsLab) {
      io.emit('lab_queue_update', { patientId, patientName, doctorId });
    }
    
    res.json({ success: true, message: 'Consultation completed and saved' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to complete consultation' });
  }
});

app.get('/api/queue/status/:doctorId', async (req, res) => {
  try {
    const [queueLength, patients] = await Promise.all([
      countDoctorWaiting(req.params.doctorId),
      getDoctorQueue(req.params.doctorId)
    ]);
    res.json({ success: true, queueLength, patients: patients.map(serializeQueueEntry) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get queue status' });
  }
});

app.get('/api/queue/status', async (req, res) => {
  try {
    res.json(await getQueueOverview());
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch global queue status' });
  }
});

app.get('/api/queue/active', async (req, res) => {
  try {
    const patients = await getActiveEntries();
    res.json({ success: true, patients: patients.map(serializeQueueEntry) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active patients' });
  }
});


// --- ADMIN TASKS ENDPOINTS ---

/**
 * Admin: Upload Reports
 */
app.post('/api/admin/reports', async (req, res) => {
  try {
    const report = new Report(req.body);
    await report.save();
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload report' });
  }
});

app.get('/api/admin/reports/:patientId', async (req, res) => {
  try {
    const reports = await Report.find({ patientId: req.params.patientId });
    res.json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

/**
 * Admin: Manage Appointments
 */
app.get('/api/admin/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ date: 1 });
    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

app.post('/api/admin/appointments', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.body.doctorId);
    const appointment = new Appointment({
      ...req.body,
      doctorName: req.body.doctorName || doctor?.name
    });
    await appointment.save();
    await emitAppointmentsUpdated();
    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

app.put('/api/admin/appointments/:id', async (req, res) => {
  try {
    const { status, date } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id, 
      { status, date }, 
      { new: true }
    );
    await emitAppointmentsUpdated();
    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

/**
 * Admin: Inventory Tracking
 */
app.get('/api/admin/inventory', async (req, res) => {
  try {
    const inventory = await Inventory.find();
    res.json({ success: true, inventory });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

app.post('/api/admin/inventory', async (req, res) => {
  try {
    // If exists, update quantity, else create
    const { itemName, category, quantity, threshold } = req.body;
    let item = await Inventory.findOne({ itemName });
    
    if (item) {
      item.quantity += quantity;
      item.lastUpdated = Date.now();
      await item.save();
    } else {
      item = new Inventory({ itemName, category, quantity, threshold });
      await item.save();
    }
    
    res.json({ success: true, item });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update inventory' });
  }
});

/**
 * Admin: Bed Status Update
 */
app.get('/api/admin/beds', async (req, res) => {
  try {
    const beds = await Bed.find();
    res.json({ success: true, beds });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch beds' });
  }
});

app.put('/api/admin/beds/:id', async (req, res) => {
  try {
    const { status, patientId } = req.body;
    const bed = await Bed.findByIdAndUpdate(
      req.params.id,
      { status, patientId, lastUpdated: Date.now() },
      { new: true }
    );
    
    // Broadcast bed status to all clients (e.g. Patient Dashboard)
    io.emit('bed_status_update', bed);
    
    res.json({ success: true, bed });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update bed status' });
  }
});

/**
 * Admin: Manage Doctors
 */
app.get('/api/admin/doctors', async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.json({ success: true, doctors });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

app.post('/api/admin/doctors', async (req, res) => {
  try {
    const doctor = new Doctor({
      ...req.body,
      department: normalizeDepartment(req.body.department)
    });
    await doctor.save();
    await emitDoctorsUpdated();
    res.json({ success: true, doctor });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add doctor' });
  }
});

app.put('/api/admin/doctors/:id', async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.department) {
      update.department = normalizeDepartment(update.department);
    }
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    await emitDoctorsUpdated();
    res.json({ success: true, doctor });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update doctor' });
  }
});

app.delete('/api/admin/doctors/:id', async (req, res) => {
  try {
    await Doctor.findByIdAndDelete(req.params.id);
    await emitDoctorsUpdated();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete doctor' });
  }
});

app.get('/api/doctors/available', async (req, res) => {
  try {
    const doctors = await Doctor.find({ availability: true }).sort({ department: 1, name: 1 });
    res.json({ success: true, doctors });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch available doctors' });
  }
});


// Socket.IO Events
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
