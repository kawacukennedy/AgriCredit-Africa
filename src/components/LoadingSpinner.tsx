import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export function LoadingSpinner({ size = 'md', message, className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const dotVariants = {
    initial: { y: 0 },
    animate: { y: [-8, 8, -8] },
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div className="relative">
        {/* Outer ring */}
        <motion.div
          className={`${sizeClasses[size]} border-2 border-gray-200 dark:border-gray-700 border-t-green-500 rounded-full`}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />

        {/* Inner dots */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex space-x-1">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-1 h-1 bg-green-500 rounded-full"
                variants={dotVariants}
                initial="initial"
                animate="animate"
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-gray-600 dark:text-gray-400 text-center"
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}

export function PageLoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <LoadingSpinner size="lg" message={message} />
    </div>
  );
}

export function InlineLoadingSpinner({ message, className }: { message?: string; className?: string }) {
  return <LoadingSpinner size="sm" message={message} className={className} />;
}