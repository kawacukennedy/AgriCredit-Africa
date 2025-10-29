'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ArrowLeft, MapPin, User, Calendar, Star, MessageCircle, Phone, Mail } from 'lucide-react';

// Mock data - in a real app, this would come from an API
const mockListings = {
  1: {
    id: 1,
    title: 'Premium Maize - 10 tons',
    farmer: 'John Doe',
    location: 'Nairobi, Kenya',
    price: 250,
    quantity: '10 tons',
    quality: 'Grade A',
    description: 'High-quality maize harvested from our family farm in Nairobi. Grown using sustainable farming practices with no chemical pesticides. Stored in climate-controlled facilities to maintain freshness and nutritional value.',
    harvestDate: '2024-09-15',
    images: ['/file.svg', '/file.svg', '/file.svg'],
    farmerDetails: {
      name: 'John Doe',
      experience: '15 years',
      farmSize: '50 acres',
      certifications: ['Organic Certified', 'Fair Trade'],
      rating: 4.8,
      reviews: 127,
      phone: '+254 712 345 678',
      email: 'john.doe@agricredit.africa'
    },
    aiInsights: {
      marketDemand: 'High',
      priceRecommendation: '$260-280/ton',
      competitorAnalysis: '5% above market average',
      qualityScore: 95
    }
  },
  2: {
    id: 2,
    title: 'Organic Rice - 5 tons',
    farmer: 'Sarah Kim',
    location: 'Kampala, Uganda',
    price: 400,
    quantity: '5 tons',
    quality: 'Organic',
    description: 'Premium organic rice cultivated in fertile Ugandan soil. Certified organic with full traceability from farm to table. Perfect for health-conscious buyers and premium markets.',
    harvestDate: '2024-08-20',
    images: ['/file.svg', '/file.svg'],
    farmerDetails: {
      name: 'Sarah Kim',
      experience: '12 years',
      farmSize: '30 acres',
      certifications: ['Organic Certified', 'GAP Certified'],
      rating: 4.9,
      reviews: 89,
      phone: '+256 712 345 678',
      email: 'sarah.kim@agricredit.africa'
    },
    aiInsights: {
      marketDemand: 'Very High',
      priceRecommendation: '$420-450/ton',
      competitorAnalysis: '10% above market average',
      qualityScore: 98
    }
  },
  3: {
    id: 3,
    title: 'Cassava Roots - 8 tons',
    farmer: 'Michael Okafor',
    location: 'Lagos, Nigeria',
    price: 180,
    quantity: '8 tons',
    quality: 'Fresh',
    description: 'Fresh cassava roots harvested at peak maturity. Excellent for gari production and other traditional Nigerian dishes. High starch content and perfect texture.',
    harvestDate: '2024-10-01',
    images: ['/file.svg'],
    farmerDetails: {
      name: 'Michael Okafor',
      experience: '20 years',
      farmSize: '75 acres',
      certifications: ['Quality Assured'],
      rating: 4.7,
      reviews: 203,
      phone: '+234 812 345 678',
      email: 'michael.okafor@agricredit.africa'
    },
    aiInsights: {
      marketDemand: 'Medium',
      priceRecommendation: '$185-195/ton',
      competitorAnalysis: 'Market average',
      qualityScore: 88
    }
  }
};

