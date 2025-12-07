'use client';

import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Users,
  Shield,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Scale
} from 'lucide-react';

export default function TermsPage() {
  const { t } = useTranslation();

  const termsSections = [
    {
      icon: Users,
      title: 'User Agreement',
      content: [
        'By accessing AgriCredit Africa, you agree to these Terms of Service and our Privacy Policy.',
        'You must be at least 18 years old and a legal resident of an eligible African country.',
        'You are responsible for maintaining the confidentiality of your account credentials.',
        'You agree to provide accurate and complete information during registration and onboarding.'
      ]
    },
    {
      icon: Shield,
      title: 'Platform Usage',
      content: [
        'AgriCredit Africa provides AI-powered microfinance and carbon credit services for African farmers.',
        'Services are available in eligible countries: Kenya, Nigeria, Ghana, Tanzania, Uganda, and Rwanda.',
        'Platform availability is subject to local regulations and licensing requirements.',
        'We reserve the right to modify or discontinue services with reasonable notice.'
      ]
    },
    {
      icon: DollarSign,
      title: 'Financial Services',
      content: [
        'Loan terms, interest rates, and conditions are determined by our AI credit scoring system.',
        'All loans are subject to approval based on credit assessment and available funds.',
        'Repayment terms must be adhered to as specified in individual loan agreements.',
        'Carbon credits are earned based on verified sustainable farming practices.',
        'Credit trading is conducted on our decentralized marketplace with smart contract enforcement.'
      ]
    },
    {
      icon: Scale,
      title: 'Legal Compliance',
      content: [
        'All activities comply with local financial regulations and international standards.',
        'KYC and AML procedures are mandatory for all users.',
        'Users must comply with all applicable laws and regulations.',
        'Platform reserves the right to report suspicious activities to regulatory authorities.',
        'Disputes are resolved through our governance system or applicable legal jurisdictions.'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-paper-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-agri-green to-sky-teal text-white py-16">
        <div className="container text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Terms of Service
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Please read these terms carefully before using AgriCredit Africa platform
          </p>
          <div className="mt-6">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              Effective Date: December 15, 2024
            </Badge>
          </div>
        </div>
      </section>

      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Terms Overview */}
          <Card className="shadow-level2 border-0 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-gray">
                <FileText className="w-5 h-5 mr-2 text-agri-green" />
                Terms Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-gray/80 leading-relaxed mb-4">
                  These Terms of Service ("Terms") govern your use of AgriCredit Africa platform and services.
                  By accessing or using our platform, you agree to be bound by these Terms.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-blue-800 mb-2">Important Notice</h4>
                  <p className="text-blue-700 text-sm">
                    AgriCredit Africa provides financial services. Please ensure you understand the risks involved
                    in cryptocurrency and DeFi platforms. Always conduct your own research and consult with
                    financial advisors when making investment decisions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms Sections */}
          <div className="space-y-8">
            {termsSections.map((section, index) => {
              const Icon = section.icon;
              return (
                <Card key={index} className="shadow-level2 border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center text-slate-gray">
                      <Icon className="w-5 h-5 mr-2 text-agri-green" />
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {section.content.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-gray/80">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Prohibited Activities */}
          <Card className="shadow-level2 border-0 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-gray">
                <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                Prohibited Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 font-medium mb-2">The following activities are strictly prohibited:</p>
                <ul className="text-red-700 space-y-1 text-sm">
                  <li>• Using the platform for any illegal activities or money laundering</li>
                  <li>• Providing false or misleading information during registration or loan applications</li>
                  <li>• Attempting to manipulate the AI credit scoring system</li>
                  <li>• Engaging in fraudulent activities or scams</li>
                  <li>• Violating intellectual property rights</li>
                  <li>• Interfering with platform operations or security</li>
                  <li>• Using automated tools or bots without authorization</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Liability and Disclaimers */}
          <Card className="shadow-level2 border-0 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-gray">
                <Shield className="w-5 h-5 mr-2 text-agri-green" />
                Liability and Disclaimers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-slate-gray mb-2">Service Availability</h4>
                <p className="text-slate-gray/70 text-sm">
                  While we strive for high availability, we do not guarantee uninterrupted access to our platform.
                  Services may be temporarily unavailable due to maintenance, technical issues, or force majeure.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-slate-gray mb-2">Investment Risks</h4>
                <p className="text-slate-gray/70 text-sm">
                  Cryptocurrency and DeFi investments carry significant risks including total loss of funds.
                  Past performance does not guarantee future results. Users should only invest what they can afford to lose.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-slate-gray mb-2">AI and Technology</h4>
                <p className="text-slate-gray/70 text-sm">
                  Our AI systems provide assessments based on available data but are not infallible.
                  Credit decisions and recommendations should be considered as guidance, not guarantees.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-slate-gray mb-2">Third-Party Services</h4>
                <p className="text-slate-gray/70 text-sm">
                  We integrate with various third-party services. We are not responsible for their performance,
                  security, or compliance with applicable laws.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card className="shadow-level2 border-0 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-gray">
                <Clock className="w-5 h-5 mr-2 text-agri-green" />
                Account Termination
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-slate-gray/70">
                  We reserve the right to suspend or terminate your account at any time for violations of these Terms,
                  illegal activities, or at our sole discretion. Upon termination:
                </p>

                <ul className="space-y-2 text-sm text-slate-gray/70">
                  <li>• Your access to the platform will be immediately revoked</li>
                  <li>• Outstanding loans must still be repaid according to their terms</li>
                  <li>• Your data will be retained as required by law or for legitimate business purposes</li>
                  <li>• You may request data export before account closure</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Governing Law */}
          <Card className="shadow-level2 border-0 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-gray">
                <Scale className="w-5 h-5 mr-2 text-agri-green" />
                Governing Law
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-slate-gray/70">
                  These Terms are governed by the laws of Kenya. Any disputes arising from these Terms
                  or your use of the platform will be resolved through:
                </p>

                <ol className="space-y-2 text-sm text-slate-gray/70 list-decimal list-inside">
                  <li>Our internal dispute resolution process</li>
                  <li>Mediation through a mutually agreed third party</li>
                  <li>The competent courts of Kenya as the final jurisdiction</li>
                </ol>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-800 text-sm">
                    <strong>International Users:</strong> If you are accessing our platform from outside Kenya,
                    you agree that Kenyan law applies and you submit to the jurisdiction of Kenyan courts.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="shadow-level1 border-0 bg-gradient-to-br from-agri-green/5 to-sky-teal/5">
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-agri-green mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-gray mb-2">Questions About These Terms?</h3>
              <p className="text-slate-gray/70 mb-6 max-w-md mx-auto">
                If you have any questions about these Terms of Service or need clarification,
                please contact our legal team.
              </p>
              <div className="space-y-2 text-sm text-slate-gray/60">
                <p>Email: legal@agricredit.africa</p>
                <p>Phone: +254 700 123 456</p>
                <p>Address: Westlands Business Park, Nairobi, Kenya</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}