import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const DEPARTMENTS = {
  cardiology: { name: 'Cardiology', icon: '❤️', color: 'from-rose-500 to-red-600' },
  general: { name: 'General Medicine', icon: '🩺', color: 'from-emerald-500 to-teal-600' },
  orthopedic: { name: 'Orthopedics', icon: '🦴', color: 'from-amber-500 to-orange-600' },
  neurology: { name: 'Neurology', icon: '🧠', color: 'from-indigo-500 to-purple-600' },
};

function PatientWorkflow({ user }) {
  const getDefaultAppointmentDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(10, 0, 0, 0);
    return date.toISOString().slice(0, 16);
  };

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: user?.fullName || '', age: '', symptoms: '' });
  const [triageResult, setTriageResult] = useState(null);
  const [queueStatus, setQueueStatus] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingDoctorId, setBookingDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(getDefaultAppointmentDate);
  const [loading, setLoading] = useState(false);

  // Auto-fill from user
  useEffect(() => {
    if (user?.fullName) setFormData(f => ({ ...f, name: user.fullName }));
  }, [user]);

  useEffect(() => {
    const fetchPatientProfile = async () => {
      if (!user?.uid) return;
      try {
        const snapshot = await getDoc(doc(db, 'users', user.uid));
        if (!snapshot.exists()) return;
        const profile = snapshot.data();
        setFormData((current) => ({
          ...current,
          name: current.name || profile.fullName || '',
          age: current.age || (profile.age ? String(profile.age) : ''),
        }));
      } catch (err) {
        console.warn('Could not load patient profile:', err.message);
      }
    };

    fetchPatientProfile();
  }, [user]);

  useEffect(() => {
    const fetchAvailableDoctors = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/doctors/available`);
        setDoctors(res.data.doctors || []);
      } catch (err) {
        console.error('Failed to fetch available doctors', err);
      } finally {
        setDoctorsLoading(false);
      }
    };

    fetchAvailableDoctors();
    const socket = io(API_BASE_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 3000,
    });

    socket.on('available_doctors_updated', (updatedDoctors) => {
      setDoctors(updatedDoctors || []);
      setDoctorsLoading(false);
    });

    socket.on('queue_update', (update) => {
      setQueueStatus((current) => {
        if (!current || String(current.doctorId) !== String(update.doctorId)) return current;
        return { ...current, queueLength: update.queueLength };
      });
    });

    socket.on('queue_entry_updated', (entry) => {
      setQueueStatus((current) => {
        if (!current || current.token !== entry.token) return current;
        return {
          ...current,
          status: entry.status,
          queueLength: entry.queueLength ?? current.queueLength
        };
      });
    });

    return () => socket.disconnect();
  }, []);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const getPriority = (symptoms) => {
    const s = symptoms.toLowerCase();
    if (s.includes('chest pain') || s.includes('breathing') || s.includes('emergency') || s.includes('bleeding')) return { level: 'Emergency', priority: 1, color: 'bg-red-500' };
    if ((s.includes('fever') && s.includes('high')) || s.includes('pain')) return { level: 'Urgent', priority: 2, color: 'bg-amber-500' };
    return { level: 'Normal', priority: 3, color: 'bg-emerald-500' };
  };

  const getDepartment = (symptoms) => {
    const s = symptoms.toLowerCase();
    if (s.includes('heart') || s.includes('chest')) return 'cardiology';
    if (s.includes('bone') || s.includes('fracture') || s.includes('joint')) return 'orthopedic';
    if (s.includes('headache') || s.includes('brain')) return 'neurology';
    return 'general';
  };

  const submitTriage = () => {
    setLoading(true);
    setTimeout(() => {
      const priority = getPriority(formData.symptoms);
      const deptKey = getDepartment(formData.symptoms);
      setTriageResult({ ...priority, department: DEPARTMENTS[deptKey] });
      setStep(2);
      setLoading(false);
    }, 1500);
  };

  const visibleDoctors = triageResult
    ? doctors.filter((doctor) => doctor.department === triageResult.department.name)
    : doctors;
  const doctorsForDisplay = visibleDoctors.length ? visibleDoctors : doctors;

  const getDoctorImage = (doctor) => doctor.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=e0f2fe&color=0369a1&size=160`;

  const bookAppointment = async (doctor) => {
    setBookingDoctorId(doctor._id);
    try {
      if (!appointmentDate) {
        window.alert('Please choose an appointment date and time.');
        return;
      }

      await axios.post(`${API_BASE_URL}/api/appointments`, {
        patientId: user?.uid || user?.email || Date.now().toString(),
        patientName: formData.name || user?.displayName || user?.email || 'Patient',
        doctorId: doctor._id,
        doctorName: doctor.name,
        date: new Date(appointmentDate).toISOString(),
        reason: formData.symptoms || 'Online consultation request'
      });
      window.alert(`Appointment request sent to ${doctor.name}.`);
    } catch (err) {
      console.error('Failed to book appointment', err);
      window.alert('Could not book appointment right now. Please try again.');
    } finally {
      setBookingDoctorId('');
    }
  };

  const generateToken = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/queue/token`, {
        patientId: user?.uid || user?.email || Date.now().toString(),
        name: formData.name,
        age: formData.age,
        symptoms: formData.symptoms
      });

      setQueueStatus({
        token: res.data.token,
        doctorId: res.data.doctorId,
        doctorAssigned: res.data.doctorName,
        queueLength: Math.max((res.data.queueLength || 1) - 1, 0),
        status: res.data.entry?.status || 'waiting',
        estimatedWait: `${Math.max(res.data.queueLength || 1, 1) * 10} mins`
      });
      setStep(3);
    } catch (err) {
      console.error('Failed to generate queue token', err);
      window.alert(err.response?.data?.error || 'Could not generate a queue token right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Progress Tracker */}
      <div className="flex items-center justify-between relative mb-12">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 -translate-y-1/2"></div>
        <div className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-indigo-500 to-cyan-400 -z-10 -translate-y-1/2 transition-all duration-700" style={{ width: `${(step - 1) * 50}%` }}></div>
        
        {['Patient Entry', 'Triage & Routing', 'Queue Status'].map((label, i) => (
          <div key={label} className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ${step > i + 1 ? 'bg-indigo-600 text-white' : step === i + 1 ? 'bg-gradient-to-br from-indigo-400 to-cyan-500 text-white shadow-lg shadow-cyan-500/30 scale-110' : 'bg-white text-slate-400 border-2 border-slate-200'}`}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span className={`mt-3 text-sm font-semibold ${step >= i + 1 ? 'text-slate-800' : 'text-slate-400'}`}>{label}</span>
          </div>
        ))}
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 md:p-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-cyan-400/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        {step === 1 && (
          <div className="relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Patient Intake</h2>
              <p className="text-slate-500">Please provide your details so our AI triage system can route you effectively.</p>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-slate-700 font-medium" placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Age</label>
                  <input type="number" name="age" value={formData.age} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-slate-700 font-medium" placeholder="Your age" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Describe Your Symptoms</label>
                <textarea name="symptoms" value={formData.symptoms} onChange={handleInputChange} rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-slate-700 font-medium resize-none" placeholder="E.g., Severe chest pain since morning, high fever, etc."></textarea>
                <p className="text-xs text-slate-500 mt-2 flex items-center">
                   <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block mr-1.5"></span> AI-powered triage will automatically determine priority.
                </p>
              </div>

              <button onClick={submitTriage} disabled={!formData.name || !formData.symptoms || loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 flex justify-center items-center gap-3 shadow-lg shadow-blue-500/30">
                {loading ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Processing Triage...</>
                ) : (
                  <>Submit for Triage <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg></>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 2 && triageResult && (
          <div className="relative z-10 text-center animate-in fade-in zoom-in-95 duration-700">
             <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-50 mb-6 shadow-inner border border-slate-100">
               <span className="text-5xl">{triageResult.department.icon}</span>
             </div>
             <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Triage Complete</h2>
             <p className="text-slate-500 mb-8 max-w-lg mx-auto">Based on your symptoms, we have prioritized your case and routed you to the appropriate department.</p>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 max-w-2xl mx-auto">
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                   <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Assigned Priority</p>
                   <div className={`px-4 py-1.5 rounded-full text-white font-bold text-sm ${triageResult.color} inline-block mb-2 shadow-sm`}>Level {triageResult.priority}: {triageResult.level}</div>
                   {triageResult.priority === 1 && <p className="text-xs text-red-500 font-semibold mt-1">Immediate attention required</p>}
                </div>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                   <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Department</p>
                   <div className={`bg-gradient-to-r ${triageResult.department.color} bg-clip-text text-transparent font-extrabold text-2xl`}>{triageResult.department.name}</div>
                </div>
             </div>

             <div className="text-left mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-800">Available Doctors</h3>
                  <span className="text-xs font-bold text-cyan-700 bg-cyan-50 border border-cyan-100 px-3 py-1 rounded-full">{doctorsForDisplay.length} Available</span>
                </div>
                <div className="mb-4 max-w-sm">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Appointment Date & Time</label>
                  <input
                    type="datetime-local"
                    value={appointmentDate}
                    onChange={(event) => setAppointmentDate(event.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none text-slate-700 font-medium"
                  />
                </div>

                {doctorsLoading ? (
                  <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div></div>
                ) : doctorsForDisplay.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-500">No available doctors added by admin yet.</div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {doctorsForDisplay.map((doctor) => (
                      <div key={doctor._id} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                        <div className="p-4">
                          <button type="button" onClick={() => setSelectedDoctor(doctor)} className="w-full p-0 text-left text-slate-900 hover:shadow-none hover:transform-none">
                            <div className="flex items-center gap-4 mb-3 min-w-0">
                              <div className="h-20 w-20 rounded-lg bg-cyan-50 border border-cyan-100 overflow-hidden shrink-0">
                                <img className="h-full w-full object-cover" title={doctor.name} src={getDoctorImage(doctor)} alt={doctor.name} />
                              </div>
                              <div className="min-w-0">
                                <h4 className="mb-1 truncate text-base font-bold text-slate-900">{doctor.name}</h4>
                                <p className="truncate text-sm text-slate-600">{doctor.qualification || doctor.department}</p>
                                <small className="block truncate text-sm text-slate-500">{doctor.specialization || doctor.department}</small>
                              </div>
                            </div>
                          </button>
                          <p className="mb-3 text-sm text-slate-700"><strong>{Number(doctor.experienceYears || 0).toFixed(1)}</strong> years experience</p>
                          <div>
                            <span className="text-xs text-slate-500">Available at</span>
                            <p className="mb-1 text-sm font-bold uppercase text-slate-800">{doctor.locationName || 'Hospital consultation desk'}</p>
                            {doctor.contact && <small className="text-cyan-700">{doctor.contact}</small>}
                          </div>
                        </div>
                        <div className="border-t border-slate-100 bg-white px-4 py-3">
                          <div className="grid grid-cols-5 gap-3 text-center">
                            <button type="button" onClick={() => setSelectedDoctor(doctor)} className="col-span-2 rounded-full bg-white border border-cyan-200 px-3 py-2 text-sm font-bold text-cyan-700 hover:bg-cyan-50">
                              View Details
                            </button>
                            <button type="button" onClick={() => bookAppointment(doctor)} disabled={bookingDoctorId === doctor._id} className="col-span-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-60">
                              {bookingDoctorId === doctor._id ? 'Booking...' : 'Book Appointment'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>

             <button onClick={generateToken} disabled={loading} className={`w-full max-w-md mx-auto bg-gradient-to-r ${triageResult.department.color} hover:opacity-90 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex justify-center items-center gap-3`}>
                {loading ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Generating Token...</>
                ) : (
                  <>Generate Queue Token <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" /></svg></>
                )}
             </button>
          </div>
        )}

        {step === 3 && queueStatus && (
          <div className="relative z-10 animate-in fade-in slide-in-from-right-8 duration-700">
             <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl mb-8">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px]"></div>
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
                  <div className="text-center md:text-left mb-6 md:mb-0">
                     <p className="text-blue-100 font-bold tracking-widest text-sm mb-1 uppercase">Your Official Token</p>
                     <h1 className="text-6xl font-black font-mono tracking-tight drop-shadow-md">{queueStatus.token}</h1>
                     <p className="text-blue-50 mt-2">Assigned to: <span className="text-white font-semibold">{queueStatus.doctorAssigned}</span></p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center min-w-[200px]">
                     <p className="text-white font-semibold mb-1">Estimated Wait</p>
                     <div className="text-4xl font-extrabold text-white">{queueStatus.estimatedWait}</div>
                  </div>
               </div>
             </div>

             <h3 className="text-xl font-bold text-slate-800 mb-4">Live Tracking</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex items-center shadow-sm">
                   <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-4">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0311.952-3.138m1.424 9.462a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.952-3.138" /></svg>
                   </div>
                   <div>
                      <p className="text-slate-500 text-sm font-semibold">People Ahead of You</p>
                      <p className="text-2xl font-black text-slate-800">{queueStatus.queueLength}</p>
                   </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex items-center shadow-sm relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                   <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mr-4">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0M3.124 7.5A8.969 8.969 0 015.292 3m13.416 0a8.969 8.969 0 012.168 4.5" /></svg>
                   </div>
                   <div>
                      <p className="text-slate-500 text-sm font-semibold">Status</p>
                      <p className="text-lg font-bold text-emerald-600 flex items-center">
                         <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2"></span> {queueStatus.status === 'in_consultation' ? 'Called for Consultation' : 'Waiting in Room'}
                      </p>
                   </div>
                </div>
             </div>
             
             <div className="mt-8 text-center">
                <button onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-800 font-semibold text-sm transition-colors">Start New Consultation</button>
             </div>
          </div>
        )}

      </div>

      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <img className="h-20 w-20 rounded-xl object-cover border border-slate-200" src={getDoctorImage(selectedDoctor)} alt={selectedDoctor.name} />
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-black text-slate-900">{selectedDoctor.name}</h3>
                <p className="text-sm font-semibold text-cyan-700">{selectedDoctor.department}</p>
                <p className="text-sm text-slate-500">{selectedDoctor.specialization || 'General consultation'}</p>
              </div>
              <button type="button" onClick={() => setSelectedDoctor(null)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 hover:shadow-none hover:transform-none" aria-label="Close doctor details">
                x
              </button>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-4"><span className="font-bold text-slate-600">Qualification: </span>{selectedDoctor.qualification || 'Not added'}</div>
              <div className="rounded-xl bg-slate-50 p-4"><span className="font-bold text-slate-600">Experience: </span>{Number(selectedDoctor.experienceYears || 0).toFixed(1)} years</div>
              <div className="rounded-xl bg-slate-50 p-4"><span className="font-bold text-slate-600">Available at: </span>{selectedDoctor.locationName || 'Hospital consultation desk'}</div>
              {selectedDoctor.contact && <div className="rounded-xl bg-slate-50 p-4"><span className="font-bold text-slate-600">Contact: </span>{selectedDoctor.contact}</div>}
            </div>
            <button type="button" onClick={() => bookAppointment(selectedDoctor)} disabled={bookingDoctorId === selectedDoctor._id} className="mt-5 w-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 font-bold text-white disabled:opacity-60">
              {bookingDoctorId === selectedDoctor._id ? 'Booking...' : 'Book Appointment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientWorkflow;
