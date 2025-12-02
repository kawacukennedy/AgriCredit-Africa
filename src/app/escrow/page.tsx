'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import {
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  Truck,
  Package,
  DollarSign,
  User,
  Calendar,
  MapPin,
  FileText,
  MessageSquare,
  Eye,
  RefreshCw
} from 'lucide-react';

interface Escrow {
  id: string;
  buyer: string;
  seller: string;
  amount: number;
  token: string;
  status: 'Created' | 'Funded' | 'Shipped' | 'Delivered' | 'Completed' | 'Disputed' | 'Cancelled';
  createdAt: number;
  shippedAt?: number;
  deliveredAt?: number;
  deliveryProof?: string;
  geoLocation?: string;
  qualityScore?: number;
  disputeDeadline?: number;
  listingId?: string;
  cropType?: string;
}

export default function EscrowDashboard() {
  const { address, isConnected } = useWallet();
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedEscrow, setSelectedEscrow] = useState<Escrow | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      loadEscrows();
    }
  }, [isConnected, address]);

  const loadEscrows = async () => {
    setLoading(true);
    try {
      // Mock data - in production, fetch from API
      const mockEscrows: Escrow[] = [
        {
          id: '1',
          buyer: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          seller: '0x8ba1f109551bD432803012645ac136ddd64DBA72',
          amount: 5000,
          token: 'USDC',
          status: 'Funded',
          createdAt: Date.now() - 86400000 * 2,
          listingId: 'LIST-001',
          cropType: 'Corn Harvest'
        },
        {
          id: '2',
          buyer: address || '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          seller: '0x9c2d45Dd7735C1234567890abcdef123456789',
          amount: 7500,
          token: 'USDC',
          status: 'Shipped',
          createdAt: Date.now() - 86400000 * 5,
          shippedAt: Date.now() - 86400000 * 1,
          geoLocation: '40.7128,-74.0060',
          listingId: 'LIST-002',
          cropType: 'Wheat Field'
        },
        {
          id: '3',
          buyer: '0xabcdef1234567890abcdef1234567890abcdef',
          seller: address || '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          amount: 3000,
          token: 'USDC',
          status: 'Delivered',
          createdAt: Date.now() - 86400000 * 7,
          shippedAt: Date.now() - 86400000 * 3,
          deliveredAt: Date.now() - 86400000 * 1,
          deliveryProof: 'ipfs://Qm...',
          qualityScore: 95,
          disputeDeadline: Date.now() + 86400000 * 6,
          listingId: 'LIST-003',
          cropType: 'Rice Paddy'
        },
        {
          id: '4',
          buyer: address || '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          seller: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          amount: 2000,
          token: 'USDC',
          status: 'Disputed',
          createdAt: Date.now() - 86400000 * 10,
          shippedAt: Date.now() - 86400000 * 6,
          deliveredAt: Date.now() - 86400000 * 4,
          deliveryProof: 'ipfs://Qm...',
          qualityScore: 75,
          listingId: 'LIST-004',
          cropType: 'Soybean Crop'
        }
      ];

      setEscrows(mockEscrows);
    } catch (error) {
      console.error('Failed to load escrows:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Created': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'Funded': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Shipped': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Delivered': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Disputed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Created': return <Clock className="w-4 h-4" />;
      case 'Funded': return <DollarSign className="w-4 h-4" />;
      case 'Shipped': return <Truck className="w-4 h-4" />;
      case 'Delivered': return <Package className="w-4 h-4" />;
      case 'Completed': return <CheckCircle className="w-4 h-4" />;
      case 'Disputed': return <AlertTriangle className="w-4 h-4" />;
      case 'Cancelled': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredEscrows = escrows.filter(escrow => {
    if (activeTab === 'all') return true;
    if (activeTab === 'buyer') return escrow.buyer.toLowerCase() === address?.toLowerCase();
    if (activeTab === 'seller') return escrow.seller.toLowerCase() === address?.toLowerCase();
    if (activeTab === 'active') return ['Created', 'Funded', 'Shipped', 'Delivered'].includes(escrow.status);
    if (activeTab === 'completed') return escrow.status === 'Completed';
    if (activeTab === 'disputed') return escrow.status === 'Disputed';
    return true;
  });

  const getActionButtons = (escrow: Escrow) => {
    const isBuyer = escrow.buyer.toLowerCase() === address?.toLowerCase();
    const isSeller = escrow.seller.toLowerCase() === address?.toLowerCase();

    switch (escrow.status) {
      case 'Created':
        if (isBuyer) return <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">Fund Escrow</button>;
        return null;
      case 'Funded':
        if (isSeller) return <button className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700">Confirm Shipment</button>;
        return null;
      case 'Shipped':
        if (isBuyer) return <button className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700">Confirm Delivery</button>;
        return null;
      case 'Delivered':
        if (isSeller && escrow.disputeDeadline && Date.now() > escrow.disputeDeadline) {
          return <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">Complete Escrow</button>;
        }
        if ((isBuyer || isSeller) && escrow.disputeDeadline && Date.now() <= escrow.disputeDeadline) {
          return <button className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">Raise Dispute</button>;
        }
        return null;
      case 'Disputed':
        return <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded">Under Review</span>;
      case 'Completed':
        return <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded">Completed</span>;
      case 'Cancelled':
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded">Cancelled</span>;
      default:
        return null;
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Escrow Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Connect your wallet to view your escrow transactions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Escrow Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Manage your secure agricultural trade transactions
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Escrows</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{escrows.length}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Escrows</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {escrows.filter(e => ['Created', 'Funded', 'Shipped', 'Delivered'].includes(e.status)).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {escrows.filter(e => e.status === 'Completed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Value</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${escrows.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          {[
            { id: 'all', label: 'All Escrows', count: escrows.length },
            { id: 'buyer', label: 'As Buyer', count: escrows.filter(e => e.buyer.toLowerCase() === address?.toLowerCase()).length },
            { id: 'seller', label: 'As Seller', count: escrows.filter(e => e.seller.toLowerCase() === address?.toLowerCase()).length },
            { id: 'active', label: 'Active', count: escrows.filter(e => ['Created', 'Funded', 'Shipped', 'Delivered'].includes(e.status)).length },
            { id: 'completed', label: 'Completed', count: escrows.filter(e => e.status === 'Completed').length },
            { id: 'disputed', label: 'Disputed', count: escrows.filter(e => e.status === 'Disputed').length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-green-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                activeTab === tab.id
                  ? 'bg-white bg-opacity-20'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Escrows List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Escrow ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredEscrows.map((escrow) => (
                    <tr key={escrow.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Shield className="w-5 h-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              #{escrow.id}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {escrow.cropType}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            escrow.buyer.toLowerCase() === address?.toLowerCase()
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {escrow.buyer.toLowerCase() === address?.toLowerCase() ? 'Buyer' : 'Seller'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          ${escrow.amount.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {escrow.token}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(escrow.status)}`}>
                          {getStatusIcon(escrow.status)}
                          <span className="ml-1">{escrow.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(escrow.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedEscrow(escrow);
                              setShowDetailsModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {getActionButtons(escrow)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedEscrow && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Escrow #{selectedEscrow.id}
                  </h2>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Status and Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Transaction Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                          <span className="font-medium">${selectedEscrow.amount.toLocaleString()} {selectedEscrow.token}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Status:</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedEscrow.status)}`}>
                            {selectedEscrow.status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Created:</span>
                          <span className="font-medium">{new Date(selectedEscrow.createdAt).toLocaleDateString()}</span>
                        </div>
                        {selectedEscrow.shippedAt && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Shipped:</span>
                            <span className="font-medium">{new Date(selectedEscrow.shippedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                        {selectedEscrow.deliveredAt && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Delivered:</span>
                            <span className="font-medium">{new Date(selectedEscrow.deliveredAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Parties</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Buyer:</span>
                          <span className="font-medium font-mono">
                            {selectedEscrow.buyer.slice(0, 6)}...{selectedEscrow.buyer.slice(-4)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Seller:</span>
                          <span className="font-medium font-mono">
                            {selectedEscrow.seller.slice(0, 6)}...{selectedEscrow.seller.slice(-4)}
                          </span>
                        </div>
                        {selectedEscrow.listingId && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Listing:</span>
                            <span className="font-medium">{selectedEscrow.listingId}</span>
                          </div>
                        )}
                        {selectedEscrow.cropType && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Crop Type:</span>
                            <span className="font-medium">{selectedEscrow.cropType}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quality and Location Info */}
                  {(selectedEscrow.qualityScore || selectedEscrow.geoLocation) && (
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Quality & Location</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedEscrow.qualityScore && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-sm">
                              Quality Score: <span className="font-medium">{selectedEscrow.qualityScore}/100</span>
                            </span>
                          </div>
                        )}
                        {selectedEscrow.geoLocation && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-blue-600" />
                            <span className="text-sm">
                              Location: <span className="font-medium">{selectedEscrow.geoLocation}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Delivery Proof */}
                  {selectedEscrow.deliveryProof && (
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Delivery Proof</h3>
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <a
                          href={selectedEscrow.deliveryProof}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                        >
                          View Delivery Proof
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Dispute Info */}
                  {selectedEscrow.status === 'Disputed' && (
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          <span className="font-medium text-red-800 dark:text-red-200">Dispute in Progress</span>
                        </div>
                        <p className="text-sm text-red-700 dark:text-red-300">
                          This escrow is currently under dispute resolution. Please wait for the outcome.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-4 flex gap-3">
                    {getActionButtons(selectedEscrow)}
                    <button
                      onClick={() => setShowDetailsModal(false)}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}