import React, { useState, useEffect, useCallback } from 'react';
import { messagingService } from '../../api/messagingService';

interface Recipient {
  id: number;
  name: string;
  email: string;
  type: 'STUDENT' | 'INSTRUCTOR';
}

const MessageComposer: React.FC = () => {
  const [messageType, setMessageType] = useState<'SMS' | 'EMAIL' | 'CALL'>('EMAIL');
  const [recipientType, setRecipientType] = useState<'STUDENT' | 'INSTRUCTOR'>('STUDENT');
  const [subject, setSubject] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);

  // Search functionality
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Recipient[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Search recipients
  const searchRecipients = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await messagingService.searchRecipients(query, recipientType);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Failed to search recipients:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [recipientType]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchRecipients(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchRecipients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (selectedRecipient) {
        // Individual message
        await messagingService.sendIndividualMessage({
          recipient_id: selectedRecipient.id,
          recipient_type: selectedRecipient.type,
          message_type: messageType,
          subject,
          body
        });
      } else if (selectedRecipients.length > 0) {
        // Bulk message
        await messagingService.sendBulkMessage({
          recipient_ids: selectedRecipients.map(r => r.id),
          recipient_type: recipientType,
          message_type: messageType,
          subject,
          body
        });
      } else {
        throw new Error('Please select at least one recipient');
      }

      setSuccess(true);
      // Reset form
      setSubject('');
      setBody('');
      setSelectedRecipient(null);
      setSelectedRecipients([]);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      setError(error.response?.data?.error || error.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addRecipient = (recipient: Recipient) => {
    if (selectedRecipients.find(r => r.id === recipient.id)) {
      return; // Already selected
    }
    setSelectedRecipients([...selectedRecipients, recipient]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeRecipient = (recipientId: number) => {
    setSelectedRecipients(selectedRecipients.filter(r => r.id !== recipientId));
  };

  const selectIndividualRecipient = (recipient: Recipient) => {
    setSelectedRecipient(recipient);
    setSearchQuery(recipient.name);
    setSearchResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Compose Message</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Message Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Message Type</label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setMessageType('EMAIL')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  messageType === 'EMAIL'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </div>
              </button>
              <button
                type="button"
                onClick={() => setMessageType('SMS')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  messageType === 'SMS'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  SMS
                </div>
              </button>
              <button
                type="button"
                onClick={() => setMessageType('CALL')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  messageType === 'CALL'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call
                </div>
              </button>
            </div>
          </div>

          {/* Recipient Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Type</label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => {
                  setRecipientType('STUDENT');
                  setSelectedRecipient(null);
                  setSelectedRecipients([]);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className={`px-4 py-2 rounded-md transition-colors ${
                  recipientType === 'STUDENT'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Students
              </button>
              <button
                type="button"
                onClick={() => {
                  setRecipientType('INSTRUCTOR');
                  setSelectedRecipient(null);
                  setSelectedRecipients([]);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className={`px-4 py-2 rounded-md transition-colors ${
                  recipientType === 'INSTRUCTOR'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Instructors
              </button>
            </div>
          </div>

          {/* Recipient Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${recipientType.toLowerCase()}s...`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {isSearching && (
                <div className="absolute right-3 top-3">
                  <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md">
                {searchResults.map((recipient) => (
                  <div
                    key={recipient.id}
                    onClick={() => selectIndividualRecipient(recipient)}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                  >
                    <div className="font-medium">{recipient.name}</div>
                    <div className="text-sm text-gray-600">{recipient.email}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Recipients */}
            {selectedRecipients.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Selected Recipients:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedRecipients.map((recipient) => (
                    <span
                      key={recipient.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
                    >
                      {recipient.name}
                      <button
                        type="button"
                        onClick={() => removeRecipient(recipient.id)}
                        className="ml-2 text-indigo-600 hover:text-indigo-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Individual Recipient Display */}
            {selectedRecipient && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Selected Recipient:</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                  {selectedRecipient.name} ({selectedRecipient.email})
                  <button
                    type="button"
                    onClick={() => setSelectedRecipient(null)}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              </div>
            )}
          </div>

          {/* Subject - only for email */}
          {messageType === 'EMAIL' && (
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required={messageType === 'EMAIL'}
              />
            </div>
          )}

          {/* Message Body */}
          <div>
            <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder={`Enter your ${messageType.toLowerCase()} message here...`}
              required
            />
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading || (!selectedRecipient && selectedRecipients.length === 0)}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                `Send ${messageType === 'CALL' ? 'Call Request' : messageType}`
              )}
            </button>
          </div>
        </form>

        {/* Success/Error Messages */}
        {success && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {messageType === 'CALL' ? 'Call request sent successfully!' : `${messageType} sent successfully!`}
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageComposer;