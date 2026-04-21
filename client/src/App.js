import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './App.css';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthSelect from './AuthSelect';
import PatientLogin from './PatientLogin';
import AdminLogin from './AdminLogin';
import PatientWorkflow from './PatientWorkflow';
import AdminDoctors from './AdminDoctors';
import AdminAppointments from './AdminAppointments';
import DoctorLogin from './DoctorLogin';
import DoctorDashboard from './DoctorDashboard';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('patient');
  const [hospitalName, setHospitalName] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [queueStatus, setQueueStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [activeAdminTab, setActiveAdminTab] = useState('dashboard');
  const [activePatients, setActivePatients] = useState([]);

  const fetchActiveQueue = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/queue/active`);
      setActivePatients(res.data.patients || []);
    } catch (err) {
      console.error('❌ Error fetching active queue:', err);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const storedRole = localStorage.getItem('app_user_role');
        setUserRole(['admin', 'doctor', 'patient'].includes(storedRole) ? storedRole : 'patient');
        setHospitalName(localStorage.getItem('app_hospital_name') || '');
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    // Connect to Socket.IO
    const newSocket = io(API_BASE_URL, {
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout: 3000,
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to server');
    });

    newSocket.on('connect_error', () => {
      console.error('⚠️ Backend socket is unavailable. Start backend on port 5000.');
    });

    newSocket.on('queue_overview_update', (overview) => {
      setQueueStatus(overview);
      setLoading(false);
    });

    newSocket.on('queue_entry_created', fetchActiveQueue);
    newSocket.on('queue_entry_updated', fetchActiveQueue);

    // Fetch queue status
    axios.get(`${API_BASE_URL}/api/queue/status`)
      .then(res => {
        setQueueStatus(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Error fetching queue status:', err);
        setLoading(false);
      });

    fetchActiveQueue();

    return () => newSocket.disconnect();
  }, [user, fetchActiveQueue]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('app_user_role');
      localStorage.removeItem('app_hospital_name');
      setUserRole('patient');
      setHospitalName('');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleAuthSuccess = ({ role, hospital }) => {
    const selectedRole = role || 'patient';
    const selectedHospital = hospital || '';
    setUserRole(selectedRole);
    setHospitalName(selectedHospital);
    localStorage.setItem('app_user_role', selectedRole);
    localStorage.setItem('app_hospital_name', selectedHospital);
  };

  const adminTasks = [
    { title: 'Manage Doctors', description: 'Add, remove, and manage hospital doctors.', action: () => setActiveAdminTab('doctors') },
    { title: 'Manage Appointments', description: 'Approve, reschedule, or cancel appointments.', action: () => setActiveAdminTab('appointments') },
  ];

  useEffect(() => {
    if (userRole !== 'admin') {
      return;
    }

    const fetchRegisteredUsers = async () => {
      try {
        setUsersLoading(true);
        const snapshot = await getDocs(collection(db, 'users'));
        const users = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
        users.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
        setRegisteredUsers(users);
      } catch (err) {
        console.warn('⚠️ Firebase users fetch failed:', err.message);
        setRegisteredUsers([]);
      } finally {
        setUsersLoading(false);
      }
    };

    fetchRegisteredUsers();
  }, [userRole]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-xl font-semibold">
        Loading authentication...
      </div>
    );
  }

  if (!user) {
    return (
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<AuthSelect />} />
          <Route path="/login/patient" element={<PatientLogin onAuthSuccess={handleAuthSuccess} />} />
          <Route path="/login/admin" element={<AdminLogin onAuthSuccess={handleAuthSuccess} />} />
          <Route path="/login/doctor" element={<DoctorLogin onAuthSuccess={handleAuthSuccess} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    );
  }

  const isAdmin = userRole === 'admin';
  const isDoctor = userRole === 'doctor';

  const renderTaskGrid = (items, accentClass) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((item) => (
        <div key={item.title} className={`group bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-xl border border-slate-200/80 p-6 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden`}>
          <div className={`absolute top-0 left-0 w-full h-1 ${isAdmin ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-gradient-to-r from-cyan-400 to-blue-500'}`}></div>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${isAdmin ? 'bg-indigo-50 text-indigo-600' : 'bg-cyan-50 text-cyan-600'} group-hover:scale-110 transition-transform duration-300`}>
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
             </svg>
          </div>
          <h3 className="text-lg font-bold mb-2 text-slate-800">{item.title}</h3>
          <p className="text-slate-500 text-sm mb-6 line-clamp-2">{item.description}</p>
          <button
            onClick={item.action}
            className={`w-full font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${isAdmin ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white' : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-600 hover:text-white'}`}
          >
            Manage
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );

  const workflowSteps = [
    'Start',
    'User selection (Admin / Patient)',
    'Login',
    isAdmin ? 'Admin workflow' : isDoctor ? 'Doctor workflow' : 'Patient workflow',
    'Shared services',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">🏥 Hospital Queue Management</h1>
            <p className="text-blue-100 mt-2">Real-time Patient Queue System with Concurrent Processing</p>
            <p className="text-blue-100 mt-1 text-sm">Signed in as: {user.email}</p>
            <p className="text-blue-100 mt-1 text-sm">
              Role: <span className="font-bold uppercase">{isAdmin ? 'admin' : isDoctor ? 'doctor' : 'patient'}</span>
              {hospitalName ? ` | Hospital: ${hospitalName}` : ''}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-white text-blue-700 font-semibold px-4 py-2 rounded-lg hover:bg-blue-50"
          >
            Logout
          </button>
        </div>
      </header>
      
      <main className="container mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Workflow</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {workflowSteps.map((step, index) => (
              <div key={step} className="rounded-lg border border-gray-200 bg-slate-50 p-4 text-center">
                <div className="text-sm font-semibold text-indigo-700">Step {index + 1}</div>
                <div className="mt-1 text-sm text-gray-800">{step}</div>
              </div>
            ))}
          </div>
        </div>

        {isAdmin ? (
          <>
            <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 rounded-2xl p-8 mb-8 shadow-2xl relative overflow-hidden border border-indigo-500/30">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between">
                <div>
                  <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300 mb-2">Admin Command Center</h2>
                  <p className="text-indigo-200 text-lg">Oversee operations, manage resources, and track performance.</p>
                </div>
                <div className="hidden md:flex h-16 w-16 bg-indigo-500/20 rounded-2xl items-center justify-center backdrop-blur-sm border border-indigo-500/50">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-indigo-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center mb-5">
                <div className="h-8 w-1.5 bg-indigo-500 rounded-full mr-3"></div>
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Quick Actions</h3>
              </div>
              {renderTaskGrid(adminTasks, 'border-indigo-500')}
            </div>

            {/* Admin Tabs Content */}
            {activeAdminTab === 'dashboard' && (
              <>
                <div className="bg-white rounded-lg shadow-lg p-8">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">📊 Hospital Queue Overview</h2>
                  {loading ? (
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="text-gray-600 mt-2">Loading...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                        <p className="text-gray-600 text-sm font-semibold">Queue Length</p>
                        <p className="text-3xl font-bold text-blue-600 mt-2">{queueStatus?.queueLength || 0}</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                        <p className="text-gray-600 text-sm font-semibold">Concurrent Ops</p>
                        <p className="text-3xl font-bold text-green-600 mt-2">{queueStatus?.concurrentOps || 0}</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                        <p className="text-gray-600 text-sm font-semibold">Processing Queue</p>
                        <p className="text-3xl font-bold text-purple-600 mt-2">{queueStatus?.processingQueueSize || 0}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 mt-8 border border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="h-8 w-1.5 bg-cyan-500 rounded-full mr-3"></div>
                      <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Active Queue</h2>
                    </div>
                    <div className="bg-cyan-50 text-cyan-700 text-sm font-semibold px-3 py-1 rounded-full">
                      {activePatients.length} Active
                    </div>
                  </div>
                  {activePatients.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-slate-500">No active queued patients yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50">
                            <th className="py-3 px-4 text-sm font-semibold text-slate-600 rounded-tl-lg">Token</th>
                            <th className="py-3 px-4 text-sm font-semibold text-slate-600">Patient</th>
                            <th className="py-3 px-4 text-sm font-semibold text-slate-600">Doctor</th>
                            <th className="py-3 px-4 text-sm font-semibold text-slate-600">Priority</th>
                            <th className="py-3 px-4 text-sm font-semibold text-slate-600 rounded-tr-lg">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {activePatients.map((patient) => (
                            <tr key={patient._id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-4 px-4 font-mono font-black text-slate-800">{patient.token}</td>
                              <td className="py-4 px-4">
                                <div className="font-semibold text-slate-800">{patient.patientName}</div>
                                <div className="text-xs text-slate-500 truncate max-w-[220px]">{patient.symptoms}</div>
                              </td>
                              <td className="py-4 px-4 text-sm text-slate-600">{patient.doctorName}</td>
                              <td className="py-4 px-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${patient.priority === 1 ? 'bg-red-100 text-red-700' : patient.priority === 2 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                  {patient.priorityLabel}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-sm font-bold capitalize text-slate-700">{patient.status.replace('_', ' ')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 mt-8 border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="h-8 w-1.5 bg-indigo-500 rounded-full mr-3"></div>
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Patient Registry</h2>
                </div>
                <div className="bg-indigo-50 text-indigo-700 text-sm font-semibold px-3 py-1 rounded-full">
                  {registeredUsers.length} Users
                </div>
              </div>
              {usersLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : registeredUsers.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-slate-500">No patient records found yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="py-3 px-4 text-sm font-semibold text-slate-600">Patient</th>
                        <th className="py-3 px-4 text-sm font-semibold text-slate-600">Contact</th>
                        <th className="py-3 px-4 text-sm font-semibold text-slate-600 hidden md:table-cell">Demographics</th>
                        <th className="py-3 px-4 text-sm font-semibold text-slate-600 hidden lg:table-cell">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {registeredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-4">
                            <div className="font-semibold text-slate-800">{user.fullName || 'Unnamed User'}</div>
                            <div className="text-xs text-slate-500 mt-1 flex items-center">
                               <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1.5"></span>
                               Active
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm text-slate-700">{user.email || '-'}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{user.phoneNumber || '-'}</div>
                          </td>
                          <td className="py-4 px-4 hidden md:table-cell">
                            <div className="text-sm text-slate-700">{user.age ? `${user.age} yrs` : '-'} • {user.gender || '-'}</div>
                            <div className="text-xs mt-0.5 inline-flex items-center px-2 py-0.5 rounded text-red-700 bg-red-50 font-medium">
                               Blood: {user.bloodGroup || 'Unknown'}
                            </div>
                          </td>
                          <td className="py-4 px-4 hidden lg:table-cell">
                            <div className="text-sm text-slate-700 truncate max-w-[150px]" title={user.address}>{user.address || '-'}</div>
                            <div className="text-xs text-slate-500 mt-0.5">Emg: {user.emergencyContact || '-'}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
            {activeAdminTab === 'doctors' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button onClick={() => setActiveAdminTab('dashboard')} className="mb-4 text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                  Back to Dashboard
                </button>
                <AdminDoctors />
              </div>
            )}

            {activeAdminTab === 'appointments' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button onClick={() => setActiveAdminTab('dashboard')} className="mb-4 text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                  Back to Dashboard
                </button>
                <AdminAppointments />
              </div>
            )}
          </>
        ) : isDoctor ? (
          <div className="py-6">
            <DoctorDashboard user={user} />
          </div>
        ) : (
          <div className="py-6">
             <PatientWorkflow user={user} />
          </div>
        )}

        {/* Info Section */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-bold text-indigo-900 mb-3">System Connection</h3>
          <ul className="text-indigo-800 space-y-2">
            <li>✅ Backend target: {API_BASE_URL}</li>
            <li>✅ Frontend API target: {API_BASE_URL}</li>
            <li>✅ Queue store: Redis / GCP Memorystore</li>
            <li>✅ Realtime updates: Socket.IO</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default App;
