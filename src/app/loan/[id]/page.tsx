'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { useGetLoanByIdQuery, useFundLoanMutation } from '@/store/apiSlice';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Leaf,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  FileText,
  ExternalLink,
  Download,
  Share2,
  Heart,
  AlertTriangle,
  CheckCircle,
  Info,
  Users,
  Activity,
  Shield,
  Eye,
  Copy
} from 'lucide-react';

export default function LoanDetailPage({ params }: { params: { id: string } }) {
  const { t } = useTranslation();
  const [fundLoan, { isLoading: isFunding }] = useFundLoanMutation();

  // Mock comprehensive loan data
  const loan = {
    id: params.id,
    farmer: {
      name: 'John Doe',
      wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      location: 'Nairobi, Kenya',
      experience: '8 years',
      farmSize: 5.2,
      previousLoans: 3,
      repaymentRate: 98
    },
    loan: {
      amount: 2500,
      fundedAmount: 875,
      interestRate: 8.5,
      termMonths: 12,
      status: 'partially_funded',
      createdAt: '2024-01-15',
      deadline: '2024-02-15',
      purpose: 'Purchase irrigation equipment and seeds for maize farming'
    },
    farm: {
      crop: 'Maize',
      size: 5.2,
      location: 'Nairobi Region, Kenya',
      ndvi: 0.78,
      soilHealth: 'Good',
      irrigation: 'Drip irrigation system',
      lastHarvest: '2023-11-20'
    },
    aiReport: {
      score: 785,
      confidence: 92,
      riskLevel: 'Low',
      cid: 'QmYwAPJzv5CZsnAzt7HZA8cEFdptQqLxjgXuJMG',
      factors: [
        { name: 'NDVI Vegetation Index', impact: 15, value: 0.78, description: 'Healthy crop growth' },
        { name: 'Repayment History', impact: 12, value: 98, description: 'Excellent payment record' },
        { name: 'Farm Location', impact: 8, value: 'Nairobi', description: 'Prime agricultural region' },
        { name: 'Weather Risk', impact: -3, value: 0.15, description: 'Low drought risk' },
        { name: 'Market Prices', impact: 5, value: 'Stable', description: 'Favorable maize prices' }
      ],
      recommendations: [
        'Continue sustainable farming practices',
        'Consider crop diversification',
        'Monitor weather patterns closely'
      ]
    },
    funders: [
      { name: 'Alice Johnson', amount: 500, date: '2024-01-16' },
      { name: 'Bob Smith', amount: 375, date: '2024-01-18' }
    ],
    contract: {
      address: '0x1234567890123456789012345678901234567890',
      network: 'Celo Alfajores',
      deployedAt: '2024-01-15T10:30:00Z',
      txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
    }
  };

  const fundingProgress = (loan.loan.fundedAmount / loan.loan.amount) * 100;
  const daysLeft = Math.max(0, Math.ceil((new Date(loan.loan.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));

  const handleFundLoan = async () => {
    try {
      await fundLoan({
        id: loan.id,
        amount_cents: 100000 // $1,000
      }).unwrap();
      // Success handling
    } catch (error) {
      console.error('Failed to fund loan:', error);
    }
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'bg-sky-teal/10 text-sky-teal border-sky-teal/20';
      case 'medium': return 'bg-harvest-gold/10 text-harvest-gold border-harvest-gold/20';
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-slate-gray/10 text-slate-gray border-slate-gray/20';
    }
  };

  return (
    <div className="min-h-screen bg-paper-white">
      <Navbar />

      {/* Header */}
      <section className="bg-gradient-to-r from-agri-green to-sky-teal text-white py-8">
        <div className="container">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/marketplace">
              <Button variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Marketplace
              </Button>
            </Link>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-black mb-2">
                ${loan.loan.amount.toLocaleString()} Agricultural Loan
              </h1>
              <div className="flex items-center space-x-4 text-white/80">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>{loan.farmer.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>{loan.farmer.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Leaf className="w-4 h-4" />
                  <span>{loan.farm.crop} Farming</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                <Heart className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Loan Overview */}
              <Card className="shadow-level2 border-0">
                <div className={`h-1 bg-gradient-to-r ${
                  loan.aiReport.riskLevel === 'Low' ? 'from-green-500 to-emerald-500' :
                  loan.aiReport.riskLevel === 'Medium' ? 'from-amber-500 to-orange-500' :
                  'from-red-500 to-red-600'
                }`}></div>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-gray mb-4">Loan Details</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-gray/70">Loan Amount</span>
                          <span className="font-semibold">${loan.loan.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-gray/70">Interest Rate</span>
                          <span className="font-semibold">{loan.loan.interestRate}% APR</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-gray/70">Term</span>
                          <span className="font-semibold">{loan.loan.termMonths} months</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-gray/70">Purpose</span>
                          <span className="font-semibold text-sm max-w-32 text-right">{loan.loan.purpose}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-gray mb-4">Funding Progress</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-gray/70">Raised</span>
                          <span className="font-semibold text-agri-green">
                            ${loan.loan.fundedAmount.toLocaleString()} / ${loan.loan.amount.toLocaleString()}
                          </span>
                        </div>
                        <Progress value={fundingProgress} className="h-3" />
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-gray/60">{Math.round(fundingProgress)}% funded</span>
                          <span className="text-slate-gray/60">{daysLeft} days left</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-gray/10">
                    <div className="flex items-center space-x-4">
                      <Badge className={getRiskBadgeColor(loan.aiReport.riskLevel)}>
                        {loan.aiReport.score} Score • {loan.aiReport.riskLevel} Risk
                      </Badge>
                      <Badge variant="outline" className="border-slate-gray/20">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                    <span className="text-sm text-slate-gray/60">
                      Created {new Date(loan.loan.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs for different sections */}
              <Tabs defaultValue="ai-report" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="ai-report">AI Report</TabsTrigger>
                  <TabsTrigger value="farmer">Farmer Profile</TabsTrigger>
                  <TabsTrigger value="farm">Farm Details</TabsTrigger>
                  <TabsTrigger value="funders">Funders</TabsTrigger>
                </TabsList>

                <TabsContent value="ai-report" className="space-y-6">
                  <Card className="shadow-level1 border-0">
                    <CardHeader>
                      <CardTitle className="flex items-center text-slate-gray">
                        <BarChart3 className="w-5 h-5 mr-2 text-agri-green" />
                        AI Credit Assessment Report
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Score Overview */}
                      <div className="text-center space-y-4">
                        <div className={`text-6xl font-black ${loan.aiReport.score >= 700 ? 'text-sky-teal' : loan.aiReport.score >= 600 ? 'text-harvest-gold' : 'text-red-500'}`}>
                          {loan.aiReport.score}
                        </div>
                        <div className="flex items-center justify-center space-x-4">
                          <Badge className="bg-slate-gray/10 text-slate-gray border-slate-gray/20">
                            {loan.aiReport.confidence}% Confidence
                          </Badge>
                          <Badge className={getRiskBadgeColor(loan.aiReport.riskLevel)}>
                            {loan.aiReport.riskLevel} Risk
                          </Badge>
                        </div>
                      </div>

                      {/* Key Factors */}
                      <div>
                        <h4 className="font-semibold text-slate-gray mb-4">Key Assessment Factors</h4>
                        <div className="space-y-3">
                          {loan.aiReport.factors.map((factor, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-slate-gray/5 rounded-lg">
                              <div className="flex-1">
                                <h5 className="font-medium text-slate-gray">{factor.name}</h5>
                                <p className="text-sm text-slate-gray/60">{factor.description}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-slate-gray/60">{factor.value}</span>
                                <div className={`flex items-center space-x-1 ${
                                  factor.impact > 0 ? 'text-sky-teal' : 'text-red-500'
                                }`}>
                                  {factor.impact > 0 ? (
                                    <TrendingUp className="w-4 h-4" />
                                  ) : (
                                    <TrendingDown className="w-4 h-4" />
                                  )}
                                  <span className="font-medium">
                                    {factor.impact > 0 ? '+' : ''}{factor.impact}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommendations */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                          <Info className="w-4 h-4 mr-2" />
                          AI Recommendations
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          {loan.aiReport.recommendations.map((rec, index) => (
                            <li key={index}>• {rec}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Report Details */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-gray/10">
                        <div>
                          <p className="text-sm text-slate-gray/60">Report IPFS CID</p>
                          <p className="font-mono text-xs text-slate-gray">{loan.aiReport.cid}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download Full Report
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="farmer" className="space-y-6">
                  <Card className="shadow-level1 border-0">
                    <CardHeader>
                      <CardTitle className="flex items-center text-slate-gray">
                        <Users className="w-5 h-5 mr-2 text-agri-green" />
                        Farmer Profile
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-slate-gray mb-2">Personal Information</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-gray/70">Name</span>
                                <span>{loan.farmer.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-gray/70">Location</span>
                                <span>{loan.farmer.location}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-gray/70">Experience</span>
                                <span>{loan.farmer.experience}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold text-slate-gray mb-2">Wallet Address</h4>
                            <div className="flex items-center space-x-2">
                              <code className="text-xs bg-slate-gray/10 px-2 py-1 rounded font-mono">
                                {loan.farmer.wallet.slice(0, 6)}...{loan.farmer.wallet.slice(-4)}
                              </code>
                              <Button variant="ghost" size="sm" className="p-1">
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-slate-gray mb-2">Farming History</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-gray/70">Previous Loans</span>
                                <span>{loan.farmer.previousLoans}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-gray/70">Repayment Rate</span>
                                <span className="text-sky-teal">{loan.farmer.repaymentRate}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-gray/70">Farm Size</span>
                                <span>{loan.farmer.farmSize} hectares</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="farm" className="space-y-6">
                  <Card className="shadow-level1 border-0">
                    <CardHeader>
                      <CardTitle className="flex items-center text-slate-gray">
                        <Leaf className="w-5 h-5 mr-2 text-agri-green" />
                        Farm Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-slate-gray mb-2">Farm Information</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-gray/70">Primary Crop</span>
                                <span>{loan.farm.crop}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-gray/70">Farm Size</span>
                                <span>{loan.farm.size} hectares</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-gray/70">Location</span>
                                <span>{loan.farm.location}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-gray/70">Irrigation</span>
                                <span>{loan.farm.irrigation}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-slate-gray mb-2">Farm Health Metrics</h4>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-gray/70">NDVI Index</span>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-agri-green">{loan.farm.ndvi}</span>
                                  <div className="w-16 h-2 bg-slate-gray/20 rounded-full">
                                    <div
                                      className="h-2 bg-agri-green rounded-full"
                                      style={{ width: `${loan.farm.ndvi * 100}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-gray/70">Soil Health</span>
                                <Badge className="bg-sky-teal/10 text-sky-teal border-sky-teal/20">
                                  {loan.farm.soilHealth}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-gray/70">Last Harvest</span>
                                <span>{new Date(loan.farm.lastHarvest).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="funders" className="space-y-6">
                  <Card className="shadow-level1 border-0">
                    <CardHeader>
                      <CardTitle className="flex items-center text-slate-gray">
                        <DollarSign className="w-5 h-5 mr-2 text-agri-green" />
                        Loan Funders ({loan.funders.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {loan.funders.map((funder, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-slate-gray/5 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-agri-green to-sky-teal rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {funder.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-slate-gray">{funder.name}</p>
                                <p className="text-sm text-slate-gray/60">{funder.date}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-agri-green">${funder.amount}</p>
                              <p className="text-xs text-slate-gray/60">Funded</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Funding Action */}
              <Card className="shadow-level2 border-0">
                <CardHeader>
                  <CardTitle className="text-slate-gray">Fund This Loan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-agri-green mb-1">
                      ${loan.loan.amount - loan.loan.fundedAmount}
                    </div>
                    <p className="text-sm text-slate-gray/60">Amount needed</p>
                  </div>

                  <Button
                    onClick={handleFundLoan}
                    disabled={isFunding}
                    className="w-full btn-primary"
                  >
                    {isFunding ? 'Processing...' : 'Fund This Loan'}
                  </Button>

                  <div className="text-xs text-slate-gray/60 text-center">
                    Funds are held in escrow until loan is fully funded
                  </div>
                </CardContent>
              </Card>

              {/* Contract Information */}
              <Card className="shadow-level1 border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-gray">
                    <Shield className="w-4 h-4 mr-2 text-agri-green" />
                    Smart Contract
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-gray/60 mb-1">Contract Address</p>
                    <div className="flex items-center space-x-2">
                      <code className="text-xs bg-slate-gray/10 px-2 py-1 rounded font-mono flex-1">
                        {loan.contract.address.slice(0, 8)}...{loan.contract.address.slice(-6)}
                      </code>
                      <Button variant="ghost" size="sm" className="p-1">
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-slate-gray/60">Network</p>
                      <p className="font-medium">{loan.contract.network}</p>
                    </div>
                    <div>
                      <p className="text-slate-gray/60">Deployed</p>
                      <p className="font-medium">{new Date(loan.contract.deployedAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on Explorer
                  </Button>
                </CardContent>
              </Card>

              {/* Risk Assessment */}
              <Card className="shadow-level1 border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-gray">
                    <Activity className="w-4 h-4 mr-2 text-agri-green" />
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-gray/70">Default Risk</span>
                      <Badge className={getRiskBadgeColor(loan.aiReport.riskLevel)}>
                        {loan.aiReport.riskLevel}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-gray/70">Expected Return</span>
                      <span className="text-sm font-semibold text-agri-green">
                        {loan.loan.interestRate + 2.5}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-gray/70">AI Confidence</span>
                      <span className="text-sm font-semibold text-sky-teal">
                        {loan.aiReport.confidence}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="shadow-level1 border-0">
                <CardHeader>
                  <CardTitle className="text-slate-gray">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Eye className="w-4 h-4 mr-2" />
                    View AI Report
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Download Contract
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Loan
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}