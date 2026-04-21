const mongoose = require('mongoose');

// STEP 12: Store Patient History
const patientHistorySchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  patientName: { type: String, required: true },
  doctorId: { type: String },
  diagnosis: { type: String },
  prescription: { type: String },
  symptoms: { type: String },
  date: { type: Date, default: Date.now }
});

const PatientHistory = mongoose.model('PatientHistory', patientHistorySchema);

// Admin Models

const reportSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  type: { type: String, enum: ['lab', 'scan', 'discharge'], required: true },
  fileUrl: { type: String },
  notes: { type: String },
  uploadedAt: { type: Date, default: Date.now }
});

const Report = mongoose.model('Report', reportSchema);

const appointmentSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  patientName: { type: String, required: true },
  doctorId: { type: String, required: true },
  doctorName: { type: String },
  date: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rescheduled', 'cancelled'], default: 'pending' },
  reason: { type: String }
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

const inventorySchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  category: { type: String, enum: ['medicine', 'consumable', 'equipment'], required: true },
  quantity: { type: Number, required: true, min: 0 },
  threshold: { type: Number, default: 10 },
  lastUpdated: { type: Date, default: Date.now }
});

const Inventory = mongoose.model('Inventory', inventorySchema);

const bedSchema = new mongoose.Schema({
  ward: { type: String, required: true },
  bedNumber: { type: String, required: true, unique: true },
  status: { type: String, enum: ['available', 'occupied', 'cleaning'], default: 'available' },
  patientId: { type: String },
  lastUpdated: { type: Date, default: Date.now }
});

const Bed = mongoose.model('Bed', bedSchema);

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  department: { type: String, required: true },
  specialization: { type: String },
  qualification: { type: String },
  experienceYears: { type: Number, default: 0 },
  locationName: { type: String },
  imageUrl: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  availability: { type: Boolean, default: true },
  contact: { type: String }
});

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = {
  PatientHistory,
  Report,
  Appointment,
  Inventory,
  Bed,
  Doctor
};
