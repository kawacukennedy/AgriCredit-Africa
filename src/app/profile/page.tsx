'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { User, Settings, Bell, Shield, CreditCard, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ProfilePage() {
  const { address, isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Profile form state
  const [profileData, setProfileData] = useState({
    farmSize: '',
    location: '',
  });

  // Form validation errors
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Settings state
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsAlerts: false,
    darkMode: false,
  });

  // Notification settings state
  const [notifications, setNotifications] = useState({
    loanUpdates: true,
    marketplaceAlerts: true,
    carbonCreditUpdates: false,
  });

  // Load saved data on component mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('agricredit_profile');
    const savedSettings = localStorage.getItem('agricredit_settings');
    const savedNotifications = localStorage.getItem('agricredit_notifications');

    if (savedProfile) {
      setProfileData(JSON.parse(savedProfile));
    }
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
  }, []);

  // Validate profile data
  const validateProfile = () => {
    const newErrors: {[key: string]: string} = {};

    if (!profileData.farmSize.trim()) {
      newErrors.farmSize = 'Farm size is required';
    }

    if (!profileData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save profile data
  const saveProfile = async () => {
    if (!validateProfile()) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      localStorage.setItem('agricredit_profile', JSON.stringify(profileData));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
      setSaveError('Failed to save profile. Please try again.');
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // Save settings
  const saveSettings = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      localStorage.setItem('agricredit_settings', JSON.stringify(settings));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveError('Failed to save settings. Please try again.');
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // Save notifications
  const saveNotifications = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      localStorage.setItem('agricredit_notifications', JSON.stringify(notifications));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save notifications:', error);
      setSaveError('Failed to save notification preferences. Please try again.');
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'payments', label: 'Payments', icon: CreditCard },
  ];

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Connect Your Wallet
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Please connect your wallet to access your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-4 sm:px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                      activeTab === tab.id
                        ? 'border-green-500 text-green-600 dark:text-green-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Personal Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Wallet Address
                      </label>
                      <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                        <code className="text-sm text-gray-900 dark:text-white">
                          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
                        </code>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Account Type
                      </label>
                      <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                        <span className="text-sm text-gray-900 dark:text-white">Farmer</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Farm Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         Farm Size
                       </label>
                       <input
                         type="text"
                         value={profileData.farmSize}
                         onChange={(e) => {
                           setProfileData(prev => ({ ...prev, farmSize: e.target.value }));
                           if (errors.farmSize) {
                             setErrors(prev => ({ ...prev, farmSize: '' }));
                           }
                         }}
                         placeholder="e.g., 5 acres"
                         className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                           errors.farmSize ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                         }`}
                       />
                       {errors.farmSize && (
                         <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.farmSize}</p>
                       )}
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         Location
                       </label>
                       <input
                         type="text"
                         value={profileData.location}
                         onChange={(e) => {
                           setProfileData(prev => ({ ...prev, location: e.target.value }));
                           if (errors.location) {
                             setErrors(prev => ({ ...prev, location: '' }));
                           }
                         }}
                         placeholder="e.g., Nairobi, Kenya"
                         className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                           errors.location ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                         }`}
                       />
                       {errors.location && (
                         <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.location}</p>
                       )}
                     </div>
                  </div>
                </div>

                 <div className="flex justify-end items-center space-x-4">
                   {saveSuccess && (
                     <div className="flex items-center text-green-600 dark:text-green-400">
                       <CheckCircle className="w-4 h-4 mr-2" />
                       <span className="text-sm">Changes saved successfully!</span>
                     </div>
                   )}
                   {saveError && (
                     <div className="flex items-center text-red-600 dark:text-red-400">
                       <AlertTriangle className="w-4 h-4 mr-2" />
                       <span className="text-sm">{saveError}</span>
                     </div>
                   )}
                   <button
                     onClick={saveProfile}
                     disabled={isSaving}
                     className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {isSaving ? 'Saving...' : 'Save Changes'}
                   </button>
                 </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Preferences
                </h2>

                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <div>
                       <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                         Email Notifications
                       </h3>
                       <p className="text-sm text-gray-500 dark:text-gray-400">
                         Receive email updates about your loans and marketplace
                       </p>
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                       <input
                         type="checkbox"
                         className="sr-only peer"
                         checked={settings.emailNotifications}
                         onChange={(e) => setSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                       />
                       <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                     </label>
                   </div>

                   <div className="flex items-center justify-between">
                     <div>
                       <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                         SMS Alerts
                       </h3>
                       <p className="text-sm text-gray-500 dark:text-gray-400">
                         Get SMS notifications for important updates
                       </p>
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                       <input
                         type="checkbox"
                         className="sr-only peer"
                         checked={settings.smsAlerts}
                         onChange={(e) => setSettings(prev => ({ ...prev, smsAlerts: e.target.checked }))}
                       />
                       <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                     </label>
                   </div>

                   <div className="flex items-center justify-between">
                     <div>
                       <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                         Dark Mode
                       </h3>
                       <p className="text-sm text-gray-500 dark:text-gray-400">
                         Toggle between light and dark themes
                       </p>
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                       <input
                         type="checkbox"
                         className="sr-only peer"
                         checked={settings.darkMode}
                         onChange={(e) => setSettings(prev => ({ ...prev, darkMode: e.target.checked }))}
                       />
                       <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                     </label>
                   </div>
                 </div>

                 <div className="flex justify-end items-center space-x-4 mt-6">
                   {saveSuccess && (
                     <div className="flex items-center text-green-600 dark:text-green-400">
                       <CheckCircle className="w-4 h-4 mr-2" />
                       <span className="text-sm">Settings saved successfully!</span>
                     </div>
                   )}
                   {saveError && (
                     <div className="flex items-center text-red-600 dark:text-red-400">
                       <AlertTriangle className="w-4 h-4 mr-2" />
                       <span className="text-sm">{saveError}</span>
                     </div>
                   )}
                   <button
                     onClick={saveSettings}
                     disabled={isSaving}
                     className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {isSaving ? 'Saving...' : 'Save Settings'}
                   </button>
                 </div>
               </div>
             )}

             {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Notification Settings
                </h2>

                <div className="space-y-4">
                   <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                     <div>
                       <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                         Loan Updates
                       </h3>
                       <p className="text-sm text-gray-500 dark:text-gray-400">
                         Notifications about loan applications and repayments
                       </p>
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                       <input
                         type="checkbox"
                         className="sr-only peer"
                         checked={notifications.loanUpdates}
                         onChange={(e) => setNotifications(prev => ({ ...prev, loanUpdates: e.target.checked }))}
                       />
                       <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                     </label>
                   </div>

                   <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                     <div>
                       <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                         Marketplace Alerts
                       </h3>
                       <p className="text-sm text-gray-500 dark:text-gray-400">
                         Updates on marketplace listings and transactions
                       </p>
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                       <input
                         type="checkbox"
                         className="sr-only peer"
                         checked={notifications.marketplaceAlerts}
                         onChange={(e) => setNotifications(prev => ({ ...prev, marketplaceAlerts: e.target.checked }))}
                       />
                       <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                     </label>
                   </div>

                   <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                     <div>
                       <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                         Carbon Credit Updates
                       </h3>
                       <p className="text-sm text-gray-500 dark:text-gray-400">
                         Notifications about carbon credit trading and rewards
                       </p>
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                       <input
                         type="checkbox"
                         className="sr-only peer"
                         checked={notifications.carbonCreditUpdates}
                         onChange={(e) => setNotifications(prev => ({ ...prev, carbonCreditUpdates: e.target.checked }))}
                       />
                       <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                     </label>
                   </div>
                 </div>

                 <div className="flex justify-end items-center space-x-4 mt-6">
                   {saveSuccess && (
                     <div className="flex items-center text-green-600 dark:text-green-400">
                       <CheckCircle className="w-4 h-4 mr-2" />
                       <span className="text-sm">Notification settings saved successfully!</span>
                     </div>
                   )}
                   {saveError && (
                     <div className="flex items-center text-red-600 dark:text-red-400">
                       <AlertTriangle className="w-4 h-4 mr-2" />
                       <span className="text-sm">{saveError}</span>
                     </div>
                   )}
                   <button
                     onClick={saveNotifications}
                     disabled={isSaving}
                     className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {isSaving ? 'Saving...' : 'Save Preferences'}
                   </button>
                 </div>
               </div>
             )}

             {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Security Settings
                </h2>

                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Two-Factor Authentication
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Add an extra layer of security to your account
                    </p>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm">
                      Enable 2FA
                    </button>
                  </div>

                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Connected Wallets
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Manage your connected blockchain wallets
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">M</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            MetaMask
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        Connected
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Payment Methods
                </h2>

                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            AgriCredit Token
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Native platform currency
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          1,250.00 AGC
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ≈ $125.00 USD
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">Ξ</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Ethereum
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            ERC-20 compatible
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          0.05 ETH
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ≈ $150.00 USD
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors">
                    Add Payment Method
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}