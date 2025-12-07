'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import {
  Search,
  HelpCircle,
  Book,
  MessageCircle,
  Phone,
  Mail,
  FileText,
  Users,
  Shield,
  CreditCard,
  Leaf,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Download,
  Play,
  ChevronRight,
  Star
} from 'lucide-react';

export default function HelpPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Topics', icon: HelpCircle, count: 25 },
    { id: 'getting-started', name: 'Getting Started', icon: Book, count: 8 },
    { id: 'loans', name: 'Loans & Credit', icon: CreditCard, count: 6 },
    { id: 'marketplace', name: 'Marketplace', icon: TrendingUp, count: 4 },
    { id: 'carbon', name: 'Carbon Credits', icon: Leaf, count: 3 },
    { id: 'security', name: 'Security & Privacy', icon: Shield, count: 4 }
  ];

  const faqs = [
    {
      id: 1,
      category: 'getting-started',
      question: 'How do I get started with AgriCredit?',
      answer: 'Getting started is easy! First, connect your Web3 wallet (MetaMask, Trust Wallet, etc.) by clicking "Connect Wallet" in the top right. Complete your farmer profile with basic information about your farm, location, and crops. Once verified, you can apply for loans, access the marketplace, and start earning carbon credits.',
      tags: ['onboarding', 'wallet', 'profile'],
      helpful: 45
    },
    {
      id: 2,
      category: 'loans',
      question: 'How does the loan application process work?',
      answer: 'Apply for a loan by clicking "Apply for Loan" from your dashboard. Fill out your farm details, upload any required documents, and consent to data usage. Our AI analyzes satellite imagery, weather data, and your farming history to generate a credit score. Approved applications appear on the lender marketplace where investors can fund your loan.',
      tags: ['application', 'ai', 'funding'],
      helpful: 38
    },
    {
      id: 3,
      category: 'security',
      question: 'What is a Decentralized Identity (DID) and why do I need one?',
      answer: 'A DID is a secure, blockchain-based digital identity that verifies your information without storing personal data centrally. It enables privacy-preserving verification for loans and transactions. Your DID is created automatically during onboarding and is used to prove your identity to lenders without revealing sensitive details.',
      tags: ['did', 'privacy', 'verification'],
      helpful: 29
    },
    {
      id: 4,
      category: 'carbon',
      question: 'How do I earn and trade carbon credits?',
      answer: 'Earn carbon credits through sustainable farming practices like reduced chemical usage, improved soil health, and efficient irrigation. Credits are automatically calculated based on your farm\'s environmental impact data. Trade them on our marketplace or use them to offset emissions. Each credit represents 1 ton of CO2 equivalent.',
      tags: ['sustainability', 'trading', 'environment'],
      helpful: 22
    },
    {
      id: 5,
      category: 'marketplace',
      question: 'How does the lender marketplace work?',
      answer: 'Browse loan applications from verified farmers on our marketplace. Each loan shows AI credit scores, risk assessments, and farm details. Fund loans by clicking "Fund Loan" and confirming the transaction in your wallet. Earn returns as farmers repay their loans. You can also trade loan NFTs on secondary markets.',
      tags: ['lending', 'investment', 'returns'],
      helpful: 31
    },
    {
      id: 6,
      category: 'getting-started',
      question: 'What wallets are supported?',
      answer: 'We support all major Web3 wallets including MetaMask, Trust Wallet, Coinbase Wallet, and WalletConnect-compatible wallets. For regions with limited internet, we also offer USSD integration for basic account management and loan repayments.',
      tags: ['wallet', 'compatibility', 'ussd'],
      helpful: 18
    },
    {
      id: 7,
      category: 'security',
      question: 'How is my data protected?',
      answer: 'Your data is protected through multiple layers: blockchain encryption, zero-knowledge proofs for privacy, and decentralized storage. We never store sensitive personal information on centralized servers. All transactions are recorded immutably on the blockchain.',
      tags: ['privacy', 'encryption', 'blockchain'],
      helpful: 25
    },
    {
      id: 8,
      category: 'loans',
      question: 'What documents do I need for loan application?',
      answer: 'Basic requirements include farm location coordinates, land ownership documents, and crop information. For enhanced loans, you may need additional verification like bank statements or cooperative membership. Our AI can often approve loans using just satellite data and mobile transaction history.',
      tags: ['documents', 'verification', 'requirements'],
      helpful: 16
    }
  ];

  const guides = [
    {
      title: 'Complete Farmer Onboarding',
      description: 'Step-by-step guide to setting up your AgriCredit account',
      duration: '5 min',
      difficulty: 'Beginner',
      category: 'getting-started',
      icon: Book
    },
    {
      title: 'Understanding Your Credit Score',
      description: 'How our AI calculates your creditworthiness',
      duration: '8 min',
      difficulty: 'Intermediate',
      category: 'loans',
      icon: TrendingUp
    },
    {
      title: 'Loan Application Process',
      description: 'Complete walkthrough of applying for agricultural loans',
      duration: '10 min',
      difficulty: 'Beginner',
      category: 'loans',
      icon: FileText
    },
    {
      title: 'Carbon Credit Trading',
      description: 'How to earn, track, and trade carbon credits',
      duration: '6 min',
      difficulty: 'Intermediate',
      category: 'carbon',
      icon: Leaf
    },
    {
      title: 'Marketplace Navigation',
      description: 'Finding and funding the best loan opportunities',
      duration: '7 min',
      difficulty: 'Beginner',
      category: 'marketplace',
      icon: TrendingUp
    },
    {
      title: 'Security Best Practices',
      description: 'Protecting your account and funds',
      duration: '12 min',
      difficulty: 'Advanced',
      category: 'security',
      icon: Shield
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredGuides = guides.filter(guide => {
    const matchesCategory = selectedCategory === 'all' || guide.category === selectedCategory;
    return matchesCategory;
  });

  return (
    <div className="min-h-screen bg-paper-white">

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-agri-green to-sky-teal text-white py-12">
        <div className="container">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              Help Center
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto mb-8">
              Find answers, guides, and support for all your AgriCredit questions
            </p>

            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
              <Input
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-white/10 border-white/30 text-white placeholder:text-white/70 focus:bg-white focus:text-slate-gray"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container py-8">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 ${
                  selectedCategory === category.id
                    ? 'bg-agri-green hover:bg-agri-green/90'
                    : 'border-slate-gray/20 hover:border-agri-green hover:text-agri-green'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{category.name}</span>
                <Badge variant="secondary" className="ml-1 text-xs">
                  {category.count}
                </Badge>
              </Button>
            );
          })}
        </div>

        <Tabs defaultValue="faq" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="guides">Guides</TabsTrigger>
            <TabsTrigger value="contact">Contact Support</TabsTrigger>
          </TabsList>

          <TabsContent value="faq" className="space-y-6">
            <Card className="shadow-level2 border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-gray">
                  <HelpCircle className="w-5 h-5 mr-2 text-agri-green" />
                  Frequently Asked Questions
                </CardTitle>
                <CardDescription>
                  {filteredFaqs.length} articles found
                  {selectedCategory !== 'all' && ` in ${categories.find(c => c.id === selectedCategory)?.name}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredFaqs.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full">
                    {filteredFaqs.map((faq) => (
                      <AccordionItem key={faq.id} value={`faq-${faq.id}`}>
                        <AccordionTrigger className="text-left">
                          <div className="flex items-start justify-between w-full pr-4">
                            <span className="font-medium text-slate-gray">{faq.question}</span>
                            <div className="flex items-center space-x-2 text-xs text-slate-gray/60">
                              <Star className="w-3 h-3" />
                              <span>{faq.helpful}</span>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4">
                            <p className="text-slate-gray/80 leading-relaxed">{faq.answer}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex flex-wrap gap-2">
                                {faq.tags.map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs border-slate-gray/20">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                              <Button variant="ghost" size="sm" className="text-agri-green hover:text-agri-green/80">
                                Was this helpful?
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="text-center py-12">
                    <HelpCircle className="w-12 h-12 text-slate-gray/40 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-gray mb-2">No results found</h3>
                    <p className="text-slate-gray/70 mb-4">
                      Try adjusting your search terms or browse all categories
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                      }}
                    >
                      Clear filters
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guides" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGuides.map((guide, index) => {
                const Icon = guide.icon;
                return (
                  <Card key={index} className="shadow-level1 border-0 hover:shadow-level2 transition-all duration-200 group cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4 mb-4">
                        <div className="w-12 h-12 bg-agri-green/10 rounded-lg flex items-center justify-center group-hover:bg-agri-green/20 transition-colors">
                          <Icon className="w-6 h-6 text-agri-green" />
                        </div>
                        <div className="flex-1">
                          <Badge className={
                            guide.difficulty === 'Beginner' ? 'bg-sky-teal/10 text-sky-teal border-sky-teal/20' :
                            guide.difficulty === 'Intermediate' ? 'bg-harvest-gold/10 text-harvest-gold border-harvest-gold/20' :
                            'bg-red-500/10 text-red-500 border-red-500/20'
                          }>
                            {guide.difficulty}
                          </Badge>
                          <h3 className="font-semibold text-slate-gray group-hover:text-agri-green transition-colors mb-2">
                            {guide.title}
                          </h3>
                          <p className="text-sm text-slate-gray/70 mb-3">{guide.description}</p>
                          <div className="flex items-center justify-between text-xs text-slate-gray/60">
                            <span className="flex items-center">
                              <Play className="w-3 h-3 mr-1" />
                              {guide.duration} read
                            </span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredGuides.length === 0 && (
              <div className="text-center py-12">
                <Book className="w-12 h-12 text-slate-gray/40 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-gray mb-2">No guides found</h3>
                <p className="text-slate-gray/70">Try selecting a different category</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="contact" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Contact Options */}
              <Card className="shadow-level2 border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-gray">
                    <MessageCircle className="w-5 h-5 mr-2 text-agri-green" />
                    Contact Support
                  </CardTitle>
                  <CardDescription>
                    Get help from our support team
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="flex items-center space-x-4 p-4 border border-slate-gray/10 rounded-lg hover:border-agri-green/30 transition-colors cursor-pointer">
                      <div className="w-12 h-12 bg-agri-green/10 rounded-lg flex items-center justify-center">
                        <MessageCircle className="w-6 h-6 text-agri-green" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-gray">Live Chat</h4>
                        <p className="text-sm text-slate-gray/70">Instant support during business hours</p>
                        <p className="text-xs text-agri-green mt-1">● Available now</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-gray/40" />
                    </div>

                    <div className="flex items-center space-x-4 p-4 border border-slate-gray/10 rounded-lg hover:border-agri-green/30 transition-colors cursor-pointer">
                      <div className="w-12 h-12 bg-sky-teal/10 rounded-lg flex items-center justify-center">
                        <Mail className="w-6 h-6 text-sky-teal" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-gray">Email Support</h4>
                        <p className="text-sm text-slate-gray/70">support@agricredit.africa</p>
                        <p className="text-xs text-slate-gray/60 mt-1">Response within 24 hours</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-gray/40" />
                    </div>

                    <div className="flex items-center space-x-4 p-4 border border-slate-gray/10 rounded-lg hover:border-agri-green/30 transition-colors cursor-pointer">
                      <div className="w-12 h-12 bg-harvest-gold/10 rounded-lg flex items-center justify-center">
                        <Phone className="w-6 h-6 text-harvest-gold" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-gray">Phone Support</h4>
                        <p className="text-sm text-slate-gray/70">+254 700 123 456</p>
                        <p className="text-xs text-slate-gray/60 mt-1">Mon-Fri, 9AM-5PM EAT</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-gray/40" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Community & Resources */}
              <Card className="shadow-level2 border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-gray">
                    <Users className="w-5 h-5 mr-2 text-agri-green" />
                    Community & Resources
                  </CardTitle>
                  <CardDescription>
                    Connect with other farmers and learn more
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="flex items-center space-x-4 p-4 border border-slate-gray/10 rounded-lg hover:border-agri-green/30 transition-colors cursor-pointer">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-gray">Discord Community</h4>
                        <p className="text-sm text-slate-gray/70">Join discussions with farmers worldwide</p>
                      </div>
                      <ExternalLink className="w-5 h-5 text-slate-gray/40" />
                    </div>

                    <div className="flex items-center space-x-4 p-4 border border-slate-gray/10 rounded-lg hover:border-agri-green/30 transition-colors cursor-pointer">
                      <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                        <Book className="w-6 h-6 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-gray">Documentation</h4>
                        <p className="text-sm text-slate-gray/70">Complete technical documentation</p>
                      </div>
                      <ExternalLink className="w-5 h-5 text-slate-gray/40" />
                    </div>

                    <div className="flex items-center space-x-4 p-4 border border-slate-gray/10 rounded-lg hover:border-agri-green/30 transition-colors cursor-pointer">
                      <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                        <Download className="w-6 h-6 text-purple-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-gray">API Reference</h4>
                        <p className="text-sm text-slate-gray/70">Developer resources and integrations</p>
                      </div>
                      <ExternalLink className="w-5 h-5 text-slate-gray/40" />
                    </div>
                  </div>

                  {/* Status */}
                  <div className="pt-4 border-t border-slate-gray/10">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-gray/70">Support Status</span>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-agri-green" />
                        <span className="text-sm text-agri-green">All systems operational</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Emergency Contact */}
            <Card className="shadow-level1 border-0 bg-red-50 border-red-200">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <AlertTriangle className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-red-800 mb-2">Emergency Support</h4>
                    <p className="text-red-700 text-sm mb-3">
                      For urgent security issues, lost access to funds, or critical system problems,
                      contact our emergency hotline immediately.
                    </p>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-red-800">+254 700 999 999</span>
                      </div>
                      <Badge className="bg-red-100 text-red-800 border-red-300">
                        24/7 Available
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
}