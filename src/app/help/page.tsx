'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  HelpCircle,
  MessageSquare,
  Phone,
  Mail,
  Book,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  CreditCard,
  TrendingUp,
  Shield,
  Zap,
  Leaf,
  DollarSign,
  BarChart3
} from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

interface Guide {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  readTime: number;
  content: string;
}

const faqs: FAQ[] = [
  {
    id: '1',
    question: 'How do I apply for a loan?',
    answer: 'To apply for a loan: 1) Connect your wallet, 2) Go to the loan application page, 3) Fill in your farm details, 4) Provide collateral, 5) Get AI credit assessment, 6) Submit your application. The AI will evaluate your creditworthiness based on satellite data, farm metrics, and repayment history.',
    category: 'loans',
    tags: ['application', 'getting-started', 'loans']
  },
  {
    id: '2',
    question: 'What is the loan approval process?',
    answer: 'After submission, your application goes through: 1) Initial validation, 2) AI credit scoring using alternative data sources, 3) Risk assessment, 4) Smart contract deployment, 5) Funding period (typically 7-14 days). You\'ll receive notifications at each step.',
    category: 'loans',
    tags: ['approval', 'process', 'timeline']
  },
  {
    id: '3',
    question: 'How does the AI credit scoring work?',
    answer: 'Our AI analyzes multiple data sources: satellite imagery for crop health, mobile money transaction history, IoT sensor data from your farm, weather patterns, and community reputation. This provides fairer access to credit than traditional banking methods.',
    category: 'ai',
    tags: ['ai', 'scoring', 'credit', 'fairness']
  },
  {
    id: '4',
    question: 'What collateral do I need?',
    answer: 'You can use crypto assets (ETH, cUSD), future crop yields (tokenized), or farm equipment as collateral. The required amount is typically 120-150% of the loan value to ensure security. Lower-risk borrowers may need less collateral.',
    category: 'loans',
    tags: ['collateral', 'security', 'requirements']
  },
  {
    id: '5',
    question: 'How do I repay my loan?',
    answer: 'Repayment can be made through: 1) Mobile money (M-Pesa, MTN), 2) Crypto wallet, 3) Automatic deductions from crop sales. You can repay early without penalties. Late payments may incur fees but we work with farmers to find solutions.',
    category: 'loans',
    tags: ['repayment', 'payment', 'mobile-money']
  },
  {
    id: '6',
    question: 'What are carbon credits and how do I earn them?',
    answer: 'Carbon credits represent 1 ton of CO2 removed from the atmosphere. Earn them through sustainable farming practices like conservation tillage, agroforestry, and reduced chemical use. Credits are verified by satellite imagery and IoT sensors.',
    category: 'carbon',
    tags: ['carbon', 'sustainability', 'credits', 'environment']
  },
  {
    id: '7',
    question: 'How does the marketplace work?',
    answer: 'List your produce with photos, descriptions, and pricing. Our AI suggests optimal prices based on market data. Buyers can purchase directly or through escrow. Payments are held securely until delivery confirmation.',
    category: 'marketplace',
    tags: ['selling', 'marketplace', 'pricing', 'escrow']
  },
  {
    id: '8',
    question: 'What is yield farming?',
    answer: 'Yield farming allows you to earn rewards by providing liquidity to loan pools or staking governance tokens. Higher-risk pools offer higher returns. You can withdraw your funds anytime, though early withdrawal may affect rewards.',
    category: 'defi',
    tags: ['yield-farming', 'staking', 'rewards', 'liquidity']
  },
  {
    id: '9',
    question: 'How do I create a DID (Decentralized Identity)?',
    answer: 'Go to Profile → DID Identity → Create DID. This generates a unique digital identity on the blockchain that stores your verified credentials privately. Required for advanced features like reputation scoring and governance participation.',
    category: 'identity',
    tags: ['did', 'identity', 'blockchain', 'privacy']
  },
  {
    id: '10',
    question: 'What happens if I default on a loan?',
    answer: 'We prioritize working with farmers to avoid default. If needed, collateral may be liquidated, but we offer grace periods and restructuring options. Defaults affect your reputation score but don\'t prevent future borrowing with improved practices.',
    category: 'loans',
    tags: ['default', 'risk', 'reputation', 'support']
  }
];

