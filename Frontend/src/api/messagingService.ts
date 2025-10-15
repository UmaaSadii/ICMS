import { api } from './api';

// Messaging Service
export const messagingService = {
  // Individual messaging
  sendIndividualMessage: (data: {
    recipient_id: number;
    recipient_type: 'STUDENT' | 'INSTRUCTOR';
    message_type: 'SMS' | 'EMAIL' | 'CALL';
    subject?: string;
    body: string;
  }) => api.post('messaging/send-individual/', data),

  // Bulk messaging (using ViewSet actions)
  sendBulkMessage: (data: {
    recipient_ids: number[];
    recipient_type: 'STUDENT' | 'INSTRUCTOR';
    message_type: 'SMS' | 'EMAIL' | 'CALL';
    subject?: string;
    body: string;
  }) => api.post('messaging/messages/send_bulk/', data),

  // Search recipients
  searchRecipients: (query: string, type: 'STUDENT' | 'INSTRUCTOR') =>
    api.get(`messaging/messages/search_recipients/?q=${query}&type=${type}`),

  // Message history with recipient filter
  getMessageHistory: (recipientId?: number, recipientType?: 'STUDENT' | 'INSTRUCTOR') => {
    let url = 'messaging/messages/history/';
    if (recipientId && recipientType) {
      url += `?recipient_id=${recipientId}&recipient_type=${recipientType}`;
    }
    return api.get(url);
  },

  // Communication stats
  getCommunicationStats: () => api.get('messaging/stats/'),

  // Message management (ViewSets)
  getAllMessages: () => api.get('messaging/messages/'),
  getMessageById: (id: number) => api.get(`messaging/messages/${id}/`),
  createMessage: (data: any) => api.post('messaging/messages/', data),
  updateMessage: (id: number, data: any) => api.put(`messaging/messages/${id}/`, data),
  deleteMessage: (id: number) => api.delete(`messaging/messages/${id}/`),

  // Mark message as read
  markAsRead: (id: number) => api.post(`messaging/messages/${id}/mark_as_read/`),

  // Message templates
  getAllTemplates: () => api.get('messaging/templates/'),
  getTemplateById: (id: number) => api.get(`messaging/templates/${id}/`),
  createTemplate: (data: any) => api.post('messaging/templates/', data),
  updateTemplate: (id: number, data: any) => api.put(`messaging/templates/${id}/`, data),
  deleteTemplate: (id: number) => api.delete(`messaging/templates/${id}/`),

  // Call functionality (to be implemented)
  initiateCall: (recipientId: number, recipientType: 'STUDENT' | 'INSTRUCTOR') =>
    api.post('messaging/calls/', { recipient_id: recipientId, recipient_type: recipientType }),

  endCall: (callId: number) => api.patch(`messaging/calls/${callId}/`, { status: 'ENDED' }),

  saveCallNotes: (callId: number, notes: string) =>
    api.patch(`messaging/calls/${callId}/`, { notes }),

  getCallHistory: () => api.get('messaging/calls/'),
};
