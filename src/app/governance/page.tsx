'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/hooks/useWallet';
import { contractInteractions } from '@/lib/contractInteractions';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';
import {
  createGovernanceProposal,
  voteOnProposal,
  getGovernanceProposal,
  getGovernanceStats,
  getVotingPower,
  executeProposal,
  GovernanceProposal,
  GovernanceStats,
  connectWebSocket,
  onWebSocketMessage,
  disconnectWebSocket
} from '@/lib/api';
import { Vote, Users, FileText, Clock, CheckCircle, XCircle, Plus, TrendingUp, Shield } from 'lucide-react';

interface Proposal extends GovernanceProposal {}

export default function GovernancePage() {
  const { address, isConnected } = useWallet();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateProposal, setShowCreateProposal] = useState(false);
  const [newProposalDesc, setNewProposalDesc] = useState('');
  const [votingOn, setVotingOn] = useState<number | null>(null);
  const [governanceStats, setGovernanceStats] = useState<GovernanceStats>({
    total_proposals: 0,
    active_proposals: 0,
    total_votes: '0',
    user_voting_power: '0'
  });

  useEffect(() => {
    if (isConnected) {
      loadProposals();
      loadGovernanceStats();

      // Connect to WebSocket for real-time updates
      if (address) {
        connectWebSocket(1, 'governance'); // Using dummy user ID for now

        // Listen for governance updates
        onWebSocketMessage('governance_update', (data: any) => {
          console.log('Received governance update:', data);
          // Refresh data when updates are received
          loadProposals();
          loadGovernanceStats();
        });
      }
    }

    return () => {
      disconnectWebSocket();
    };
  }, [isConnected, address]);

  const loadProposals = async () => {
    setIsLoading(true);
    try {
      const proposals = await getGovernanceProposals();
      setProposals(proposals);
    } catch (error) {
      console.error('Failed to load proposals:', error);
      // Fallback to mock data if API fails
      const mockProposals: Proposal[] = [
        {
          id: 1,
          proposer: '0x1234...5678',
          description: 'Increase microloan limits to $10,000 for verified farmers',
          for_votes: '125000',
          against_votes: '25000',
          start_time: Date.now() - 86400000, // 1 day ago
          end_time: Date.now() + 86400000 * 6, // 6 days from now
          executed: false,
          status: 'active',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          proposer: '0x9876...1234',
          description: 'Fund IoT sensor deployment in rural areas',
          for_votes: '98000',
          against_votes: '52000',
          start_time: Date.now() - 86400000 * 3,
          end_time: Date.now() - 86400000, // Ended 1 day ago
          executed: true,
          status: 'executed',
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          proposer: '0xabcd...efgh',
          description: 'Add support for additional local currencies',
          for_votes: '45000',
          against_votes: '78000',
          start_time: Date.now() - 86400000 * 5,
          end_time: Date.now() - 86400000 * 2,
          executed: false,
          status: 'failed',
          created_at: new Date().toISOString()
        }
      ];
      setProposals(mockProposals);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGovernanceStats = async () => {
    try {
      const stats = await getGovernanceStats();
      setGovernanceStats(stats);

      // Also get user voting power if connected
      if (address) {
        const votingPower = await getVotingPower(address);
        setGovernanceStats(prev => ({
          ...prev,
          user_voting_power: votingPower.voting_power
        }));
      }
    } catch (error) {
      console.error('Failed to load governance stats:', error);
      // Fallback to mock data
      setGovernanceStats({
        total_proposals: 15,
        active_proposals: 3,
        total_votes: '1250000',
        user_voting_power: '25000'
      });
    }
  };

  const handleCreateProposal = async () => {
    if (!newProposalDesc.trim()) return;

    setIsLoading(true);
    try {
      const result = await createGovernanceProposal(newProposalDesc);
      if (result.success) {
        alert('Proposal created successfully!');
        setShowCreateProposal(false);
        setNewProposalDesc('');
        loadProposals();
        loadGovernanceStats();
      } else {
        alert(result.error || 'Failed to create proposal. Please try again.');
      }
    } catch (error) {
      console.error('Failed to create proposal:', error);
      alert('Failed to create proposal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (proposalId: number, support: boolean) => {
    setVotingOn(proposalId);
    try {
      const result = await voteOnProposal(proposalId, support);
      if (result.success) {
        alert(`Vote ${support ? 'for' : 'against'} proposal #${proposalId} recorded!`);
        loadProposals();
        loadGovernanceStats();
      } else {
        alert(result.error || 'Failed to record vote. Please try again.');
      }
    } catch (error) {
      console.error('Failed to vote:', error);
      alert('Failed to record vote. Please try again.');
    } finally {
      setVotingOn(null);
    }
  };

  const handleExecuteProposal = async (proposalId: number) => {
    setIsLoading(true);
    try {
      const result = await executeProposal(proposalId);
      if (result.success) {
        alert('Proposal executed successfully!');
        loadProposals();
        loadGovernanceStats();
      } else {
        alert(result.error || 'Failed to execute proposal. Please try again.');
      }
    } catch (error) {
      console.error('Failed to execute proposal:', error);
      alert('Failed to execute proposal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getProposalStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'passed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'executed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTimeRemaining = (endTime: number) => {
    const now = Date.now();
    const remaining = endTime - now;

    if (remaining <= 0) return 'Ended';

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Connect Your Wallet
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Please connect your wallet to participate in governance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">DAO Governance</h1>
            <button
              onClick={() => setShowCreateProposal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Proposal
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Governance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Total Proposals</h3>
            </div>
             <div className="text-3xl font-bold text-blue-600">{governanceStats.total_proposals}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Active Proposals</h3>
            </div>
             <div className="text-3xl font-bold text-orange-600">{governanceStats.active_proposals}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <Vote className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Total Votes</h3>
            </div>
             <div className="text-3xl font-bold text-purple-600">{(parseInt(governanceStats.total_votes) / 1000).toFixed(0)}K</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Your Voting Power</h3>
            </div>
             <div className="text-3xl font-bold text-green-600">{(parseInt(governanceStats.user_voting_power) / 1000).toFixed(0)}K</div>
          </motion.div>
        </div>

        {/* Proposals List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Proposals</h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {proposals.map((proposal, index) => (
              <motion.div
                key={proposal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-semibold text-gray-800 dark:text-white">
                        Proposal #{proposal.id}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProposalStatusColor(proposal.status)}`}>
                        {proposal.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-3">{proposal.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>By: {proposal.proposer}</span>
                       <span>Time remaining: {getTimeRemaining(proposal.end_time)}</span>
                    </div>
                  </div>
                </div>

                {/* Voting Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                     <span>For: {parseInt(proposal.for_votes).toLocaleString()}</span>
                     <span>Against: {parseInt(proposal.against_votes).toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                       style={{
                         width: `${(parseInt(proposal.for_votes) / (parseInt(proposal.for_votes) + parseInt(proposal.against_votes))) * 100}%`
                       }}
                    ></div>
                  </div>
                </div>

                {/* Voting Actions */}
                {proposal.status === 'active' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleVote(proposal.id, true)}
                      disabled={votingOn === proposal.id}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {votingOn === proposal.id ? 'Voting...' : 'Vote For'}
                    </button>
                    <button
                      onClick={() => handleVote(proposal.id, false)}
                      disabled={votingOn === proposal.id}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      {votingOn === proposal.id ? 'Voting...' : 'Vote Against'}
                    </button>
                  </div>
                )}

                {/* Execute Action */}
                {proposal.status === 'passed' && !proposal.executed && (
                  <button
                    onClick={() => handleExecuteProposal(proposal.id)}
                    disabled={isLoading}
                    className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Executing...' : 'Execute Proposal'}
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Create Proposal Modal */}
        {showCreateProposal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg"
            >
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Create New Proposal</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Proposal Description
                  </label>
                  <textarea
                    value={newProposalDesc}
                    onChange={(e) => setNewProposalDesc(e.target.value)}
                    placeholder="Describe your proposal..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white h-32 resize-none"
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Requirements:</h3>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Minimum 1,000 AGC tokens to propose</li>
                    <li>• 7-day voting period</li>
                    <li>• &gt;50% approval needed to pass</li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowCreateProposal(false);
                      setNewProposalDesc('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateProposal}
                    disabled={isLoading || !newProposalDesc.trim()}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Creating...' : 'Create Proposal'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}