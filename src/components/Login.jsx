import React, { useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const Login = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    role: 'admin',
    username: '',
    password: '',
    remember: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Clear form state and localStorage on component mount (after logout)
  useEffect(() => {
    // Clear any stale authentication data
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    
    // Reset form to clean state
    setFormData({
      role: 'admin',
      username: '',
      password: '',
      remember: true
    });
    setError('');
    setIsLoading(false);
  }, []);


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle role change
    if (name === 'role') {
      setFormData(prev => ({
        ...prev,
        [name]: value
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

  const clearUsername = () => {
    setFormData(prev => ({
      ...prev,
      username: ''
    }));
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
    
    // Prevent multiple simultaneous login attempts
    if (isLoading) {
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      // Clear any previous authentication data before new login
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userData');
      
      // Trim and validate inputs
      const trimmedUsername = formData.username.trim();
      const trimmedPassword = formData.password.trim();
      
      if (!trimmedUsername || !trimmedPassword) {
        setError('Please enter both username and password.');
        setIsLoading(false);
        return;
      }
      
      // Try API login
      const response = await authAPI.login(trimmedUsername, trimmedPassword, formData.role);
      
      if (response && response.success) {
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
        
        // Successful login - store credentials
        if (formData.remember) {
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userRole', normalizedRole);
          localStorage.setItem('userData', JSON.stringify(response.user));
        }
        
        // Clear form before navigation
        setFormData({
          role: 'admin',
          username: '',
          password: '',
          remember: true
        });
        setIsLoading(false);
        
        // Small delay to ensure state is cleared
        setTimeout(() => {
          onLoginSuccess(normalizedRole, response.user);
        }, 100);
      } else {
        setIsLoading(false);
        setError('Invalid username or password. Please check your credentials.');
      }
    } catch (apiError) {
      console.error('Login error:', apiError);
      
      // Clear form password on error
      setFormData(prev => ({
        ...prev,
        password: ''
      }));
      
      setIsLoading(false);
      
      // Provide specific error messages
      if (apiError.message && apiError.message.includes('timeout')) {
        setError('Login request timed out. Please try again.');
      } else if (apiError.message && apiError.message.includes('connection')) {
        setError('Connection error. Please check your internet and try again.');
      } else {
        setError(apiError.message || 'Invalid username or password. Please check your credentials.');
      }
    }
  };


  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <img src="/logo.png" alt="Anitha Stores Logo" className="header-logo" />
        <div className="header-content">
          <div className="header-logo-name">
            <h1 className="store-name">Anitha Stores</h1>
          </div>
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
              <div className="banner-logo">
                <img 
                  src="/logo.png" 
                  alt="" 
                  className="logo-image"
                  onError={(e) => {
                    // Try alternative logo paths
                    if (e.target.src.includes('logo.png')) {
                      e.target.src = '/logo192.png';
                    } else if (e.target.src.includes('logo192.png')) {
                      e.target.src = '/logo.jpg';
                    } else if (e.target.src.includes('logo.jpg')) {
                      e.target.src = '/logo.svg';
                    } else {
                      e.target.style.display = 'none';
                      console.error('Logo image not found. Please add logo.png to the public folder.');
                    }
                  }}
                />
              </div>
              <h2 className="welcome-text">Welcome</h2>
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

              {/* Username Field */}
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
                  {formData.username && (
                    <button
                      type="button"
                      className="password-toggle username-clear"
                      onClick={clearUsername}
                      title="Clear username"
                      aria-label="Clear username"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
              </div>

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
          <span className="ssl-text">Powered by Evercode</span>
        </div>
      </footer>
    </div>
  );
};

export default Login;

