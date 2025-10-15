import React, { useState, useEffect } from 'react';
import { messagingService } from '../../api/apiService';
import MessageComposer from './MessageComposer';
import MessageHistory from './MessageHistory';
import CallSystem from './CallSystem';

const MessagingSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'compose' | 'history' | 'calls'>('compose');
  const [stats, setStats] = useState({
    totalMessages: 0,
    sentMessages: 0,
    deliveredMessages: 0,
    failedMessages: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await messagingService.getCommunicationStats();
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch communication stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Messaging System</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-lg font-medium text-blue-800">Total Messages</h3>
          <p className="text-3xl font-bold text-blue-600">
            {loading ? '...' : stats.totalMessages}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="text-lg font-medium text-green-800">Delivered</h3>
          <p className="text-3xl font-bold text-green-600">
            {loading ? '...' : stats.deliveredMessages}
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h3 className="text-lg font-medium text-yellow-800">Sent</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {loading ? '...' : stats.sentMessages}
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <h3 className="text-lg font-medium text-red-800">Failed</h3>
          <p className="text-3xl font-bold text-red-600">
            {loading ? '...' : stats.failedMessages}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('compose')}
            className={`${activeTab === 'compose' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Compose Message
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`${activeTab === 'history' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Message History
          </button>
          <button
            onClick={() => setActiveTab('calls')}
            className={`${activeTab === 'calls' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Calls
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'compose' && <MessageComposer />}
        {activeTab === 'history' && <MessageHistory />}
        {activeTab === 'calls' && <CallSystem />}
      </div>
    </div>
  );
};

export default MessagingSystem;