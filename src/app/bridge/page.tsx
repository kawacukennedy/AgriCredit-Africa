'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowRightLeft, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { api } from '@/lib/api';

interface Chain {
  name: string;
  chain_id: number;
  active: boolean;
  required_confirmations: number;
  total_transferred: string;
}

interface BridgeTransaction {
  transfer_id: number;
  status: string;
  from_chain: string;
  to_chain: string;
  amount: number;
  recipient: string;
  tx_hash: string;
  timestamp: number;
  confirmations: number;
  required_confirmations: number;
}

interface BridgeFee {
  base_fee: number;
  percentage_fee: number;
  total_fee: number;
  estimated_time: string;
}

export default function BridgePage() {
  const { address, isConnected } = useWallet();
  const [chains, setChains] = useState<Chain[]>([]);
  const [transactions, setTransactions] = useState<BridgeTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [transferring, setTransferring] = useState(false);

  // Form state
  const [fromChain, setFromChain] = useState('');
  const [toChain, setToChain] = useState('');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [fees, setFees] = useState<BridgeFee | null>(null);

  // Load supported chains
  useEffect(() => {
    loadChains();
    loadTransactions();
  }, []);

  const loadChains = async () => {
    try {
      const response = await api.get('/blockchain/bridge/chains');
      setChains(response.data);
    } catch (error) {
      console.error('Failed to load chains:', error);
    }
  };

  const loadTransactions = async () => {
    if (!address) return;

    try {
      const response = await api.get('/blockchain/bridge/history', {
        params: { limit: 10 }
      });
      setTransactions(response.data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const calculateFees = async () => {
    if (!fromChain || !toChain || !amount) return;

    try {
      const response = await api.get('/blockchain/bridge/fees', {
        params: { from_chain: fromChain, to_chain: toChain }
      });
      setFees(response.data);
    } catch (error) {
      console.error('Failed to calculate fees:', error);
    }
  };

  useEffect(() => {
    calculateFees();
  }, [fromChain, toChain, amount]);

  const handleTransfer = async () => {
    if (!isConnected || !fromChain || !toChain || !amount || !recipient) return;

    setTransferring(true);
    try {
      const response = await api.post('/blockchain/bridge/transfer', {
        from_chain: fromChain,
        to_chain: toChain,
        token_address: '0x0000000000000000000000000000000000000000', // AgriCredit token
        amount: parseFloat(amount),
        recipient: recipient
      });

      // Reload transactions
      loadTransactions();

      // Reset form
      setAmount('');
      setRecipient('');
      setFees(null);

      alert('Bridge transfer initiated successfully!');
    } catch (error) {
      console.error('Transfer failed:', error);
      alert('Transfer failed. Please try again.');
    } finally {
      setTransferring(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Please connect your wallet to use the cross-chain bridge.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Cross-Chain Bridge</h1>
        <p className="text-gray-600">
          Transfer tokens seamlessly across different blockchain networks
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bridge Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Initiate Transfer
            </CardTitle>
            <CardDescription>
              Bridge your tokens to another blockchain network
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="from-chain">From Chain</Label>
                <Select value={fromChain} onValueChange={setFromChain}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source chain" />
                  </SelectTrigger>
                  <SelectContent>
                    {chains.filter(chain => chain.active).map((chain) => (
                      <SelectItem key={chain.name} value={chain.name}>
                        {chain.name.charAt(0).toUpperCase() + chain.name.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="to-chain">To Chain</Label>
                <Select value={toChain} onValueChange={setToChain}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination chain" />
                  </SelectTrigger>
                  <SelectContent>
                    {chains.filter(chain => chain.active && chain.name !== fromChain).map((chain) => (
                      <SelectItem key={chain.name} value={chain.name}>
                        {chain.name.charAt(0).toUpperCase() + chain.name.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="recipient">Recipient Address</Label>
              <Input
                id="recipient"
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>

            {fees && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Transfer Details</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Base Fee:</span>
                    <span>{fees.base_fee} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Percentage Fee:</span>
                    <span>{fees.percentage_fee} ETH</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total Fee:</span>
                    <span>{fees.total_fee} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Time:</span>
                    <span>{fees.estimated_time}</span>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleTransfer}
              disabled={transferring || !fromChain || !toChain || !amount || !recipient}
              className="w-full"
            >
              {transferring ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initiating Transfer...
                </>
              ) : (
                'Initiate Bridge Transfer'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transfers</CardTitle>
            <CardDescription>
              Your recent cross-chain bridge transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No bridge transactions found
              </p>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div key={tx.transfer_id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(tx.status)}
                        <span className="font-semibold">
                          {tx.from_chain} → {tx.to_chain}
                        </span>
                      </div>
                      <Badge className={getStatusColor(tx.status)}>
                        {tx.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Amount:</span> {tx.amount} tokens
                      </div>
                      <div>
                        <span className="font-medium">Confirmations:</span> {tx.confirmations}/{tx.required_confirmations}
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Recipient:</span> {tx.recipient}
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Tx Hash:</span>{' '}
                        <code className="text-xs bg-gray-100 px-1 rounded">
                          {tx.tx_hash.slice(0, 10)}...{tx.tx_hash.slice(-8)}
                        </code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Supported Chains */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Supported Chains</CardTitle>
          <CardDescription>
            Networks available for cross-chain bridging
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {chains.filter(chain => chain.active).map((chain) => (
              <div key={chain.name} className="border rounded-lg p-4">
                <h3 className="font-semibold capitalize mb-2">{chain.name}</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Chain ID: {chain.chain_id}</div>
                  <div>Confirmations: {chain.required_confirmations}</div>
                  <div>Total Transferred: {parseFloat(chain.total_transferred).toLocaleString()} tokens</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}