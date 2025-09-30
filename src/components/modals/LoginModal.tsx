import React, { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { isValidEmail } from '../../lib/utils/validation';

export const LoginModal: React.FC = () => {
  const { modals, closeModal, openModal } = useAppStore();
  const { login, isLoading } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const isOpen = modals.loginModal;

  const handleClose = () => {
    closeModal('loginModal');
    setFormData({ email: '', password: '' });
    setErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await login(formData.email, formData.password);
      showSuccess('Welcome back!', 'You have been successfully logged in.');
      handleClose();
    } catch (error) {
      showError('Login Failed', error instanceof Error ? error.message : 'Please check your credentials and try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md fanz-bg-elevated rounded-xl shadow-lg border border-gray-700"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 id="login-modal-title" className="text-xl font-semibold text-white">
            Welcome Back
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
            aria-label="Close modal"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-400 text-sm mb-6">
            Sign in to your GirlFanz account to access your content and connect with creators.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-gray-900 border rounded-lg text-white placeholder-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.email ? 'border-red-500' : 'border-gray-600 hover:border-gray-500'
                }`}
                placeholder="Enter your email"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-gray-900 border rounded-lg text-white placeholder-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.password ? 'border-red-500' : 'border-gray-600 hover:border-gray-500'
                }`}
                placeholder="Enter your password"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full fanz-bg-primary hover:opacity-90 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Signing In...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Forgot Password */}
          <div className="text-center mt-4">
            <button className="text-sm text-gray-400 hover:text-primary transition-colors">
              Forgot your password?
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-700"></div>
            <div className="px-4 text-gray-500 text-sm">or</div>
            <div className="flex-1 border-t border-gray-700"></div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              Don&apos;t have an account?{' '}
              <button
                onClick={() => {
                  handleClose();
                  openModal('registerModal');
                }}
                className="text-primary hover:text-secondary transition-colors font-medium"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};