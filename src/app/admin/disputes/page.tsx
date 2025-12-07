'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
  AlertTriangle,
  Eye,
  CheckCircle,
  Clock,
  FileText,
  Users,
  DollarSign,
  Calendar,
  MessageSquare,
  Shield,
  Search
} from 'lucide-react';

export default function AdminDisputesPage() {
  return (
    <AuthGuard>
      <AdminDisputesContent />
    </AuthGuard>
  );
}

function AdminDisputesContent() {
  const { t } = useTranslation();

  const handleDisputeResolution = (disputeId: string) => {
    // Implement dispute resolution logic
    console.log('Resolving dispute for dispute:', disputeId);
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'high': return 'bg-harvest-gold/10 text-harvest-gold border-harvest-gold/20';
      case 'medium': return 'bg-harvest-gold/10 text-harvest-gold border-harvest-gold/20';
      case 'low': return 'bg-slate-gray/10 text-slate-gray border-slate-gray/20';
      default: return 'bg-slate-gray/10 text-slate-gray border-slate-gray/20';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-harvest-gold/10 text-harvest-gold border-harvest-gold/20';
      case 'investigating': return 'bg-sky-teal/10 text-sky-teal border-sky-teal/20';
      case 'evidence_review': return 'bg-agri-green/10 text-agri-green border-agri-green/20';
      case 'resolved': return 'bg-sky-teal/10 text-sky-teal border-sky-teal/20';
      case 'escalated': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-slate-gray/10 text-slate-gray border-slate-gray/20';
    }
  };

  return (
    <div className="min-h-screen bg-paper-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-agri-green to-sky-teal text-white py-8">
        <div className="container">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-black mb-2">
                Dispute Resolution Center
              </h1>
              <p className="text-xl opacity-90">
                Manage and resolve loan disputes, payment issues, and contract conflicts
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              <Link href="/admin">
                <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                  ← Back to Dashboard
                </Button>
              </Link>
              <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                <FileText className="w-4 h-4 mr-2" />
                Dispute Guidelines
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-8">
        {/* Dispute Filters */}
        <Card className="shadow-level1 border-0 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-gray/40 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search disputes..."
                    className="pl-10 pr-4 py-2 border border-slate-gray/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-agri-green/20"
                  />
                </div>
                <select className="px-3 py-2 border border-slate-gray/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-agri-green/20">
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select className="px-3 py-2 border border-slate-gray/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-agri-green/20">
                  <option value="all">All Types</option>
                  <option value="payment">Payment</option>
                  <option value="verification">Verification</option>
                  <option value="contract">Contract</option>
                  <option value="oracle">Oracle</option>
                  <option value="other">Other</option>
                </select>
                <select className="px-3 py-2 border border-slate-gray/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-agri-green/20">
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="investigating">Investigating</option>
                  <option value="evidence_review">Evidence Review</option>
                  <option value="resolved">Resolved</option>
                  <option value="escalated">Escalated</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-gray/60">
                  12 active disputes
                </span>
                <Button className="btn-primary">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  New Dispute
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disputes List */}
        <Card className="shadow-level2 border-0">
          <CardHeader>
            <CardTitle className="flex items-center text-slate-gray">
              <AlertTriangle className="w-5 h-5 mr-2 text-harvest-gold" />
              Active Disputes ({12})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                {
                  id: 'DSP-2024-001',
                  type: 'payment',
                  title: 'Loan Repayment Dispute',
                  description: 'Farmer claims payment was made but not recorded in system. Bank statement provided as evidence.',
                  priority: 'urgent',
                  status: 'investigating',
                  submitted: '2 hours ago',
                  amount: 250,
                  parties: ['John Doe (Farmer)', 'AgriCredit System'],
                  evidence: ['Bank Statement', 'Transaction Receipt'],
                  assignedTo: 'Admin Team'
                },
                {
                  id: 'DSP-2024-002',
                  type: 'verification',
                  title: 'Carbon Credit Verification Dispute',
                  description: 'Discrepancy in satellite data verification for carbon sequestration. Farmer disputes NDVI readings.',
                  priority: 'high',
                  status: 'evidence_review',
                  submitted: '1 day ago',
                  amount: null,
                  parties: ['Sarah Johnson (Farmer)', 'Oracle Service'],
                  evidence: ['Satellite Images', 'Field Photos', 'Expert Report'],
                  assignedTo: 'Technical Team'
                },
                {
                  id: 'DSP-2024-003',
                  type: 'contract',
                  title: 'Loan Terms Dispute',
                  description: 'Borrower disputes interest rate calculation. Claims misunderstanding of APR terms.',
                  priority: 'medium',
                  status: 'pending',
                  submitted: '3 days ago',
                  amount: 1800,
                  parties: ['Michael Brown (Farmer)', 'Lending Protocol'],
                  evidence: ['Loan Agreement', 'Email Correspondence'],
                  assignedTo: 'Legal Team'
                },
                {
                  id: 'DSP-2024-004',
                  type: 'oracle',
                  title: 'Weather Data Oracle Dispute',
                  description: 'Farmer disputes weather data used for parametric insurance payout. Claims local conditions were different.',
                  priority: 'medium',
                  status: 'investigating',
                  submitted: '5 days ago',
                  amount: 500,
                  parties: ['David Wilson (Farmer)', 'Weather Oracle'],
                  evidence: ['Local Weather Station Data', 'Insurance Policy'],
                  assignedTo: 'Oracle Team'
                },
                {
                  id: 'DSP-2024-005',
                  type: 'verification',
                  title: 'Farm Size Verification Dispute',
                  description: 'Discrepancy between farmer-reported farm size and satellite measurement.',
                  priority: 'low',
                  status: 'evidence_review',
                  submitted: '1 week ago',
                  amount: null,
                  parties: ['Emma Davis (Farmer)', 'Verification Service'],
                  evidence: ['Land Deed', 'GPS Coordinates', 'Aerial Photos'],
                  assignedTo: 'Verification Team'
                }
              ].map((dispute) => (
                <div key={dispute.id} className="p-6 border border-slate-gray/10 rounded-xl hover:shadow-level1 transition-all duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-gray">
                          {dispute.title} #{dispute.id}
                        </h3>
                        <Badge className={getPriorityBadgeColor(dispute.priority)}>
                          {dispute.priority}
                        </Badge>
                        <Badge className={getStatusBadgeColor(dispute.status)}>
                          {dispute.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-slate-gray/70 mb-3">{dispute.description}</p>
                      <div className="flex items-center space-x-6 text-sm text-slate-gray/60 mb-3">
                        <span>Submitted: {dispute.submitted}</span>
                        {dispute.amount && <span>Amount: ${dispute.amount}</span>}
                        <span>Assigned: {dispute.assignedTo}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="text-slate-gray/60">Parties: </span>
                          <span className="text-slate-gray">{dispute.parties.join(', ')}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-slate-gray/60">Evidence: </span>
                          <span className="text-slate-gray">{dispute.evidence.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-gray/20 hover:border-agri-green hover:text-agri-green"
                      onClick={() => handleDisputeResolution(dispute.id)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Review Evidence
                    </Button>
                    <Button size="sm" variant="outline" className="border-slate-gray/20 hover:border-sky-teal hover:text-sky-teal">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contact Parties
                    </Button>
                    <Button size="sm" className="btn-primary">
                      Resolve Dispute
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dispute Statistics */}
        <div className="grid md:grid-cols-4 gap-4 mt-6">
          <Card className="shadow-level1 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-gray mb-1">12</p>
                  <p className="text-sm text-slate-gray/60">Active Disputes</p>
                </div>
                <div className="w-12 h-12 bg-harvest-gold/10 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-harvest-gold" />
                </div>
              </div>
              <div className="flex items-center mt-3">
                <Badge className="bg-harvest-gold/10 text-harvest-gold border-harvest-gold/20 text-xs">
                  +2 this week
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-level1 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-gray mb-1">3</p>
                  <p className="text-sm text-slate-gray/60">Urgent Cases</p>
                </div>
                <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
              </div>
              <div className="flex items-center mt-3">
                <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-xs">
                  Requires attention
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-level1 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-gray mb-1">94.2%</p>
                  <p className="text-sm text-slate-gray/60">Resolution Rate</p>
                </div>
                <div className="w-12 h-12 bg-sky-teal/10 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-sky-teal" />
                </div>
              </div>
              <div className="flex items-center mt-3">
                <Badge className="bg-sky-teal/10 text-sky-teal border-sky-teal/20 text-xs">
                  Above target
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-level1 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-gray mb-1">2.3 days</p>
                  <p className="text-sm text-slate-gray/60">Avg Resolution Time</p>
                </div>
                <div className="w-12 h-12 bg-agri-green/10 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-agri-green" />
                </div>
              </div>
              <div className="flex items-center mt-3">
                <Badge className="bg-agri-green/10 text-agri-green border-agri-green/20 text-xs">
                  On track
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}