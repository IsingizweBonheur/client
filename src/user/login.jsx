import React, { useState } from 'react';
import { API_URL } from "../config";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, faEnvelope, faLock, faSignInAlt, 
  faUserPlus, faSpinner, faArrowLeft, faHamburger,
  faKey, faArrowRight, faCheckCircle, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

// User context simulation
const useUser = () => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    const savedSession = localStorage.getItem('session');
    return saved && savedSession ? JSON.parse(saved) : null;
  });

  const login = (userData, sessionData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('session', JSON.stringify(sessionData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('session');
  };

  return { user, login, logout };
};

const UserLogin = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error', 'info'
  const { login } = useUser();

  const API_BASE_URL = API_URL;

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (showResetPassword) {
        await handleResetPassword();
        return;
      }

      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : { username: formData.username, email: formData.email, password: formData.password };

      console.log('Making request to:', `${API_BASE_URL}${endpoint}`);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      showMessage(data.message, 'success');

      if (isLogin) {
        // Store user data and session tokens
        login(data.user, data.session);
        
        // Set authorization header for future requests
        localStorage.setItem('auth_token', data.session.access_token);
        
        setTimeout(() => {
          window.location.href = '/userdashboard';
        }, 1000);
      } else {
        // Switch to login after successful registration
        setIsLogin(true);
        setFormData({ username: '', email: '', password: '', newPassword: '', confirmPassword: '' });
        showMessage('Account created successfully! Please login.', 'success');
      }

    } catch (error) {
      console.error('Auth error:', error);
      showMessage(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      showMessage('Please enter your email address', 'error');
      return;
    }

    setLoading(true);
    showMessage('Checking email...', 'info');

    try {
      // First check if email exists
      const checkResponse = await fetch(`${API_BASE_URL}/api/auth/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });

      const checkData = await checkResponse.json();

      if (!checkResponse.ok) {
        throw new Error(checkData.message || 'Failed to check email');
      }

      if (!checkData.exists) {
        // For security, show success message even if email doesn't exist
        showMessage('If an account with that email exists, a password reset link has been sent', 'success');
        setFormData({ ...formData, email: '' });
        setTimeout(() => {
          setShowForgotPassword(false);
        }, 3000);
        return;
      }

      // Email exists, proceed with forgot password
      showMessage('Sending password reset link...', 'info');

      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }

      showMessage('✅ If an account with that email exists, a password reset link has been sent!', 'success');
      setResetEmail(formData.email);
      setFormData({ ...formData, email: '' });
      
      // Auto-show reset form in demo mode if token is provided
      if (data.demoResetToken) {
        console.log('Demo reset token:', data.demoResetToken);
        showMessage('📧 Password reset email sent! (Check console for demo token)', 'success');
        
        setTimeout(() => {
          setResetToken(data.demoResetToken);
          setShowForgotPassword(false);
          setShowResetPassword(true);
          showMessage('You can now set your new password', 'info');
        }, 3000);
      } else {
        // In production, just show success message
        setTimeout(() => {
          setShowForgotPassword(false);
          showMessage('Please check your email for the reset link', 'info');
        }, 3000);
      }

    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const validateResetToken = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/validate-reset-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        throw new Error(data.message || 'Invalid reset token');
      }

      return data;
    } catch (error) {
      throw new Error('Failed to validate reset token');
    }
  };

  const handleResetPassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      showMessage('Passwords do not match', 'error');
      return;
    }

    if (formData.newPassword.length < 6) {
      showMessage('Password must be at least 6 characters long', 'error');
      return;
    }

    setLoading(true);
    showMessage('Validating token and resetting password...', 'info');

    try {
      // Validate token first
      const tokenValidation = await validateResetToken(resetToken);
      
      if (!tokenValidation.valid) {
        throw new Error('Invalid or expired reset token');
      }

      // Proceed with password reset
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: resetToken,
          newPassword: formData.newPassword,
          email: resetEmail
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      showMessage('✅ Password reset successfully! You can now login with your new password.', 'success');
      
      // Reset states and go back to login
      setTimeout(() => {
        setShowResetPassword(false);
        setIsLogin(true);
        setFormData({ username: '', email: '', password: '', newPassword: '', confirmPassword: '' });
        setResetToken('');
        setResetEmail('');
        showMessage('You can now login with your new password', 'success');
      }, 3000);

    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const goToHomepage = () => {
    window.location.href = '/';
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setShowResetPassword(false);
    setFormData({ username: '', email: '', password: '', newPassword: '', confirmPassword: '' });
    setResetToken('');
    setResetEmail('');
    setMessage('');
  };

  // Forgot Password View
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
          {/* Back Button */}
          <button
            onClick={handleBackToLogin}
            className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-lg" />
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faKey} className="text-white text-2xl" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Reset Password</h2>
            <p className="text-gray-600 mt-2">
              Enter your email to receive a reset link
            </p>
          </div>

          {/* Forgot Password Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleForgotPassword(); }} className="space-y-6">
            <div className="relative">
              <FontAwesomeIcon 
                icon={faEnvelope} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              />
              <input
                type="email"
                name="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>

            {message && (
              <div className={`p-4 rounded-lg border ${
                messageType === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : messageType === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-blue-50 border-blue-200 text-orange-800'
              }`}>
                <div className="flex items-center">
                  <FontAwesomeIcon 
                    icon={messageType === 'success' ? faCheckCircle : faExclamationTriangle} 
                    className={`mr-2 ${
                      messageType === 'success' ? 'text-green-500' : 
                      messageType === 'error' ? 'text-red-500' : 'text-orange-500'
                    }`} 
                  />
                  <span>{message}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                  Sending reset link...
                </span>
              ) : (
                <span>
                  <FontAwesomeIcon icon={faKey} className="mr-2" />
                  Send Reset Link
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-orange-500 mt-1 mr-3" />
              <div>
                <p className="text-sm text-orange-800 font-medium">Check your email</p>
                <p className="text-xs text-orange-700 mt-1">
                  If an account with this email exists, you'll receive a password reset link. Check your spam folder if you don't see it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Reset Password View
  if (showResetPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
          {/* Back Button */}
          <button
            onClick={handleBackToLogin}
            className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-lg" />
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faKey} className="text-white text-2xl" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Create New Password</h2>
            <p className="text-gray-600 mt-2">
              Enter your new password below
            </p>
            {resetEmail && (
              <p className="text-sm text-gray-500 mt-1">
                For: {resetEmail}
              </p>
            )}
          </div>

          {/* Reset Password Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <FontAwesomeIcon 
                icon={faLock} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              />
              <input
                type="password"
                name="newPassword"
                placeholder="New password (min. 6 characters)"
                value={formData.newPassword}
                onChange={handleInputChange}
                required
                minLength="6"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="relative">
              <FontAwesomeIcon 
                icon={faLock} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                minLength="6"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>

            {message && (
              <div className={`p-4 rounded-lg border ${
                messageType === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : messageType === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-blue-50 border-blue-200 text-orange-800'
              }`}>
                <div className="flex items-center">
                  <FontAwesomeIcon 
                    icon={messageType === 'success' ? faCheckCircle : faExclamationTriangle} 
                    className={`mr-2 ${
                      messageType === 'success' ? 'text-green-500' : 
                      messageType === 'error' ? 'text-red-500' : 'text-orange-500'
                    }`} 
                  />
                  <span>{message}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                  Resetting password...
                </span>
              ) : (
                <span>
                  <FontAwesomeIcon icon={faKey} className="mr-2" />
                  Reset Password
                </span>
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
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
        {/* Back to Home Button */}
        <button
          onClick={goToHomepage}
          className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-lg" />
        </button>

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
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div className="relative">
              <FontAwesomeIcon 
                icon={faUser} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              />
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleInputChange}
                required={!isLogin}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>
          )}

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
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="relative">
            <FontAwesomeIcon 
              icon={faLock} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength="6"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Forgot Password Link (only in login mode) */}
          {isLogin && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-orange-600 hover:text-orange-800 text-sm font-medium transition-colors duration-200 flex items-center justify-end w-full"
              >
                <FontAwesomeIcon icon={faKey} className="mr-2" />
                Forgot your password?
              </button>
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-lg border ${
              messageType === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : messageType === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-orange-800'
            }`}>
              <div className="flex items-center">
                <FontAwesomeIcon 
                  icon={messageType === 'success' ? faCheckCircle : faExclamationTriangle} 
                  className={`mr-2 ${
                    messageType === 'success' ? 'text-green-500' : 
                    messageType === 'error' ? 'text-red-500' : 'text-orange-500'
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
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              <span>
                <FontAwesomeIcon 
                  icon={isLogin ? faSignInAlt : faUserPlus} 
                  className="mr-2" 
                />
                {isLogin ? 'Sign In' : 'Create Account'}
              </span>
            )}
          </button>
        </form>

        {/* Toggle between Login/Signup */}
        <div className="text-center mt-6">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-orange-600 hover:text-orange-800 font-medium transition-colors duration-200"
          >
            <FontAwesomeIcon 
              icon={isLogin ? faUserPlus : faSignInAlt} 
              className="mr-2" 
            />
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;
