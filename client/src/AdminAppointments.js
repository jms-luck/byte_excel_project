import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
    const socket = io(API_BASE_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 3000,
    });

    socket.on('appointments_updated', (updatedAppointments) => {
      setAppointments(updatedAppointments || []);
      setLoading(false);
    });

    return () => socket.disconnect();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/appointments`);
      setAppointments(res.data.appointments || []);
    } catch (err) {
      console.error('Failed to fetch appointments', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await axios.put(`${API_BASE_URL}/api/admin/appointments/${id}`, { status: newStatus });
      fetchAppointments();
    } catch (err) {
      console.error('Failed to update appointment', err);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      case 'rescheduled': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mt-8 border border-slate-100 relative overflow-hidden">
      <div className="flex items-center mb-8">
        <div className="h-8 w-1.5 bg-indigo-500 rounded-full mr-3"></div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Manage Appointments</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-slate-500">No appointments found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="py-3 px-4 text-sm font-semibold text-slate-600 rounded-tl-lg">Patient</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-600">Doctor</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-600">Date/Time</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-600">Reason</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-600">Status</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-600 rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map((app) => (
                <tr key={app._id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4 font-semibold text-slate-800">{app.patientName}</td>
                  <td className="py-4 px-4 text-sm text-slate-600">{app.doctorName || app.doctorId}</td>
                  <td className="py-4 px-4 text-sm text-slate-700 font-medium">
                    {new Date(app.date).toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-500">{app.reason || '-'}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold border capitalize ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2">
                      {app.status === 'pending' && (
                        <button onClick={() => handleUpdateStatus(app._id, 'approved')} className="bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">
                          Approve
                        </button>
                      )}
                      {(app.status === 'pending' || app.status === 'approved') && (
                        <button onClick={() => handleUpdateStatus(app._id, 'rescheduled')} className="bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">
                          Reschedule
                        </button>
                      )}
                      {app.status !== 'cancelled' && (
                        <button onClick={() => handleUpdateStatus(app._id, 'cancelled')} className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminAppointments;
