'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { OnboardingModal } from '@/components/OnboardingModal';
import { getAuthToken, setAuthToken, getCurrentUser, getCreditScore, getYieldPrediction, getUserLoans, getUserNotifications, getSensorData, getUserDevices, getUserDashboardData, connectWebSocket, subscribeToNotifications, subscribeToSensorAlerts } from '@/lib/api';
import { LogOut, TrendingUp, DollarSign, Leaf, Bell, BarChart3, Activity, Thermometer, Droplets, RefreshCw } from 'lucide-react';
// import { CustomLineChart, CustomBarChart } from '@/components/charts';
import { SkeletonCard } from '@/components/Skeleton';

export default function Dashboard() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState({
    creditScore: null as any,
    yieldPrediction: null as any,
    loans: [] as any[],
    notifications: [] as any[],
    sensorData: [] as any[],
    sensorDevices: [] as any[]
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  // Real-time updates every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      refreshDashboardData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  const checkAuthAndLoadData = async () => {
    const token = getAuthToken();
    if (!token) {
      router.push('/');
      return;
    }

    setIsAuthenticated(true);

    try {
      // Fetch user data
      const userData = await getCurrentUser();
      setUser(userData);

      // Fetch dashboard data in parallel
      const [creditScoreRes, yieldPredRes, loansRes, notificationsRes, devicesRes] = await Promise.allSettled([
        getCreditScore({
          crop_type: 'maize',
          farm_size: userData.farm_size || 5,
          location: userData.location || 'Kenya',
          historical_data: {}
        }),
        getYieldPrediction({
          crop_type: 'maize',
          farm_size: userData.farm_size || 5,
          location: userData.location || 'Kenya',
          weather_data: {}
        }),
        getUserLoans(),
        getUserNotifications(),
        getUserDevices()
      ]);

      let sensorData = [];
      const devices = devicesRes.status === 'fulfilled' ? devicesRes.value : [];
      if (devices.length > 0) {
        try {
          const sensorRes = await getSensorData(devices[0].device_id, 24);
          sensorData = sensorRes.data || [];
        } catch (error) {
          console.warn('Failed to fetch sensor data:', error);
        }
      }

      setDashboardData({
        creditScore: creditScoreRes.status === 'fulfilled' ? creditScoreRes.value.data : null,
        yieldPrediction: yieldPredRes.status === 'fulfilled' ? yieldPredRes.value.data : null,
        loans: loansRes.status === 'fulfilled' ? loansRes.value : [],
        notifications: notificationsRes.status === 'fulfilled' ? notificationsRes.value : [],
        sensorData: sensorData,
        sensorDevices: devices
      });

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }

    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('agricredit_onboarding_completed');
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setIsAuthenticated(false);
    setUser(null);
    router.push('/');
  };

  const refreshDashboardData = async () => {
    if (!user) return;

    try {
      // Refresh data in parallel
      const [creditScoreRes, yieldPredRes, loansRes, notificationsRes] = await Promise.allSettled([
        getCreditScore({
          crop_type: 'maize',
          farm_size: user.farm_size || 5,
          location: user.location || 'Kenya',
          historical_data: {}
        }),
        getYieldPrediction({
          crop_type: 'maize',
          farm_size: user.farm_size || 5,
          location: user.location || 'Kenya',
          weather_data: {}
        }),
        getUserLoans(),
        getUserNotifications()
      ]);

      // Update only if data has changed
      const newData = {
        creditScore: creditScoreRes.status === 'fulfilled' ? creditScoreRes.value.data : dashboardData.creditScore,
        yieldPrediction: yieldPredRes.status === 'fulfilled' ? yieldPredRes.value.data : dashboardData.yieldPrediction,
        loans: loansRes.status === 'fulfilled' ? loansRes.value : dashboardData.loans,
        notifications: notificationsRes.status === 'fulfilled' ? notificationsRes.value : dashboardData.notifications,
        sensorData: dashboardData.sensorData,
        sensorDevices: dashboardData.sensorDevices
      };

      setDashboardData(newData);
      setLastUpdate(new Date());
      setShowUpdateNotification(true);

      // Hide notification after 3 seconds
      setTimeout(() => setShowUpdateNotification(false), 3000);
    } catch (error) {
      console.warn('Failed to refresh dashboard data:', error);
    }
  };

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    localStorage.setItem('agricredit_onboarding_completed', 'true');
  };

  const handleApplyForLoan = () => {
    router.push('/loan-application');
  };

  const handleListProduce = () => {
    router.push('/marketplace');
  };

  const handleViewCarbonImpact = () => {
    router.push('/carbon-dashboard');
  };

  return (
    <>
      <OnboardingModal isOpen={showOnboarding} onClose={handleOnboardingClose} />

      {/* Real-time Update Notification */}
      <AnimatePresence>
        {showUpdateNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Dashboard updated
          </motion.div>
        )}
      </AnimatePresence>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
            <div className="flex items-center gap-4">
              {user && (
                <>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Welcome, {user.full_name || user.username}
                  </span>
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                  <button
                    onClick={refreshDashboardData}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
                    title="Refresh data"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  {lastUpdate && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Updated {lastUpdate.toLocaleTimeString()}
                    </span>
                  )}
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* AI Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Credit Score</h3>
            </div>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
            ) : dashboardData.creditScore ? (
              <>
                <div className="text-3xl font-bold text-green-600">{dashboardData.creditScore.score}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Risk: {dashboardData.creditScore.risk_level}</p>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold text-gray-400">--</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">No data available</p>
              </>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Yield Prediction</h3>
            </div>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
            ) : dashboardData.yieldPrediction ? (
              <>
                <div className="text-3xl font-bold text-blue-600">
                  {Math.round(dashboardData.yieldPrediction.predicted_yield)} {dashboardData.yieldPrediction.unit}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {dashboardData.yieldPrediction.confidence_interval_lower}-{dashboardData.yieldPrediction.confidence_interval_upper} {dashboardData.yieldPrediction.unit}
                </p>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold text-gray-400">--</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">No data available</p>
              </>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Active Loans</h3>
            </div>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold text-purple-600">
                  {dashboardData.loans.filter((loan: any) => loan.status === 'active').length}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ${dashboardData.loans.filter((loan: any) => loan.status === 'active').reduce((sum: number, loan: any) => sum + loan.amount, 0)} outstanding
                </p>
              </>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Notifications</h3>
            </div>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold text-teal-600">
                  {dashboardData.notifications.filter((n: any) => !n.is_read).length}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Unread messages</p>
              </>
            )}
          </motion.div>
        </div>

        {/* Weather Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-6 rounded-lg shadow-sm mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="text-4xl">🌤️</div>
              <div>
                <h3 className="text-xl font-semibold">Weather Forecast</h3>
                <p className="text-sm opacity-90">Perfect conditions for maize planting</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">24°C</div>
              <div className="text-sm opacity-90">Feels like 26°C</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { day: "Today", temp: "24°", icon: "☀️", condition: "Sunny" },
              { day: "Tomorrow", temp: "22°", icon: "🌤️", condition: "Partly cloudy" },
              { day: "Wed", temp: "25°", icon: "🌧️", condition: "Light rain" },
              { day: "Thu", temp: "23°", icon: "☀️", condition: "Sunny" }
            ].map((forecast, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl mb-1">{forecast.icon}</div>
                <div className="font-medium">{forecast.day}</div>
                <div className="text-lg font-bold">{forecast.temp}</div>
                <div className="text-xs opacity-80">{forecast.condition}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Sensor Data Charts */}
        {dashboardData.sensorDevices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-8"
          >
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-green-600" />
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">IoT Sensor Data</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Soil Moisture Chart */}
              <div>
             <div className="h-48 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
               <div className="text-center">
                 <Droplets className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                 <p className="text-sm text-gray-600 dark:text-gray-400">Soil Moisture Chart</p>
               </div>
             </div>
              </div>

              {/* Temperature Chart */}
              <div>
             <div className="h-48 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
               <div className="text-center">
                 <Thermometer className="w-8 h-8 text-red-600 mx-auto mb-2" />
                 <p className="text-sm text-gray-600 dark:text-gray-400">Temperature Chart</p>
               </div>
             </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loan History Chart */}
        {dashboardData.loans.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-8"
          >
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Loan History</h3>
            </div>

             <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
               <div className="text-center">
                 <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                 <p className="text-sm text-gray-600 dark:text-gray-400">Loan History Chart</p>
               </div>
             </div>
          </motion.div>
        )}

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-600" />
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Recent Notifications</h3>
            </div>
            <button
              onClick={() => router.push('/notifications')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All →
            </button>
          </div>
          <div className="space-y-4">
            {dashboardData.notifications.length > 0 ? (
              dashboardData.notifications.slice(0, 3).map((notification: any) => (
                <div key={notification.id} className={`p-4 border rounded-lg ${notification.is_read ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700' : 'border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-white">{notification.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No notifications yet</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Enhanced Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
        >
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Apply for Loan",
                description: "Get AI-powered credit assessment",
                icon: "💰",
                color: "from-green-500 to-green-600",
                action: handleApplyForLoan
              },
              {
                title: "List Produce",
                description: "Sell on the AI marketplace",
                icon: "🌾",
                color: "from-blue-500 to-blue-600",
                action: handleListProduce
              },
              {
                title: "Carbon Impact",
                description: "Track environmental contribution",
                icon: "🌱",
                color: "from-teal-500 to-teal-600",
                action: handleViewCarbonImpact
              },
              {
                title: "NFT Farming",
                description: "Manage tokenized farm assets",
                icon: "🎨",
                color: "from-purple-500 to-purple-600",
                action: () => router.push('/nft-farming')
              },
              {
                title: "Liquidity Pools",
                description: "Provide liquidity and earn rewards",
                icon: "💧",
                color: "from-cyan-500 to-cyan-600",
                action: () => router.push('/liquidity-pool')
              },
              {
                title: "Yield Farming",
                description: "Stake tokens for passive income",
                icon: "📈",
                color: "from-orange-500 to-orange-600",
                action: () => router.push('/yield-farming')
              },
              {
                title: "DAO Governance",
                description: "Vote on platform decisions",
                icon: "🗳️",
                color: "from-indigo-500 to-indigo-600",
                action: () => router.push('/governance')
              },
              {
                title: "Carbon Market",
                description: "Trade carbon credits",
                icon: "⚡",
                color: "from-emerald-500 to-emerald-600",
                action: () => router.push('/carbon-marketplace')
              },
              {
                title: "IoT Dashboard",
                description: "Monitor farm sensors",
                icon: "📊",
                color: "from-rose-500 to-rose-600",
                action: () => router.push('/iot-dashboard')
              }
            ].map((action, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={action.action}
                className={`p-6 bg-gradient-to-br ${action.color} text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-left group`}
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  {action.icon}
                </div>
                <h4 className="font-semibold text-lg mb-2">{action.title}</h4>
                <p className="text-sm opacity-90">{action.description}</p>
                <div className="mt-4 flex items-center text-sm font-medium">
                  <span>Get Started</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </main>
      </div>
    </>
  );
}