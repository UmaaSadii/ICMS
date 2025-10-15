import React, { useState, useEffect, useMemo } from 'react';
import { studentService } from '../api/apiService';

interface Course {
  course_id: number;
  name: string;
  code: string;
  description?: string;
}

interface Student {
  student_id: number;
  name: string;
  email: string;
  course: Course;
  gpa: number;
  attendance_percentage: number;
  image?: string;
}

interface EligibilityData {
  student_id: number;
  eligibility_status: string;
  eligibility_score: number;
  eligibility_factors: string[];
  eligible_scholarships: Array<{
    id: number;
    name: string;
    amount: number;
  }>;
}

interface StudentWithEligibility extends Student {
  eligibility?: EligibilityData;
  loading?: boolean;
}

const ScholarshipEligibilityChecker: React.FC = () => {
  const [students, setStudents] = useState<StudentWithEligibility[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterGPA, setFilterGPA] = useState<string>('all');
  const [filterAttendance, setFilterAttendance] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentWithEligibility | null>(null);
  const [updatingMetrics, setUpdatingMetrics] = useState<Set<number>>(new Set());

  // Fetch all students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await studentService.getAllStudents();
        const studentsData: StudentWithEligibility[] = response.data.map((student: Student) => ({
          ...student,
          loading: false
        }));
        setStudents(studentsData);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load students');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Check eligibility for a student
  const checkEligibility = async (student: StudentWithEligibility, updateMetrics = false) => {
    try {
      // Set loading state for this student
      setStudents(prev => prev.map(s =>
        s.student_id === student.student_id
          ? { ...s, loading: true }
          : s
      ));

      const response = await studentService.predictScholarship(student.student_id);
      const eligibilityData = response.data;

      // Update student with eligibility data
      setStudents(prev => prev.map(s =>
        s.student_id === student.student_id
          ? { ...s, eligibility: eligibilityData, loading: false }
          : s
      ));

      // If metrics were updated, also update the base student data
      if (updateMetrics) {
        // You might want to refresh the student list or update specific fields
        // For now, we'll just update the eligibility data
      }
    } catch (err: any) {
      console.error('Failed to check eligibility:', err);
      setStudents(prev => prev.map(s =>
        s.student_id === student.student_id
          ? { ...s, loading: false }
          : s
      ));
    }
  };

  // Update metrics for a student
  const updateMetrics = async (studentId: number) => {
    try {
      setUpdatingMetrics(prev => new Set(prev).add(studentId));
      await studentService.updateStudentMetrics(studentId);

      // Refresh student data
      const response = await studentService.getAllStudents();
      const updatedStudents = response.data.map((student: Student) => ({
        ...student,
        eligibility: students.find(s => s.student_id === student.student_id)?.eligibility
      }));
      setStudents(updatedStudents);
    } catch (err: any) {
      console.error('Failed to update metrics:', err);
    } finally {
      setUpdatingMetrics(prev => {
        const newSet = new Set(prev);
        newSet.delete(studentId);
        return newSet;
      });
    }
  };

  // Filter students based on criteria
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Status filter
      if (filterStatus !== 'all') {
        if (!student.eligibility) return false;
        const status = student.eligibility.eligibility_status.toLowerCase().replace(' ', '_');
        if (status !== filterStatus) return false;
      }

      // GPA filter
      if (filterGPA !== 'all') {
        const gpa = student.gpa;
        if (filterGPA === 'excellent' && gpa < 3.5) return false;
        if (filterGPA === 'good' && (gpa < 3.0 || gpa >= 3.5)) return false;
        if (filterGPA === 'average' && (gpa < 2.5 || gpa >= 3.0)) return false;
        if (filterGPA === 'poor' && gpa >= 2.5) return false;
      }

      // Attendance filter
      if (filterAttendance !== 'all') {
        const attendance = student.attendance_percentage;
        if (filterAttendance === 'excellent' && attendance < 90) return false;
        if (filterAttendance === 'good' && (attendance < 80 || attendance >= 90)) return false;
        if (filterAttendance === 'average' && (attendance < 70 || attendance >= 80)) return false;
        if (filterAttendance === 'poor' && attendance >= 70) return false;
      }

      return true;
    });
  }, [students, filterStatus, filterGPA, filterAttendance]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'highly eligible': return 'bg-gradient-to-r from-green-500 to-green-600';
      case 'eligible': return 'bg-gradient-to-r from-blue-500 to-blue-600';
      case 'potentially eligible': return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
      case 'not eligible': return 'bg-gradient-to-r from-red-500 to-red-600';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  // Get GPA color
  const getGPAColor = (gpa: number) => {
    if (gpa >= 3.5) return 'text-green-600';
    if (gpa >= 3.0) return 'text-blue-600';
    if (gpa >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get attendance color
  const getAttendanceColor = (attendance: number) => {
    if (attendance >= 90) return 'text-green-600';
    if (attendance >= 80) return 'text-blue-600';
    if (attendance >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Scholarship Eligibility Checker</h2>
        <p className="text-indigo-100">Check and manage scholarship eligibility for all students</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Eligibility Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="highly_eligible">Highly Eligible</option>
              <option value="eligible">Eligible</option>
              <option value="potentially_eligible">Potentially Eligible</option>
              <option value="not_eligible">Not Eligible</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">GPA Range</label>
            <select
              value={filterGPA}
              onChange={(e) => setFilterGPA(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All GPA</option>
              <option value="excellent">Excellent (3.5+)</option>
              <option value="good">Good (3.0-3.5)</option>
              <option value="average">Average (2.5-3.0)</option>
              <option value="poor">{"Poor (<2.5)"}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Attendance Range</label>
            <select
              value={filterAttendance}
              onChange={(e) => setFilterAttendance(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Attendance</option>
              <option value="excellent">Excellent (90%+)</option>
              <option value="good">Good (80-90%)</option>
              <option value="average">Average (70-80%)</option>
              <option value="poor">{"Poor (<70%)"}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Students ({filteredStudents.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GPA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Eligibility Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.student_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {student.image ? (
                          <img className="h-10 w-10 rounded-full object-cover" src={student.image} alt={student.name} />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.course.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getGPAColor(student.gpa)}`}>
                      {student.gpa.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getAttendanceColor(student.attendance_percentage)}`}>
                      {student.attendance_percentage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {student.eligibility ? (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white ${getStatusColor(student.eligibility.eligibility_status)}`}>
                        {student.eligibility.eligibility_status}
                      </span>
                    ) : (
                      <span className="text-gray-500 text-sm">Not checked</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => checkEligibility(student)}
                      disabled={student.loading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md text-xs transition-colors disabled:opacity-50"
                    >
                      {student.loading ? 'Checking...' : 'Check Eligibility'}
                    </button>
                    <button
                      onClick={() => checkEligibility(student, true)}
                      disabled={student.loading}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-xs transition-colors disabled:opacity-50"
                    >
                      Update & Check
                    </button>
                    <button
                      onClick={() => updateMetrics(student.student_id)}
                      disabled={updatingMetrics.has(student.student_id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-xs transition-colors disabled:opacity-50"
                    >
                      {updatingMetrics.has(student.student_id) ? 'Updating...' : 'Update Metrics'}
                    </button>
                    {student.eligibility && (
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md text-xs transition-colors"
                      >
                        Details
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-.98-5.5-2.5m-.5-4h.01" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your filters.</p>
          </div>
        )}
      </div>

      {/* Student Details Modal */}
      {selectedStudent && selectedStudent.eligibility && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                  {selectedStudent.image ? (
                    <img className="h-16 w-16 rounded-full object-cover mr-4" src={selectedStudent.image} alt={selectedStudent.name} />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center mr-4">
                      <span className="text-white font-medium text-xl">
                        {selectedStudent.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedStudent.name}</h3>
                    <p className="text-gray-600">{selectedStudent.email}</p>
                    <p className="text-gray-600">{selectedStudent.course.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Academic Performance</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">GPA:</span>
                      <span className={`font-medium ${getGPAColor(selectedStudent.gpa)}`}>
                        {selectedStudent.gpa.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Attendance:</span>
                      <span className={`font-medium ${getAttendanceColor(selectedStudent.attendance_percentage)}`}>
                        {selectedStudent.attendance_percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Eligibility Score</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${getStatusColor(selectedStudent.eligibility!.eligibility_status)}`}>
                        {selectedStudent.eligibility!.eligibility_status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Score:</span>
                      <span className="font-medium text-gray-900">
                        {selectedStudent.eligibility!.eligibility_score.toFixed(1)}/100
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Eligibility Factors</h4>
                <div className="space-y-2">
                  {selectedStudent.eligibility!.eligibility_factors.map((factor, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-700">
                      <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {factor}
                    </div>
                  ))}
                </div>
              </div>

              {selectedStudent.eligibility!.eligible_scholarships.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Eligible Scholarships</h4>
                  <div className="space-y-3">
                    {selectedStudent.eligibility!.eligible_scholarships.map((scholarship) => (
                      <div key={scholarship.id} className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h5 className="font-medium text-gray-900">{scholarship.name}</h5>
                            <p className="text-sm text-gray-600">Amount: ${scholarship.amount}</p>
                          </div>
                          <span className="bg-green-100 text-green-800 px-2 py-1 text-xs font-semibold rounded-full">
                            Eligible
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScholarshipEligibilityChecker;
