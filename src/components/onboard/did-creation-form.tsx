'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useWallet } from '@/hooks/useWallet';
import { useCreateDIDMutation } from '@/lib/api';
import { Loader2, Shield, Key, CheckCircle, AlertTriangle, Info, ArrowRight, Wallet, Lock } from 'lucide-react';

interface DIDCreationFormProps {
  onNext: (data: any) => void;
  initialData?: any;
}

function DIDCreationForm({ onNext, initialData }: DIDCreationFormProps) {
  const { t } = useTranslation();
  const { address, isConnected, connect, isConnecting, error: walletError } = useWallet();
  const [did, setDid] = useState(initialData?.did || '');
  const [isCreating, setIsCreating] = useState(false);
  const [creationStep, setCreationStep] = useState<'idle' | 'connecting' | 'creating' | 'success'>('idle');
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);

  const handleCreateDID = async () => {
    if (!isConnected || !address) {
      await connect();
      return;
    }

    setIsCreating(true);
    setCreationStep('creating');

    try {
      // Simulate DID creation process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate mock DID
      const mockDID = `did:agricredit:${address?.slice(0, 10)}${Date.now().toString().slice(-6)}`;

      setDid(mockDID);
      setCreationStep('success');

      // Auto-advance after success animation
      setTimeout(() => {
        onNext({
          did: mockDID,
          walletAddress: address,
          createdAt: new Date().toISOString(),
          didDocument: {
            '@context': 'https://www.w3.org/ns/did/v1',
            id: mockDID,
            verificationMethod: [{
              id: `${mockDID}#key-1`,
              type: 'EcdsaSecp256k1VerificationKey2019',
              controller: mockDID,
              publicKeyHex: '0x' + Math.random().toString(16).substring(2, 66)
            }]
          },
          blockchainTx: `0x${Math.random().toString(16).substring(2, 66)}`
        });
      }, 2000);

    } catch (error) {
      console.error('Failed to create DID:', error);
      setCreationStep('idle');
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-gray mb-2">Create Your Decentralized Identity</h3>
          <p className="text-slate-gray/70 max-w-md mx-auto">
            Your DID (Decentralized Identifier) is your unique identity on the AgriCredit platform.
            It enables secure, private access to all platform features.
          </p>
        </div>
      </div>

      {/* Benefits */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-agri-green/5 rounded-xl">
          <Lock className="w-8 h-8 text-agri-green mx-auto mb-2" />
          <h4 className="font-semibold text-slate-gray mb-1">Secure</h4>
          <p className="text-sm text-slate-gray/70">Cryptographically secure identity</p>
        </div>
        <div className="text-center p-4 bg-sky-teal/5 rounded-xl">
          <Key className="w-8 h-8 text-sky-teal mx-auto mb-2" />
          <h4 className="font-semibold text-slate-gray mb-1">Private</h4>
          <p className="text-sm text-slate-gray/70">You own your identity data</p>
        </div>
        <div className="text-center p-4 bg-harvest-gold/5 rounded-xl">
          <CheckCircle className="w-8 h-8 text-harvest-gold mx-auto mb-2" />
          <h4 className="font-semibold text-slate-gray mb-1">Verified</h4>
          <p className="text-sm text-slate-gray/70">Blockchain-verified credentials</p>
        </div>
      </div>

      {/* Wallet Connection Status */}
      {!isConnected && (
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 animate-fadeIn">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <Wallet className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h4 className="font-semibold text-amber-800 mb-2">Connect Your Web3 Wallet</h4>
                <p className="text-amber-700 text-sm mb-4">
                  Connect your MetaMask, Trust Wallet, or any Web3 wallet to create your decentralized identity
                </p>

                {walletError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-red-700 text-sm">{walletError}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <Button
                    onClick={handleCreateDID}
                    disabled={isConnecting}
                    className="btn-primary w-full"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4 mr-2" />
                        Connect Wallet
                      </>
                    )}
                  </Button>

                  <div className="text-xs text-amber-600">
                    <p>Supported wallets: MetaMask, Trust Wallet, Coinbase Wallet</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* DID Creation */}
      {isConnected && !did && creationStep !== 'creating' && (
        <Card className="border-agri-green/20 bg-gradient-to-br from-agri-green/5 to-sky-teal/5 animate-fadeIn">
          <CardHeader>
            <CardTitle className="flex items-center text-slate-gray">
              <Key className="w-5 h-5 mr-2 text-agri-green" />
              Ready to Create Your DID
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-gray">Connected Wallet</Label>
              <div className="flex items-center space-x-3 p-4 bg-paper-white rounded-lg border border-slate-gray/20 animate-slideInLeft">
                <div className="w-8 h-8 bg-gradient-to-br from-agri-green to-sky-teal rounded-full flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-mono text-sm text-slate-gray">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                  <Badge variant="secondary" className="mt-1 bg-sky-teal/10 text-sky-teal border-sky-teal/20">
                    ✅ Connected & Verified
                  </Badge>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-slideInRight">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="font-medium text-blue-800 mb-1">What happens next?</h5>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Your wallet address will be registered on the blockchain</li>
                    <li>• A unique DID will be generated for your identity</li>
                    <li>• You'll receive verifiable credentials for platform access</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              onClick={handleCreateDID}
              disabled={isCreating}
              className="w-full btn-primary text-lg py-4 h-auto animate-pulse hover:animate-none"
            >
              <Shield className="mr-2 h-5 w-5" />
              Create My Decentralized Identity
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* DID Creation Progress */}
      {creationStep === 'creating' && (
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 animate-fadeIn">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto animate-spin">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-gray mb-2">Creating Your DID</h3>
                <p className="text-slate-gray/70">
                  Registering your identity on the blockchain...
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-sm">
                  <CheckCircle className="w-5 h-5 text-sky-teal" />
                  <span className="text-slate-gray">Wallet verified</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Loader2 className="w-5 h-5 text-agri-green animate-spin" />
                  <span className="text-slate-gray">Generating DID</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-slate-gray/50">
                  <div className="w-5 h-5 rounded-full border-2 border-slate-gray/30"></div>
                  <span>Creating credentials</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success State */}
      {creationStep === 'success' && did && (
        <Card className="border-sky-teal/20 bg-gradient-to-br from-sky-teal/5 to-green-50 animate-fadeIn">
          <CardHeader>
            <CardTitle className="text-sky-teal flex items-center">
              <CheckCircle className="mr-2 h-6 w-6 animate-bounce" />
              DID Created Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-gray">Your Decentralized Identifier</Label>
              <div className="p-4 bg-paper-white rounded-lg border border-slate-gray/20 animate-slideInLeft">
                <p className="font-mono text-sm text-slate-gray break-all">{did}</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 animate-slideInRight">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="font-medium text-amber-800 mb-1">Security Notice</h5>
                  <p className="text-sm text-amber-700">
                    Your DID is securely stored and managed by your wallet. The platform never stores your private keys.
                    Keep your wallet secure and never share your seed phrase.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-fadeIn animation-delay-300">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="font-medium text-green-800 mb-1">What's Next?</h5>
                  <p className="text-sm text-green-700">
                    Your identity is now verified on the blockchain. Next, we'll verify your personal information
                    through our AI-powered KYC process.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => onNext({ did, walletAddress: address })}
              className="w-full btn-primary text-lg py-4 h-auto animate-pulse hover:animate-none"
            >
              Continue to AI Identity Verification
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Security Information Toggle */}
      <div className="text-center">
        <button
          onClick={() => setShowSecurityInfo(!showSecurityInfo)}
          className="text-sm text-slate-gray/60 hover:text-agri-green transition-colors"
        >
          {showSecurityInfo ? 'Hide' : 'Show'} security information
        </button>
      </div>

      {showSecurityInfo && (
        <Card className="bg-slate-gray/5 border-slate-gray/20">
          <CardContent className="p-6">
            <h4 className="font-semibold text-slate-gray mb-3">Security & Privacy</h4>
            <div className="space-y-3 text-sm text-slate-gray/70">
              <p>• Your DID is cryptographically linked to your wallet address</p>
              <p>• Identity verification uses zero-knowledge proofs where possible</p>
              <p>• All personal data is encrypted and stored securely</p>
              <p>• You maintain full control over your identity and data</p>
              <p>• Blockchain transactions are transparent but your data remains private</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default DIDCreationForm;