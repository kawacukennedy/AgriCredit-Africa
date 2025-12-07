'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hooks';
import {
  User,
  Shield,
  Key,
  Bell,
  Globe,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
  AlertTriangle,
  Smartphone,
  Mail,
  MapPin,
  Camera,
  Upload,
  RefreshCw,
  Settings,
  Lock,
  Unlock,
  Fingerprint,
  CreditCard
} from 'lucide-react';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [showDID, setShowDID] = useState(false);

  // Comprehensive mock data for profile
  const profileData = {
    personal: {
      name: user?.name || 'John Farmer',
      email: 'john.farmer@example.com',
      phone: '+254 712 345 678',
      location: 'Nairobi, Kenya',
      bio: 'Experienced maize farmer with 8 years in sustainable agriculture. Specializing in drought-resistant crop varieties.',
      avatar: '/api/placeholder/150/150',
      joinedDate: 'January 2023'
    },
    did: {
      id: 'did:agricredit:0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      status: 'verified',
      verificationDate: '2024-01-15',
      credentials: [
        { type: 'Identity Verification', issuer: 'AgriCredit Registry', status: 'active', issued: '2024-01-15' },
        { type: 'Farm Ownership', issuer: 'Land Registry', status: 'active', issued: '2024-01-10' },
        { type: 'Credit History', issuer: 'Credit Bureau', status: 'active', issued: '2024-01-12' }
      ]
    },
    kyc: {
      status: 'approved',
      level: 'Enhanced',
      documents: [
        { type: 'National ID', status: 'verified', uploaded: '2024-01-10' },
        { type: 'Farm Deed', status: 'verified', uploaded: '2024-01-11' },
        { type: 'Bank Statement', status: 'verified', uploaded: '2024-01-12' }
      ],
      lastReview: '2024-01-15',
      nextReview: '2025-01-15'
    },
    security: {
      twoFactorEnabled: true,
      biometricEnabled: false,
      sessionTimeout: 30,
      loginAlerts: true,
      transactionAlerts: true,
      lastPasswordChange: '2024-01-01',
      activeSessions: 2
    },
    preferences: {
      language: 'en',
      theme: 'light',
      currency: 'KES',
      notifications: {
        email: true,
        sms: true,
        push: false,
        marketing: false
      },
      privacy: {
        profileVisibility: 'farmers_only',
        showLocation: true,
        showFarmSize: false,
        allowAnalytics: true
      }
    }
  };

  const handleSaveProfile = () => {
    // Implement save logic
    setIsEditing(false);
  };

  const handleDIDRecovery = () => {
    // Implement DID recovery logic
  };

  const handleKYCRefresh = () => {
    // Implement KYC refresh logic
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-paper-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-agri-green to-sky-teal text-white py-12">
        <div className="container">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-12 h-12" />
              </div>
              <Button size="sm" className="absolute -bottom-2 -right-2 w-8 h-8 p-0 bg-harvest-gold hover:bg-harvest-gold/90 rounded-full">
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black mb-2">
                {profileData.personal.name}
              </h1>
              <p className="text-xl opacity-90 mb-2">
                {profileData.personal.location} • Joined {profileData.personal.joinedDate}
              </p>
              <div className="flex items-center space-x-4">
                <Badge className="bg-white/20 text-white border-white/30">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified Farmer
                </Badge>
                <Badge className="bg-harvest-gold/20 text-harvest-gold border-harvest-gold/30">
                  Enhanced KYC
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-8">
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="identity">Identity & DID</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-6">
            <Card className="shadow-level2 border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center text-slate-gray">
                      <User className="w-5 h-5 mr-2 text-agri-green" />
                      Personal Information
                    </CardTitle>
                    <CardDescription>
                      Manage your personal details and farm information
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(!isEditing)}
                    className="border-slate-gray/20"
                  >
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-slate-gray">Full Name</Label>
                      {isEditing ? (
                        <Input defaultValue={profileData.personal.name} className="mt-1" />
                      ) : (
                        <p className="text-slate-gray mt-1">{profileData.personal.name}</p>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-slate-gray">Email Address</Label>
                      {isEditing ? (
                        <Input type="email" defaultValue={profileData.personal.email} className="mt-1" />
                      ) : (
                        <p className="text-slate-gray mt-1">{profileData.personal.email}</p>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-slate-gray">Phone Number</Label>
                      {isEditing ? (
                        <Input type="tel" defaultValue={profileData.personal.phone} className="mt-1" />
                      ) : (
                        <p className="text-slate-gray mt-1">{profileData.personal.phone}</p>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-slate-gray">Location</Label>
                      {isEditing ? (
                        <Input defaultValue={profileData.personal.location} className="mt-1" />
                      ) : (
                        <div className="flex items-center space-x-2 mt-1">
                          <MapPin className="w-4 h-4 text-slate-gray/60" />
                          <span className="text-slate-gray">{profileData.personal.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-slate-gray">Bio</Label>
                      {isEditing ? (
                        <Textarea
                          defaultValue={profileData.personal.bio}
                          className="mt-1"
                          rows={4}
                        />
                      ) : (
                        <p className="text-slate-gray/70 mt-1">{profileData.personal.bio}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-slate-gray">Farm Size</Label>
                        <p className="text-slate-gray mt-1">5.2 hectares</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-gray">Experience</Label>
                        <p className="text-slate-gray mt-1">8 years</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-slate-gray">Primary Crops</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <Badge className="bg-agri-green/10 text-agri-green border-agri-green/20">Maize</Badge>
                        <Badge className="bg-sky-teal/10 text-sky-teal border-sky-teal/20">Beans</Badge>
                        <Badge className="bg-harvest-gold/10 text-harvest-gold border-harvest-gold/20">Cassava</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end space-x-3 pt-6 border-t border-slate-gray/10">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveProfile} className="btn-primary">
                      Save Changes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="identity" className="space-y-6">
            {/* DID Management */}
            <Card className="shadow-level2 border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-gray">
                  <Key className="w-5 h-5 mr-2 text-agri-green" />
                  Decentralized Identity (DID)
                </CardTitle>
                <CardDescription>
                  Your secure, blockchain-based digital identity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-slate-gray/5 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium text-slate-gray">DID Identifier</Label>
                    <Badge className="bg-sky-teal/10 text-sky-teal border-sky-teal/20">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-3">
                    <code className="flex-1 text-sm bg-white px-3 py-2 rounded border font-mono text-slate-gray">
                      {showDID ? profileData.did.id : `${profileData.did.id.slice(0, 20)}...${profileData.did.id.slice(-8)}`}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDID(!showDID)}
                    >
                      {showDID ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(profileData.did.id)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-gray/60 mt-2">
                    Verified on {new Date(profileData.did.verificationDate).toLocaleDateString()}
                  </p>
                </div>

                {/* Verifiable Credentials */}
                <div>
                  <h4 className="font-semibold text-slate-gray mb-4">Verifiable Credentials</h4>
                  <div className="space-y-3">
                    {profileData.did.credentials.map((cred, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-slate-gray/10 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-agri-green/10 rounded-lg flex items-center justify-center">
                            <Shield className="w-5 h-5 text-agri-green" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-gray">{cred.type}</p>
                            <p className="text-sm text-slate-gray/60">Issued by {cred.issuer}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-sky-teal/10 text-sky-teal border-sky-teal/20 mb-1">
                            {cred.status}
                          </Badge>
                          <p className="text-xs text-slate-gray/60">
                            {new Date(cred.issued).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button variant="outline" className="border-slate-gray/20">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Credentials
                  </Button>
                  <Button variant="outline" onClick={handleDIDRecovery} className="border-slate-gray/20">
                    <Key className="w-4 h-4 mr-2" />
                    Recovery Options
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* KYC Status */}
            <Card className="shadow-level2 border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-gray">
                  <CheckCircle className="w-5 h-5 mr-2 text-agri-green" />
                  Know Your Customer (KYC)
                </CardTitle>
                <CardDescription>
                  Your identity verification status and documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-agri-green/5 border border-agri-green/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-8 h-8 text-agri-green" />
                    <div>
                      <p className="font-semibold text-slate-gray">KYC Approved</p>
                      <p className="text-sm text-slate-gray/60">Enhanced verification level</p>
                    </div>
                  </div>
                  <Badge className="bg-agri-green/10 text-agri-green border-agri-green/20">
                    {profileData.kyc.level}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-gray mb-4">Verification Documents</h4>
                  <div className="space-y-3">
                    {profileData.kyc.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-slate-gray/10 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-slate-gray/10 rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-slate-gray" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-gray">{doc.type}</p>
                            <p className="text-sm text-slate-gray/60">Uploaded {new Date(doc.uploaded).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Badge className="bg-sky-teal/10 text-sky-teal border-sky-teal/20">
                          {doc.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-gray/10">
                  <div>
                    <p className="text-sm text-slate-gray/60">Last review: {new Date(profileData.kyc.lastReview).toLocaleDateString()}</p>
                    <p className="text-sm text-slate-gray/60">Next review: {new Date(profileData.kyc.nextReview).toLocaleDateString()}</p>
                  </div>
                  <Button variant="outline" onClick={handleKYCRefresh} className="border-slate-gray/20">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Status
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="shadow-level2 border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-gray">
                  <Shield className="w-5 h-5 mr-2 text-agri-green" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security and authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Two-Factor Authentication */}
                <div className="flex items-center justify-between p-4 border border-slate-gray/10 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="w-6 h-6 text-agri-green" />
                    <div>
                      <p className="font-medium text-slate-gray">Two-Factor Authentication</p>
                      <p className="text-sm text-slate-gray/60">Add an extra layer of security</p>
                    </div>
                  </div>
                  <Switch checked={profileData.security.twoFactorEnabled} />
                </div>

                {/* Biometric Authentication */}
                <div className="flex items-center justify-between p-4 border border-slate-gray/10 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Fingerprint className="w-6 h-6 text-agri-green" />
                    <div>
                      <p className="font-medium text-slate-gray">Biometric Login</p>
                      <p className="text-sm text-slate-gray/60">Use fingerprint or face recognition</p>
                    </div>
                  </div>
                  <Switch checked={profileData.security.biometricEnabled} />
                </div>

                {/* Session Management */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-gray">Session Management</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-slate-gray">Session Timeout</Label>
                      <Select defaultValue={profileData.security.sessionTimeout.toString()}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="240">4 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-gray">Active Sessions</Label>
                      <p className="text-slate-gray mt-1">{profileData.security.activeSessions} active sessions</p>
                    </div>
                  </div>
                </div>

                {/* Password Management */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-gray">Password & Recovery</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-slate-gray">Last Changed</Label>
                      <p className="text-slate-gray mt-1">
                        {new Date(profileData.security.lastPasswordChange).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" className="flex-1 border-slate-gray/20">
                        <Lock className="w-4 h-4 mr-2" />
                        Change Password
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Security Alerts */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-gray">Security Alerts</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-slate-gray/60" />
                        <span className="text-sm text-slate-gray">Login alerts</span>
                      </div>
                      <Switch checked={profileData.security.loginAlerts} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="w-4 h-4 text-slate-gray/60" />
                        <span className="text-sm text-slate-gray">Transaction alerts</span>
                      </div>
                      <Switch checked={profileData.security.transactionAlerts} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card className="shadow-level2 border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-gray">
                  <Settings className="w-5 h-5 mr-2 text-agri-green" />
                  Preferences
                </CardTitle>
                <CardDescription>
                  Customize your experience and privacy settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Language & Display */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-slate-gray">Language</Label>
                    <Select defaultValue={profileData.preferences.language}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="sw">Kiswahili</SelectItem>
                        <SelectItem value="ha">Hausa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-slate-gray">Currency</Label>
                    <Select defaultValue={profileData.preferences.currency}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KES">Kenyan Shilling (KES)</SelectItem>
                        <SelectItem value="USD">US Dollar (USD)</SelectItem>
                        <SelectItem value="EUR">Euro (EUR)</SelectItem>
                        <SelectItem value="NGN">Nigerian Naira (NGN)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Notifications */}
                <div>
                  <h4 className="font-semibold text-slate-gray mb-4">Notifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-slate-gray/60" />
                        <span className="text-sm text-slate-gray">Email notifications</span>
                      </div>
                      <Switch checked={profileData.preferences.notifications.email} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Smartphone className="w-4 h-4 text-slate-gray/60" />
                        <span className="text-sm text-slate-gray">SMS notifications</span>
                      </div>
                      <Switch checked={profileData.preferences.notifications.sms} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Bell className="w-4 h-4 text-slate-gray/60" />
                        <span className="text-sm text-slate-gray">Push notifications</span>
                      </div>
                      <Switch checked={profileData.preferences.notifications.push} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Globe className="w-4 h-4 text-slate-gray/60" />
                        <span className="text-sm text-slate-gray">Marketing communications</span>
                      </div>
                      <Switch checked={profileData.preferences.notifications.marketing} />
                    </div>
                  </div>
                </div>

                {/* Privacy Settings */}
                <div>
                  <h4 className="font-semibold text-slate-gray mb-4">Privacy Settings</h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-slate-gray">Profile Visibility</Label>
                      <Select defaultValue={profileData.preferences.privacy.profileVisibility}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="farmers_only">Farmers Only</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-gray">Show location</p>
                        <p className="text-xs text-slate-gray/60">Display your farm location publicly</p>
                      </div>
                      <Switch checked={profileData.preferences.privacy.showLocation} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-gray">Show farm size</p>
                        <p className="text-xs text-slate-gray/60">Display your farm size in profile</p>
                      </div>
                      <Switch checked={profileData.preferences.privacy.showFarmSize} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-gray">Analytics tracking</p>
                        <p className="text-xs text-slate-gray/60">Help improve the platform with usage data</p>
                      </div>
                      <Switch checked={profileData.preferences.privacy.allowAnalytics} />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-gray/10">
                  <Button className="btn-primary">
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="shadow-level2 border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-gray">
                  <Activity className="w-5 h-5 mr-2 text-agri-green" />
                  Account Activity
                </CardTitle>
                <CardDescription>
                  Recent account activity and transaction history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { action: 'Profile updated', timestamp: '2 hours ago', type: 'profile' },
                    { action: 'Loan application submitted', timestamp: '1 day ago', type: 'loan' },
                    { action: 'KYC documents verified', timestamp: '3 days ago', type: 'verification' },
                    { action: 'Password changed', timestamp: '1 week ago', type: 'security' },
                    { action: 'DID credentials refreshed', timestamp: '2 weeks ago', type: 'identity' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border border-slate-gray/10 rounded-lg">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        activity.type === 'loan' ? 'bg-agri-green/10' :
                        activity.type === 'verification' ? 'bg-sky-teal/10' :
                        activity.type === 'security' ? 'bg-harvest-gold/10' :
                        'bg-slate-gray/10'
                      }`}>
                        {activity.type === 'loan' && <CreditCard className="w-5 h-5 text-agri-green" />}
                        {activity.type === 'verification' && <CheckCircle className="w-5 h-5 text-sky-teal" />}
                        {activity.type === 'security' && <Shield className="w-5 h-5 text-harvest-gold" />}
                        {activity.type === 'profile' && <User className="w-5 h-5 text-slate-gray" />}
                        {activity.type === 'identity' && <Key className="w-5 h-5 text-slate-gray" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-gray">{activity.action}</p>
                        <p className="text-sm text-slate-gray/60">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}