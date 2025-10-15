import { api } from './api';

// Student Service
export const studentService = {
  getAllStudents: (filters?: { department?: number; semester?: number; search?: string; ordering?: string }) => {
    const params = new URLSearchParams();
    if (filters?.department) params.append('department', filters.department.toString());
    if (filters?.semester) params.append('semester', filters.semester.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.ordering) params.append('ordering', filters.ordering);
    const queryString = params.toString();
    return api.get(`students/${queryString ? '?' + queryString : ''}`);
  },
  getStudentById: (id: number) => api.get(`students/${id}/`),
  createStudent: (data: any) => api.post('students/', data),
  updateStudent: (id: number, data: any) => api.put(`students/${id}/`, data),
  deleteStudent: (id: number) => api.delete(`students/${id}/`),
  getStudentProfile: (id: number) => api.get(`students/${id}/`),
  getCurrentStudentProfile: () => api.get('students/profile/'), // New profile endpoint
  uploadStudentImage: (id: number, formData: FormData) => api.post(`students/${id}/upload-image/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  // New endpoints for scholarship prediction and metrics
  predictScholarship: (id: number) => api.get(`students/${id}/predict-scholarship/`),
  updateStudentMetrics: (id: number) => api.post(`students/${id}/update-metrics/`),
  generatePerformanceNotes: (id: number, save: boolean = true) => api.post(`students/${id}/generate-notes/?save=${save}`),
};



// Result Service
export const resultService = {
  getAllResults: () => api.get('results/'),
  getResultById: (id: number) => api.get(`results/${id}/`),
  createResult: (data: any) => api.post('results/', data),
  updateResult: (id: number, data: any) => api.put(`results/${id}/`, data),
  deleteResult: (id: number) => api.delete(`results/${id}/`),
  getStudentResults: (studentId: number) => api.get(`students/${studentId}/results/`),
};

// Event Service
export const eventService = {
  getAllEvents: () => api.get('events/'),
  getEventById: (id: number) => api.get(`events/${id}/`),
  createEvent: (data: any) => api.post('events/', data),
  updateEvent: (id: number, data: any) => api.put(`events/${id}/`, data),
  deleteEvent: (id: number) => api.delete(`events/${id}/`),
};

// Department Service
export const departmentService = {
  getAllDepartments: () => api.get('academics/departments/'),
  getDepartmentById: (id: number) => api.get(`academics/departments/${id}/`),
  createDepartment: (data: any) => api.post('academics/departments/', data),
  updateDepartment: (id: number, data: any) => api.put(`academics/departments/${id}/`, data),
  deleteDepartment: (id: number) => api.delete(`academics/departments/${id}/`),
  
  // Semester methods
  getAllSemesters: () => api.get('academics/semesters/'),
  getSemesterById: (id: number) => api.get(`academics/semesters/${id}/`),
  getSemestersByDepartment: (departmentId: number) => api.get(`academics/departments/${departmentId}/semesters/`),
  createSemester: (data: any) => api.post('academics/semesters/', data),
  updateSemester: (id: number, data: any) => api.put(`academics/semesters/${id}/`, data),
  deleteSemester: (id: number) => api.delete(`academics/semesters/${id}/`),
};

// Semester Service
export const semesterService = {
  getAllSemesters: () => api.get('academics/semesters/'),
  getSemesterById: (id: number) => api.get(`academics/semesters/${id}/`),
  createSemester: (data: any) => api.post('academics/semesters/', data),
  updateSemester: (id: number, data: any) => api.put(`academics/semesters/${id}/`, data),
  deleteSemester: (id: number) => api.delete(`academics/semesters/${id}/`),
  getSemestersByDepartment: (departmentId: number) => api.get(`academics/departments/${departmentId}/semesters/`),
};

// Course Service
export const courseService = {
  getAllCourses: () => api.get('academics/courses/'),
  getCourseById: (id: number) => api.get(`academics/courses/${id}/`),
  createCourse: (data: any) => api.post('academics/courses/', data),
  updateCourse: (id: number, data: any) => api.put(`academics/courses/${id}/`, data),
  deleteCourse: (id: number) => api.delete(`academics/courses/${id}/`),
  getCoursesBySemester: (semesterId: number) => api.get(`academics/semesters/${semesterId}/courses/`),
};

// Fee Service
export const feeService = {
  getAllFees: () => api.get('academics/fees/'),
  getFeeById: (id: number) => api.get(`academics/fees/${id}/`),
  createFee: (data: any) => api.post('academics/fees/', data),
  updateFee: (id: number, data: any) => api.put(`academics/fees/${id}/`, data),
  deleteFee: (id: number) => api.delete(`academics/fees/${id}/`),
  getStudentFees: (studentId: number) => api.get(`academics/students/${studentId}/fees/`),
};

// Transport Service
export const transportService = {
  getAllTransports: () => api.get('transports/'),
  getTransportById: (id: number) => api.get(`transports/${id}/`),
  createTransport: (data: any) => api.post('transports/', data),
  updateTransport: (id: number, data: any) => api.put(`transports/${id}/`, data),
  deleteTransport: (id: number) => api.delete(`transports/${id}/`),
};

// Announcement Service
export const announcementService = {
  getAllAnnouncements: () => api.get('announcements/'),
  getAnnouncementById: (id: number) => api.get(`announcements/${id}/`),
  createAnnouncement: (data: any) => api.post('announcements/', data),
  updateAnnouncement: (id: number, data: any) => api.put(`announcements/${id}/`, data),
  deleteAnnouncement: (id: number) => api.delete(`announcements/${id}/`),
};

// Scholarship Service
export const scholarshipService = {
  getAllScholarships: () => api.get('academics/scholarships/'),
  getScholarshipById: (id: number) => api.get(`academics/scholarships/${id}/`),
  createScholarship: (data: any) => api.post('academics/scholarships/', data),
  updateScholarship: (id: number, data: any) => api.put(`academics/scholarships/${id}/`, data),
  deleteScholarship: (id: number) => api.delete(`academics/scholarships/${id}/`),
  getStudentScholarships: (studentId: number) => api.get(`academics/students/${studentId}/scholarships/`),
};

// Messaging Service
export const messagingService = {
  // Individual messaging
  sendIndividualMessage: (data: {
    recipient_id: number;
    message_type: 'SMS' | 'EMAIL' | 'CALL';
    subject?: string;
    body: string;
  }) => api.post('messaging/send-individual/', data),

  // Bulk messaging
  sendBulkMessage: (data: {
    recipient_type: 'INDIVIDUAL' | 'DEPARTMENT' | 'COURSE' | 'ALL_STUDENTS' | 'ALL_STAFF';
    recipient_ids?: number[];
    message_type: 'SMS' | 'EMAIL' | 'CALL';
    subject?: string;
    body: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH';
  }) => api.post('messaging/send-bulk/', data),

  // Message history
  getMessageHistory: () => api.get('messaging/history/'),

  // Communication stats
  getCommunicationStats: () => api.get('messaging/stats/'),

  // Message management (ViewSets)
  getAllMessages: () => api.get('messaging/messages/'),
  getMessageById: (id: number) => api.get(`messaging/messages/${id}/`),
  createMessage: (data: any) => api.post('messaging/messages/', data),
  updateMessage: (id: number, data: any) => api.put(`messaging/messages/${id}/`, data),
  deleteMessage: (id: number) => api.delete(`messaging/messages/${id}/`),

  // Send message action
  sendMessage: (id: number) => api.post(`messaging/messages/${id}/send/`),

  // Sent messages
  getSentMessages: () => api.get('messaging/messages/sent/'),

  // Received messages
  getReceivedMessages: () => api.get('messaging/messages/received/'),

  // Message templates
  getAllTemplates: () => api.get('messaging/templates/'),
  getTemplateById: (id: number) => api.get(`messaging/templates/${id}/`),
  createTemplate: (data: any) => api.post('messaging/templates/', data),
  updateTemplate: (id: number, data: any) => api.put(`messaging/templates/${id}/`, data),
  deleteTemplate: (id: number) => api.delete(`messaging/templates/${id}/`),

  // Use template
  useTemplate: (id: number) => api.post(`messaging/templates/${id}/use_template/`),

  // SMS Settings
  getAllSmsSettings: () => api.get('messaging/sms-settings/'),
  getSmsSettingById: (id: number) => api.get(`messaging/sms-settings/${id}/`),
  createSmsSetting: (data: any) => api.post('messaging/sms-settings/', data),
  updateSmsSetting: (id: number, data: any) => api.put(`messaging/sms-settings/${id}/`, data),
  deleteSmsSetting: (id: number) => api.delete(`messaging/sms-settings/${id}/`),

  // Email Settings
  getAllEmailSettings: () => api.get('messaging/email-settings/'),
  getEmailSettingById: (id: number) => api.get(`messaging/email-settings/${id}/`),
  createEmailSetting: (data: any) => api.post('messaging/email-settings/', data),
  updateEmailSetting: (id: number, data: any) => api.put(`messaging/email-settings/${id}/`, data),
  deleteEmailSetting: (id: number) => api.delete(`messaging/email-settings/${id}/`),
  
  // Search recipients
  searchRecipients: (query: string, type?: string) => {
    const params = new URLSearchParams({ q: query });
    if (type) params.append('type', type);
    return api.get(`messaging/messages/search_recipients/?${params.toString()}`);
  },
  
  // Call functionality
  initiateCall: (recipientId: number, recipientType: string) => api.post(`messaging/call/initiate/`, { recipient_id: recipientId, recipient_type: recipientType }),
  endCall: (callId: number) => api.post(`messaging/call/${callId}/end/`),
  saveCallNotes: (callId: number, notes: string) => api.post(`messaging/call/${callId}/notes/`, { notes })
};

// Re-export authService from api.ts
export { authService } from './api';
