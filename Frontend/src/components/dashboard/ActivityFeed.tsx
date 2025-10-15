import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Activity {
  id: string;
  type: 'user' | 'system' | 'academic' | 'financial';
  action: string;
  description: string;
  timestamp: Date;
  user?: string;
  icon: string;
}

const ActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: '1',
      type: 'user',
      action: 'Student Registration',
      description: 'New student John Doe registered for Computer Science',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      user: 'System',
      icon: '👤'
    },
    {
      id: '2',
      type: 'academic',
      action: 'Result Upload',
      description: 'Mathematics exam results uploaded for Semester 1',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      user: 'Dr. Smith',
      icon: '📊'
    },
    {
      id: '3',
      type: 'financial',
      action: 'Fee Payment',
      description: 'Payment of $1,200 received from student ID: 2024001',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      user: 'Finance System',
      icon: '💰'
    },
    {
      id: '4',
      type: 'system',
      action: 'Backup Completed',
      description: 'Daily database backup completed successfully',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      user: 'System',
      icon: '🔄'
    },
    {
      id: '5',
      type: 'user',
      action: 'Instructor Added',
      description: 'New instructor Prof. Johnson added to Physics department',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      user: 'Admin',
      icon: '👨‍🏫'
    }
  ]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'user': return 'bg-blue-500';
      case 'system': return 'bg-green-500';
      case 'academic': return 'bg-purple-500';
      case 'financial': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm ${getTypeColor(activity.type)}`}>
              {activity.icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {activity.action}
                </p>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTimeAgo(activity.timestamp)}
                </span>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {activity.description}
              </p>

              {activity.user && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  by {activity.user}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
        <button className="w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors">
          View All Activity →
        </button>
      </div>
    </motion.div>
  );
};

export default ActivityFeed;
