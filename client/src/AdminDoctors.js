import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const emptyForm = {
    name: '',
    department: 'General Medicine',
    specialization: '',
    qualification: '',
    experienceYears: '',
    locationName: '',
    imageUrl: '',
    contact: '',
    availability: true
  };
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchDoctors();
    const socket = io(API_BASE_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 3000,
    });

    socket.on('doctors_updated', (updatedDoctors) => {
      setDoctors(updatedDoctors || []);
      setLoading(false);
    });

    return () => socket.disconnect();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/doctors`);
      setDoctors(res.data.doctors || []);
    } catch (err) {
      console.error('Failed to fetch doctors', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/admin/doctors`, {
        ...formData,
        experienceYears: Number(formData.experienceYears) || 0
      });
      setShowAddForm(false);
      setFormData(emptyForm);
      fetchDoctors();
    } catch (err) {
      console.error('Failed to add doctor', err);
    }
  };

  const handleDeleteDoctor = async (id) => {
    if (!window.confirm('Are you sure you want to remove this doctor?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/doctors/${id}`);
      fetchDoctors();
    } catch (err) {
      console.error('Failed to delete doctor', err);
    }
  };

  const handleToggleAvailability = async (doc) => {
    try {
      await axios.put(`${API_BASE_URL}/api/admin/doctors/${doc._id}`, {
        availability: !doc.availability
      });
    } catch (err) {
      console.error('Failed to update doctor availability', err);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mt-8 border border-slate-100 relative overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="h-8 w-1.5 bg-indigo-500 rounded-full mr-3"></div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Manage Doctors</h2>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
        >
          {showAddForm ? 'Cancel' : <><span className="text-xl leading-none">+</span> Add Doctor</>}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddDoctor} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-bold text-slate-700 mb-4">Add New Doctor</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Doctor Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Doctor name" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Department</label>
              <select name="department" value={formData.department} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="General Medicine">General Medicine</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Neurology">Neurology</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Specialization</label>
              <input type="text" name="specialization" value={formData.specialization} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Heart Surgeon" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Qualification</label>
              <input type="text" name="qualification" value={formData.qualification} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="MBBS, MD Cardiology" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Experience</label>
              <input type="number" min="0" step="0.1" name="experienceYears" value={formData.experienceYears} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="5.10" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Available At</label>
              <input type="text" name="locationName" value={formData.locationName} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Gachibowli MedPlus Diagnostic Centre" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Image URL</label>
              <input type="url" name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://example.com/doctor.jpg" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Contact Info</label>
              <input type="text" name="contact" value={formData.contact} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Phone or Email" />
            </div>
            <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 pt-7">
              <input type="checkbox" name="availability" checked={formData.availability} onChange={handleInputChange} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              Available for patient booking
            </label>
          </div>
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
            Save Doctor
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-slate-500">No doctors added yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map(doc => (
            <div key={doc._id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-lg transition-shadow relative group">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xl font-bold mb-3">
                {doc.name.charAt(0)}
              </div>
              <h3 className="font-bold text-lg text-slate-800">{doc.name}</h3>
              <p className="text-indigo-600 font-semibold text-sm mb-1">{doc.department}</p>
              <p className="text-slate-500 text-sm mb-1">{doc.specialization || 'General'}</p>
              <p className="text-slate-400 text-xs">{doc.qualification || 'Qualification not added'}</p>
              <p className="text-slate-500 text-xs mt-2">{doc.locationName || 'Location not added'}</p>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <span className={`px-2 py-1 rounded text-xs font-bold ${doc.availability ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {doc.availability ? 'Available' : 'Unavailable'}
                </span>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleToggleAvailability(doc)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:shadow-none hover:transform-none">
                    {doc.availability ? 'Mark Off' : 'Mark On'}
                  </button>
                  <button onClick={() => handleDeleteDoctor(doc._id)} className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.146 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminDoctors;
