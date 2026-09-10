import React from 'react';
import './App.css';
import Login from './front/Login.js';
import { ToastContainer } from 'react-toastify';
import AxiosInterceptor, { ProtectedRoute } from './services/Intercept.jsx';
import AdminDashboard from './dashes/AdminDash.js';
import { Routes, Route } from 'react-router-dom';

function AppContent() {
  return (
    <Routes>
 <Route path="/" element={<Login />} />
  <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path='/admin' element={<AdminDashboard />} >

        </Route>
        </Route>
    </Routes>
  );
}

function App() {
  return (
    <AxiosInterceptor>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme="colored"
      />
      <AppContent />
     {/* <SpeedInsights /> */}
    </AxiosInterceptor>
  );
}

export default App;