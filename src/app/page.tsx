export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <header className="flex justify-between items-center p-6">
        <h1 className="text-2xl font-bold text-green-800 dark:text-green-400">AgriCredit</h1>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg">Connect Wallet</button>
      </header>
      <main className="container mx-auto px-6 py-12 text-center">
        <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
          AgriCredit Africa
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Decentralized microcredit for sustainable agriculture
        </p>
        <button className="bg-green-600 text-white px-6 py-3 rounded-lg mt-8">
          Get Started
        </button>
      </main>
    </div>
  );
}