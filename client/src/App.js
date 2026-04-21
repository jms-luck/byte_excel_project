import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './App.css';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import LoginPage from './LoginPage';

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [queueStatus, setQueueStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    // Connect to Socket.IO
    const newSocket = io('http://localhost:5000');

    newSocket.on('connect', () => {
      console.log('✅ Connected to server');
    });

    // Fetch queue status
    axios.get('http://localhost:5000/api/queue/status')
      .then(res => {
        setQueueStatus(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Error fetching queue status:', err);
        setLoading(false);
      });

    return () => newSocket.disconnect();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-xl font-semibold">
        Loading authentication...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const generateToken = async () => {
    try {
      await axios.post('http://localhost:5000/api/queue/token');
      console.log('🎟️ Token generated');
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const callNext = async () => {
    try {
      await axios.post('http://localhost:5000/api/queue/next');
      console.log('➡️ Next patient called');
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">🏥 Hospital Queue Management</h1>
            <p className="text-blue-100 mt-2">Real-time Patient Queue System with Concurrent Processing</p>
            <p className="text-blue-100 mt-1 text-sm">Signed in as: {user.email}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Patient Dashboard */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-green-500 hover:shadow-xl transition">
            <h2 className="text-2xl font-bold mb-4 text-green-600">👤 Patient Dashboard</h2>
            <p className="text-gray-600 mb-6">Generate your token and join the queue</p>
            <button 
              onClick={generateToken}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition transform hover:scale-105"
            >
              🎟️ Get Token
            </button>
          </div>

          {/* Doctor Dashboard */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-blue-500 hover:shadow-xl transition">
            <h2 className="text-2xl font-bold mb-4 text-blue-600">🧑‍⚕️ Doctor Dashboard</h2>
            <p className="text-gray-600 mb-6">Call the next patient in queue</p>
            <button 
              onClick={callNext}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition transform hover:scale-105"
            >
              ➡️ Call Next Patient
            </button>
          </div>
        </div>

        {/* Queue Status */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">📊 System Status</h2>
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

        {/* Info Section */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-bold text-indigo-900 mb-3">ℹ️ Concurrent System Info</h3>
          <ul className="text-indigo-800 space-y-2">
            <li>✅ Backend running on http://localhost:5000</li>
            <li>✅ Concurrent operations: 5 per interval</li>
            <li>✅ Max concurrent limit: 10 operations</li>
            <li>✅ Real-time updates via Socket.IO</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default App;