export default function ListingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [listing, setListing] = useState<any>(null);
  const [isContacting, setIsContacting] = useState(false);
  const [contactMethod, setContactMethod] = useState<'phone' | 'email' | null>(null);

  useEffect(() => {
    const listingId = params.id as string;
    const foundListing = mockListings[parseInt(listingId) as keyof typeof mockListings];

    if (foundListing) {
      setListing(foundListing);
    } else {
      // Listing not found, redirect to marketplace
      router.push('/marketplace');
    }
  }, [params.id, router]);

  const handleContact = async (method: 'phone' | 'email') => {
    setIsContacting(true);
    setContactMethod(method);

    // Simulate contact process
    setTimeout(() => {
      if (method === 'phone') {
        window.location.href = `tel:${listing.farmerDetails.phone}`;
      } else {
        window.location.href = `mailto:${listing.farmerDetails.email}?subject=Interest in ${listing.title}`;
      }
      setIsContacting(false);
      setContactMethod(null);
    }, 1000);
  };

  const handlePurchase = () => {
    // In a real app, this would initiate a blockchain transaction
    alert('Purchase functionality would initiate a smart contract transaction on the blockchain.');
  };

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading listing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Listing Details</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {listing.images.map((image: string, index: number) => (
                  <Image
                    key={index}
                    src={image}
                    alt={`${listing.title} - Image ${index + 1}`}
                    width={400}
                    height={300}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ))}
              </div>
            </motion.div>

            {/* Product Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
            >
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{listing.title}</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">${listing.price}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">per ton</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{listing.quantity}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">available</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{listing.quality}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">quality</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{listing.aiInsights.qualityScore}%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">AI score</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>{listing.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>Harvested: {new Date(listing.harvestDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <User className="w-4 h-4" />
                  <span>Farmer: {listing.farmer}</span>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Description</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{listing.description}</p>
              </div>
            </motion.div>

            {/* AI Insights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
            >
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">AI Market Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200">Market Demand</h4>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{listing.aiInsights.marketDemand}</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                  <h4 className="font-medium text-green-800 dark:text-green-200">Price Recommendation</h4>
                  <p className="text-lg font-bold text-green-600 mt-1">{listing.aiInsights.priceRecommendation}</p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900 rounded-lg">
                  <h4 className="font-medium text-purple-800 dark:text-purple-200">Competitor Analysis</h4>
                  <p className="text-sm text-purple-600 dark:text-purple-300 mt-1">{listing.aiInsights.competitorAnalysis}</p>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-900 rounded-lg">
                  <h4 className="font-medium text-orange-800 dark:text-orange-200">Quality Score</h4>
                  <p className="text-2xl font-bold text-orange-600 mt-1">{listing.aiInsights.qualityScore}/100</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Purchase Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Purchase Options</h3>
              <div className="space-y-3">
                <button
                  onClick={handlePurchase}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Purchase Now
                </button>
                <button className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Add to Watchlist
                </button>
                <button className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Request Sample
                </button>
              </div>
            </motion.div>

            {/* Farmer Profile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Farmer Profile</h3>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {listing.farmerDetails.name.split(' ').map((n: string) => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white">{listing.farmerDetails.name}</h4>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {listing.farmerDetails.rating} ({listing.farmerDetails.reviews} reviews)
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Experience:</span>
                  <span className="text-gray-800 dark:text-white">{listing.farmerDetails.experience}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Farm Size:</span>
                  <span className="text-gray-800 dark:text-white">{listing.farmerDetails.farmSize}</span>
                </div>
              </div>

              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Certifications:</h5>
                <div className="flex flex-wrap gap-1">
                  {listing.farmerDetails.certifications.map((cert: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full"
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => handleContact('phone')}
                  disabled={isContacting}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Phone className="w-4 h-4" />
                  {isContacting && contactMethod === 'phone' ? 'Calling...' : 'Call Farmer'}
                </button>
                <button
                  onClick={() => handleContact('email')}
                  disabled={isContacting}
                  className="w-full flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <Mail className="w-4 h-4" />
                  {isContacting && contactMethod === 'email' ? 'Opening...' : 'Send Message'}
                </button>
              </div>
            </motion.div>

            {/* Reviews */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Reviews</h3>
              <div className="space-y-3">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-yellow-500 fill-current" />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">2 days ago</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    "Excellent quality maize. Exactly as described. Will definitely buy again."
                  </p>
                </div>
                <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[...Array(4)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-yellow-500 fill-current" />
                      ))}
                      <Star className="w-3 h-3 text-gray-300" />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">1 week ago</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    "Good quality, timely delivery. Price was fair for the market."
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}