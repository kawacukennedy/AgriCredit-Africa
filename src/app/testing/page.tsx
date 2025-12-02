'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import {
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  FileText,
  Code,
  Zap,
  BarChart3,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Target,
  TrendingUp
} from 'lucide-react';
import { BarChart, LineChart } from '@/components/charts';

interface TestResult {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'running' | 'pending';
  duration: number;
  error?: string;
  category: 'unit' | 'integration' | 'e2e' | 'api' | 'contract';
  timestamp: number;
}

interface TestSuite {
  id: string;
  name: string;
  description: string;
  category: 'unit' | 'integration' | 'e2e' | 'api' | 'contract';
  tests: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
  lastRun: number;
  status: 'idle' | 'running' | 'completed' | 'failed';
}

interface TestMetrics {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  coverage: number;
  averageDuration: number;
  successRate: number;
}

export default function TestingPage() {
  const { address, isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState('overview');
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [selectedSuite, setSelectedSuite] = useState<TestSuite | null>(null);
  const [runningTests, setRunningTests] = useState(false);
  const [metrics, setMetrics] = useState<TestMetrics>({
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    coverage: 0,
    averageDuration: 0,
    successRate: 0
  });

  useEffect(() => {
    if (isConnected) {
      loadTestSuites();
    }
  }, [isConnected]);

  const loadTestSuites = async () => {
    // Mock data - in production, fetch from test runner API
    const mockSuites: TestSuite[] = [
      {
        id: 'backend-api',
        name: 'Backend API Tests',
        description: 'Comprehensive API endpoint testing',
        category: 'api',
        totalTests: 45,
        passedTests: 42,
        failedTests: 3,
        duration: 125000,
        lastRun: Date.now() - 3600000,
        status: 'completed',
        tests: [
          {
            id: 'auth-login',
            name: 'Authentication - Login',
            status: 'passed',
            duration: 2450,
            category: 'api',
            timestamp: Date.now() - 3600000
          },
          {
            id: 'auth-register',
            name: 'Authentication - Registration',
            status: 'passed',
            duration: 3200,
            category: 'api',
            timestamp: Date.now() - 3600000
          },
          {
            id: 'loan-application',
            name: 'Loan Application API',
            status: 'failed',
            duration: 1800,
            error: 'Validation error: missing required field',
            category: 'api',
            timestamp: Date.now() - 3600000
          }
        ]
      },
      {
        id: 'smart-contracts',
        name: 'Smart Contract Tests',
        description: 'Blockchain contract functionality tests',
        category: 'contract',
        totalTests: 32,
        passedTests: 30,
        failedTests: 2,
        duration: 89000,
        lastRun: Date.now() - 7200000,
        status: 'completed',
        tests: [
          {
            id: 'loan-manager-deploy',
            name: 'Loan Manager Deployment',
            status: 'passed',
            duration: 5200,
            category: 'contract',
            timestamp: Date.now() - 7200000
          },
          {
            id: 'credit-scoring',
            name: 'Credit Scoring Logic',
            status: 'passed',
            duration: 3800,
            category: 'contract',
            timestamp: Date.now() - 7200000
          }
        ]
      },
      {
        id: 'frontend-unit',
        name: 'Frontend Unit Tests',
        description: 'React component and hook testing',
        category: 'unit',
        totalTests: 28,
        passedTests: 26,
        failedTests: 2,
        duration: 45000,
        lastRun: Date.now() - 1800000,
        status: 'completed',
        tests: [
          {
            id: 'wallet-hook',
            name: 'useWallet Hook',
            status: 'passed',
            duration: 1200,
            category: 'unit',
            timestamp: Date.now() - 1800000
          },
          {
            id: 'auth-modal',
            name: 'Auth Modal Component',
            status: 'failed',
            duration: 800,
            error: 'Component not rendering correctly',
            category: 'unit',
            timestamp: Date.now() - 1800000
          }
        ]
      },
      {
        id: 'integration-e2e',
        name: 'End-to-End Integration',
        description: 'Full user journey testing',
        category: 'e2e',
        totalTests: 15,
        passedTests: 12,
        failedTests: 3,
        duration: 180000,
        lastRun: Date.now() - 86400000,
        status: 'completed',
        tests: [
          {
            id: 'loan-application-flow',
            name: 'Complete Loan Application Flow',
            status: 'passed',
            duration: 25000,
            category: 'e2e',
            timestamp: Date.now() - 86400000
          },
          {
            id: 'marketplace-trading',
            name: 'Marketplace Trading Flow',
            status: 'failed',
            duration: 18000,
            error: 'Transaction timeout',
            category: 'e2e',
            timestamp: Date.now() - 86400000
          }
        ]
      },
      {
        id: 'ai-models',
        name: 'AI Model Tests',
        description: 'Machine learning model validation',
        category: 'integration',
        totalTests: 18,
        passedTests: 16,
        failedTests: 2,
        duration: 156000,
        lastRun: Date.now() - 43200000,
        status: 'completed',
        tests: [
          {
            id: 'yield-prediction',
            name: 'Yield Prediction Model',
            status: 'passed',
            duration: 8500,
            category: 'integration',
            timestamp: Date.now() - 43200000
          },
          {
            id: 'credit-scoring-ai',
            name: 'AI Credit Scoring',
            status: 'passed',
            duration: 7200,
            category: 'integration',
            timestamp: Date.now() - 43200000
          }
        ]
      }
    ];

    setTestSuites(mockSuites);

    // Calculate metrics
    const totalTests = mockSuites.reduce((sum, suite) => sum + suite.totalTests, 0);
    const passedTests = mockSuites.reduce((sum, suite) => sum + suite.passedTests, 0);
    const failedTests = mockSuites.reduce((sum, suite) => sum + suite.failedTests, 0);
    const totalDuration = mockSuites.reduce((sum, suite) => sum + suite.duration, 0);

    setMetrics({
      totalTests,
      passedTests,
      failedTests,
      coverage: 87.5, // Mock coverage
      averageDuration: totalDuration / totalTests,
      successRate: (passedTests / totalTests) * 100
    });
  };

  const runAllTests = async () => {
    setRunningTests(true);

    // Simulate running tests
    setTestSuites(prev => prev.map(suite => ({
      ...suite,
      status: 'running' as const
    })));

    // Simulate test execution
    await new Promise(resolve => setTimeout(resolve, 3000));

    setTestSuites(prev => prev.map(suite => ({
      ...suite,
      status: 'completed' as const,
      lastRun: Date.now()
    })));

    setRunningTests(false);
  };

  const runTestSuite = async (suiteId: string) => {
    setTestSuites(prev => prev.map(suite =>
      suite.id === suiteId
        ? { ...suite, status: 'running' as const }
        : suite
    ));

    // Simulate test execution
    await new Promise(resolve => setTimeout(resolve, 2000));

    setTestSuites(prev => prev.map(suite =>
      suite.id === suiteId
        ? { ...suite, status: 'completed' as const, lastRun: Date.now() }
        : suite
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'failed': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'running': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
      case 'pending': return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
      case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'idle': return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'running': return <Clock className="w-4 h-4 animate-spin" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'idle': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'unit': return <Code className="w-5 h-5 text-blue-600" />;
      case 'integration': return <Zap className="w-5 h-5 text-purple-600" />;
      case 'e2e': return <Target className="w-5 h-5 text-green-600" />;
      case 'api': return <FileText className="w-5 h-5 text-indigo-600" />;
      case 'contract': return <Upload className="w-5 h-5 text-orange-600" />;
      default: return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Code className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Testing Suite
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Connect your wallet to access the testing dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Testing Suite</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Comprehensive testing dashboard for unit, integration, and end-to-end tests
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'suites', label: 'Test Suites', icon: FileText },
            { id: 'results', label: 'Test Results', icon: CheckCircle },
            { id: 'coverage', label: 'Coverage', icon: TrendingUp }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
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

        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tests</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalTests}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
                    <p className="text-2xl font-bold text-green-600">{metrics.successRate.toFixed(1)}%</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Code Coverage</p>
                    <p className="text-2xl font-bold text-purple-600">{metrics.coverage}%</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Duration</p>
                    <p className="text-2xl font-bold text-indigo-600">{(metrics.averageDuration / 1000).toFixed(1)}s</p>
                  </div>
                  <Clock className="w-8 h-8 text-indigo-600" />
                </div>
              </div>
            </div>

            {/* Test Status Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Test Status Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4">Test Results</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Passed</span>
                      <span className="font-medium text-green-600">{metrics.passedTests}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Failed</span>
                      <span className="font-medium text-red-600">{metrics.failedTests}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Total</span>
                      <span className="font-medium text-gray-900 dark:text-white">{metrics.totalTests}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4">Test Categories</h3>
                  <div className="space-y-3">
                    {['unit', 'integration', 'e2e', 'api', 'contract'].map(category => {
                      const count = testSuites.filter(s => s.category === category).length;
                      return (
                        <div key={category} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(category)}
                            <span className="text-gray-600 dark:text-gray-400 capitalize">{category}</span>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Test Runs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Test Runs</h2>
                <button
                  onClick={runAllTests}
                  disabled={runningTests}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {runningTests ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Run All Tests
                </button>
              </div>

              <div className="space-y-4">
                {testSuites.map((suite) => (
                  <div key={suite.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="flex items-center gap-4">
                      {getCategoryIcon(suite.category)}
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{suite.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{suite.description}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {suite.passedTests}/{suite.totalTests} passed • {(suite.duration / 1000).toFixed(1)}s
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(suite.status)}`}>
                        {suite.status}
                      </span>
                      <button
                        onClick={() => runTestSuite(suite.id)}
                        disabled={suite.status === 'running'}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm rounded transition-colors"
                      >
                        Run
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'suites' && (
          <div className="space-y-6">
            {testSuites.map((suite) => (
              <div key={suite.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(suite.category)}
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{suite.name}</h2>
                      <p className="text-gray-600 dark:text-gray-400">{suite.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(suite.status)}`}>
                      {suite.status}
                    </span>
                    <button
                      onClick={() => runTestSuite(suite.id)}
                      disabled={suite.status === 'running'}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                    >
                      {suite.status === 'running' ? 'Running...' : 'Run Suite'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{suite.totalTests}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Tests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{suite.passedTests}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Passed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{suite.failedTests}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{(suite.duration / 1000).toFixed(1)}s</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Duration</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900 dark:text-white">Test Cases</h3>
                  {suite.tests.map((test) => (
                    <div key={test.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className={`p-1 rounded-full ${getStatusColor(test.status)}`}>
                          {getStatusIcon(test.status)}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{test.name}</p>
                          {test.error && (
                            <p className="text-sm text-red-600 dark:text-red-400">{test.error}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {(test.duration / 1000).toFixed(2)}s
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'results' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Test Results</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Test Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Suite
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {testSuites.flatMap(suite =>
                    suite.tests.map(test => (
                      <tr key={`${suite.id}-${test.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`p-1 rounded-full mr-3 ${getStatusColor(test.status)}`}>
                              {getStatusIcon(test.status)}
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">{test.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {suite.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(test.status)}`}>
                            {test.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {(test.duration / 1000).toFixed(2)}s
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(test.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'coverage' && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Code Coverage Report</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4">Coverage by Category</h3>
                  <div className="space-y-4">
                    {[
                      { name: 'Statements', value: 87.5, color: 'bg-blue-600' },
                      { name: 'Branches', value: 82.3, color: 'bg-green-600' },
                      { name: 'Functions', value: 91.2, color: 'bg-purple-600' },
                      { name: 'Lines', value: 89.7, color: 'bg-yellow-600' }
                    ].map((item) => (
                      <div key={item.name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                          <span className="font-medium text-gray-900 dark:text-white">{item.value}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${item.color}`}
                            style={{ width: `${item.value}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4">Coverage Trend</h3>
                  <div className="h-64">
                    <LineChart
                      data={[
                        { date: 'Jan', coverage: 78.5 },
                        { date: 'Feb', coverage: 81.2 },
                        { date: 'Mar', coverage: 83.7 },
                        { date: 'Apr', coverage: 85.1 },
                        { date: 'May', coverage: 87.5 },
                      ]}
                      xKey="date"
                      yKey="coverage"
                      color="#10B981"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Coverage by File</h2>

              <div className="space-y-4">
                {[
                  { file: 'src/hooks/useWallet.ts', coverage: 95.2, lines: 120 },
                  { file: 'src/components/AuthModal.tsx', coverage: 88.7, lines: 85 },
                  { file: 'src/lib/api.ts', coverage: 92.1, lines: 156 },
                  { file: 'backend/core/blockchain.py', coverage: 89.3, lines: 203 },
                  { file: 'backend/app/main.py', coverage: 85.6, lines: 312 },
                  { file: 'contracts/AgriCredit.sol', coverage: 94.8, lines: 89 }
                ].map((file) => (
                  <div key={file.file} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{file.file}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{file.lines} lines</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{file.coverage}%</div>
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${file.coverage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}