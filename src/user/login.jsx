// src/components/UserLogin.js
import React, { useState } from 'react';
import { API_URL } from "../config";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, faEnvelope, faLock, faSignInAlt, 
  faUserPlus, faSpinner, faHamburger,
  faCheckCircle, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

const UserLogin = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const clearMessages = () => {
    setMessage('');
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    if (!isLogin) {
      if (!formData.username.trim()) {
        errors.username = 'Username is required';
      } else if (formData.username.length < 3 || formData.username.length > 20) {
        errors.username = 'Username must be between 3 and 20 characters';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    if (loading) return;

    if (!validateForm()) {
      showMessage('Please fix the errors above', 'error');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const url = `${API_URL}${endpoint}`;
      
      const payload = isLogin 
        ? { 
            email: formData.email.trim().toLowerCase(), 
            password: formData.password 
          }
        : { 
            username: formData.username.trim(), 
            email: formData.email.trim().toLowerCase(), 
            password: formData.password 
          };

      console.log('Making request to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('Success response:', data);

      if (isLogin) {
        if (data.user) {
          // Store user data
          localStorage.setItem('user', JSON.stringify(data.user));
          showMessage('✅ Login successful! Redirecting...', 'success');
          
          // Call onLogin callback after a short delay
          setTimeout(() => {
            onLogin(data.user);
          }, 1000);
        } else {
          throw new Error('No user data received from server');
        }
      } else {
        showMessage('✅ Account created successfully! Please login.', 'success');
        // Switch to login mode and clear form
        setIsLogin(true);
        setFormData({ username: '', email: '', password: '' });
      }

    } catch (error) {
      console.error('Authentication error:', error);
      
      if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
        showMessage('❌ Cannot connect to server. Please check:\n• Your internet connection\n• If the backend server is running\n• Server URL: ' + API_URL, 'error');
      } else {
        showMessage(`❌ ${error.message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ username: '', email: '', password: '' });
    clearMessages();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faHamburger} className="text-white text-2xl" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-600 mt-2">
            {isLogin ? 'Sign in to your account' : 'Join our foodie community'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Server: {API_URL}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Field (only for registration) */}
          {!isLogin && (
            <div>
              <div className="relative">
                <FontAwesomeIcon 
                  icon={faUser} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                />
                <input
                  type="text"
                  name="username"
                  placeholder="Username (3-20 characters)"
                  value={formData.username}
                  onChange={handleInputChange}
                  required={!isLogin}
                  minLength="3"
                  maxLength="20"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    formErrors.username ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
              </div>
              {formErrors.username && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1 text-xs" />
                  {formErrors.username}
                </p>
              )}
            </div>
          )}

          {/* Email Field */}
          <div>
            <div className="relative">
              <FontAwesomeIcon 
                icon={faEnvelope} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              />
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleInputChange}
                required
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                  formErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
            </div>
            {formErrors.email && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1 text-xs" />
                {formErrors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="relative">
              <FontAwesomeIcon 
                icon={faLock} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              />
              <input
                type="password"
                name="password"
                placeholder="Password (min. 6 characters)"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength="6"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                  formErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
            </div>
            {formErrors.password && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1 text-xs" />
                {formErrors.password}
              </p>
            )}
          </div>

          {/* Message Display */}
          {message && (
            <div className={`p-4 rounded-lg border ${
              messageType === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center">
                <FontAwesomeIcon 
                  icon={messageType === 'success' ? faCheckCircle : faExclamationTriangle} 
                  className={`mr-2 ${
                    messageType === 'success' ? 'text-green-500' : 'text-red-500'
                  }`} 
                />
                <span className="whitespace-pre-line text-sm">{message}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center"
          >
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                {isLogin ? 'Signing In...' : 'Creating Account...'}
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={isLogin ? faSignInAlt : faUserPlus} className="mr-2" />
                {isLogin ? 'Sign In' : 'Create Account'}
              </>
            )}
          </button>
        </form>

        {/* Toggle between Login/Signup */}
        <div className="text-center mt-6">
          <button
            onClick={toggleMode}
            className="text-orange-600 hover:text-orange-800 font-medium transition-colors duration-200 text-sm"
          >
            <FontAwesomeIcon 
              icon={isLogin ? faUserPlus : faSignInAlt} 
              className="mr-2" 
            />
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>

        {/* Debug Info */}
        <div className="mt-6 p-3 bg-gray-100 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            <strong>Debug Info:</strong><br />
            Server: {API_URL}<br />
            Using endpoints: /api/auth/login & /api/auth/register
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;
