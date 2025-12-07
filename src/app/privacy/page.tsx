'use client';

import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Eye,
  Lock,
  Database,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe
} from 'lucide-react';

export default function PrivacyPage() {
  const { t } = useTranslation();

  const privacyPrinciples = [
    {
      icon: Lock,
      title: 'Data Encryption',
      description: 'All personal data is encrypted at rest and in transit using industry-standard protocols.'
    },
    {
      icon: Eye,
      title: 'Transparency',
      description: 'We clearly explain what data we collect and how it\'s used in our platform.'
    },
    {
      icon: Users,
      title: 'User Control',
      description: 'You have full control over your data and can request deletion at any time.'
    },
    {
      icon: Shield,
      title: 'Security First',
      description: 'We implement multiple layers of security to protect your information.'
    }
  ];

  const dataCategories = [
    {
      category: 'Personal Information',
      description: 'Name, email, phone number, and residential address',
      purpose: 'Account creation, identity verification, and communication',
      retention: 'As long as account is active'
    },
    {
      category: 'Identity Documents',
      description: 'Government ID, passport, or other verification documents',
      purpose: 'KYC compliance and fraud prevention',
      retention: '7 years (legal requirement)'
    },
    {
      category: 'Biometric Data',
      description: 'Facial recognition data and biometric verification results',
      purpose: 'Secure identity verification and anti-fraud measures',
      retention: 'Deleted after verification (results stored for 7 years)'
    },
    {
      category: 'Farm Data',
      description: 'Farm location, size, crop types, and agricultural information',
      purpose: 'AI credit scoring and personalized recommendations',
      retention: 'As long as account is active'
    },
    {
      category: 'Financial Data',
      description: 'Loan applications, payment history, and transaction records',
      purpose: 'Loan processing and regulatory compliance',
      retention: '7 years (legal requirement)'
    },
    {
      category: 'Usage Data',
      description: 'Platform usage patterns, IP addresses, and device information',
      purpose: 'Platform improvement and security monitoring',
      retention: '2 years'
    }
  ];

  return (
    <div className="min-h-screen bg-paper-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-agri-green to-sky-teal text-white py-16">
        <div className="container text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Your privacy and data security are our top priorities. Learn how we protect and manage your information.
          </p>
          <div className="mt-6">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              Last updated: December 15, 2024
            </Badge>
          </div>
        </div>
      </section>

      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Privacy Principles */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-gray mb-8 text-center">Our Privacy Principles</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {privacyPrinciples.map((principle, index) => {
                const Icon = principle.icon;
                return (
                  <Card key={index} className="shadow-level1 border-0 text-center">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 bg-agri-green/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-6 h-6 text-agri-green" />
                      </div>
                      <h3 className="font-semibold text-slate-gray mb-2">{principle.title}</h3>
                      <p className="text-slate-gray/70 text-sm">{principle.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* What We Collect */}
          <Card className="shadow-level2 border-0 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-gray">
                <Database className="w-5 h-5 mr-2 text-agri-green" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {dataCategories.map((category, index) => (
                  <div key={index} className="border-b border-slate-gray/10 pb-6 last:border-b-0 last:pb-0">
                    <h4 className="font-semibold text-slate-gray mb-2">{category.category}</h4>
                    <p className="text-slate-gray/70 text-sm mb-3">{category.description}</p>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-slate-gray">Purpose: </span>
                        <span className="text-slate-gray/70">{category.purpose}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-gray">Retention: </span>
                        <span className="text-slate-gray/70">{category.retention}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* How We Use Data */}
          <Card className="shadow-level2 border-0 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-gray">
                <FileText className="w-5 h-5 mr-2 text-agri-green" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-slate-gray">Account Management</h4>
                    <p className="text-slate-gray/70 text-sm">Creating and managing your AgriCredit account and profile.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-slate-gray">Identity Verification</h4>
                    <p className="text-slate-gray/70 text-sm">Verifying your identity for KYC compliance and fraud prevention.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-slate-gray">AI Credit Scoring</h4>
                    <p className="text-slate-gray/70 text-sm">Analyzing your data to provide fair and accurate credit assessments.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-slate-gray">Platform Improvement</h4>
                    <p className="text-slate-gray/70 text-sm">Enhancing our services and developing new features.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-slate-gray">Legal Compliance</h4>
                    <p className="text-slate-gray/70 text-sm">Meeting regulatory requirements and legal obligations.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Sharing */}
          <Card className="shadow-level2 border-0 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-gray">
                <Users className="w-5 h-5 mr-2 text-agri-green" />
                Information Sharing and Disclosure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">We Do NOT Share Your Data With:</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Third-party advertisers or marketing companies</li>
                    <li>• Social media platforms for advertising</li>
                    <li>• Data brokers or aggregators</li>
                    <li>• Any entity for commercial purposes without your consent</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">We MAY Share Your Data With:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Financial institutions for loan processing</li>
                    <li>• Regulatory authorities as required by law</li>
                    <li>• Service providers who help operate our platform</li>
                    <li>• Legal authorities in response to lawful requests</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card className="shadow-level2 border-0 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-gray">
                <Shield className="w-5 h-5 mr-2 text-agri-green" />
                Your Rights and Choices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-slate-gray mb-2">Access Your Data</h4>
                    <p className="text-slate-gray/70 text-sm">Request a copy of all personal data we hold about you.</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-slate-gray mb-2">Correct Your Data</h4>
                    <p className="text-slate-gray/70 text-sm">Update or correct any inaccurate personal information.</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-slate-gray mb-2">Delete Your Data</h4>
                    <p className="text-slate-gray/70 text-sm">Request deletion of your personal data (subject to legal requirements).</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-slate-gray mb-2">Data Portability</h4>
                    <p className="text-slate-gray/70 text-sm">Receive your data in a structured, machine-readable format.</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-slate-gray mb-2">Withdraw Consent</h4>
                    <p className="text-slate-gray/70 text-sm">Opt-out of data processing where consent was the legal basis.</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-slate-gray mb-2">Object to Processing</h4>
                    <p className="text-slate-gray/70 text-sm">Object to certain types of data processing.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Measures */}
          <Card className="shadow-level2 border-0 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-gray">
                <Lock className="w-5 h-5 mr-2 text-agri-green" />
                Security Measures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-gray">Technical Security</h4>
                  <ul className="text-sm text-slate-gray/70 space-y-1">
                    <li>• End-to-end encryption for data transmission</li>
                    <li>• AES-256 encryption for data at rest</li>
                    <li>• Multi-factor authentication</li>
                    <li>• Regular security audits and penetration testing</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-slate-gray">Operational Security</h4>
                  <ul className="text-sm text-slate-gray/70 space-y-1">
                    <li>• Access controls and role-based permissions</li>
                    <li>• Employee background checks</li>
                    <li>• Incident response procedures</li>
                    <li>• Regular security training</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="shadow-level1 border-0 bg-gradient-to-br from-agri-green/5 to-sky-teal/5">
            <CardContent className="p-8 text-center">
              <Shield className="w-12 h-12 text-agri-green mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-gray mb-2">Questions About Your Privacy?</h3>
              <p className="text-slate-gray/70 mb-6 max-w-md mx-auto">
                If you have any questions about this Privacy Policy or our data practices,
                please contact our Data Protection Officer.
              </p>
              <div className="space-y-2 text-sm text-slate-gray/60">
                <p>Email: privacy@agricredit.africa</p>
                <p>Phone: +254 700 123 456</p>
                <p>Response time: Within 48 hours</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}