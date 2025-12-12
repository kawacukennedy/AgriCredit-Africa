'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Shield,
  DollarSign,
  CheckCircle,
  ArrowRight,
  Info,
  Star,
  TrendingUp,
  Award,
  HeartHandshake,
  Building2
} from 'lucide-react';

export default function CooperativeLendingPage() {
  const { t } = useTranslation();
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);

  const cooperativePrograms = [
    {
      id: 'group-loan',
      title: 'Group Loan Program',
      description: 'Borrow as part of a cooperative group for better rates and terms',
      benefits: [
        'Lower interest rates (8-12% APR)',
        'Longer repayment periods (up to 24 months)',
        'Group guarantee reduces individual risk',
        'Capacity building training included'
      ],
      requirements: [
        'Active cooperative membership',
        'Group of 5-20 farmers',
        'Minimum 6 months cooperative membership',
        'Group leader designated'
      ],
      maxAmount: 10000,
      interestRate: '8-12%',
      term: '12-24 months',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      id: 'cooperative-revolving',
      title: 'Cooperative Revolving Fund',
      description: 'Access revolving credit funds managed by your cooperative',
      benefits: [
        'Quick approval through cooperative',
        'Flexible usage for farming inputs',
        'Lower processing fees',
        'Community-based decision making'
      ],
      requirements: [
        'Established cooperative with fund',
        'Good standing member',
        'Regular contribution history',
        'Cooperative board approval'
      ],
      maxAmount: 5000,
      interestRate: '6-10%',
      term: '6-18 months',
      icon: Building2,
      color: 'bg-green-500'
    },
    {
      id: 'peer-lending',
      title: 'Peer-to-Peer Cooperative Lending',
      description: 'Borrow from fellow cooperative members with platform facilitation',
      benefits: [
        'Community-driven lending',
        'Potentially lower rates',
        'Builds local financial ecosystem',
        'Transparent platform tracking'
      ],
      requirements: [
        'Active cooperative member',
        'Established lending history',
        'Peer lender availability',
        'Platform registration'
      ],
      maxAmount: 3000,
      interestRate: '5-15%',
      term: '3-12 months',
      icon: HeartHandshake,
      color: 'bg-purple-500'
    }
  ];

  const handleApply = (programId: string) => {
    setSelectedProgram(programId);
    // In a real app, this would navigate to application form
    console.log(`Applying for ${programId}`);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#4CAF50] to-[#00C853] text-white py-12">
        <div className="container">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-black mb-2">
                Cooperative Lending
              </h1>
              <p className="text-xl opacity-90">
                Access better loan terms through your farming cooperative
              </p>
            </div>
            <div className="hidden md:block">
              <Badge className="bg-white/20 text-white border-white/30 text-lg px-4 py-2">
                <Award className="w-5 h-5 mr-2" />
                Community Power
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Introduction */}
        <div className="mb-12">
          <Card className="bg-[#1E1E1E] border-[#424242]">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="flex items-center mb-4">
                    <Users className="w-8 h-8 text-[#00C853] mr-3" />
                    <h2 className="text-2xl font-bold">Strength in Numbers</h2>
                  </div>
                  <p className="text-[#BDBDBD] mb-6">
                    Cooperative lending leverages the collective strength of farming communities to provide
                    better loan terms, lower interest rates, and more flexible repayment options. When farmers
                    come together, everyone benefits from improved access to credit.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#00C853]">25%</div>
                      <div className="text-sm text-[#BDBDBD]">Lower Interest Rates</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#00C853]">50%</div>
                      <div className="text-sm text-[#BDBDBD]">Higher Approval Rates</div>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-[#00C853]/20 to-[#4CAF50]/20 rounded-xl p-6">
                  <Shield className="w-16 h-16 text-[#00C853] mb-4" />
                  <h3 className="text-xl font-semibold mb-3">Why Choose Cooperative Lending?</h3>
                  <ul className="space-y-2 text-sm text-[#BDBDBD]">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-[#00C853] mr-2 flex-shrink-0" />
                      Collective risk sharing reduces individual burden
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-[#00C853] mr-2 flex-shrink-0" />
                      Community oversight ensures responsible lending
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-[#00C853] mr-2 flex-shrink-0" />
                      Better terms through group negotiation power
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-[#00C853] mr-2 flex-shrink-0" />
                      Capacity building and training included
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cooperative Programs */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Available Programs</h2>
            <p className="text-[#BDBDBD] max-w-2xl mx-auto">
              Choose the cooperative lending program that best fits your farming cooperative's needs and structure.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {cooperativePrograms.map((program) => {
              const IconComponent = program.icon;
              return (
                <Card key={program.id} className="bg-[#1E1E1E] border-[#424242] hover:border-[#00C853] transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 ${program.color} rounded-xl flex items-center justify-center`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <Badge className="bg-[#00C853]/20 text-[#00C853] border-[#00C853]/30">
                        Up to ${program.maxAmount.toLocaleString()}
                      </Badge>
                    </div>
                    <CardTitle className="text-white text-xl">{program.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[#BDBDBD] mb-6">{program.description}</p>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-white mb-2">Benefits</h4>
                        <ul className="space-y-1">
                          {program.benefits.map((benefit, index) => (
                            <li key={index} className="flex items-start text-sm text-[#BDBDBD]">
                              <CheckCircle className="w-4 h-4 text-[#00C853] mr-2 mt-0.5 flex-shrink-0" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-white mb-2">Requirements</h4>
                        <ul className="space-y-1">
                          {program.requirements.map((req, index) => (
                            <li key={index} className="flex items-start text-sm text-[#BDBDBD]">
                              <Info className="w-4 h-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-[#242424] rounded-lg p-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-lg font-bold text-[#00C853]">{program.interestRate}</div>
                            <div className="text-xs text-[#BDBDBD]">Interest Rate</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-[#00C853]">{program.term}</div>
                            <div className="text-xs text-[#BDBDBD]">Term</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-[#00C853]">${program.maxAmount.toLocaleString()}</div>
                            <div className="text-xs text-[#BDBDBD]">Max Amount</div>
                          </div>
                        </div>
                      </div>

                      <Button
                        className="w-full bg-gradient-to-r from-[#4CAF50] to-[#00C853] hover:from-[#4CAF50]/90 hover:to-[#00C853]/90"
                        onClick={() => handleApply(program.id)}
                      >
                        Apply for {program.title}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-12">
          <Card className="bg-[#1E1E1E] border-[#424242]">
            <CardHeader>
              <CardTitle className="text-white text-2xl text-center">How Cooperative Lending Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#00C853]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-[#00C853]" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">1. Join or Form Group</h3>
                  <p className="text-sm text-[#BDBDBD]">Connect with your farming cooperative or form a lending group</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#00C853]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-[#00C853]" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">2. Group Assessment</h3>
                  <p className="text-sm text-[#BDBDBD]">Cooperative evaluates group creditworthiness and capacity</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#00C853]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-8 h-8 text-[#00C853]" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">3. Access Credit</h3>
                  <p className="text-sm text-[#BDBDBD]">Receive loans with better terms through group guarantee</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#00C853]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-[#00C853]" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">4. Build Capacity</h3>
                  <p className="text-sm text-[#BDBDBD]">Strengthen cooperative through successful lending cycles</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Success Stories */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Success Stories</h2>
            <p className="text-[#BDBDBD]">See how cooperative lending has transformed farming communities</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-[#1E1E1E] border-[#424242]">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#00C853]/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Star className="w-6 h-6 text-[#00C853]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2">Kenya Maize Cooperative</h3>
                    <p className="text-[#BDBDBD] mb-3">
                      "Through group lending, our 50-member cooperative secured $50,000 at 10% APR.
                      This enabled us to buy quality seeds and fertilizers, increasing our yields by 40%
                      and creating jobs for 20 additional farm workers."
                    </p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-[#00C853]">+40% yield increase</span>
                      <span className="text-[#00C853]">20 new jobs created</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1E1E1E] border-[#424242]">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#00C853]/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6 text-[#00C853]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2">Nigeria Rice Farmers Union</h3>
                    <p className="text-[#BDBDBD] mb-3">
                      "The revolving fund program allowed us to access credit quickly for irrigation equipment.
                      Our repayment rate is 98%, and we've expanded from 30 to 75 members in just 2 years."
                    </p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-[#00C853]">98% repayment rate</span>
                      <span className="text-[#00C853]">75 active members</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-[#4CAF50]/20 to-[#00C853]/20 border-[#00C853]/30">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-white mb-4">Ready to Access Cooperative Credit?</h2>
              <p className="text-[#BDBDBD] mb-6 max-w-2xl mx-auto">
                Join the growing number of farmers who are leveraging cooperative power to access better
                credit terms and build stronger farming communities.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-gradient-to-r from-[#4CAF50] to-[#00C853] hover:from-[#4CAF50]/90 hover:to-[#00C853]/90">
                  Apply for Cooperative Loan
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="outline" className="border-[#424242] hover:border-[#00C853] text-white">
                  Find Local Cooperatives
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}