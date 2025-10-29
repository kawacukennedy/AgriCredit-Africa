'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const listings = [
  {
    id: 1,
    title: 'Premium Maize - 10 tons',
    farmer: 'John Doe',
    location: 'Nairobi, Kenya',
    price: 250,
    quantity: '10 tons',
    quality: 'Grade A',
    cropType: 'maize',
    image: '/file.svg'
  },
  {
    id: 2,
    title: 'Organic Rice - 5 tons',
    farmer: 'Sarah Kim',
    location: 'Kampala, Uganda',
    price: 400,
    quantity: '5 tons',
    quality: 'Organic',
    cropType: 'rice',
    image: '/file.svg'
  },
  {
    id: 3,
    title: 'Cassava Roots - 8 tons',
    farmer: 'Michael Okafor',
    location: 'Lagos, Nigeria',
    price: 180,
    quantity: '8 tons',
    quality: 'Fresh',
    cropType: 'cassava',
    image: '/file.svg'
  }
];

export default function Marketplace() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  const handleListProduce = () => {
    router.push('/marketplace/list');
  };

  const handleViewDetails = (listingId: number) => {
    router.push(`/marketplace/${listingId}`);
  };

  const filteredListings = listings.filter((listing) => {
    const matchesSearch = !searchTerm ||
      listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.farmer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCrop = !selectedCrop || listing.cropType === selectedCrop;
    const matchesLocation = !selectedLocation ||
      listing.location.toLowerCase().includes(selectedLocation.toLowerCase());

    return matchesSearch && matchesCrop && matchesLocation;
  });

  const handleSearch = () => {
    // The filtering is handled by the filteredListings computed value
    console.log('Filtered results:', filteredListings.length, 'listings');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Marketplace</h1>
            <button
              onClick={handleListProduce}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              List Produce
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search produce..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            />
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              <option value="">All Crops</option>
              <option value="maize">Maize</option>
              <option value="rice">Rice</option>
              <option value="cassava">Cassava</option>
            </select>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              <option value="">All Locations</option>
              <option value="kenya">Kenya</option>
              <option value="uganda">Uganda</option>
              <option value="nigeria">Nigeria</option>
            </select>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        {/* Listings */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing, index) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <Image
                  src={listing.image}
                  alt={listing.title}
                  width={400}
                  height={128}
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                  {listing.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Farmer: {listing.farmer}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Location: {listing.location}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Quality: {listing.quality}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-green-600">
                    ${listing.price}/ton
                  </span>
                  <button
                    onClick={() => handleViewDetails(listing.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* AI Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mt-8"
        >
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            AI Recommendations for You
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 dark:text-white mb-2">
                Optimal Pricing Strategy
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Based on current market trends and your location, consider pricing your maize at $260-280 per ton for maximum profit.
              </p>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-400 text-xs rounded">
                  +15% potential increase
                </span>
              </div>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 dark:text-white mb-2">
                Buyer Match
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                High-demand buyer in Nairobi is looking for maize. 95% match based on quality and location preferences.
              </p>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm">
                Contact Buyer
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}