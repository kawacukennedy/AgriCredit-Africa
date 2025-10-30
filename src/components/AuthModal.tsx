'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, Mail, Lock, User, Phone, MapPin } from 'lucide-react';
import { registerUser, login, UserCreate, LoginRequest } from '@/lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

type AuthMode = 'login' | 'register';

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login form state
  const [loginData, setLoginData] = useState<LoginRequest>({
    username: '',
    password: ''
  });

  // Register form state
  const [registerData, setRegisterData] = useState<UserCreate>({
    email: '',
    username: '',
    password: '',
    full_name: '',
    phone: '',
    location: '',
    farm_size: undefined
  });

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setValidationErrors({});

    // Validate login form
    const errors: Record<string, string> = {};
    if (!loginData.username.trim()) {
      errors.username = 'Username or email is required';
    }
    if (!loginData.password) {
      errors.password = 'Password is required';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await login(loginData);
      onSuccess({ token: response.access_token });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setValidationErrors({});

    // Validate register form
    const errors: Record<string, string> = {};

    const emailError = validateEmail(registerData.email);
    if (emailError) errors.email = emailError;

    const usernameError = validateUsername(registerData.username);
    if (usernameError) errors.username = usernameError;

    const passwordError = validatePassword(registerData.password);
    if (passwordError) errors.password = passwordError;

    const phoneError = validatePhone(registerData.phone || '');
    if (phoneError) errors.phone = phoneError;

    const farmSizeError = validateFarmSize(registerData.farm_size);
    if (farmSizeError) errors.farm_size = farmSizeError;

    if (!registerData.full_name?.trim()) {
      errors.full_name = 'Full name is required';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setIsLoading(false);
      return;
    }

    try {
      const user = await registerUser(registerData);
      // After registration, automatically log in
      const loginResponse = await login({
        username: registerData.username,
        password: registerData.password
      });
      onSuccess({ token: loginResponse.access_token, user });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForms = () => {
    setLoginData({ username: '', password: '' });
    setRegisterData({
      email: '',
      username: '',
      password: '',
      full_name: '',
      phone: '',
      location: '',
      farm_size: undefined
    });
    setError(null);
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForms();
    setValidationErrors({});
  };

  const validateEmail = (email: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters long';
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    return null;
  };

  const validateUsername = (username: string): string | null => {
    if (!username) return 'Username is required';
    if (username.length < 3) return 'Username must be at least 3 characters long';
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers, and underscores';
    return null;
  };

  const validatePhone = (phone: string): string | null => {
    if (!phone) return null; // Optional field
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(phone)) return 'Please enter a valid phone number';
    return null;
  };

  const validateFarmSize = (farmSize: number | undefined): string | null => {
    if (farmSize === undefined || farmSize === null) return null; // Optional field
    if (farmSize <= 0) return 'Farm size must be greater than 0';
    if (farmSize > 1000) return 'Farm size seems too large (max 1000 ha)';
    return null;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <div className="p-6">
                {error && (
                  <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 rounded-lg">
                    {error}
                  </div>
                )}

                {mode === 'login' ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                         Username or Email
                       </label>
                       <div className="relative">
                         <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                         <input
                           type="text"
                           value={loginData.username}
                           onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                           className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                             validationErrors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                           }`}
                           placeholder="Enter your username or email"
                           required
                         />
                       </div>
                       {validationErrors.username && (
                         <p className="text-red-500 text-xs mt-1">{validationErrors.username}</p>
                       )}
                     </div>

                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                         Password
                       </label>
                       <div className="relative">
                         <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                         <input
                           type={showPassword ? 'text' : 'password'}
                           value={loginData.password}
                           onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                           className={`w-full pl-10 pr-12 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                             validationErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                           }`}
                           placeholder="Enter your password"
                           required
                         />
                         <button
                           type="button"
                           onClick={() => setShowPassword(!showPassword)}
                           className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                         >
                           {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                         </button>
                       </div>
                       {validationErrors.password && (
                         <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>
                       )}
                     </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition-colors"
                    >
                      {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={registerData.full_name?.split(' ')[0] || ''}
                          onChange={(e) => setRegisterData({
                            ...registerData,
                            full_name: e.target.value + (registerData.full_name?.split(' ')[1] ? ' ' + registerData.full_name.split(' ')[1] : '')
                          })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={registerData.full_name?.split(' ')[1] || ''}
                          onChange={(e) => setRegisterData({
                            ...registerData,
                            full_name: (registerData.full_name?.split(' ')[0] || '') + ' ' + e.target.value
                          })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Doe"
                        />
                      </div>
                    </div>

                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                         Email
                       </label>
                       <div className="relative">
                         <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                         <input
                           type="email"
                           value={registerData.email}
                           onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                           className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                             validationErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                           }`}
                           placeholder="john@example.com"
                           required
                         />
                       </div>
                       {validationErrors.email && (
                         <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
                       )}
                     </div>

                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                         Username
                       </label>
                       <div className="relative">
                         <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                         <input
                           type="text"
                           value={registerData.username}
                           onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                           className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                             validationErrors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                           }`}
                           placeholder="johndoe"
                           required
                         />
                       </div>
                       {validationErrors.username && (
                         <p className="text-red-500 text-xs mt-1">{validationErrors.username}</p>
                       )}
                     </div>

                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                         Password
                       </label>
                       <div className="relative">
                         <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                         <input
                           type={showPassword ? 'text' : 'password'}
                           value={registerData.password}
                           onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                           className={`w-full pl-10 pr-12 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                             validationErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                           }`}
                           placeholder="Create a strong password"
                           required
                         />
                         <button
                           type="button"
                           onClick={() => setShowPassword(!showPassword)}
                           className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                         >
                           {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                         </button>
                       </div>
                       {validationErrors.password && (
                         <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>
                       )}
                     </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Phone (Optional)
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="tel"
                            value={registerData.phone || ''}
                            onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="+1234567890"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Farm Size (ha)
                        </label>
                        <input
                          type="number"
                          value={registerData.farm_size || ''}
                          onChange={(e) => setRegisterData({ ...registerData, farm_size: parseFloat(e.target.value) || undefined })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="5.0"
                          min="0"
                          step="0.1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Location (Optional)
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={registerData.location || ''}
                          onChange={(e) => setRegisterData({ ...registerData, location: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="City, Country"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition-colors"
                    >
                      {isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                  </form>
                )}

                {/* Mode Switch */}
                <div className="mt-6 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                    <button
                      onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                      className="ml-2 text-green-600 hover:text-green-700 font-semibold"
                    >
                      {mode === 'login' ? 'Sign Up' : 'Sign In'}
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}