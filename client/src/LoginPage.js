import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

const ADMIN_ACCESS_CODE = process.env.REACT_APP_ADMIN_ACCESS_CODE || '520450';

const authErrorMessage = (code) => {
  const map = {
    'auth/configuration-not-found': 'Firebase Authentication is not fully configured. In Firebase Console, open Authentication -> Sign-in method and enable Email/Password, then save. Also ensure your Web App is created for this project.',
    'auth/operation-not-allowed': 'Email/Password login is disabled. Enable it in Firebase Console -> Authentication -> Sign-in method.',
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

function LoginPage({ onAuthSuccess }) {
  const [loginType, setLoginType] = useState('patient');
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (loginType === 'admin') {
        if (!hospitalName.trim()) {
          setError('Hospital name is required for admin login.');
          setLoading(false);
          return;
        }
        if (adminCode.trim() !== ADMIN_ACCESS_CODE) {
          setError('Invalid admin access code.');
          setLoading(false);
          return;
        }
        if (isSignUp) {
          setError('Admin signup is disabled. Use existing admin credentials.');
          setLoading(false);
          return;
        }
      }

      if (isSignUp) {
        if (loginType === 'patient') {
          if (!fullName.trim() || !phoneNumber.trim() || !age.trim() || !gender.trim() || !address.trim()) {
            setError('Please fill all required user details.');
            setLoading(false);
            return;
          }
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        if (loginType === 'patient') {
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
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      if (onAuthSuccess) {
        onAuthSuccess({
          role: loginType,
          hospital: hospitalName,
          fullName,
        });
      }
    } catch (err) {
      setError(authErrorMessage(err?.code));
      console.error('Firebase Auth Error:', err?.code, err?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/95 rounded-2xl shadow-2xl p-8 border border-white/40">
        <h1 className="text-3xl font-bold text-slate-800">Hospital Portal Login</h1>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            type="button"
            onClick={() => {
              setLoginType('patient');
              setError('');
            }}
            className={`rounded-lg px-3 py-2 font-semibold ${loginType === 'patient' ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            Patient Login
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginType('admin');
              setIsSignUp(false);
              setError('');
            }}
            className={`rounded-lg px-3 py-2 font-semibold ${loginType === 'admin' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            Hospital Admin
          </button>
        </div>
        <p className="text-slate-600 mt-2">
          {loginType === 'admin'
            ? 'Sign in as hospital administrator'
            : (isSignUp ? 'Create your patient account' : 'Sign in as patient')}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {loginType === 'patient' && isSignUp ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="10-digit mobile number"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    min="1"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Age"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Current address"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Blood Group</label>
                  <input
                    type="text"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Emergency Contact</label>
                  <input
                    type="tel"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Optional"
                  />
                </div>
              </div>
            </>
          ) : null}

          {loginType === 'admin' ? (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Hospital Name</label>
              <input
                type="text"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Government Hospital Name"
              />
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="At least 6 characters"
            />
          </div>

          {loginType === 'admin' ? (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Admin Access Code</label>
              <input
                type="password"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Enter admin access code"
              />
            </div>
          ) : null}

          {error ? (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className={`w-full disabled:bg-slate-400 text-white font-bold py-2.5 rounded-lg transition ${loginType === 'admin' ? 'bg-red-600 hover:bg-red-700' : 'bg-cyan-600 hover:bg-cyan-700'}`}
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create User Account' : (loginType === 'admin' ? 'Login as Admin' : 'Login as User')}
          </button>
        </form>

        {loginType === 'patient' ? (
          <button
            type="button"
            onClick={() => {
              setIsSignUp((prev) => !prev);
              setError('');
            }}
            className="mt-4 w-full text-cyan-700 hover:text-cyan-900 text-sm font-semibold"
          >
            {isSignUp ? 'Already have a patient account? Login' : 'New patient? Create an account'}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default LoginPage;
