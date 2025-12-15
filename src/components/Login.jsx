import React, { useState } from 'react';
import { authAPI } from '../services/api';

const Login = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    role: 'admin',
    email: '',
    username: '',
    password: '',
    remember: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Temporary credentials (fallback if API is not available)
  const TEMP_CREDENTIALS = {
    email: 'admin@anithastores.com',
    password: 'admin123'
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Clear the opposite field when role changes
    if (name === 'role') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        email: value === 'admin' ? prev.email : '',
        username: value === 'admin' ? '' : prev.username
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      console.log('Back button clicked');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Try API login first
      // For admin: use email, for supervisor/staff: use username
      const loginIdentifier = formData.role === 'admin' ? formData.email : formData.username;
      const response = await authAPI.login(loginIdentifier, formData.password, formData.role);
      
      if (response.success) {
        // Normalize role: Super Admin -> admin, Supervisor -> supervisor, Staff -> staff
        let normalizedRole = response.user.role || formData.role;
        if (normalizedRole === 'Super Admin' || normalizedRole === 'admin') {
          normalizedRole = 'admin';
        } else if (normalizedRole.toLowerCase() === 'supervisor' || normalizedRole.toLowerCase() === 'manager') {
          normalizedRole = 'supervisor';
        } else if (normalizedRole.toLowerCase() === 'staff') {
          normalizedRole = 'staff';
        } else {
          // Default to staff if role is not recognized
          normalizedRole = 'staff';
        }
        
        // Successful login
        if (formData.remember) {
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userRole', normalizedRole);
          localStorage.setItem('userData', JSON.stringify(response.user));
        }
        setIsLoading(false);
        onLoginSuccess(normalizedRole, response.user);
      }
    } catch (apiError) {
      // Fallback to temporary credentials if API fails (only for admin)
      console.warn('API login failed, using fallback:', apiError.message);
      
      if (
        formData.role === 'admin' &&
        formData.email.toLowerCase() === TEMP_CREDENTIALS.email.toLowerCase() &&
        formData.password === TEMP_CREDENTIALS.password
      ) {
        // Successful login with fallback
        if (formData.remember) {
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userRole', 'admin');
          localStorage.setItem('userData', JSON.stringify({
            name: 'Admin Root',
            role: 'admin',
            email: formData.email
          }));
        }
        setIsLoading(false);
        onLoginSuccess('admin', {
          name: 'Admin Root',
          role: 'admin',
          email: formData.email
        });
      } else {
        // Failed login
        setIsLoading(false);
        if (formData.role === 'admin') {
          setError('Invalid email or password. Use: admin@anithastores.com / admin123');
        } else {
          setError('Invalid username or password. Please check your credentials.');
        }
      }
    }
  };


  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <button className="back-btn" onClick={handleBack}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <div className="header-content">
          <h1 className="store-name">Anitha Stores</h1>
          <p className="subtitle">Secure login for Admin</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="login-card">
          {/* Red Banner Section */}
          <div className="banner">
            <div className="banner-pattern"></div>
            <div className="banner-content">
              <div className="user-icon">
                <i className="fas fa-user"></i>
              </div>
              <h2 className="welcome-text">Welcome Back</h2>
              <p className="welcome-subtitle">Sign in to continue</p>
            </div>
          </div>

          {/* Login Form Section */}
          <div className="form-section">
            <form className="login-form" onSubmit={handleSubmit}>
              {/* Select Role Field */}
              <div className="form-group">
                <label htmlFor="role">Select Role</label>
                <div className="input-wrapper role-select">
                  <i className="fas fa-user input-icon"></i>
                  <select
                    id="role"
                    name="role"
                    className="form-input"
                    value={formData.role}
                    onChange={handleInputChange}
                  >
                    <option value="admin">Admin</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="staff">Staff</option>
                  </select>
                  <i className="fas fa-chevron-down dropdown-icon"></i>
                </div>
              </div>

              {/* Email/Username Field - Changes based on role */}
              {formData.role === 'admin' ? (
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <div className="input-wrapper">
                    <i className="fas fa-envelope input-icon"></i>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="form-input"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <div className="input-wrapper">
                    <i className="fas fa-user input-icon"></i>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      className="form-input"
                      placeholder="Enter your username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Password Field */}
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <i className="fas fa-lock input-icon"></i>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    className="form-input"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={togglePasswordVisibility}
                  >
                    <i className={showPassword ? 'fas fa-eye' : 'fas fa-eye-slash'}></i>
                  </button>
                </div>
              </div>

              {/* Remember Me and Forgot */}
              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    id="remember"
                    name="remember"
                    checked={formData.remember}
                    onChange={handleInputChange}
                  />
                  <span className="checkmark"></span>
                  <span className="checkbox-text">Remember me</span>
                </label>
                <a href="#" className="forgot-link">Forgot?</a>
              </div>

              {/* Error Message */}
              {error && (
                <div className="error-message">
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{error}</span>
                </div>
              )}

              {/* Sign In Button */}
              <button
                type="submit"
                className="signin-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="ssl-badge">
          <i className="fas fa-check-circle ssl-icon"></i>
          <span className="ssl-text">Secure SSL Encrypted Connection</span>
        </div>
      </footer>
    </div>
  );
};

export default Login;

