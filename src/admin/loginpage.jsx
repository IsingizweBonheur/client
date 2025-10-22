// src/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  faSignInAlt,
  faSpinner,
  faShieldAlt,
  faArrowLeft,
  faKey,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mode, setMode] = useState("login"); // 'login', 'forgot', 'reset'

  const handleLogin = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      localStorage.setItem("sb-user", JSON.stringify(data.user));
      navigate("/adminpanel");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordResetRequest = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) throw error;

      setSuccess("Password reset instructions have been sent to your email!");
      setMode("login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setSuccess("Password updated successfully! You can now login with your new password.");
      setMode("login");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      if (mode === "login") handleLogin();
      else if (mode === "forgot") handlePasswordResetRequest();
      else if (mode === "reset") handlePasswordReset();
    }
  };

  const renderLoginForm = () => (
    <>
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 tracking-wide">
            Email Address
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-orange-500">
              <FontAwesomeIcon 
                icon={faEnvelope} 
                className="text-gray-400 group-focus-within:text-orange-500 text-sm transition-colors duration-200" 
              />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="admin@fastfood.com"
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all duration-200 text-gray-900 placeholder-gray-400 hover:border-gray-300"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 tracking-wide">
            Password
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-orange-500">
              <FontAwesomeIcon 
                icon={faLock} 
                className="text-gray-400 group-focus-within:text-orange-500 text-sm transition-colors duration-200" 
              />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your password"
              className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all duration-200 text-gray-900 placeholder-gray-400 hover:border-gray-300"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-orange-500 transition-colors duration-200"
            >
              <FontAwesomeIcon 
                icon={showPassword ? faEyeSlash : faEye} 
                className="text-lg"
              />
            </button>
          </div>
        </div>

        {/* Forgot Password Link */}
        <div className="text-right">
          <button
            onClick={() => setMode("forgot")}
            className="text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors duration-200"
          >
            Forgot your password?
          </button>
        </div>
      </div>

      {/* Login Button */}
      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-4 rounded-xl font-bold text-lg hover:from-orange-600 hover:to-amber-600 focus:ring-4 focus:ring-orange-100 focus:outline-none flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {loading ? (
          <>
            <FontAwesomeIcon 
              icon={faSpinner} 
              spin 
              className="mr-3 text-lg" 
            />
            <span className="tracking-wide">
              Signing in...
            </span>
          </>
        ) : (
          <>
            <FontAwesomeIcon 
              icon={faSignInAlt} 
              className="mr-3 text-lg" 
            />
            <span className="tracking-wide">
              Sign In to Dashboard
            </span>
          </>
        )}
      </button>
    </>
  );

  const renderForgotPasswordForm = () => (
    <>
      {/* Back to Login */}
      <button
        onClick={() => setMode("login")}
        className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 transition-colors duration-200 text-sm font-medium"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
        <span>Back to Login</span>
      </button>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 tracking-wide">
            Email Address
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-orange-500">
              <FontAwesomeIcon 
                icon={faEnvelope} 
                className="text-gray-400 group-focus-within:text-orange-500 text-sm transition-colors duration-200" 
              />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="admin@fastfood.com"
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all duration-200 text-gray-900 placeholder-gray-400 hover:border-gray-300"
            />
          </div>
        </div>

        <p className="text-gray-600 text-sm text-center">
          Enter your email address and we'll send you instructions to reset your password.
        </p>

        {/* Reset Password Button */}
        <button
          onClick={handlePasswordResetRequest}
          disabled={loading || !email}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-4 rounded-xl font-bold text-lg hover:from-orange-600 hover:to-amber-600 focus:ring-4 focus:ring-orange-100 focus:outline-none flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? (
            <>
              <FontAwesomeIcon 
                icon={faSpinner} 
                spin 
                className="mr-3 text-lg" 
              />
              <span className="tracking-wide">
                Sending...
              </span>
            </>
          ) : (
            <>
              <FontAwesomeIcon 
                icon={faKey} 
                className="mr-3 text-lg" 
              />
              <span className="tracking-wide">
                Send Reset Instructions
              </span>
            </>
          )}
        </button>
      </div>
    </>
  );

  const renderResetPasswordForm = () => (
    <>
      {/* Back to Login */}
      <button
        onClick={() => setMode("login")}
        className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 transition-colors duration-200 text-sm font-medium"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
        <span>Back to Login</span>
      </button>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 tracking-wide">
            New Password
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-orange-500">
              <FontAwesomeIcon 
                icon={faLock} 
                className="text-gray-400 group-focus-within:text-orange-500 text-sm transition-colors duration-200" 
              />
            </div>
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter new password"
              className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all duration-200 text-gray-900 placeholder-gray-400 hover:border-gray-300"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-orange-500 transition-colors duration-200"
            >
              <FontAwesomeIcon 
                icon={showNewPassword ? faEyeSlash : faEye} 
                className="text-lg"
              />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 tracking-wide">
            Confirm New Password
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-orange-500">
              <FontAwesomeIcon 
                icon={faCheck} 
                className="text-gray-400 group-focus-within:text-orange-500 text-sm transition-colors duration-200" 
              />
            </div>
            <input
              type={showNewPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Confirm new password"
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all duration-200 text-gray-900 placeholder-gray-400 hover:border-gray-300"
            />
          </div>
        </div>

        {/* Reset Password Button */}
        <button
          onClick={handlePasswordReset}
          disabled={loading || !newPassword || !confirmPassword}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-600 focus:ring-4 focus:ring-green-100 focus:outline-none flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? (
            <>
              <FontAwesomeIcon 
                icon={faSpinner} 
                spin 
                className="mr-3 text-lg" 
              />
              <span className="tracking-wide">
                Updating...
              </span>
            </>
          ) : (
            <>
              <FontAwesomeIcon 
                icon={faCheck} 
                className="mr-3 text-lg" 
              />
              <span className="tracking-wide">
                Update Password
              </span>
            </>
          )}
        </button>
      </div>
    </>
  );

  const getHeaderText = () => {
    switch (mode) {
      case "forgot":
        return "Reset Password";
      case "reset":
        return "Set New Password";
      default:
        return "Admin Login";
    }
  };

  const getHeaderIcon = () => {
    switch (mode) {
      case "forgot":
        return faKey;
      case "reset":
        return faLock;
      default:
        return faSignInAlt;
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case "forgot":
        return "Enter your email to receive reset instructions";
      case "reset":
        return "Create a new password for your account";
      default:
        return "Welcome to FastFood Express Management System";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4 sm:p-6">
      {/* Main Login Card */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 sm:p-10 space-y-8 border border-orange-100">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200">
              <FontAwesomeIcon 
                icon={getHeaderIcon()} 
                className="text-white text-2xl" 
              />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              {getHeaderText()}
            </h1>
            <p className="text-gray-600 text-base leading-relaxed">
              {getSubtitle()}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 animate-pulse">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <p className="text-red-700 text-sm font-medium text-center">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 animate-pulse">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-green-700 text-sm font-medium text-center">
                {success}
              </p>
            </div>
          </div>
        )}

        {/* Render Appropriate Form */}
        {mode === "login" && renderLoginForm()}
        {mode === "forgot" && renderForgotPasswordForm()}
        {mode === "reset" && renderResetPasswordForm()}

        {/* Security Note */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <FontAwesomeIcon 
              icon={faShieldAlt} 
              className="text-orange-500 mt-0.5 text-sm" 
            />
            <div className="text-left">
              <p className="text-orange-800 text-xs font-semibold mb-1">
                {mode === "forgot" ? "Secure Password Reset" : 
                 mode === "reset" ? "Create Strong Password" : "Admin Access Only"}
              </p>
              <p className="text-orange-600 text-xs">
                {mode === "forgot" ? "Reset link will be sent to your registered email. Check your spam folder if you don't see it." :
                 mode === "reset" ? "Use a strong password with at least 6 characters including letters and numbers for better security." :
                 "This login is restricted to authorized personnel only. Please contact system administration if you need access."}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-gray-100">
          <p className="text-gray-500 text-xs font-medium tracking-wide">
            {mode === "forgot" ? "Secure password recovery • Check your email inbox" : 
             mode === "reset" ? "Secure password update • Choose a strong password" :
             "Secure admin access • Contact IT support for assistance"}
          </p>
        </div>
      </div>
    </div>
  );
}