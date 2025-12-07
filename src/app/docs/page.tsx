'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
  Book,
  Search,
  FileText,
  Code,
  Users,
  Shield,
  TrendingUp,
  Leaf,
  ChevronRight,
  ExternalLink,
  Download
} from 'lucide-react';

export default function DocsPage() {
  const { t } = useTranslation();

  const docSections = [
    {
      title: 'Getting Started',
      description: 'Learn the basics of AgriCredit and get up and running quickly.',
      icon: Book,
      articles: [
        { title: 'Platform Overview', href: '/docs/overview', time: '5 min read' },
        { title: 'Creating Your Account', href: '/docs/account-setup', time: '3 min read' },
        { title: 'Wallet Integration', href: '/docs/wallet-integration', time: '8 min read' },
        { title: 'First Loan Application', href: '/docs/first-loan', time: '10 min read' }
      ]
    },
    {
      title: 'For Farmers',
      description: 'Everything you need to know about applying for loans and managing your farm.',
      icon: Leaf,
      articles: [
        { title: 'Loan Application Process', href: '/docs/loan-application', time: '12 min read' },
        { title: 'Understanding AI Scores', href: '/docs/ai-scoring', time: '15 min read' },
        { title: 'Farm Data Requirements', href: '/docs/farm-data', time: '7 min read' },
        { title: 'Repayment Options', href: '/docs/repayment', time: '6 min read' }
      ]
    },
    {
      title: 'For Investors',
      description: 'Guide to funding loans, managing portfolios, and maximizing returns.',
      icon: TrendingUp,
      articles: [
        { title: 'Investment Basics', href: '/docs/investment-basics', time: '10 min read' },
        { title: 'Risk Assessment', href: '/docs/risk-assessment', time: '14 min read' },
        { title: 'Portfolio Management', href: '/docs/portfolio-management', time: '11 min read' },
        { title: 'Secondary Markets', href: '/docs/secondary-markets', time: '9 min read' }
      ]
    },
    {
      title: 'API & Integration',
      description: 'Technical documentation for developers and integrations.',
      icon: Code,
      articles: [
        { title: 'API Reference', href: '/docs/api-reference', time: '20 min read' },
        { title: 'Authentication', href: '/docs/api-auth', time: '8 min read' },
        { title: 'Webhooks', href: '/docs/webhooks', time: '12 min read' },
        { title: 'SDKs & Libraries', href: '/docs/sdks', time: '15 min read' }
      ]
    },
    {
      title: 'Security & Privacy',
      description: 'Learn about our security measures and privacy protections.',
      icon: Shield,
      articles: [
        { title: 'Data Protection', href: '/docs/data-protection', time: '10 min read' },
        { title: 'DID & Identity', href: '/docs/did-identity', time: '13 min read' },
        { title: 'Smart Contract Security', href: '/docs/smart-contracts', time: '18 min read' },
        { title: 'Incident Response', href: '/docs/incident-response', time: '7 min read' }
      ]
    },
    {
      title: 'Governance',
      description: 'Participate in platform governance and decision making.',
      icon: Users,
      articles: [
        { title: 'Governance Overview', href: '/docs/governance-overview', time: '8 min read' },
        { title: 'Creating Proposals', href: '/docs/creating-proposals', time: '11 min read' },
        { title: 'Voting Process', href: '/docs/voting-process', time: '6 min read' },
        { title: 'Delegate Voting', href: '/docs/delegate-voting', time: '9 min read' }
      ]
    }
  ];

  const quickLinks = [
    { title: 'FAQ', href: '/help', description: 'Frequently asked questions' },
    { title: 'API Status', href: '/api/status', description: 'Check system status' },
    { title: 'Changelog', href: '/docs/changelog', description: 'Latest updates and changes' },
    { title: 'Support', href: '/help', description: 'Get help from our team' }
  ];

  return (
    <div className="min-h-screen bg-paper-white">

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-agri-green to-sky-teal text-white py-16">
        <div className="container">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              Documentation
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto mb-8">
              Comprehensive guides and technical documentation for AgriCredit Africa
            </p>

            {/* Search */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
              <Input
                placeholder="Search documentation..."
                className="pl-12 bg-white/10 border-white/30 text-white placeholder:text-white/70 focus:bg-white focus:text-slate-gray"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container py-12">
        {/* Quick Links */}
        <div className="grid md:grid-cols-4 gap-4 mb-12">
          {quickLinks.map((link, index) => (
            <Link key={index} href={link.href}>
              <Card className="shadow-level1 border-0 hover:shadow-level2 transition-all duration-200 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold text-slate-gray mb-1">{link.title}</h3>
                  <p className="text-sm text-slate-gray/60">{link.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Documentation Sections */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {docSections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Card key={index} className="shadow-level1 border-0 hover:shadow-level2 transition-all duration-200">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-agri-green/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-agri-green" />
                    </div>
                    <CardTitle className="text-slate-gray">{section.title}</CardTitle>
                  </div>
                  <p className="text-slate-gray/70 text-sm">{section.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {section.articles.map((article, articleIndex) => (
                      <Link key={articleIndex} href={article.href}>
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-gray/5 transition-colors cursor-pointer group">
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-gray group-hover:text-agri-green transition-colors">
                              {article.title}
                            </h4>
                            <p className="text-xs text-slate-gray/60">{article.time}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-gray/40 group-hover:text-agri-green transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Resources Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-slate-gray mb-8 text-center">Additional Resources</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="shadow-level1 border-0">
              <CardContent className="p-6 text-center">
                <FileText className="w-12 h-12 text-agri-green mx-auto mb-4" />
                <h3 className="font-semibold text-slate-gray mb-2">Technical Papers</h3>
                <p className="text-slate-gray/70 text-sm mb-4">
                  Research papers on our AI models, blockchain architecture, and impact studies.
                </p>
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download Papers
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-level1 border-0">
              <CardContent className="p-6 text-center">
                <Code className="w-12 h-12 text-sky-teal mx-auto mb-4" />
                <h3 className="font-semibold text-slate-gray mb-2">Code Examples</h3>
                <p className="text-slate-gray/70 text-sm mb-4">
                  Sample code for integrating with AgriCredit APIs and smart contracts.
                </p>
                <Button variant="outline" className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on GitHub
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-level1 border-0">
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 text-harvest-gold mx-auto mb-4" />
                <h3 className="font-semibold text-slate-gray mb-2">Community</h3>
                <p className="text-slate-gray/70 text-sm mb-4">
                  Join our community forums and connect with other AgriCredit users.
                </p>
                <Button variant="outline" className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Join Community
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

    </div>
  );
}