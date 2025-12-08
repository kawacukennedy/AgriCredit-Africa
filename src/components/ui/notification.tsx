import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 11);
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove notification after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearAll,
      }}
    >
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onRemove: () => void;
}

function NotificationItem({ notification, onRemove }: NotificationItemProps) {
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStyles = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div
      className={cn(
        'p-4 rounded-lg border shadow-lg animate-in slide-in-from-right-full duration-300',
        getStyles(notification.type)
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-slate-gray">
            {notification.title}
          </h4>
          {notification.message && (
            <p className="text-sm text-slate-gray/80 mt-1">
              {notification.message}
            </p>
          )}
          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className="text-sm font-medium text-agri-green hover:text-agri-green/80 mt-2 underline"
            >
              {notification.action.label}
            </button>
          )}
        </div>
        <button
          onClick={onRemove}
          className="flex-shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4 text-slate-gray/60" />
        </button>
      </div>
    </div>
  );
}

// Convenience hooks for different notification types
export function useNotification() {
  const { addNotification } = useNotifications();

  return {
    success: (title: string, message?: string, options?: Partial<Notification>) =>
      addNotification({ type: 'success', title, message, ...options }),
    error: (title: string, message?: string, options?: Partial<Notification>) =>
      addNotification({ type: 'error', title, message, ...options }),
    warning: (title: string, message?: string, options?: Partial<Notification>) =>
      addNotification({ type: 'warning', title, message, ...options }),
    info: (title: string, message?: string, options?: Partial<Notification>) =>
      addNotification({ type: 'info', title, message, ...options }),
  };
}