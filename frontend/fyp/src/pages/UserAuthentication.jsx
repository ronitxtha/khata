import React from "react";

export default function UserAuthentication() {
  return (
    <div className="ua-container">
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body, html, .ua-container {
          height: 100%;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .ua-container {
          background: linear-gradient(135deg, #007bff, #00c6ff);
          color: white;
          padding: 50px 20px;
        }
        .hero {
          text-align: center;
          margin-bottom: 50px;
        }
        .hero img {
          max-width: 100%;
          height: auto;
          border-radius: 15px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.2);
        }
        .hero h1 {
          font-size: 3rem;
          margin: 25px 0 15px;
        }
        .hero p {
          font-size: 1.2rem;
          max-width: 800px;
          margin: 0 auto;
          color: #e0f8ff;
          line-height: 1.5;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 24px;
          max-width: 1000px;
          margin: 0 auto;
        }
        .feature-card {
          background: rgba(255,255,255,0.15);
          border-radius: 12px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: start;
          transition: transform 0.3s, background 0.3s;
          box-shadow: 0 6px 18px rgba(0,0,0,0.15);
        }
        .feature-card:hover {
          background: rgba(255,255,255,0.25);
          transform: translateY(-8px);
        }
        .icon {
          font-size: 2.2rem;
          margin-bottom: 14px;
          color: #fff;
        }
        .feature-title {
          font-size: 1.3rem;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .feature-text {
          font-size: 1rem;
          color: #e8f8ff;
          line-height: 1.4;
        }
        .footer-note {
          text-align: center;
          margin-top: 60px;
          font-size: 0.95rem;
          color: #cceeff;
        }
      `}</style>

      <div className="hero">
        <img src="https://images.unsplash.com/photo-1605902711622-cfb43c443f12?auto=format&fit=crop&w=1350&q=80" 
             alt="Login security" />
        <h1>🔐 User Authentication</h1>
        <p>
          Secure login and registration for customers, staff, and owners. 
          Protect sensitive data while keeping onboarding smooth and simple.
        </p>
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <i className="fa-solid fa-user-shield icon"></i>
          <div className="feature-title">Role-Based Access</div>
          <div className="feature-text">
            Separate access for customers, staff, and owners ensures only authorized users can see or modify data.
          </div>
        </div>

        <div className="feature-card">
          <i className="fa-solid fa-lock icon"></i>
          <div className="feature-title">Secure Registration</div>
          <div className="feature-text">
            Accounts are protected with strong password encryption and verification steps.
          </div>
        </div>

        <div className="feature-card">
          <i className="fa-solid fa-user-check icon"></i>
          <div className="feature-title">Staff Permissions</div>
          <div className="feature-text">
            Owners control what staff members can access or manage, preventing accidental changes.
          </div>
        </div>

        <div className="feature-card">
          <i className="fa-solid fa-mobile-screen-button icon"></i>
          <div className="feature-title">Multi-Device Login</div>
          <div className="feature-text">
            Access accounts securely from mobile, tablet, or desktop, with synced data across devices.
          </div>
        </div>

        <div className="feature-card">
          <i className="fa-solid fa-envelope-open-text icon"></i>
          <div className="feature-title">Password Recovery</div>
          <div className="feature-text">
            Easy reset flow using verified email, so users can regain access safely.
          </div>
        </div>

        <div className="feature-card">
          <i className="fa-solid fa-user-clock icon"></i>
          <div className="feature-title">Session Security</div>
          <div className="feature-text">
            Automatically expires inactive sessions to protect sensitive business data.
          </div>
        </div>
      </div>

      <div className="footer-note">
        Keep your business safe while allowing smooth and secure access for everyone.
      </div>

      {/* Add Font Awesome CDN for icons */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />
    </div>
  );
}