const guides: Guide[] = [
  {
    id: 'getting-started',
    title: 'Getting Started with AgriCredit',
    description: 'Complete guide for new users to set up their profile and make their first loan application.',
    category: 'basics',
    difficulty: 'beginner',
    readTime: 10,
    content: 'Step-by-step guide for onboarding...'
  },
  {
    id: 'loan-application',
    title: 'How to Apply for a Loan',
    description: 'Detailed walkthrough of the loan application process and what to expect.',
    category: 'loans',
    difficulty: 'beginner',
    readTime: 15,
    content: 'Complete loan application guide...'
  },
  {
    id: 'marketplace-guide',
    title: 'Selling on the Marketplace',
    description: 'Learn how to list products, set prices, and manage sales effectively.',
    category: 'marketplace',
    difficulty: 'intermediate',
    readTime: 12,
    content: 'Marketplace selling guide...'
  },
  {
    id: 'carbon-credits',
    title: 'Understanding Carbon Credits',
    description: 'How carbon credits work, how to earn them, and trading strategies.',
    category: 'carbon',
    difficulty: 'intermediate',
    readTime: 18,
    content: 'Carbon credit comprehensive guide...'
  },
  {
    id: 'yield-farming',
    title: 'Yield Farming Strategies',
    description: 'Advanced strategies for maximizing returns through DeFi farming.',
    category: 'defi',
    difficulty: 'advanced',
    readTime: 25,
    content: 'Advanced yield farming guide...'
  }
];

const categories = [
  { id: 'all', label: 'All Topics', icon: Book, color: 'text-gray-600' },
  { id: 'basics', label: 'Getting Started', icon: User, color: 'text-blue-600' },
  { id: 'loans', label: 'Loans & Credit', icon: DollarSign, color: 'text-green-600' },
  { id: 'marketplace', label: 'Marketplace', icon: BarChart3, color: 'text-purple-600' },
  { id: 'carbon', label: 'Carbon Credits', icon: Leaf, color: 'text-teal-600' },
  { id: 'defi', label: 'DeFi & Farming', icon: TrendingUp, color: 'text-orange-600' },
  { id: 'ai', label: 'AI & Technology', icon: Zap, color: 'text-indigo-600' },
  { id: 'identity', label: 'Identity & Security', icon: Shield, color: 'text-red-600' }
];

