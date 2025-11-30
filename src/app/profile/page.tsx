'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { User, Settings, Bell, Shield, CreditCard, Fingerprint, Key, Award, CheckCircle, AlertCircle, Plus, RefreshCw, TrendingUp } from 'lucide-react';
import { getIdentity, createDID, getDIDCredentials, getReputationScore, getAIKYCStatus, getBorrowerReputation } from '@/lib/api';

interface Identity {
  did: string;
  wallet: string;
  reputationScore: number;
  isVerified: boolean;
  createdAt: number;
  publicKey: string;
}

interface Credential {
  credentialType: string;
  issuer: string;
  subject: string;
  issuanceDate: number;
  expirationDate: number;
  isValid: boolean;
  credentialHash: string;
  metadataURI: string;
}

interface ReputationData {
  borrower: string;
  totalLoans: number;
  repaidLoans: number;
  defaultedLoans: number;
  reputationScore: number;
  repaymentRate: number;
  creditScore: number;
}

export default function ProfilePage() {
  const { address, isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState('profile');
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [reputation, setReputation] = useState<ReputationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [creatingDID, setCreatingDID] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'did', label: 'DID Identity', icon: Fingerprint },
    { id: 'reputation', label: 'Reputation', icon: TrendingUp },
    { id: 'credentials', label: 'Credentials', icon: Award },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'payments', label: 'Payments', icon: CreditCard },
  ];

  useEffect(() => {
    if (isConnected && address) {
      loadIdentityData();
    }
  }, [isConnected, address]);

  const loadIdentityData = async () => {
    if (!address) return;

    setLoading(true);
    try {
      const [identityData, credentialsData, reputationData] = await Promise.allSettled([
        getIdentity(address),
        getDIDCredentials(address),
        getBorrowerReputation(address)
      ]);

      if (identityData.status === 'fulfilled') {
        setIdentity(identityData.value);
      }
      if (credentialsData.status === 'fulfilled') {
        setCredentials(credentialsData.value);
      }
      if (reputationData.status === 'fulfilled') {
        setReputation(reputationData.value);
      }
    } catch (error) {
      console.error('Failed to load identity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDID = async () => {
    if (!address) return;

    setCreatingDID(true);
    try {
      const result = await createDID(address);
      if (result.success) {
        alert('DID created successfully!');
        loadIdentityData();
      } else {
        alert(`DID creation failed: ${result.error}`);
      }
    } catch (error) {
      console.error('DID creation failed:', error);
      alert('DID creation failed. Please try again.');
    } finally {
      setCreatingDID(false);
    }
  };

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

        <div className="flex space-x-4 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-green-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-8">
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Personal Information
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Wallet Address
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg font-mono text-sm">
                      {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Reputation Score
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      {identity ? (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{identity.reputationScore}</span>
                          <span className="text-sm text-gray-500">/ 1000</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">Loading...</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {identity?.isVerified ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span>Identity Verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <AlertCircle className="w-5 h-5" />
                      <span>Identity Not Verified</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'did' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Decentralized Identity (DID)
                  </h2>
                  <button
                    onClick={loadIdentityData}
                    disabled={loading}
                    className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                {identity ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          DID
                        </label>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg font-mono text-sm break-all">
                          {identity.did}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Public Key
                        </label>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg font-mono text-xs break-all">
                          {identity.publicKey}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Reputation Score
                        </label>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          {identity.reputationScore}/1000
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Verification Status
                        </label>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          {identity.isVerified ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Verified
                            </span>
                          ) : (
                            <span className="text-yellow-600 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              Unverified
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Created
                        </label>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          {new Date(identity.createdAt * 1000).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Fingerprint className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                      No DID Found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Create your decentralized identity to access advanced features.
                    </p>
                    <button
                      onClick={handleCreateDID}
                      disabled={creatingDID}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
                    >
                      {creatingDID ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Creating DID...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Create DID
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {identity && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    DID Management
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <Key className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">Update Public Key</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Update your DID's public key for enhanced security
                      </p>
                    </button>
                    <button className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-5 h-5 text-green-600" />
                        <span className="font-medium">Setup Guardians</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Configure recovery guardians for your identity
                      </p>
                    </button>
                  </div>
                </div>
              )}
             </div>
           )}

           {activeTab === 'reputation' && (
             <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
               <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                 Borrower Reputation
               </h2>
               {reputation ? (
                 <div className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-4 rounded-lg">
                       <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                         {reputation.reputationScore}
                       </div>
                       <div className="text-sm text-blue-600 dark:text-blue-400">
                         Reputation Score
                       </div>
                       <div className="text-xs text-blue-500 mt-1">
                         Out of 1000
                       </div>
                     </div>
                     <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 p-4 rounded-lg">
                       <div className="text-2xl font-bold text-green-600 dark:text-green-300">
                         {reputation.creditScore}
                       </div>
                       <div className="text-sm text-green-600 dark:text-green-400">
                         Credit Score
                       </div>
                       <div className="text-xs text-green-500 mt-1">
                         Calculated Score
                       </div>
                     </div>
                     <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 p-4 rounded-lg">
                       <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">
                         {reputation.repaymentRate.toFixed(1)}%
                       </div>
                       <div className="text-sm text-purple-600 dark:text-purple-400">
                         Repayment Rate
                       </div>
                       <div className="text-xs text-purple-500 mt-1">
                         Historical Performance
                       </div>
                     </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                       <div className="text-lg font-semibold text-gray-900 dark:text-white">
                         {reputation.totalLoans}
                       </div>
                       <div className="text-sm text-gray-600 dark:text-gray-400">
                         Total Loans
                       </div>
                     </div>
                     <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                       <div className="text-lg font-semibold text-green-600">
                         {reputation.repaidLoans}
                       </div>
                       <div className="text-sm text-gray-600 dark:text-gray-400">
                         Repaid Loans
                       </div>
                     </div>
                     <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                       <div className="text-lg font-semibold text-red-600">
                         {reputation.defaultedLoans}
                       </div>
                       <div className="text-sm text-gray-600 dark:text-gray-400">
                         Defaulted Loans
                       </div>
                     </div>
                   </div>

                   <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                     <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                       Reputation Insights
                     </h3>
                     <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                       <div className="flex justify-between">
                         <span>Loan History:</span>
                         <span className={reputation.totalLoans > 0 ? 'text-green-600' : 'text-gray-500'}>
                           {reputation.totalLoans > 0 ? 'Active Borrower' : 'New Borrower'}
                         </span>
                       </div>
                       <div className="flex justify-between">
                         <span>Risk Level:</span>
                         <span className={
                           reputation.reputationScore >= 750 ? 'text-green-600' :
                           reputation.reputationScore >= 650 ? 'text-yellow-600' : 'text-red-600'
                         }>
                           {reputation.reputationScore >= 750 ? 'Low Risk' :
                            reputation.reputationScore >= 650 ? 'Medium Risk' : 'High Risk'}
                         </span>
                       </div>
                       <div className="flex justify-between">
                         <span>Credit Tier:</span>
                         <span className={
                           reputation.creditScore >= 750 ? 'text-green-600' :
                           reputation.creditScore >= 650 ? 'text-blue-600' : 'text-purple-600'
                         }>
                           {reputation.creditScore >= 750 ? 'Excellent' :
                            reputation.creditScore >= 650 ? 'Good' : 'Fair'}
                         </span>
                       </div>
                     </div>
                   </div>
                 </div>
               ) : (
                 <div className="text-center py-8">
                   <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                   <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                     No Reputation Data
                   </h3>
                   <p className="text-gray-600 dark:text-gray-400">
                     Your reputation data will appear here once you have loan activity.
                   </p>
                 </div>
               )}
             </div>
           )}

           {activeTab === 'credentials' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Verifiable Credentials
              </h2>
              {credentials.length > 0 ? (
                <div className="space-y-4">
                  {credentials.map((credential, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Award className="w-5 h-5 text-green-600" />
                            <span className="font-medium text-gray-800 dark:text-white">
                              {credential.credentialType}
                            </span>
                            {credential.isValid ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs rounded-full">
                                Valid
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs rounded-full">
                                Invalid
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Issued by: {credential.issuer}
                          </p>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <div>Issued: {new Date(credential.issuanceDate * 1000).toLocaleDateString()}</div>
                          <div>Expires: {new Date(credential.expirationDate * 1000).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 font-mono break-all">
                        Hash: {credential.credentialHash}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                    No Credentials Yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your verifiable credentials will appear here once issued.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Preferences
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Settings management features coming soon.
              </p>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Notification Settings
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Notification preferences coming soon.
              </p>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Security Settings
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Security features coming soon.
              </p>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Payment Methods
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Payment management features coming soon.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}