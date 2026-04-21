import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

function App() {
  const [queueStatus, setQueueStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Connect to Socket.IO
    const socket = io('http://localhost:5000');
    
    socket.on('connect', () => {
      console.log('Connected to server');
    });

    // Fetch queue status
    axios.get('http://localhost:5000/api/queue/status')
      .then(res => {
        setQueueStatus(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching queue status:', err);
        setLoading(false);
      });

    return () => socket.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-3xl font-bold">🏥 Hospital Queue Management</h1>
      </header>
      
      <main className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patient Dashboard */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">👤 Patient Dashboard</h2>
            <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
              Get Token
            </button>
          </div>

          {/* Doctor Dashboard */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">🧑‍⚕️ Doctor Dashboard</h2>
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Call Next Patient
            </button>
          </div>
        </div>

        {/* Queue Status */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-2xl font-bold mb-4">📊 Queue Status</h2>
          {loading ? <p>Loading...</p> : <pre>{JSON.stringify(queueStatus, null, 2)}</pre>}
        </div>
      </main>
    </div>
  );
}

export default App;