export default function HelpCenter() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [filteredFAQs, setFilteredFAQs] = useState<FAQ[]>(faqs);
  const [filteredGuides, setFilteredGuides] = useState<Guide[]>(guides);
  const [activeTab, setActiveTab] = useState<'faq' | 'guides' | 'contact'>('faq');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'normal'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    filterContent();
  }, [searchTerm, selectedCategory]);

  const filterContent = () => {
    let filteredFAQs = faqs;
    let filteredGuides = guides;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredFAQs = faqs.filter(faq =>
        faq.question.toLowerCase().includes(term) ||
        faq.answer.toLowerCase().includes(term) ||
        faq.tags.some(tag => tag.toLowerCase().includes(term))
      );
      filteredGuides = guides.filter(guide =>
        guide.title.toLowerCase().includes(term) ||
        guide.description.toLowerCase().includes(term) ||
        guide.content.toLowerCase().includes(term)
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filteredFAQs = filteredFAQs.filter(faq => faq.category === selectedCategory);
      filteredGuides = filteredGuides.filter(guide => guide.category === selectedCategory);
    }

    setFilteredFAQs(filteredFAQs);
    setFilteredGuides(filteredGuides);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    alert('Thank you for your message! We\'ll get back to you within 24 hours.');
    setContactForm({ name: '', email: '', subject: '', message: '', priority: 'normal' });
    setSubmitting(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100 dark:bg-green-900';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900';
      case 'advanced': return 'text-red-600 bg-red-100 dark:bg-red-900';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-600';
      case 'normal': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'urgent': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Help Center</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Find answers, guides, and get support
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search FAQs, guides, and topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <category.icon className="w-4 h-4" />
                  <span className="text-sm">{category.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4">
            {[
              { id: 'faq', label: 'FAQ', icon: HelpCircle },
              { id: 'guides', label: 'Guides', icon: Book },
              { id: 'contact', label: 'Contact Support', icon: MessageSquare }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
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
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'faq' && (
            <motion.div
              key="faq"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {filteredFAQs.length > 0 ? filteredFAQs.map((faq) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                    className="w-full p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                        {faq.question}
                      </h3>
                      {expandedFAQ === faq.id ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                        {categories.find(c => c.id === faq.category)?.label || faq.category}
                      </span>
                      {faq.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                  <AnimatePresence>
                    {expandedFAQ === faq.id && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="border-t border-gray-200 dark:border-gray-600"
                      >
                        <div className="p-6 text-gray-700 dark:text-gray-300">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )) : (
                <div className="text-center py-12">
                  <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                    No FAQs found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Try adjusting your search terms or browse all categories.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'guides' && (
            <motion.div
              key="guides"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredGuides.length > 0 ? filteredGuides.map((guide) => (
                <motion.div
                  key={guide.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {guide.title}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(guide.difficulty)}`}>
                        {guide.difficulty}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {guide.description}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <span>{categories.find(c => c.id === guide.category)?.label}</span>
                      <span>{guide.readTime} min read</span>
                    </div>
                    <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                      <Book className="w-4 h-4" />
                      Read Guide
                    </button>
                  </div>
                </motion.div>
              )) : (
                <div className="col-span-full text-center py-12">
                  <Book className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                    No guides found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Try adjusting your search terms or browse all categories.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'contact' && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Contact Form */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
                    Contact Support
                  </h3>
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Name
                        </label>
                        <input
                          type="text"
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Priority
                      </label>
                      <select
                        value={contactForm.priority}
                        onChange={(e) => setContactForm({ ...contactForm, priority: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                      >
                        <option value="low">Low - General question</option>
                        <option value="normal">Normal - Technical issue</option>
                        <option value="high">High - Loan/payment issue</option>
                        <option value="urgent">Urgent - Security/emergency</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Message
                      </label>
                      <textarea
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                        rows={5}
                        placeholder="Describe your issue or question..."
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-4 h-4" />
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Contact Info & Resources */}
                <div className="space-y-6">
                  {/* Quick Contact */}
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                      Quick Contact
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-800 dark:text-white">Email Support</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">support@agricredit.africa</div>
                          <div className="text-xs text-gray-500">Response within 24 hours</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                          <Phone className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-800 dark:text-white">Emergency Hotline</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">+1-800-AGRICULTURE</div>
                          <div className="text-xs text-gray-500">24/7 for urgent issues</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                          <MessageSquare className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-800 dark:text-white">Live Chat</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Available in app</div>
                          <div className="text-xs text-gray-500">Mon-Fri 9AM-6PM EAT</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Response Times */}
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                      Response Times
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          General Questions
                        </span>
                        <span className="font-medium">&lt; 24 hours</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-yellow-600" />
                          Technical Issues
                        </span>
                        <span className="font-medium">&lt; 4 hours</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-600" />
                          Payment/Loan Issues
                        </span>
                        <span className="font-medium">&lt; 2 hours</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-red-600" />
                          Security/Emergency
                        </span>
                        <span className="font-medium">&lt; 1 hour</span>
                      </div>
                    </div>
                  </div>

                  {/* Community Resources */}
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                      Community Resources
                    </h3>
                    <div className="space-y-3">
                      <a
                        href="https://discord.gg/agricredit"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                          <MessageSquare className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-800 dark:text-white">Discord Community</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Join discussions with other farmers</div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                      <a
                        href="https://docs.agricredit.africa"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <Book className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-800 dark:text-white">Documentation</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Technical guides and API docs</div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}