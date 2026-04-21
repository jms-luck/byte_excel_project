import React from 'react';
import { useNavigate } from 'react-router-dom';

function AuthSelect() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/10 rounded-full blur-[100px]" />
      
      <div className="w-full max-w-5xl relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm border border-blue-100 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-blue-600">
              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v5.25H6a.75.75 0 000 1.5h5.25V18a.75.75 0 001.5 0v-5.25H18a.75.75 0 000-1.5h-5.25V6z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-5xl font-extrabold text-slate-800 mb-4 tracking-tight">
            Hospital Management System
          </h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto font-medium">
            Centralized healthcare portal. Please select your role to continue securely.
          </p>
        </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 max-w-5xl mx-auto">
              
              {/* Patient Card */}
              <button 
                onClick={() => navigate('/login/patient')}
                className="group relative bg-white hover:bg-slate-50 shadow-xl shadow-blue-900/5 border border-slate-200 hover:border-blue-300 p-8 rounded-3xl transition-all duration-300 hover:-translate-y-2 text-left overflow-hidden flex flex-col justify-between h-[320px]"
              >
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-50 rounded-full blur-2xl group-hover:bg-blue-100 transition-colors"></div>
                
                <div className="relative z-10">
                  <div className="h-14 w-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-blue-700 transition-colors">Patient Portal</h2>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">
                    Access your medical records, check live queue status, and request emergency triage services.
                  </p>
                </div>
                
                <div className="relative z-10 flex items-center text-blue-600 font-bold text-sm group-hover:translate-x-2 transition-transform mt-6">
                  Continue as Patient
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 ml-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </button>

              {/* Doctor Card */}
              <button 
                onClick={() => navigate('/login/doctor')}
                className="group relative bg-white hover:bg-slate-50 shadow-xl shadow-teal-900/5 border border-slate-200 hover:border-teal-300 p-8 rounded-3xl transition-all duration-300 hover:-translate-y-2 text-left overflow-hidden flex flex-col justify-between h-[320px]"
              >
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-teal-50 rounded-full blur-2xl group-hover:bg-teal-100 transition-colors"></div>
                
                <div className="relative z-10">
                  <div className="h-14 w-14 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 15l3-3m0 0l-3-3m3 3h-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-teal-700 transition-colors">Doctor Portal</h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">
                    Access patient queues, manage active consultations, and route to laboratory/pharmacy.
                  </p>
                </div>

                <div className="relative z-10 flex items-center text-teal-600 font-bold text-sm group-hover:translate-x-2 transition-transform mt-6">
                  Login as Doctor
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 ml-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </button>

              {/* Admin Card */}
              <button 
                onClick={() => navigate('/login/admin')}
                className="group relative bg-white hover:bg-slate-50 shadow-xl shadow-indigo-900/5 border border-slate-200 hover:border-indigo-300 p-8 rounded-3xl transition-all duration-300 hover:-translate-y-2 text-left overflow-hidden flex flex-col justify-between h-[320px]"
              >
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-50 rounded-full blur-2xl group-hover:bg-indigo-100 transition-colors"></div>
                
                <div className="relative z-10">
                  <div className="h-14 w-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-indigo-700 transition-colors">Admin Portal</h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">
                    Manage hospital resources, oversee queues, schedule appointments, and track staff availability.
                  </p>
                </div>

                <div className="relative z-10 flex items-center text-indigo-600 font-bold text-sm group-hover:translate-x-2 transition-transform mt-6">
                  Login as Admin
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 ml-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </button>
            </div>
      </div>
    </div>
  );
}

export default AuthSelect;
