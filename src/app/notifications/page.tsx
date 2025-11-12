'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getAuthToken, getUserNotifications, markNotificationRead, Notification as NotificationType, connectWebSocket, onWebSocketMessage, disconnectWebSocket } from '@/lib/api';
import { Bell, Check, CheckCheck, AlertCircle, Info, TrendingUp, DollarSign, MessageSquare, X } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAuthAndLoadNotifications();

    // Connect to WebSocket for real-time notifications
    const token = getAuthToken();
    if (token) {
      connectWebSocket(1, 'notifications'); // Using dummy user ID

      // Listen for new notifications
      onWebSocketMessage('notification', (notification: NotificationType) => {
        console.log('Received new notification:', notification);
        setNotifications(prev => [notification, ...prev]);
      });
    }

    return () => {
      disconnectWebSocket();
    };
  }, []);

  const checkAuthAndLoadNotifications = async () => {
    const token = getAuthToken();
    if (!token) {
      router.push('/');
      return;
    }

    try {
      const data = await getUserNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.is_read);
    for (const notification of unreadNotifications) {
      try {
        await markNotificationRead(notification.id);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'loan':
        return <DollarSign className="w-5 h-5 text-green-600" />;
      case 'marketplace':
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
      case 'system':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-purple-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    // Filter by read status
    const matchesFilter = (() => {
      switch (filter) {
        case 'unread':
          return !notification.is_read;
        case 'read':
          return notification.is_read;
        default:
          return true;
      }
    })();

    // Filter by search term
    const matchesSearch = searchTerm === '' ||
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.type.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                ←
              </button>
              <div className="flex items-center gap-2">
                <Bell className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Notifications</h1>
                {unreadCount > 0 && (
                  <span className="bg-red-600 text-white text-sm px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                Mark All Read
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Filters and Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
            <div className="flex gap-2 flex-wrap">
              {[
                { key: 'all', label: 'All', count: notifications.length },
                { key: 'unread', label: 'Unread', count: unreadCount },
                { key: 'read', label: 'Read', count: notifications.filter(n => n.is_read).length }
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setNotifications([])}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
              >
                Clear All
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="font-medium text-gray-800 dark:text-white mb-3">Notification Preferences</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { type: 'loan', label: 'Loan Updates', enabled: true },
                { type: 'marketplace', label: 'Marketplace', enabled: true },
                { type: 'system', label: 'System Alerts', enabled: true }
              ].map((pref) => (
                <label key={pref.type} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    defaultChecked={pref.enabled}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{pref.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border-l-4 ${
                  notification.is_read
                    ? 'border-gray-300 dark:border-gray-600'
                    : 'border-blue-500'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className={`font-semibold ${
                          notification.is_read
                            ? 'text-gray-800 dark:text-gray-200'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {notification.title}
                        </h3>
                        <p className={`mt-1 ${
                          notification.is_read
                            ? 'text-gray-600 dark:text-gray-400'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {notification.message}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                        {!notification.is_read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {notification.data && Object.keys(notification.data).length > 0 && (
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <details>
                          <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                            Additional Details
                          </summary>
                          <pre className="mt-2 text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                            {JSON.stringify(notification.data, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="relative mb-6">
                <Bell className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                {filter === 'unread' ? 'All caught up!' : searchTerm ? 'No matches found' : 'No notifications yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {filter === 'unread'
                  ? 'You\'ve read all your notifications. Great job staying on top of things!'
                  : searchTerm
                    ? `No notifications match "${searchTerm}". Try adjusting your search terms.`
                    : 'You don\'t have any notifications yet. They\'ll appear here when you have updates.'
                }
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Clear Search
                </button>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}