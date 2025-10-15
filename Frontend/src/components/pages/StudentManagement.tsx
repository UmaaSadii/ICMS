import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { studentService, courseService, departmentService } from '../../api/apiService';
import StudentModal from '../modals/StudentModal';
import EnhancedStudentProfile from '../EnhancedStudentProfile';
import { Pie } from 'react-chartjs-2';

interface Course {
  course_id: number;
  name: string;
  code: string;
  description?: string;
}

interface Department {
  id: number;
  name: string;
  code: string;
  description: string;
  department_id?: number;
  departmentId?: number;
}

interface Student {
  student_id: number;
  id?: number;
  name: string;
  email: string;
  phone: string;
  department?: Department | null;
  semester?: { semester_id: number; name: string; semester_code: string } | null;
  batch?: string;
  father_guardian: string;
  image?: string;
  attendance_percentage: number;
  gpa: number;
  performance_notes?: string;
}

interface StudentManagementProps {
  activeTab: string;
}

const StudentManagement: React.FC<StudentManagementProps> = ({ activeTab }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  const [departmentCounts, setDepartmentCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showStudentModal, setShowStudentModal] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showStudentProfile, setShowStudentProfile] = useState<boolean>(false);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);


  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentService.getAllStudents();
      setStudents(response.data);

      // Calculate counts per department with better error handling
      const counts: Record<number, number> = {};
      response.data.forEach((student: Student) => {
        let departmentId: number | null = null;

        // Handle different possible department structures
        if (student.department) {
          if (typeof student.department === 'object' && student.department !== null) {
            // If department is an object, try different ID fields
            if (student.department.department_id) {
              departmentId = student.department.department_id;
            } else if (student.department.id) {
              departmentId = student.department.id;
            } else if (student.department.departmentId) {
              departmentId = student.department.departmentId;
            }
          } else if (typeof student.department === 'number') {
            // If department is just an ID number
            departmentId = student.department;
          }
        }

        // Also check if department is stored as a direct property
        if (!departmentId && (student as any).department_id) {
          departmentId = (student as any).department_id;
        }

        if (departmentId) {
          counts[departmentId] = (counts[departmentId] || 0) + 1;
        }
      });

      console.log('Department counts calculated:', counts);
      console.log('Sample student data:', response.data.slice(0, 2)); // Log first 2 students for debugging
      setDepartmentCounts(counts);

    } catch (error: any) {
      setError(error.message || 'Failed to fetch students');
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      const response = await courseService.getAllCourses();
      setCourses(response.data);
    } catch (error: any) {
      console.error('Failed to fetch courses:', error);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await departmentService.getAllDepartments();
      setDepartments(response.data);
    } catch (error: any) {
      console.error('Failed to fetch departments:', error);
    }
  }, []);



  useEffect(() => {
    if (activeTab === 'students') {
      fetchStudents();
      fetchCourses();
      fetchDepartments();
    }
  }, [activeTab, fetchStudents, fetchCourses, fetchDepartments]);



  const handleDeleteStudent = useCallback(async (id: number) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await studentService.deleteStudent(id);
        setStudents(prev => {
          const updated = prev.filter(student => student.student_id !== id);
          // Recalculate counts
          const counts: Record<number, number> = {};
          updated.forEach((student: Student) => {
            if (student.department && student.department.department_id) {
              counts[student.department.department_id] = (counts[student.department.department_id] || 0) + 1;
            }
          });
          setDepartmentCounts(counts);
          return updated;
        });
      } catch (error: any) {
        setError(error.message || 'Failed to delete student');
        console.error('Failed to delete student:', error);
      }
    }
  }, []);

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    return students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.department?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.semester?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.semester?.semester_code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  // Department chart data
  const departmentChartData = useMemo(() => {
    if (Object.keys(departmentCounts).length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{
          data: [100],
          backgroundColor: ['#e5e7eb']
        }]
      };
    }

    const chartData = Object.entries(departmentCounts).map(([deptId, count]) => {
      const dept = departments.find(d =>
        d.department_id === parseInt(deptId) ||
        d.id === parseInt(deptId) ||
        d.departmentId === parseInt(deptId)
      );
      return {
        department: dept?.name || dept?.department_name || `Department ${deptId}`,
        count: count as number
      };
    });

    return {
      labels: chartData.map(item => item.department),
      datasets: [{
        label: 'Students by Department',
        data: chartData.map(item => item.count),
        backgroundColor: [
          '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
          '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  }, [departmentCounts, departments]);

  return (
    <div className="p-6" role="main" aria-labelledby="student-management-heading">
      <div className="flex justify-between items-center mb-6">
        <h2 id="student-management-heading" className="text-2xl font-bold text-gray-800">
          Students ({filteredStudents.length})
        </h2>
        <div className="flex space-x-4">
          <input
            id="student-search"
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-describedby="student-search-help"
          />
          <span id="student-search-help" className="sr-only">
            Search by student name, email, department name, or semester
          </span>
          <button
            onClick={() => {
              setEditingStudent(null);
              setShowStudentModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label="Add new student"
          >
            Add Student
          </button>
        </div>
      </div>



      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Department Statistics */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Department Statistics</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-gray-600">Loading department statistics...</span>
          </div>
        ) : Object.keys(departmentCounts).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="mt-2">No department statistics available</p>
            <p className="text-sm">Students need to be assigned to departments to see statistics</p>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
              <p className="text-sm text-yellow-800 font-medium">Debug Information:</p>
              <p className="text-xs text-yellow-700">Total students: {students.length}</p>
              <p className="text-xs text-yellow-700">Students with departments: {students.filter(s => s.department).length}</p>
              <p className="text-xs text-yellow-700">Available departments: {departments.length}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(departmentCounts).map(([deptId, count]) => {
              // Find department info from the departments state with multiple fallback options
              const dept = departments.find(d =>
                d.id === parseInt(deptId) ||
                d.department_id === parseInt(deptId) ||
                d.departmentId === parseInt(deptId)
              );

              const totalStudents = Object.values(departmentCounts).reduce((sum, count) => sum + count, 0);
              const percentage = totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(1) : '0';

              return (
                <div key={deptId} className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800 text-sm">
                      {dept?.name || dept?.department_name || `Department ${deptId}`}
                    </h4>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {percentage}%
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-indigo-600 mb-1">{count}</p>
                  <p className="text-sm text-gray-600">students</p>
                  {dept?.code && (
                    <p className="text-xs text-gray-500 mt-1">Code: {dept.code}</p>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    ID: {deptId}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary Statistics */}
        {Object.keys(departmentCounts).length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Total Departments</p>
                <p className="text-lg font-bold text-gray-900">{Object.keys(departmentCounts).length}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-lg font-bold text-gray-900">{Object.values(departmentCounts).reduce((sum, count) => sum + count, 0)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Avg per Department</p>
                <p className="text-lg font-bold text-gray-900">
                  {Object.keys(departmentCounts).length > 0
                    ? (Object.values(departmentCounts).reduce((sum, count) => sum + count, 0) / Object.keys(departmentCounts).length).toFixed(1)
                    : '0'
                  }
                </p>
              </div>
            </div>
          </div>
        )}


      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              Students ({filteredStudents.length})
            </h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-sm text-gray-600">Active</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64" role="status" aria-live="polite">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <span className="sr-only">Loading students...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200" role="table">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Semester
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student, index) => (
                  <tr key={student.student_id} className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-gray-50/30' : 'bg-white'}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {student.image ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={student.image}
                              alt={`${student.name} profile`}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                              <span className="text-white font-medium text-sm" aria-hidden="true">
                                {student.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">{student.name}</div>
                          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block">ID: {student.student_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.department ? (
                        <div className="bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                          <div className="font-semibold text-green-900">{student.department.name}</div>
                          <div className="text-green-600 text-xs">{student.department.code}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 bg-gray-100 px-3 py-2 rounded-lg">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.semester ? (
                        <div className="bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
                          <div className="font-semibold text-purple-900">{student.semester.name}</div>
                          <div className="text-purple-600 text-xs">{student.semester.semester_code}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 bg-gray-100 px-3 py-2 rounded-lg">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.batch ? (
                        <div className="bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                          <div className="font-semibold text-blue-900">{student.batch}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 bg-gray-100 px-3 py-2 rounded-lg">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.email}</div>
                      <div className="text-sm text-gray-500">{student.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-sm text-gray-600">GPA:</span>
                          <span className="font-semibold text-gray-900">{student.gpa?.toFixed(2) || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <span className="text-sm text-gray-600">Attendance:</span>
                          <span className="font-semibold text-gray-900">{student.attendance_percentage?.toFixed(1) || 'N/A'}%</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setViewingStudent(student);
                            setShowStudentProfile(true);
                          }}
                          className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 focus:text-blue-900 focus:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
                          aria-label={`View profile of ${student.name}`}
                          title="View Profile"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setEditingStudent(student);
                            setShowStudentModal(true);
                          }}
                          className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 focus:text-indigo-900 focus:bg-indigo-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-lg"
                          aria-label={`Edit student ${student.name}`}
                          title="Edit Student"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student.student_id)}
                          className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 focus:text-red-900 focus:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-lg"
                          aria-label={`Delete student ${student.name}`}
                          title="Delete Student"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredStudents.length === 0 && !loading && (
          <div className="text-center py-12" role="status">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-.98-5.5-2.5m-.5-4h.01" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new student.'}
            </p>
          </div>
        )}
      </div>

      {/* Student Modal */}
      {showStudentModal && (
        <StudentModal
          isOpen={showStudentModal}
          studentId={editingStudent ? editingStudent.student_id : undefined}
          onClose={() => {
            setShowStudentModal(false);
            setEditingStudent(null);
          }}
          onSuccess={() => {
            fetchStudents();
          }}
        />
      )}

      {/* Student Profile Modal */}
      {showStudentProfile && viewingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-y-auto">
            <EnhancedStudentProfile
              studentId={viewingStudent.student_id}
              onClose={() => {
                setShowStudentProfile(false);
                setViewingStudent(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(StudentManagement);
