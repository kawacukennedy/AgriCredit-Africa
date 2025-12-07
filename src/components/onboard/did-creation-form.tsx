'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { useWallet } from '@/hooks/useWallet';
import { useCreateDIDMutation } from '@/lib/api';
import { Loader2, Shield, Key } from 'lucide-react';

interface DIDCreationFormProps {
  onNext: (data: any) => void;
  initialData?: any;
}

export function DIDCreationForm({ onNext, initialData }: DIDCreationFormProps) {
  const { t } = useTranslation();
  const { address, isConnected } = useWallet();
  const [createDID, { isLoading: isCreating }] = useCreateDIDMutation();
  const [did, setDid] = useState(initialData?.did || '');
  const [privateKey, setPrivateKey] = useState('');

  const handleCreateDID = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      const result = await createDID({
        wallet_address: address,
        public_key: '0x' + Math.random().toString(16).substring(2, 66), // Mock public key
      }).unwrap();

      setDid(result.did);

      // Generate a mock private key display (in reality, this would be handled securely)
      const mockPrivateKey = '0x' + Math.random().toString(16).substring(2, 66);
      setPrivateKey(mockPrivateKey);

      onNext({
        did: result.did,
        walletAddress: address,
        createdAt: new Date().toISOString(),
        didDocument: result.did_document,
        blockchainTx: result.blockchain_tx
      });

    } catch (error) {
      console.error('Failed to create DID:', error);
      alert('Failed to create DID. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="mx-auto h-12 w-12 text-agri-green mb-4" />
        <h3 className="text-lg font-semibold mb-2">Create Your Decentralized Identity</h3>
        <p className="text-muted-foreground">
          Your DID (Decentralized Identifier) is your unique identity on the AgriCredit platform.
          It enables secure, private access to all platform features.
        </p>
      </div>

      {!isConnected && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <Key className="mx-auto h-8 w-8 text-orange-600 mb-2" />
              <p className="text-orange-800 font-medium">Wallet Connection Required</p>
              <p className="text-orange-700 text-sm mt-1">
                Please connect your Web3 wallet to create your DID
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {isConnected && !did && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="wallet-address">Connected Wallet</Label>
            <Input
              id="wallet-address"
              value={address}
              disabled
              className="bg-muted"
            />
          </div>

          <Button
            onClick={handleCreateDID}
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating DID...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Create DID
              </>
            )}
          </Button>
        </div>
      )}

      {did && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              DID Created Successfully
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-green-700">Your DID</Label>
                <div className="bg-white p-3 rounded border font-mono text-sm break-all">
                  {did}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
                <p className="text-yellow-800 text-sm">
                  <strong>Security Notice:</strong> Store your private key securely.
                  Never share it with anyone. The platform will handle authentication automatically.
                </p>
              </div>

              <Button onClick={() => onNext({ did, walletAddress: address })} className="w-full">
                Continue to AI KYC
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}