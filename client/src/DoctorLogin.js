import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

const ADMIN_ACCESS_CODE = process.env.REACT_APP_ADMIN_ACCESS_CODE || '520450';

const authErrorMessage = (code) => {
  const map = {
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/invalid-login-credentials': 'Invalid email or password.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Invalid email or password.',
    'auth/invalid-email': 'Please enter a valid email address.',
  };
  return map[code] || 'Authentication failed. Please try again.';
};

function DoctorLogin({ onAuthSuccess }) {
  const navigate = useNavigate();
  const [hospitalName, setHospitalName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [doctorCode, setDoctorCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!hospitalName.trim()) {
        setError('Hospital name is required for doctor login.');
        setLoading(false);
        return;
      }
      if (doctorCode.trim() !== ADMIN_ACCESS_CODE) {
        setError('Invalid doctor access code.');
        setLoading(false);
        return;
      }

      await signInWithEmailAndPassword(auth, email, password);

      if (onAuthSuccess) {
        onAuthSuccess({
          role: 'doctor',
          hospital: hospitalName,
          fullName: '',
        });
      }
      navigate('/');
    } catch (err) {
      setError(authErrorMessage(err?.code));
      console.error('Firebase Auth Error:', err?.code, err?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-emerald-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-teal-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-400/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-md bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 rounded-3xl p-10 relative z-10 transition-all duration-300">
        
        <button 
          onClick={() => navigate('/')} 
          className="absolute top-6 left-6 text-slate-400 hover:text-teal-600 transition-colors flex items-center group text-sm font-semibold"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>

        <div className="text-center mb-8 mt-4">
          <div className="inline-flex items-center justify-center p-4 bg-teal-50 rounded-2xl mb-4 shadow-sm border border-teal-100">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-teal-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 15l3-3m0 0l-3-3m3 3h-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 mb-2 tracking-tight">Doctor Portal</h1>
          <p className="text-slate-500 text-sm font-medium">
            Authorized personnel only. Please verify your credentials.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg text-sm font-medium shadow-sm flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2 shrink-0">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Hospital Name *</label>
            <input type="text" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} required
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-medium"
              placeholder="e.g. City General Hospital" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Doctor Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-medium"
              placeholder="doctor@hospital.com" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Password *</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-medium"
              placeholder="••••••••" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Access Code *</label>
            <input type="password" value={doctorCode} onChange={(e) => setDoctorCode(e.target.value)} required
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-mono tracking-widest"
              placeholder="••••••" />
            <p className="text-xs text-slate-500 mt-1.5">Default test code: {ADMIN_ACCESS_CODE}</p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-teal-600/30 flex justify-center items-center mt-6"
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Authenticating...
              </div>
            ) : 'Secure Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default DoctorLogin;
