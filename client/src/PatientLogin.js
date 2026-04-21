import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

const authErrorMessage = (code) => {
  const map = {
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/invalid-login-credentials': 'Invalid email or password.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Invalid email or password.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/email-already-in-use': 'This email is already registered. Try login instead.',
    'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
  };
  return map[code] || 'Authentication failed. Please try again.';
};

function PatientLogin({ onAuthSuccess }) {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!fullName.trim() || !phoneNumber.trim() || !age.trim() || !gender.trim() || !address.trim()) {
          setError('Please fill all required user details.');
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          role: 'patient',
          fullName: fullName.trim(),
          email: email.trim(),
          phoneNumber: phoneNumber.trim(),
          age: Number(age),
          gender,
          address: address.trim(),
          bloodGroup: bloodGroup.trim(),
          emergencyContact: emergencyContact.trim(),
          createdAt: serverTimestamp(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      if (onAuthSuccess) {
        onAuthSuccess({
          role: 'patient',
          hospital: '',
          fullName,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-400/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-md bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 rounded-3xl p-10 relative z-10 transition-all duration-300">
        
        <button 
          onClick={() => navigate('/')} 
          className="absolute top-6 left-6 text-slate-400 hover:text-blue-600 transition-colors flex items-center group text-sm font-semibold"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>

        <div className="text-center mb-8 mt-4">
          <div className="inline-flex items-center justify-center p-4 bg-blue-50 rounded-2xl mb-4 shadow-sm border border-blue-100">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-blue-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 mb-2 tracking-tight">Patient Portal</h1>
          <p className="text-slate-500 text-sm font-medium">
            Register or sign in to access your records
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

        <div className="flex p-1 bg-slate-50 border border-slate-200 rounded-xl mb-8 shadow-inner">
          <button
            type="button"
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${!isSignUp ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => { setIsSignUp(false); setError(''); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${isSignUp ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => { setIsSignUp(true); setError(''); }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Name *</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                  placeholder="Full name" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Phone Number *</label>
                <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                  placeholder="10-digit mobile number" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Age *</label>
                  <input type="number" min="1" value={age} onChange={(e) => setAge(e.target.value)} required
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                    placeholder="Age" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Gender *</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} required
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium appearance-none"
                  >
                    <option value="" className="text-slate-400">Select</option>
                    <option value="Male" className="text-slate-800">Male</option>
                    <option value="Female" className="text-slate-800">Female</option>
                    <option value="Other" className="text-slate-800">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Address *</label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} required rows={2}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                  placeholder="Current address" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Blood Group</label>
                  <input type="text" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                    placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Emergency Contact</label>
                  <input type="tel" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                    placeholder="Optional" />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Email Address *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
              placeholder="patient@example.com" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Password *</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
              placeholder="••••••••" />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex justify-center items-center mt-6"
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </div>
            ) : isSignUp ? 'Create Patient Account' : 'Secure Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PatientLogin;
