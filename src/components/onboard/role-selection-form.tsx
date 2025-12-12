'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import {
  Tractor,
  TrendingUp,
  Users,
  Leaf,
  DollarSign,
  BarChart3,
  Shield,
  Zap,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

interface RoleSelectionFormProps {
  onNext: (data: any) => void;
  initialData: any;
}

export default function RoleSelectionForm({ onNext, initialData }: RoleSelectionFormProps) {
  const { t } = useTranslation();
  const [selectedRole, setSelectedRole] = useState(initialData?.role || '');

  const roles = [
    {
      id: 'farmer',
      title: 'Farmer',
      subtitle: 'Grow crops, access microloans, earn carbon credits',
      description: 'Join thousands of African farmers accessing AI-powered microcredit, carbon trading, and sustainable farming tools.',
      icon: Tractor,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50',
      features: [
        'AI-powered credit scoring',
        'Instant microloans up to $5,000',
        'Carbon credit generation',
        'Market access & price discovery',
        'Weather risk protection',
        'Community farming pools'
      ],
      stats: {
        users: '125,000+',
        loans: '$25M+',
        credits: '500,000+'
      }
    },
    {
      id: 'investor',
      title: 'Investor',
      subtitle: 'Fund sustainable agriculture, earn returns',
      description: 'Invest in verified African farmers and earn competitive returns while supporting sustainable agriculture.',
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'from-blue-50 to-cyan-50',
      features: [
        'Diversified loan portfolios',
        'Carbon credit co-ownership',
        'Real-time farm monitoring',
        'Blockchain-backed security',
        'Competitive returns (12-18% APR)',
        'Impact investing focus'
      ],
      stats: {
        users: '8,500+',
        invested: '$50M+',
        returns: '15.2%'
      }
    }
  ];

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
  };

  const handleContinue = () => {
    if (selectedRole) {
      onNext({ role: selectedRole });
    }
  };

  return (
    <div className="space-y-8">
      {/* Role Selection Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-slate-gray">
          Choose Your Role
        </h2>
        <p className="text-lg text-slate-gray/70 max-w-2xl mx-auto">
          Select how you'd like to participate in the AgriCredit ecosystem.
          Each role offers unique opportunities and benefits.
        </p>
      </div>

      {/* Role Cards */}
      <div className="grid md:grid-cols-2 gap-8">
        {roles.map((role) => {
          const RoleIcon = role.icon;
          const isSelected = selectedRole === role.id;

          return (
            <Card
              key={role.id}
              className={`relative cursor-pointer transition-all duration-300 hover:shadow-xl border-2 ${
                isSelected
                  ? 'border-agri-green shadow-lg shadow-agri-green/20 bg-gradient-to-br from-agri-green/5 to-sky-teal/5'
                  : 'border-slate-gray/20 hover:border-agri-green/30'
              }`}
              onClick={() => handleRoleSelect(role.id)}
            >
              {isSelected && (
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-agri-green rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              )}

              <CardHeader className="pb-4">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${role.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <RoleIcon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-slate-gray mb-2">
                  {role.title}
                </CardTitle>
                <p className="text-agri-green font-medium text-lg">
                  {role.subtitle}
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                <p className="text-slate-gray/70 leading-relaxed">
                  {role.description}
                </p>

                {/* Key Features */}
                <div>
                  <h4 className="font-semibold text-slate-gray mb-3 flex items-center">
                    <Zap className="w-4 h-4 mr-2 text-agri-green" />
                    Key Features
                  </h4>
                  <ul className="space-y-2">
                    {role.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-slate-gray/70">
                        <CheckCircle className="w-4 h-4 text-agri-green mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-gray/10">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-agri-green">{role.stats.users}</div>
                    <div className="text-xs text-slate-gray/60">
                      {role.id === 'farmer' ? 'Farmers' : 'Investors'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-agri-green">
                      {role.id === 'farmer' ? role.stats.loans : role.stats.invested}
                    </div>
                    <div className="text-xs text-slate-gray/60">
                      {role.id === 'farmer' ? 'Loans Funded' : 'Invested'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-agri-green">
                      {role.id === 'farmer' ? role.stats.credits : role.stats.returns}
                    </div>
                    <div className="text-xs text-slate-gray/60">
                      {role.id === 'farmer' ? 'Carbon Credits' : 'Avg Returns'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Continue Button */}
      <div className="flex justify-center pt-8">
        <Button
          onClick={handleContinue}
          disabled={!selectedRole}
          className="px-12 py-4 text-lg font-semibold bg-gradient-to-r from-agri-green to-sky-teal hover:from-agri-green/90 hover:to-sky-teal/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue as {selectedRole === 'farmer' ? 'Farmer' : 'Investor'}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>

      {/* Help Text */}
      <div className="text-center text-slate-gray/60">
        <p className="text-sm">
          Not sure which role is right for you?{' '}
          <button className="text-agri-green hover:underline font-medium">
            Learn more about each role
          </button>
        </p>
      </div>
    </div>
  );
}