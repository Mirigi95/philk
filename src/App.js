import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <main className="landing-container">
        <div className="card">
          <div className="status-badge">Work in Progress</div>
          <h1>Philcare Clinic System</h1>
          <p className="subtitle">
            We are building a new, improved digital experience to better serve your healthcare needs.
          </p>
          
          <div className="progress-bar-container">
            <div className="progress-bar"></div>
          </div>

          <div className="info-grid">
            <div className="info-item">
              <h3>Appointments</h3>
              <p>Easy online scheduling coming soon.</p>
            </div>
            <div className="info-item">
              <h3>Patient Portal</h3>
              <p>Secure access to your medical records.</p>
            </div>
          </div>

          <div className="contact-section">
            <p>For urgent inquiries, please contact us directly:</p>
            <a href="mailto:danmirigi@outlook.com" className="contact-button">
              Contact Support
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;