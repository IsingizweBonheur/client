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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setFormErrors({});

    if (loading) return;

    // Basic validation
    if (!formData.email || !formData.password) {
      setMessage('Please fill in all fields');
      setMessageType('error');
      return;
    }

    if (!isLogin && !formData.username) {
      setMessage('Username is required for registration');
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
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📡 Response status:', response.status);

      const data = await response.json();
      console.log('📡 Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      if (isLogin) {
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          setMessage('✅ Login successful! Redirecting...');
          setMessageType('success');
          
          setTimeout(() => {
            onLogin(data.user);
          }, 1000);
        } else {
          throw new Error('No user data received from server');
        }
      } else {
        setMessage('✅ Account created successfully! Please login.');
        setMessageType('success');
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
    setMessage('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <div className="relative">
                <FontAwesomeIcon icon={faUser} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="username"
                  placeholder="Username (3-20 characters)"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          <div>
            <div className="relative">
              <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                name="password"
                placeholder="Password (min. 6 characters)"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`p-4 rounded-lg border text-sm whitespace-pre-line ${
              messageType === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-start">
                <FontAwesomeIcon 
                  icon={messageType === 'success' ? faCheckCircle : faExclamationTriangle} 
                  className={`mt-1 mr-2 ${
                    messageType === 'success' ? 'text-green-500' : 'text-red-500'
                  }`} 
                />
                <span>{message}</span>
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
            <FontAwesomeIcon icon={isLogin ? faUserPlus : faSignInAlt} className="mr-2" />
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
      </div>
    </div>
  );
};

export default UserLogin;
