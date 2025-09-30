'use client';

import React, { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePasswordSimple as validatePassword, validateUsername } from '../../lib/utils/validation';

export const RegisterModal: React.FC = () => {
  const { activeModal, closeModal, addNotification } = useAppStore();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    displayName: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    agreeToTerms: false,
    agreeToMarketing: false,
    userType: 'fan' as 'fan' | 'creator'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const isOpen = activeModal === 'registerModal';

  const handleClose = () => {
    if (!isLoading) {
      closeModal();
      setFormData({
        email: '',
        username: '',
        displayName: '',
        password: '',
        confirmPassword: '',
        dateOfBirth: '',
        agreeToTerms: false,
        agreeToMarketing: false,
        userType: 'fan'
      });
      setErrors({});
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Username validation
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (!validateUsername(formData.username)) {
      newErrors.username = 'Username must be 3-20 characters, alphanumeric and underscores only';
    }

    // Display name validation
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Date of birth validation (must be 18+)
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const today = new Date();
      const birthDate = new Date(formData.dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < 18) {
        newErrors.dateOfBirth = 'You must be 18 or older to create an account';
      }
    }

    // Terms agreement validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms of Service';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await register({
        email: formData.email,
        username: formData.username,
        displayName: formData.displayName,
        password: formData.password,
        dateOfBirth: formData.dateOfBirth,
        userType: formData.userType,
        agreeToMarketing: formData.agreeToMarketing
      });

      addNotification({
        type: 'success',
        title: 'Account Created',
        message: 'Welcome to GirlFanz! Please check your email to verify your account.'
      });
      
      handleClose();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Registration Failed',
        message: error instanceof Error ? error.message : 'Failed to create account'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleSwitchToLogin = () => {
    closeModal();
    // Small delay to allow modal to close before opening login
    setTimeout(() => {
      useAppStore.getState().openModal('loginModal');
    }, 150);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleOverlayClick}
    >
      <div className="fanz-bg-elevated rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold fanz-brand-primary">Join GirlFanz</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors p-2"
              disabled={isLoading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Account Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleInputChange('userType', 'fan')}
                  className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                    formData.userType === 'fan'
                      ? 'fanz-bg-primary text-white border-transparent'
                      : 'border-gray-600 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  Fan
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('userType', 'creator')}
                  className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                    formData.userType === 'creator'
                      ? 'fanz-bg-primary text-white border-transparent'
                      : 'border-gray-600 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  Creator
                </button>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg bg-gray-900 border transition-colors placeholder-gray-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-700 focus:border-blue-500'
                }`}
                placeholder="your@email.com"
                disabled={isLoading}
              />
              {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg bg-gray-900 border transition-colors placeholder-gray-500 ${
                  errors.username ? 'border-red-500' : 'border-gray-700 focus:border-blue-500'
                }`}
                placeholder="Choose a unique username"
                disabled={isLoading}
              />
              {errors.username && <p className="text-red-400 text-sm mt-1">{errors.username}</p>}
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Display Name *
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg bg-gray-900 border transition-colors placeholder-gray-500 ${
                  errors.displayName ? 'border-red-500' : 'border-gray-700 focus:border-blue-500'
                }`}
                placeholder="Your display name"
                disabled={isLoading}
              />
              {errors.displayName && <p className="text-red-400 text-sm mt-1">{errors.displayName}</p>}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Date of Birth * (18+ only)
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg bg-gray-900 border transition-colors ${
                  errors.dateOfBirth ? 'border-red-500' : 'border-gray-700 focus:border-blue-500'
                }`}
                disabled={isLoading}
              />
              {errors.dateOfBirth && <p className="text-red-400 text-sm mt-1">{errors.dateOfBirth}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg bg-gray-900 border transition-colors placeholder-gray-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-700 focus:border-blue-500'
                }`}
                placeholder="Create a strong password"
                disabled={isLoading}
              />
              {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg bg-gray-900 border transition-colors placeholder-gray-500 ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-700 focus:border-blue-500'
                }`}
                placeholder="Confirm your password"
                disabled={isLoading}
              />
              {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-900 focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-300">
                  I agree to the{' '}
                  <a href="/legal" className="fanz-brand-primary hover:underline" target="_blank">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/legal" className="fanz-brand-primary hover:underline" target="_blank">
                    Privacy Policy
                  </a>{' '}
                  *
                </span>
              </label>
              {errors.agreeToTerms && <p className="text-red-400 text-sm">{errors.agreeToTerms}</p>}

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.agreeToMarketing}
                  onChange={(e) => handleInputChange('agreeToMarketing', e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-900 focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-300">
                  I'd like to receive updates and marketing communications (optional)
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-opacity ${
                isLoading
                  ? 'fanz-bg-primary opacity-50 cursor-not-allowed'
                  : 'fanz-bg-primary hover:opacity-90'
              } text-white`}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <button
                onClick={handleSwitchToLogin}
                className="fanz-brand-primary hover:underline"
                disabled={isLoading}
              >
                Sign In
              </button>
            </p>
          </div>

          {/* Age Verification Notice */}
          <div className="mt-4 p-3 bg-orange-900/20 border border-orange-700 rounded-lg">
            <p className="text-xs text-orange-300 text-center">
              🔞 You must be 18 or older to create an account. Age verification is required for all users.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};