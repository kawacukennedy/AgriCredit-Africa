'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useGetLoansQuery } from '@/store/apiSlice';
import Link from 'next/link';
import { DollarSign, Calendar, TrendingUp, AlertCircle, CheckCircle, Clock, Plus, Eye, CreditCard } from 'lucide-react';

export function LoanList() {
  const { t } = useTranslation();
  const { data: loans, isLoading, error } = useGetLoansQuery({});

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'funded':
        return {
          color: 'bg-sky-teal/10 text-sky-teal border-sky-teal/20',
          icon: CheckCircle,
          label: 'Funded'
        };
      case 'pending':
        return {
          color: 'bg-harvest-gold/10 text-harvest-gold border-harvest-gold/20',
          icon: Clock,
          label: 'Pending'
        };
      case 'repaid':
        return {
          color: 'bg-green-500/10 text-green-600 border-green-500/20',
          icon: CheckCircle,
          label: 'Repaid'
        };
      case 'defaulted':
        return {
          color: 'bg-red-500/10 text-red-500 border-red-500/20',
          icon: AlertCircle,
          label: 'Defaulted'
        };
      default:
        return {
          color: 'bg-slate-gray/10 text-slate-gray border-slate-gray/20',
          icon: Clock,
          label: status || 'Unknown'
        };
    }
  };

  // Mock data for demonstration
  const mockLoans = [
    {
      id: '1',
      amount: 2500,
      status: 'funded',
      interestRate: 8.5,
      termDays: 180,
      fundedDate: '2024-01-15',
      nextPayment: '2024-02-15',
      progress: 35
    },
    {
      id: '2',
      amount: 1500,
      status: 'pending',
      interestRate: 9.2,
      termDays: 120,
      appliedDate: '2024-01-10',
      progress: 0
    }
  ];

  const displayLoans = loans?.length > 0 ? loans.slice(0, 3) : mockLoans;

  if (isLoading) {
    return (
      <Card className="shadow-level2 border-0">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-slate-gray">
            <CreditCard className="w-5 h-5 mr-2 text-agri-green" />
            Active Loans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
             {[1, 2].map((i) => (
               <div key={i} className="p-6 border border-slate-gray/10 rounded-xl">
                 <div className="loading-skeleton space-y-3">
                   <div className="h-4 bg-slate-gray/10 rounded w-3/4"></div>
                   <div className="h-3 bg-slate-gray/10 rounded w-1/2"></div>
                  <div className="h-3 bg-slate-gray/10 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-level2 border-0">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-slate-gray">
            <CreditCard className="w-5 h-5 mr-2 text-agri-green" />
            Active Loans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-gray mb-2">Unable to Load Loans</h3>
            <p className="text-slate-gray/70 text-sm mb-4">
              We couldn't load your loan information. Please try again.
            </p>
            <Button variant="outline" size="sm">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-level2 border-0">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-slate-gray">
          <CreditCard className="w-5 h-5 mr-2 text-agri-green" />
          Active Loans
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {displayLoans && displayLoans.length > 0 ? (
            displayLoans.map((loan: any) => {
              const statusConfig = getStatusConfig(loan.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div key={loan.id} className="p-6 border border-slate-gray/10 rounded-xl hover:shadow-level1 transition-all duration-200 group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-agri-green to-sky-teal rounded-lg flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-gray group-hover:text-agri-green transition-colors">
                          ${loan.amount || loan.principal_cents / 100 || 0}
                        </h3>
                        <p className="text-sm text-slate-gray/60">
                          {loan.interestRate || 8.5}% APR • {loan.termDays || 180} days
                        </p>
                      </div>
                    </div>
                    <Badge className={`${statusConfig.color} flex items-center space-x-1`}>
                      <StatusIcon className="w-3 h-3" />
                      <span>{statusConfig.label}</span>
                    </Badge>
                  </div>

                  {/* Progress bar for active loans */}
                  {loan.status === 'funded' && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-gray">Repayment Progress</span>
                        <span className="text-sm text-slate-gray/60">{loan.progress || 35}%</span>
                      </div>
                      <div className="w-full bg-slate-gray/10 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-agri-green to-sky-teal h-2 rounded-full transition-all duration-300"
                          style={{ width: `${loan.progress || 35}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Loan details */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-slate-gray/40" />
                      <div>
                        <p className="text-xs text-slate-gray/60">Next Payment</p>
                        <p className="text-sm font-medium text-slate-gray">
                          {loan.nextPayment || loan.fundedDate || 'TBD'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-slate-gray/40" />
                      <div>
                        <p className="text-xs text-slate-gray/60">Status</p>
                        <p className="text-sm font-medium text-slate-gray capitalize">
                          {loan.status || 'Active'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Link href={`/loan/${loan.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full border-slate-gray/20 hover:border-agri-green hover:text-agri-green">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                    {loan.status === 'funded' && (
                      <Button size="sm" className="btn-primary">
                        Make Payment
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-gray/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-slate-gray/40" />
              </div>
              <h3 className="text-lg font-semibold text-slate-gray mb-2">No Active Loans</h3>
              <p className="text-slate-gray/70 text-sm mb-6 max-w-sm mx-auto">
                You don't have any active loans yet. Apply for your first loan to get started with agricultural financing.
              </p>
              <Link href="/apply">
                <Button className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Apply for Loan
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="pt-6 border-t border-slate-gray/10">
          <div className="grid grid-cols-2 gap-3">
            <Link href="/apply">
              <Button variant="outline" className="w-full border-slate-gray/20 hover:border-agri-green hover:text-agri-green">
                <Plus className="w-4 h-4 mr-2" />
                New Loan
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button variant="outline" className="w-full border-slate-gray/20 hover:border-harvest-gold hover:text-harvest-gold">
                <TrendingUp className="w-4 h-4 mr-2" />
                Browse Loans
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}