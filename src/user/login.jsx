// src/components/UserLogin.js
import React, { useState } from 'react';
import { API_URL } from "../config";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, faEnvelope, faLock, faSignInAlt, 
  faUserPlus, faSpinner, faHamburger,
  faCheckCircle, faExclamationTriangle,
  faWifi, faServer
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

  // Test backend connection directly
  const testBackendConnection = async () => {
    try {
      console.log('🔍 Testing connection to:', API_URL);
      
      const response = await fetch(`${API_URL}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend is working:', data);
        return { success: true, data };
      } else {
        const errorText = await response.text();
        console.log('❌ Backend error:', errorText);
        return { 
          success: false, 
          error: `Server returned status: ${response.status} - ${errorText}` 
        };
      }
    } catch (error) {
      console.error('💥 Connection failed:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  };

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

    setLoading(true);
    setMessage('Testing connection to server...');
    setMessageType('info');

    try {
      // Step 1: Test connection first
      const connectionTest = await testBackendConnection();
      
      if (!connectionTest.success) {
        throw new Error(`Cannot connect to backend: ${connectionTest.error}`);
      }

      setMessage('Connection successful! Attempting login...');
      
      // Step 2: Attempt login
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

      console.log('🚀 Making request to:', url);
      console.log('📦 Payload:', { ...payload, password: '***' });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📨 Response status:', response.status);
      console.log('📨 Response headers:', response.headers);

      const responseText = await response.text();
      console.log('📨 Response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse JSON:', parseError);
        throw new Error(`Server returned invalid JSON: ${responseText}`);
      }

      if (!response.ok) {
        throw new Error(data.message || `Login failed with status ${response.status}`);
      }

      console.log('✅ Login success:', data);

      if (isLogin && data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setMessage('✅ Login successful! Redirecting...');
        setMessageType('success');
        
        setTimeout(() => {
          onLogin(data.user);
        }, 1000);
      } else if (!isLogin) {
        setMessage('✅ Account created! Please login.');
        setMessageType('success');
        setIsLogin(true);
        setFormData({ username: '', email: '', password: '' });
      } else {
        throw new Error('No user data received');
      }

    } catch (error) {
      console.error('💥 Authentication failed:', error);
      
      let errorMessage = error.message;
      
      if (error.message.includes('Failed to fetch') || 
          error.message.includes('NetworkError') ||
          error.message.includes('Load failed')) {
        errorMessage = `🌐 Network Connection Failed

Cannot connect to: ${API_URL}

Possible reasons:
• Backend server is sleeping on Render
• Backend server is not running
• CORS configuration issue
• Network firewall blocking the connection

Please:
1. Wait 30-60 seconds for Render to wake up the server
2. Refresh and try again
3. Check if backend is deployed correctly on Render`;
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

  // Manual connection test button
  const handleTestConnection = async () => {
    setLoading(true);
    setMessage('Testing connection to server...');
    
    const result = await testBackendConnection();
    
    if (result.success) {
      setMessage(`✅ Server is running!\n\nResponse: ${JSON.stringify(result.data)}`);
      setMessageType('success');
    } else {
      setMessage(`❌ Connection failed:\n\n${result.error}`);
      setMessageType('error');
    }
    
    setLoading(false);
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
                  placeholder="Username"
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
                placeholder="Password"
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
                {isLogin ? 'Connecting...' : 'Creating...'}
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
          onClick={handleTestConnection}
          disabled={loading}
          className="w-full mt-4 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center"
        >
          <FontAwesomeIcon icon={faWifi} className="mr-2" />
          Test Server Connection
        </button>

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

        {/* Troubleshooting Info */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-bold text-yellow-800 mb-2 flex items-center">
            <FontAwesomeIcon icon={faServer} className="mr-2" />
            Troubleshooting
          </h4>
          <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
            <li>Render free tier servers sleep after inactivity</li>
            <li>First request may take 30-60 seconds to wake up</li>
            <li>Check browser Console for detailed errors</li>
            <li>Verify backend is deployed on Render</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;
