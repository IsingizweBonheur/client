// src/components/UserLogin.js
import React, { useState } from 'react';
import { API_URL } from "../config";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, faEnvelope, faLock, faSignInAlt, 
  faUserPlus, faSpinner, faHamburger,
  faCheckCircle, faExclamationTriangle,
  faEye, faEyeSlash
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
  const [showPassword, setShowPassword] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const validateForm = () => {
    const errors = {};

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    // Username validation for registration
    if (!isLogin) {
      if (!formData.username.trim()) {
        errors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        errors.username = 'Username must be at least 3 characters';
      } else if (formData.username.length > 20) {
        errors.username = 'Username must be less than 20 characters';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setFormErrors({});

    if (loading) return;

    if (!validateForm()) {
      setMessage('Please fix the errors above');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('Connecting to server...');
    setMessageType('info');

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

      console.log('🔄 Making request to:', url);
      console.log('📦 Payload:', { ...payload, password: '***' });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📡 Response status:', response.status);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response: ${text}`);
      }

      const data = await response.json();
      console.log('📡 Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      if (isLogin) {
        if (data.user) {
          // Store user data
          localStorage.setItem('user', JSON.stringify(data.user));
          setMessage('✅ Login successful! Redirecting to dashboard...');
          setMessageType('success');
          setRedirecting(true);
          
          // Redirect after a short delay to show success message
          setTimeout(() => {
            onLogin(data.user);
          }, 2000);
        } else {
          throw new Error('No user data received from server');
        }
      } else {
        setMessage('✅ Account created successfully! Please login.');
        setMessageType('success');
        // Switch to login mode and clear form
        setIsLogin(true);
        setFormData({ username: '', email: '', password: '' });
      }

    } catch (error) {
      console.error('❌ Authentication error:', error);
      
      let errorMessage = error.message;
      
      if (error.message.includes('Failed to fetch') || 
          error.message.includes('NetworkError') ||
          error.message.includes('Load failed')) {
        errorMessage = `🌐 Connection Error

Cannot connect to server at:
${API_URL}

Possible issues:
• Backend server is sleeping (Render free tier)
• CORS configuration issue
• Network connectivity problem

Please:
1. Wait 30-60 seconds for server to wake up
2. Refresh and try again
3. Check if backend is deployed correctly`;
      } else if (error.message.includes('Invalid credentials')) {
        errorMessage = '❌ Invalid email or password. Please try again.';
      } else if (error.message.includes('User already exists')) {
        errorMessage = '❌ An account with this email or username already exists.';
      }
      
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ username: '', email: '', password: '' });
    setFormErrors({});
    setMessage('');
    setRedirecting(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const testConnection = async () => {
    setLoading(true);
    setMessage('Testing connection to server...');
    setMessageType('info');

    try {
      const response = await fetch(`${API_URL}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(`✅ Connection successful! Server is running.\n\nStatus: ${data.status}\nMessage: ${data.message}`);
        setMessageType('success');
      } else {
        throw new Error(`Server returned status: ${response.status}`);
      }
    } catch (error) {
      setMessage(`❌ Connection failed: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
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
          <p className="text-xs text-gray-500 mt-2 bg-gray-100 p-2 rounded">
            Server: <strong>{API_URL}</strong>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password (min. 6 characters)"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                  formErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
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
            <div className={`p-4 rounded-lg border text-sm whitespace-pre-line ${
              messageType === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : messageType === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              <div className="flex items-start">
                <FontAwesomeIcon 
                  icon={messageType === 'success' ? faCheckCircle : faExclamationTriangle} 
                  className={`mt-1 mr-2 ${
                    messageType === 'success' ? 'text-green-500' : 'text-red-500'
                  }`} 
                />
                <span>{message}</span>
                {redirecting && (
                  <div className="ml-2">
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-green-500" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || redirecting}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 disabled:scale-100"
          >
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                {isLogin ? 'Signing In...' : 'Creating Account...'}
              </>
            ) : redirecting ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                Redirecting...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={isLogin ? faSignInAlt : faUserPlus} className="mr-2" />
                {isLogin ? 'Sign In' : 'Create Account'}
              </>
            )}
          </button>
        </form>

        {/* Test Connection Button */}
        <button
          onClick={testConnection}
          disabled={loading || redirecting}
          className="w-full mt-4 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center"
        >
          <FontAwesomeIcon icon={faSpinner} className={(loading || redirecting) ? 'animate-spin mr-2' : 'mr-2'} />
          Test Server Connection
        </button>

        {/* Toggle between Login/Signup */}
        <div className="text-center mt-6">
          <button
            onClick={toggleMode}
            disabled={redirecting}
            className="text-orange-600 hover:text-orange-800 disabled:text-orange-300 font-medium transition-colors duration-200 text-sm"
          >
            <FontAwesomeIcon 
              icon={isLogin ? faUserPlus : faSignInAlt} 
              className="mr-2" 
            />
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>

        {/* Debug Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-bold text-blue-800 mb-2">Debug Information</h4>
          <p className="text-sm text-blue-700">
            <strong>Backend URL:</strong> {API_URL}<br />
            <strong>Login Endpoint:</strong> {API_URL}/api/auth/login<br />
            <strong>Register Endpoint:</strong> {API_URL}/api/auth/register<br />
            <strong>Health Check:</strong> {API_URL}/api/health
          </p>
        </div>

        {/* Troubleshooting Tips */}
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-bold text-yellow-800 mb-2">Troubleshooting Tips</h4>
          <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
            <li>Click "Test Server Connection" first to verify backend is running</li>
            <li>Render free tier servers sleep after 15 minutes of inactivity</li>
            <li>First request may take 30-60 seconds to wake up the server</li>
            <li>Check browser console (F12) for detailed error messages</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;
