'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/hooks/useWallet';
import { contractInteractions } from '@/lib/contractInteractions';
import { Plus, Leaf, MapPin, Calendar, TrendingUp, Award, ShoppingCart, Users, DollarSign, BarChart3 } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('portfolio');
  const [showMintForm, setShowMintForm] = useState(false);
  const [showLeaseForm, setShowLeaseForm] = useState(false);
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<FarmNFT | null>(null);
  const [mintForm, setMintForm] = useState({
    farmName: '',
    location: '',
    size: '',
    cropType: '',
    expectedYield: '',
    metadataURI: ''
  });
  const [leaseForm, setLeaseForm] = useState({
    duration: '',
    price: '',
    lessee: ''
  });
  const [tradeForm, setTradeForm] = useState({
    price: '',
    buyer: ''
  });
  const [marketplaceNFTs, setMarketplaceNFTs] = useState<FarmNFT[]>([]);
  const [leasedNFTs, setLeasedNFTs] = useState<FarmNFT[]>([]);

  useEffect(() => {
    if (isConnected && address) {
      loadUserNFTs();
      loadMarketplaceNFTs();
      loadLeasedNFTs();
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

  const handleLeaseNFT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNFT) return;

    setIsLoading(true);
    try {
      await contractInteractions.leaseFarmNFT(
        selectedNFT.id,
        parseInt(leaseForm.duration),
        parseInt(leaseForm.price),
        leaseForm.lessee
      );
      alert('NFT leased successfully!');
      setShowLeaseForm(false);
      setLeaseForm({ duration: '', price: '', lessee: '' });
      setSelectedNFT(null);
      loadUserNFTs();
    } catch (error) {
      console.error('Failed to lease NFT:', error);
      alert('Failed to lease NFT. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTradeNFT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNFT) return;

    setIsLoading(true);
    try {
      await contractInteractions.tradeFarmNFT(
        selectedNFT.id,
        parseInt(tradeForm.price),
        tradeForm.buyer
      );
      alert('NFT trade initiated successfully!');
      setShowTradeForm(false);
      setTradeForm({ price: '', buyer: '' });
      setSelectedNFT(null);
      loadUserNFTs();
    } catch (error) {
      console.error('Failed to trade NFT:', error);
      alert('Failed to trade NFT. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMarketplaceNFTs = async () => {
    try {
      // Mock marketplace data for now
      const mockMarketplace: FarmNFT[] = [
        {
          id: 101,
          farmer: '0xabcd...1234',
          farmName: 'Green Valley Farm',
          location: 'Nairobi, Kenya',
          size: 50,
          cropType: 'maize',
          expectedYield: 25,
          plantingDate: Date.now() - 86400000 * 30,
          harvestDate: Date.now() + 86400000 * 60,
          metadataURI: 'ipfs://marketplace-nft-101',
          isActive: true
        },
        {
          id: 102,
          farmer: '0xefgh...5678',
          farmName: 'Sunset Acres',
          location: 'Kampala, Uganda',
          size: 75,
          cropType: 'rice',
          expectedYield: 40,
          plantingDate: Date.now() - 86400000 * 45,
          harvestDate: Date.now() + 86400000 * 45,
          metadataURI: 'ipfs://marketplace-nft-102',
          isActive: true
        }
      ];
      setMarketplaceNFTs(mockMarketplace);
    } catch (error) {
      console.error('Failed to load marketplace NFTs:', error);
    }
  };

  const loadLeasedNFTs = async () => {
    try {
      // Mock leased NFTs data
      const mockLeased: FarmNFT[] = [
        {
          id: 201,
          farmer: address || '',
          farmName: 'My Leased Farm',
          location: 'Dar es Salaam, Tanzania',
          size: 30,
          cropType: 'cassava',
          expectedYield: 15,
          plantingDate: Date.now() - 86400000 * 20,
          harvestDate: Date.now() + 86400000 * 70,
          metadataURI: 'ipfs://leased-nft-201',
          isActive: true
        }
      ];
      setLeasedNFTs(mockLeased);
    } catch (error) {
      console.error('Failed to load leased NFTs:', error);
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
        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex">
              {[
                { id: 'portfolio', label: 'My Portfolio', icon: Award },
                { id: 'marketplace', label: 'Marketplace', icon: ShoppingCart },
                { id: 'leasing', label: 'Leasing', icon: Users },
                { id: 'analytics', label: 'Analytics', icon: BarChart3 }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'portfolio' && (
          <>
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
                      <button
                        onClick={() => {
                          setSelectedNFT(nft);
                          setShowLeaseForm(true);
                        }}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Lease
                      </button>
                      <button
                        onClick={() => {
                          setSelectedNFT(nft);
                          setShowTradeForm(true);
                        }}
                        className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                      >
                        Trade
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
          </>
        )}

        {activeTab === 'marketplace' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Marketplace Header */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">NFT Marketplace</h2>
                <div className="flex gap-2">
                  <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm">
                    <option>All Crops</option>
                    <option>Maize</option>
                    <option>Rice</option>
                    <option>Cassava</option>
                  </select>
                  <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm">
                    <option>All Locations</option>
                    <option>Kenya</option>
                    <option>Uganda</option>
                    <option>Tanzania</option>
                  </select>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Discover and purchase tokenized farm assets from verified farmers across Africa.
              </p>
            </div>

            {/* Marketplace Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {marketplaceNFTs.map((nft, index) => (
                <motion.div
                  key={nft.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
                >
                  <div className="p-6">
                    <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-lg mb-4 flex items-center justify-center">
                      <div className="text-center">
                        <ShoppingCart className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                        <p className="text-blue-800 dark:text-blue-200 font-semibold">Market NFT #{nft.id}</p>
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
                        <DollarSign className="w-4 h-4" />
                        <span className="text-green-600 font-medium">$2,500 AGC</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors text-sm">
                        Buy Now
                      </button>
                      <button className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">
                        View Details
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'leasing' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Leasing Header */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Farm Leasing</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Lease your tokenized farm assets or rent farms from other farmers to expand your agricultural operations.
              </p>
            </div>

            {/* Leased Farms */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">My Leased Farms</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {leasedNFTs.map((nft, index) => (
                  <motion.div
                    key={nft.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-800 dark:text-white">Leased Farm #{nft.id}</span>
                    </div>
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-2">{nft.farmName}</h4>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <div>Location: {nft.location}</div>
                      <div>Crop: {nft.cropType} • Size: {nft.size} acres</div>
                      <div>Lease expires: {new Date(nft.harvestDate * 1000).toLocaleDateString()}</div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors text-sm">
                        Manage Lease
                      </button>
                      <button className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">
                        View Contract
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Available for Lease */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Available for Lease</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nfts.filter(nft => nft.isActive).map((nft, index) => (
                  <motion.div
                    key={nft.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-2">{nft.farmName}</h4>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <div>{nft.location}</div>
                      <div>{nft.cropType} • {nft.size} acres</div>
                      <div>Expected yield: {nft.expectedYield} tons</div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedNFT(nft);
                        setShowLeaseForm(true);
                      }}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Lease Farm
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Analytics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Total Value</h3>
                </div>
                <div className="text-3xl font-bold text-green-600">$12,500</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Portfolio value</p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">ROI</h3>
                </div>
                <div className="text-3xl font-bold text-blue-600">+24.5%</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Annual return</p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Active Leases</h3>
                </div>
                <div className="text-3xl font-bold text-purple-600">{leasedNFTs.length}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Leased farms</p>
              </div>
            </div>

            {/* Performance Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Portfolio Performance</h3>
              <div className="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                  <p>Performance chart would be displayed here</p>
                </div>
              </div>
            </div>
          </motion.div>
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

        {/* Lease Form Modal */}
        {showLeaseForm && selectedNFT && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
            >
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Lease Farm NFT</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Leasing <strong>{selectedNFT.farmName}</strong> ({selectedNFT.size} acres, {selectedNFT.cropType})
              </p>

              <form onSubmit={handleLeaseNFT} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Lease Duration (months)
                  </label>
                  <input
                    type="number"
                    value={leaseForm.duration}
                    onChange={(e) => setLeaseForm(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    placeholder="12"
                    min="1"
                    max="24"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Monthly Price (AGC tokens)
                  </label>
                  <input
                    type="number"
                    value={leaseForm.price}
                    onChange={(e) => setLeaseForm(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    placeholder="500"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Lessee Address
                  </label>
                  <input
                    type="text"
                    value={leaseForm.lessee}
                    onChange={(e) => setLeaseForm(prev => ({ ...prev, lessee: e.target.value }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    placeholder="0x..."
                    required
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Lease Summary</h4>
                  <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <div>Total duration: {leaseForm.duration || 0} months</div>
                    <div>Monthly payment: {leaseForm.price || 0} AGC</div>
                    <div>Total revenue: {(parseInt(leaseForm.duration || '0') * parseInt(leaseForm.price || '0'))} AGC</div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLeaseForm(false);
                      setSelectedNFT(null);
                      setLeaseForm({ duration: '', price: '', lessee: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Creating Lease...' : 'Create Lease'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Trade Form Modal */}
        {showTradeForm && selectedNFT && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
            >
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Trade Farm NFT</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Selling <strong>{selectedNFT.farmName}</strong> ({selectedNFT.size} acres, {selectedNFT.cropType})
              </p>

              <form onSubmit={handleTradeNFT} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sale Price (AGC tokens)
                  </label>
                  <input
                    type="number"
                    value={tradeForm.price}
                    onChange={(e) => setTradeForm(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    placeholder="2500"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Buyer Address
                  </label>
                  <input
                    type="text"
                    value={tradeForm.buyer}
                    onChange={(e) => setTradeForm(prev => ({ ...prev, buyer: e.target.value }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    placeholder="0x..."
                    required
                  />
                </div>

                <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">Trade Summary</h4>
                  <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <div>Farm NFT: #{selectedNFT.id}</div>
                    <div>Sale price: {tradeForm.price || 0} AGC tokens</div>
                    <div>Expected yield: {selectedNFT.expectedYield} tons</div>
                    <div>Farm size: {selectedNFT.size} acres</div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTradeForm(false);
                      setSelectedNFT(null);
                      setTradeForm({ price: '', buyer: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Initiating Trade...' : 'Initiate Trade'}
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