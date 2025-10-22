// components/UserLogin.js
import React, { useState } from 'react';
import { API_URL } from "../config";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, faEnvelope, faLock, faSignInAlt, 
  faUserPlus, faSpinner, faArrowLeft, faHamburger,
  faKey, faCheckCircle, faExclamationTriangle,
  faServer
} from '@fortawesome/free-solid-svg-icons';

const UserLogin = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    newPassword: '',
    confirmPassword: ''
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

    if (showResetPassword) {
      if (!formData.newPassword) {
        errors.newPassword = 'New password is required';
      } else if (formData.newPassword.length < 6) {
        errors.newPassword = 'Password must be at least 6 characters long';
      }

      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const makeApiRequest = async (url, options) => {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      if (error.name === 'TypeError') {
        throw new Error('Cannot connect to server. Please check your internet connection and try again.');
      }
      throw error;
    }
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
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
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

      const data = await makeApiRequest(`${API_URL}${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (isLogin) {
        if (data.user) {
          // Store user data and call onLogin callback
          localStorage.setItem('user', JSON.stringify(data.user));
          showMessage('✅ Login successful! Redirecting...', 'success');
          
          setTimeout(() => {
            onLogin(data.user);
          }, 1000);
        } else {
          throw new Error('No user data received from server');
        }
      } else {
        showMessage('✅ Account created successfully! Please login.', 'success');
        setIsLogin(true);
        setFormData({ username: '', email: '', password: '', newPassword: '', confirmPassword: '' });
      }

    } catch (error) {
      console.error('Authentication error:', error);
      showMessage(error.message || 'An unexpected error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    clearMessages();

    if (!formData.email.trim()) {
      showMessage('Please enter your email address', 'error');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showMessage('Please enter a valid email address', 'error');
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      const data = await makeApiRequest(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        body: JSON.stringify({ email: formData.email.trim().toLowerCase() }),
      });

      showMessage('✅ If an account with that email exists, a password reset link has been sent!', 'success');
      
      if (data.demoResetToken) {
        setTimeout(() => {
          setResetToken(data.demoResetToken);
          setShowForgotPassword(false);
          setShowResetPassword(true);
          setFormData({ ...formData, email: '' });
          showMessage('You can now set your new password', 'info');
        }, 2000);
      } else {
        setTimeout(() => {
          setShowForgotPassword(false);
          setFormData({ ...formData, email: '' });
        }, 3000);
      }

    } catch (error) {
      console.error('Forgot password error:', error);
      showMessage(error.message || 'Failed to send reset email. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    clearMessages();

    if (!resetToken) {
      showMessage('Reset token is missing or invalid', 'error');
      return;
    }

    if (!validateForm()) {
      showMessage('Please fix the errors above', 'error');
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      const data = await makeApiRequest(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        body: JSON.stringify({
          token: resetToken,
          newPassword: formData.newPassword
        }),
      });

      showMessage('✅ Password reset successfully! You can now login with your new password.', 'success');
      
      setTimeout(() => {
        setShowResetPassword(false);
        setIsLogin(true);
        setFormData({ username: '', email: '', password: '', newPassword: '', confirmPassword: '' });
        setResetToken('');
        clearMessages();
      }, 2000);

    } catch (error) {
      console.error('Reset password error:', error);
      showMessage(error.message || 'Failed to reset password. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setShowResetPassword(false);
    setFormData({ username: '', email: '', password: '', newPassword: '', confirmPassword: '' });
    setResetToken('');
    clearMessages();
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ username: '', email: '', password: '', newPassword: '', confirmPassword: '' });
    clearMessages();
  };

  // Forgot Password View
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
          <button
            onClick={handleBackToLogin}
            className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 transition-colors p-2"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-lg" />
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faKey} className="text-white text-2xl" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Reset Password</h2>
            <p className="text-gray-600 mt-2">Enter your email to receive a reset link</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleForgotPassword(); }} className="space-y-6">
            <div>
              <div className="relative">
                <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
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

            {message && (
              <div className={`p-4 rounded-lg border ${
                messageType === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center">
                  <FontAwesomeIcon icon={messageType === 'success' ? faCheckCircle : faExclamationTriangle} className="mr-2" />
                  <span className="whitespace-pre-line">{message}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200"
            >
              {loading ? (
                <span><FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />Sending...</span>
              ) : (
                <span><FontAwesomeIcon icon={faKey} className="mr-2" />Send Reset Link</span>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Reset Password View
  if (showResetPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
          <button
            onClick={handleBackToLogin}
            className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 transition-colors p-2"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-lg" />
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faKey} className="text-white text-2xl" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Create New Password</h2>
            <p className="text-gray-600 mt-2">Enter your new password below</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleResetPassword(); }} className="space-y-6">
            <div>
              <div className="relative">
                <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  name="newPassword"
                  placeholder="New password (min. 6 characters)"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  required
                  minLength="6"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    formErrors.newPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
              </div>
              {formErrors.newPassword && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1 text-xs" />
                  {formErrors.newPassword}
                </p>
              )}
            </div>

            <div>
              <div className="relative">
                <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  minLength="6"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    formErrors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
              </div>
              {formErrors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1 text-xs" />
                  {formErrors.confirmPassword}
                </p>
              )}
            </div>

            {message && (
              <div className={`p-4 rounded-lg border ${
                messageType === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center">
                  <FontAwesomeIcon icon={messageType === 'success' ? faCheckCircle : faExclamationTriangle} className="mr-2" />
                  <span className="whitespace-pre-line">{message}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200"
            >
              {loading ? (
                <span><FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />Resetting...</span>
              ) : (
                <span><FontAwesomeIcon icon={faKey} className="mr-2" />Reset Password</span>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main Login/Signup View
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
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
        </div>

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
                  required={!isLogin}
                  minLength="3"
                  maxLength="20"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
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

          <div>
            <div className="relative">
              <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleInputChange}
                required
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
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

          <div>
            <div className="relative">
              <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                name="password"
                placeholder="Password (min. 6 characters)"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength="6"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
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

          {isLogin && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-orange-600 hover:text-orange-800 text-sm font-medium transition-colors duration-200"
              >
                <FontAwesomeIcon icon={faKey} className="mr-2" />
                Forgot your password?
              </button>
            </div>
          )}

          {message && (
            <div className={`p-4 rounded-lg border ${
              messageType === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center">
                <FontAwesomeIcon icon={messageType === 'success' ? faCheckCircle : faExclamationTriangle} className="mr-2" />
                <span className="whitespace-pre-line">{message}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200"
          >
            {loading ? (
              <span><FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
            ) : (
              <span><FontAwesomeIcon icon={isLogin ? faSignInAlt : faUserPlus} className="mr-2" />{isLogin ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={toggleMode}
            className="text-orange-600 hover:text-orange-800 font-medium transition-colors duration-200"
          >
            <FontAwesomeIcon icon={isLogin ? faUserPlus : faSignInAlt} className="mr-2" />
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;
