import React, { useState } from 'react';
import { messagingService } from '../../api/messagingService';

interface CallRecipient {
  id: number;
  name: string;
  email: string;
  type: 'STUDENT' | 'INSTRUCTOR';
}

const CallSystem: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [recipientType, setRecipientType] = useState<'STUDENT' | 'INSTRUCTOR'>('STUDENT');
  const [recipients, setRecipients] = useState<CallRecipient[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<CallRecipient | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'connected' | 'ended' | 'failed'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [callTimer, setCallTimer] = useState<NodeJS.Timeout | null>(null);
  const [callNote, setCallNote] = useState('');
  const [loading, setLoading] = useState(false);

  // Search for recipients
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await messagingService.searchRecipients(searchQuery, recipientType);
      setRecipients(response.data);
    } catch (error) {
      console.error('Failed to search recipients:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initiate a call
  const initiateCall = async () => {
    if (!selectedRecipient) return;

    setCallStatus('calling');
    try {
      await messagingService.initiateCall(selectedRecipient.id, selectedRecipient.type);
      setCallStatus('connected');

      // Start call timer
      const timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      setCallTimer(timer);
    } catch (error) {
      console.error('Failed to initiate call:', error);
      setCallStatus('failed');
    }
  };

  // End the call
  const endCall = async () => {
    if (callTimer) {
      clearInterval(callTimer);
      setCallTimer(null);
    }
    
    setCallStatus('ended');
    try {
      if (selectedRecipient?.id) {
        // End the call with the recipient ID
        await messagingService.endCall(selectedRecipient.id);
        // Save call record with note
        await messagingService.saveCallNotes(selectedRecipient.id, callNote);
      }
    } catch (error) {
      console.error('Failed to end call properly:', error);
    }
    
    // Reset after a short delay
    setTimeout(() => {
      setCallStatus('idle');
      setCallDuration(0);
      setCallNote('');
    }, 3000);
  };

  // Format seconds to MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Call System</h2>
      
      {/* Recipient type selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Recipient Type
        </label>
        <div className="flex space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="recipientType"
              value="STUDENT"
              checked={recipientType === 'STUDENT'}
              onChange={(e) => setRecipientType(e.target.value as 'STUDENT' | 'INSTRUCTOR')}
              className="form-radio h-4 w-4 text-indigo-600"
            />
            <span className="ml-2">Student</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="recipientType"
              value="INSTRUCTOR"
              checked={recipientType === 'INSTRUCTOR'}
              onChange={(e) => setRecipientType(e.target.value as 'STUDENT' | 'INSTRUCTOR')}
              className="form-radio h-4 w-4 text-indigo-600"
            />
            <span className="ml-2">Instructor</span>
          </label>
        </div>
      </div>

      {/* Search for recipients */}
      <div className="mb-6">
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
          Search for Recipients
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <input
            type="text"
            name="search"
            id="search"
            className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300"
            placeholder="Search by name or email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={callStatus !== 'idle'}
          />
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={handleSearch}
            disabled={!searchQuery.trim() || callStatus !== 'idle' || loading}
          >
            {loading ? (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : 'Search'}
          </button>
        </div>
      </div>

      {/* Recipients list */}
      {recipients.length > 0 && callStatus === 'idle' && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Select a Recipient</h3>
          <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {recipients.map((recipient) => (
                <li
                  key={recipient.id}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${selectedRecipient?.id === recipient.id ? 'bg-indigo-50' : ''}`}
                  onClick={() => setSelectedRecipient(recipient)}
                >
                  <div className="flex items-center">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{recipient.name}</p>
                      <p className="text-sm text-gray-500 truncate">{recipient.email}</p>
                    </div>
                    <div>
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {recipient.type}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Call interface */}
      {selectedRecipient && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{selectedRecipient.name}</h3>
              <p className="text-sm text-gray-500">{selectedRecipient.email}</p>
            </div>
            <div className="flex items-center">
              {callStatus === 'idle' && (
                <button
                  type="button"
                  onClick={initiateCall}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call
                </button>
              )}
              {(callStatus === 'connected' || callStatus === 'calling') && (
                <button
                  type="button"
                  onClick={endCall}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                  </svg>
                  End Call
                </button>
              )}
            </div>
          </div>

          {/* Call status */}
          <div className="mb-4">
            {callStatus === 'calling' && (
              <div className="flex items-center text-yellow-600">
                <svg className="animate-pulse h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>Calling...</span>
              </div>
            )}
            {callStatus === 'connected' && (
              <div className="flex items-center text-green-600">
                <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>Connected - {formatDuration(callDuration)}</span>
              </div>
            )}
            {callStatus === 'ended' && (
              <div className="flex items-center text-gray-600">
                <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                </svg>
                <span>Call Ended - Duration: {formatDuration(callDuration)}</span>
              </div>
            )}
            {callStatus === 'failed' && (
              <div className="flex items-center text-red-600">
                <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Call Failed</span>
              </div>
            )}
          </div>

          {/* Call notes */}
          {(callStatus === 'connected' || callStatus === 'ended') && (
            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                Call Notes
              </label>
              <textarea
                id="note"
                name="note"
                rows={3}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Add notes about this call"
                value={callNote}
                onChange={(e) => setCallNote(e.target.value)}
                disabled={callStatus === 'ended'}
              />
            </div>
          )}
        </div>
      )}

      {/* Call history would go here */}
    </div>
  );
};

export default CallSystem;