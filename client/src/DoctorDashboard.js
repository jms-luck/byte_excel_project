import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function DoctorDashboard({ user }) {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [currentPatient, setCurrentPatient] = useState(null);
  const [queueLength, setQueueLength] = useState(0);
  const [waitingPatients, setWaitingPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState({ diagnosis: '', prescription: '', needsLab: false });

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/doctors/available`);
        const availableDoctors = res.data.doctors || [];
        setDoctors(availableDoctors);
        const matchingDoctor = availableDoctors.find((doctor) => (
          doctor.contact &&
          user?.email &&
          doctor.contact.toLowerCase().includes(user.email.toLowerCase())
        ));
        setSelectedDoctorId((current) => current || matchingDoctor?._id || availableDoctors[0]?._id || '');
      } catch (err) {
        console.error('Failed to fetch doctors', err);
      }
    };

    fetchDoctors();
  }, [user]);

  const fetchQueueStatus = useCallback(async (doctorId = selectedDoctorId) => {
    if (!doctorId) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/queue/status/${doctorId}`);
      setQueueLength(res.data.queueLength || 0);
      setWaitingPatients(res.data.patients || []);
    } catch (err) {
      console.error('Failed to fetch queue status', err);
    }
  }, [selectedDoctorId]);

  useEffect(() => {
    if (!selectedDoctorId) return undefined;

    fetchQueueStatus(selectedDoctorId);
    const socket = io(API_BASE_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 3000,
    });

    socket.on('queue_update', (update) => {
      if (String(update.doctorId) === String(selectedDoctorId)) {
        setQueueLength(update.queueLength || 0);
        fetchQueueStatus(selectedDoctorId);
      }
    });

    socket.on('queue_entry_created', (entry) => {
      if (String(entry.doctorId) === String(selectedDoctorId)) {
        fetchQueueStatus(selectedDoctorId);
      }
    });

    socket.on('queue_entry_updated', (entry) => {
      if (String(entry.doctorId) === String(selectedDoctorId)) {
        fetchQueueStatus(selectedDoctorId);
      }
    });

    socket.on('available_doctors_updated', (updatedDoctors) => {
      setDoctors(updatedDoctors || []);
    });

    return () => socket.disconnect();
  }, [selectedDoctorId, fetchQueueStatus]);

  const callNextPatient = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/queue/next`, { doctorId: selectedDoctorId });
      if (res.data.patient) {
        setCurrentPatient(res.data.patient);
        setNotes({ diagnosis: '', prescription: '', needsLab: false });
      } else {
        alert('Queue is empty!');
        setCurrentPatient(null);
      }
      fetchQueueStatus(selectedDoctorId);
    } catch (err) {
      console.error('Failed to call next patient', err);
    } finally {
      setLoading(false);
    }
  };

  const completeConsultation = async () => {
    if (!currentPatient) return;
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/doctor/complete`, {
        patientId: currentPatient.patientId || currentPatient.id,
        patientName: currentPatient.patientName || currentPatient.name || 'Unknown Patient',
        queueEntryId: currentPatient._id,
        doctorId: selectedDoctorId,
        diagnosis: notes.diagnosis,
        prescription: notes.prescription,
        symptoms: currentPatient.symptoms,
        needsLab: notes.needsLab
      });
      setCurrentPatient(null);
      setNotes({ diagnosis: '', prescription: '', needsLab: false });
      fetchQueueStatus(selectedDoctorId);
    } catch (err) {
      console.error('Failed to complete consultation', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-100 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Doctor Workspace</h1>
            <p className="text-slate-500 font-medium mt-1">Manage your consultations and patient flow</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-4">
            <select
              value={selectedDoctorId}
              onChange={(event) => {
                setSelectedDoctorId(event.target.value);
                setCurrentPatient(null);
              }}
              className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {doctors.length === 0 ? (
                <option value="">No available doctors</option>
              ) : doctors.map((doctor) => (
                <option key={doctor._id} value={doctor._id}>{doctor.name} - {doctor.department}</option>
              ))}
            </select>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 flex items-center shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-3"></div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Waiting Queue</p>
                <p className="text-xl font-black text-slate-800">{queueLength} Patients</p>
              </div>
            </div>
          </div>
        </div>

        {!currentPatient ? (
          <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Ready for Next Patient</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">Call the next patient from the queue to begin the consultation process. Emergency overrides are handled automatically.</p>
            {waitingPatients.length > 0 && (
              <div className="max-w-2xl mx-auto mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white text-left">
                {waitingPatients.filter((patient) => patient.status === 'waiting').slice(0, 4).map((patient) => (
                  <div key={patient._id} className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-b-0">
                    <div>
                      <p className="font-bold text-slate-800">{patient.token} - {patient.patientName}</p>
                      <p className="text-xs text-slate-500">{patient.priorityLabel} • {patient.symptoms}</p>
                    </div>
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{patient.department}</span>
                  </div>
                ))}
              </div>
            )}
            <button 
              onClick={callNextPatient} 
              disabled={loading || queueLength === 0 || !selectedDoctorId}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 text-white font-bold py-4 px-10 rounded-xl transition-all shadow-lg hover:shadow-blue-600/30 flex items-center justify-center gap-3 mx-auto text-lg"
            >
              {loading ? 'Fetching...' : <>Call Next Patient <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg></>}
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white mb-8 shadow-xl flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px]"></div>
              <div className="relative z-10 flex items-center gap-6">
                <div className="bg-white/20 backdrop-blur-md border border-white/30 p-4 rounded-xl text-center min-w-[120px] shadow-sm">
                  <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Token</p>
                  <p className="text-3xl font-black font-mono text-white">{currentPatient.token || 'TKN-000'}</p>
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-1 text-white">{currentPatient.patientName || currentPatient.name || 'Unknown Patient'}</h2>
                  <p className="text-blue-100 flex items-center gap-2">
                    <span className="bg-white/20 px-2 py-0.5 rounded text-sm font-semibold border border-white/20 text-white">Priority: {currentPatient.priority}</span>
                    <span className="opacity-50">•</span>
                    <span className="font-medium text-blue-50">Waiting since {new Date(currentPatient.time).toLocaleTimeString()}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm">
                  <h3 className="font-bold text-amber-800 flex items-center gap-2 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Reported Symptoms
                  </h3>
                  <p className="text-amber-900 font-medium">{currentPatient.symptoms || 'No symptoms reported.'}</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h3 className="font-bold text-slate-700 mb-4">Post-Consultation Actions</h3>
                  <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-blue-400 transition-colors">
                    <input type="checkbox" checked={notes.needsLab} onChange={(e) => setNotes({...notes, needsLab: e.target.checked})} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                    <div>
                      <p className="font-semibold text-slate-800">Send to Lab / Pharmacy</p>
                      <p className="text-xs text-slate-500 mt-0.5">Routes patient to next queue automatically</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Medical Diagnosis</label>
                  <textarea value={notes.diagnosis} onChange={(e) => setNotes({...notes, diagnosis: e.target.value})} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 font-medium resize-none shadow-inner" placeholder="Enter clinical findings..."></textarea>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Prescription & Plan</label>
                  <textarea value={notes.prescription} onChange={(e) => setNotes({...notes, prescription: e.target.value})} rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 font-medium resize-none shadow-inner" placeholder="Rx details..."></textarea>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                  <button onClick={completeConsultation} disabled={loading} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 text-lg">
                    {loading ? 'Processing...' : <>Complete Consultation <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg></>}
                  </button>
                  <button onClick={() => setCurrentPatient(null)} className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors">
                    Hold
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DoctorDashboard;
