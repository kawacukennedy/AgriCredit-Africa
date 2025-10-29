'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/hooks/useWallet';
import { contractInteractions } from '@/lib/contractInteractions';
import { Plus, Leaf, MapPin, Calendar, TrendingUp, Award } from 'lucide-react';

interface FarmNFT {
  id: number;
  farmer: string;
  farmName: string;
  location: string;
  size: number;
  cropType: string;
  expectedYield: number;
  plantingDate: number;
  harvestDate: number;
  metadataURI: string;
  isActive: boolean;
}

export default function NFTFarmingPage() {
  const { address, isConnected } = useWallet();
  const [nfts, setNfts] = useState<FarmNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showMintForm, setShowMintForm] = useState(false);
  const [mintForm, setMintForm] = useState({
    farmName: '',
    location: '',
    size: '',
    cropType: '',
    expectedYield: '',
    metadataURI: ''
  });

  useEffect(() => {
    if (isConnected && address) {
      loadUserNFTs();
    }
  }, [isConnected, address]);

  const loadUserNFTs = async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      const nftIds = await contractInteractions.getFarmerNFTs(address);
      const nftPromises = nftIds.map(async (id: number) => {
        const nft = await contractInteractions.getFarmNFT(id);
        return {
          id: nft.id.toNumber(),
          farmer: nft.farmer,
          farmName: nft.farmName,
          location: nft.location,
          size: nft.size.toNumber(),
          cropType: nft.cropType,
          expectedYield: nft.expectedYield.toNumber(),
          plantingDate: nft.plantingDate.toNumber(),
          harvestDate: nft.harvestDate.toNumber(),
          metadataURI: nft.metadataURI,
          isActive: nft.isActive
        };
      });

      const userNfts = await Promise.all(nftPromises);
      setNfts(userNfts);
    } catch (error) {
      console.error('Failed to load NFTs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMintNFT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    setIsLoading(true);
    try {
      await contractInteractions.mintFarmNFT(
        address,
        mintForm.farmName,
        mintForm.location,
        parseInt(mintForm.size),
        mintForm.cropType,
        parseInt(mintForm.expectedYield),
        mintForm.metadataURI || 'ipfs://default-metadata'
      );

      alert('Farm NFT minted successfully!');
      setShowMintForm(false);
      setMintForm({
        farmName: '',
        location: '',
        size: '',
        cropType: '',
        expectedYield: '',
        metadataURI: ''
      });
      loadUserNFTs();
    } catch (error) {
      console.error('Failed to mint NFT:', error);
      alert('Failed to mint NFT. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordHarvest = async (tokenId: number, actualYield: number) => {
    try {
      await contractInteractions.recordHarvest(tokenId, actualYield);
      alert('Harvest recorded successfully!');
      loadUserNFTs();
    } catch (error) {
      console.error('Failed to record harvest:', error);
      alert('Failed to record harvest. Please try again.');
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Connect Your Wallet
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Please connect your wallet to access NFT farming features.
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
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">NFT Farming</h1>
            <button
              onClick={() => setShowMintForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Mint Farm NFT
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Total NFTs</h3>
            </div>
            <div className="text-3xl font-bold text-green-600">{nfts.length}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Total Acreage</h3>
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {nfts.reduce((sum, nft) => sum + nft.size, 0)} acres
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Expected Yield</h3>
            </div>
            <div className="text-3xl font-bold text-purple-600">
              {nfts.reduce((sum, nft) => sum + nft.expectedYield, 0)} tons
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Active Farms</h3>
            </div>
            <div className="text-3xl font-bold text-orange-600">
              {nfts.filter(nft => nft.isActive).length}
            </div>
          </motion.div>
        </div>

        {/* NFT Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nfts.map((nft, index) => (
            <motion.div
              key={nft.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
            >
              <div className="p-6">
                <div className="w-full h-48 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-lg mb-4 flex items-center justify-center">
                  <div className="text-center">
                    <Leaf className="w-12 h-12 text-green-600 mx-auto mb-2" />
                    <p className="text-green-800 dark:text-green-200 font-semibold">Farm NFT #{nft.id}</p>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                  {nft.farmName}
                </h3>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{nft.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Leaf className="w-4 h-4" />
                    <span>{nft.cropType} • {nft.size} acres</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Expected: {nft.expectedYield} tons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Planted: {new Date(nft.plantingDate * 1000).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleRecordHarvest(nft.id, nft.expectedYield)}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Record Harvest
                  </button>
                  <button className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">
                    View Details
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {nfts.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Leaf className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              No Farm NFTs Yet
            </h3>
            <p className="text-gray-500 dark:text-gray-500 mb-4">
              Mint your first farm NFT to tokenize your agricultural assets.
            </p>
            <button
              onClick={() => setShowMintForm(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Mint Your First NFT
            </button>
          </div>
        )}

        {/* Mint Form Modal */}
        {showMintForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
            >
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Mint Farm NFT</h2>

              <form onSubmit={handleMintNFT} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Farm Name
                  </label>
                  <input
                    type="text"
                    value={mintForm.farmName}
                    onChange={(e) => setMintForm(prev => ({ ...prev, farmName: e.target.value }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={mintForm.location}
                    onChange={(e) => setMintForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Size (acres)
                    </label>
                    <input
                      type="number"
                      value={mintForm.size}
                      onChange={(e) => setMintForm(prev => ({ ...prev, size: e.target.value }))}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Crop Type
                    </label>
                    <select
                      value={mintForm.cropType}
                      onChange={(e) => setMintForm(prev => ({ ...prev, cropType: e.target.value }))}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                      required
                    >
                      <option value="">Select crop</option>
                      <option value="maize">Maize</option>
                      <option value="rice">Rice</option>
                      <option value="cassava">Cassava</option>
                      <option value="wheat">Wheat</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expected Yield (tons)
                  </label>
                  <input
                    type="number"
                    value={mintForm.expectedYield}
                    onChange={(e) => setMintForm(prev => ({ ...prev, expectedYield: e.target.value }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowMintForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Minting...' : 'Mint NFT'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}