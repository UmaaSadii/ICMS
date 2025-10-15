import { api } from './api';

export const academicsService = {
  getDepartments: () => api.get('academics/departments/'),
  getCourses: () => api.get('academics/courses/'),
  getCoursesByDepartment: (departmentId: number) => api.get(`academics/departments/${departmentId}/courses/`),
  getCoursesBySemester: (semesterId: number) => api.get(`academics/semesters/${semesterId}/courses/`),

  // Attendance APIs
  getStudentAttendance: (studentId: string) => api.get(`academics/students/${studentId}/attendance/`),
  createStudentAttendance: (studentId: number, data: any) => api.post(`academics/students/${studentId}/attendance/`, data),
  updateAttendance: (attendanceId: number, data: any) => api.put(`academics/attendance/${attendanceId}/`, data),
  deleteAttendance: (attendanceId: number) => api.delete(`academics/attendance/${attendanceId}/`),

  // Result APIs
  getResultsByDepartmentCourse: (departmentId: number, courseId: number) => api.get(`academics/departments/${departmentId}/courses/${courseId}/results/professional/`),
  getStudentResults: (studentId: string) => api.get(`academics/students/${studentId}/results/professional/`),
  createStudentResult: (studentId: string, data: any) => api.post(`academics/students/${studentId}/results/professional/`, data),
  updateResult: (resultId: number, data: any) => api.put(`academics/results/${resultId}/`, data),
  deleteResult: (resultId: number) => api.delete(`academics/results/${resultId}/`),

  // Fee APIs
  getFees: (filters?: { department?: number; semester?: number }) => {
    const params = new URLSearchParams();
    if (filters?.department) params.append('department', filters.department.toString());
    if (filters?.semester) params.append('semester', filters.semester.toString());
    console.log('Fee API filters:', params.toString());
    return api.get(`academics/fees/?${params.toString()}`);
  },
  getStudentFees: (studentId: number) => api.get(`academics/students/${studentId}/fees/`),
  createStudentFee: (studentId: number, data: any) => api.post(`academics/students/${studentId}/fees/`, data),
  updateFee: (feeId: number, data: any) => api.put(`academics/fees/${feeId}/`, data),
  deleteFee: (feeId: number) => api.delete(`academics/fees/${feeId}/`),

  // Student APIs
  getStudents: (filters?: { department?: number; semester?: number }) => {
    const params = new URLSearchParams();
    if (filters?.department) params.append('department', filters.department.toString());
    if (filters?.semester) params.append('semester', filters.semester.toString());
    console.log('Student API filters:', params.toString());
    return api.get(`students/?${params.toString()}`);
  },
  getStudent: (studentId: string) => api.get(`students/students/${studentId}/`),

  // Semester APIs
  getSemesters: () => api.get('academics/semesters/'),
  getSemester: (semesterId: number) => api.get(`academics/semesters/${semesterId}/`),
  getSemestersByDepartment: (departmentId: number) => api.get(`academics/departments/${departmentId}/semesters/`),

  // Fee Structure APIs
  getFeeStructures: () => api.get('academics/fee-structures/'),
  createFeeStructure: (data: any) => api.post('academics/fee-structures/', data),
  updateFeeStructure: (id: number, data: any) => api.put(`academics/fee-structures/${id}/`, data),
  deleteFeeStructure: (id: number) => api.delete(`academics/fee-structures/${id}/`),

  // Add other academic related API calls here
};
