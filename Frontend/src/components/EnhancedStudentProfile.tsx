import React, { useState, useEffect } from 'react';
import { studentService } from '../api/apiService';

interface EnhancedStudentProfileProps {
  studentId?: number;
  onClose?: () => void;
}

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
  phone: string;
  courses?: Course[];
  department?: {
    id: number;
    name: string;
  } | null;
  father_guardian?: string;
  guardian_name?: string;
  guardian_contact?: string;
  address?: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  registration_number?: string;
  image?: string;
  attendance_percentage: number;
  gpa: number;
  performance_notes?: string;
  enrollment_date?: string;
}

interface ScholarshipPrediction {
  eligibility_status: string;
  eligibility_score: number;
  eligibility_factors: string[];
  recommended_scholarships: {
    id: number;
    name: string;
    amount: number;
    requirements: string[];
  }[];
}

const EnhancedStudentProfile: React.FC<EnhancedStudentProfileProps> = ({ studentId, onClose }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [scholarshipPrediction, setScholarshipPrediction] = useState<ScholarshipPrediction | null>(null);
  const [predictingScholarship, setPredictingScholarship] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'academic' | 'personal' | 'scholarship'>('overview');
  
  useEffect(() => {
    const fetchStudent = async () => {
      if (!studentId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await studentService.getStudentById(studentId);
        setStudent(response.data);
      } catch (error: any) {
        setError(error.response?.data?.message || 'Failed to fetch student profile');
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [studentId]);

  const predictScholarship = async () => {
    if (!studentId || !student) return;
    
    setPredictingScholarship(true);
    try {
      // Simulate scholarship prediction API call
      const mockPrediction: ScholarshipPrediction = {
        eligibility_status: student.gpa >= 3.5 ? 'Eligible' : 'Not Eligible',
        eligibility_score: Math.min(95, Math.max(20, (student.gpa * 20) + (student.attendance_percentage * 0.3))),
        eligibility_factors: [
          `GPA: ${student.gpa.toFixed(2)}/5.0`,
          `Attendance: ${student.attendance_percentage.toFixed(1)}%`,
          student.gpa >= 3.5 ? 'High academic performance' : 'Average academic performance',
          student.attendance_percentage >= 90 ? 'Excellent attendance record' : 'Good attendance record'
        ],
        recommended_scholarships: student.gpa >= 3.5 ? [
          {
            id: 1,
            name: 'Merit Scholarship',
            amount: 5000,
            requirements: ['GPA >= 3.5', 'Attendance >= 85%']
          },
          {
            id: 2,
            name: 'Excellence Award',
            amount: 3000,
            requirements: ['GPA >= 3.2', 'Good conduct']
          }
        ] : []
      };
      
      setScholarshipPrediction(mockPrediction);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to predict scholarship eligibility');
    } finally {
      setPredictingScholarship(false);
    }
  };
  
  const handleBack = () => {
    if (onClose) {
      onClose();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading student profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <svg className="h-8 w-8 text-red-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-lg font-medium text-red-800">Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center">
          <svg className="h-8 w-8 text-yellow-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h3 className="text-lg font-medium text-yellow-800">No Data</h3>
            <p className="text-yellow-600">No student data available</p>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '👤' },
    { id: 'academic', name: 'Academic', icon: '📚' },
    { id: 'personal', name: 'Personal', icon: 'ℹ️' },
    { id: 'scholarship', name: 'Scholarship', icon: '🎓' }
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-white shadow-lg">
                  {student.image ? (
                    <img src={student.image} alt={student.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-2xl font-bold">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">{student.name}</h1>
                  <p className="text-indigo-100 text-lg">{student.email}</p>
                  <p className="text-indigo-200">Student ID: {student.student_id}</p>
                </div>
              </div>
              <button
                onClick={handleBack}
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Student Overview</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium">GPA</p>
                      <p className="text-3xl font-bold text-blue-900">{student.gpa?.toFixed(2) || 'N/A'}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">Attendance</p>
                      <p className="text-3xl font-bold text-green-900">{student.attendance_percentage?.toFixed(1) || 'N/A'}%</p>
                    </div>
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
                  <div className="flex flex-col">
                    <p className="text-purple-600 text-sm font-medium mb-2">Courses</p>
                    {student.courses && student.courses.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1 max-h-48 overflow-y-auto">
                        {student.courses.map((course) => (
                          <li key={course.course_id} className="text-purple-900 font-bold">
                            {course.name} ({course.code})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-purple-900 font-bold">No courses assigned</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'academic' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Academic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700">Course Details</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {student.courses && student.courses.length > 0 ? (
                      <div className="space-y-3">
                        <p className="font-medium">Assigned Courses:</p>
                        {student.courses.map((course) => (
                          <div key={course.course_id} className="bg-white p-3 rounded border">
                            <p><span className="font-medium">Name:</span> {course.name}</p>
                            <p><span className="font-medium">Code:</span> {course.code}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>No courses assigned</p>
                    )}
                    <p><span className="font-medium">Department:</span> {student.department?.name || 'Not assigned'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700">Performance</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p><span className="font-medium">GPA:</span> {student.gpa?.toFixed(2) || 'N/A'}/5.0</p>
                    <p><span className="font-medium">Attendance:</span> {student.attendance_percentage?.toFixed(1) || 'N/A'}%</p>
                    <p><span className="font-medium">Enrollment:</span> {student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'personal' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Personal Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700">Basic Details</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><span className="font-medium">Email:</span> {student.email}</p>
                    <p><span className="font-medium">Phone:</span> {student.phone}</p>
                    <p><span className="font-medium">Gender:</span> {student.gender || 'Not specified'}</p>
                    <p><span className="font-medium">Blood Group:</span> {student.blood_group || 'Not specified'}</p>
                    <p><span className="font-medium">Date of Birth:</span> {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'Not specified'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700">Guardian Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><span className="font-medium">Guardian Name:</span> {student.father_guardian || student.guardian_name || 'Not specified'}</p>
                    <p><span className="font-medium">Guardian Contact:</span> {student.guardian_contact || 'Not specified'}</p>
                    <p><span className="font-medium">Address:</span> {student.address || 'Not specified'}</p>
                    <p><span className="font-medium">Registration No:</span> {student.registration_number || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scholarship' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Scholarship Predictions</h2>
                <button
                  onClick={predictScholarship}
                  disabled={predictingScholarship}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  {predictingScholarship ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span>Analyze Eligibility</span>
                    </>
                  )}
                </button>
              </div>

              {scholarshipPrediction ? (
                <div className="space-y-6">
                  <div className={`p-6 rounded-xl ${scholarshipPrediction.eligibility_status === 'Eligible' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-800">Eligibility Status</h3>
                      <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                        scholarshipPrediction.eligibility_status === 'Eligible' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {scholarshipPrediction.eligibility_status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Eligibility Score</span>
                          <span>{scholarshipPrediction.eligibility_score}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${scholarshipPrediction.eligibility_score >= 70 ? 'bg-green-500' : scholarshipPrediction.eligibility_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${scholarshipPrediction.eligibility_score}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-700 mb-3">Eligibility Factors</h4>
                      <ul className="space-y-2">
                        {scholarshipPrediction.eligibility_factors.map((factor, index) => (
                          <li key={index} className="flex items-center space-x-2 text-gray-600">
                            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-700 mb-3">Recommended Scholarships</h4>
                      {scholarshipPrediction.recommended_scholarships.length > 0 ? (
                        <div className="space-y-3">
                          {scholarshipPrediction.recommended_scholarships.map((scholarship) => (
                            <div key={scholarship.id} className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="font-semibold text-blue-900">{scholarship.name}</h5>
                                <span className="text-lg font-bold text-blue-600">${scholarship.amount.toLocaleString()}</span>
                              </div>
                              <div className="text-sm text-blue-700">
                                <p className="font-medium mb-1">Requirements:</p>
                                <ul className="list-disc list-inside space-y-1">
                                  {scholarship.requirements.map((req, index) => (
                                    <li key={index}>{req}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No scholarships available at this time.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Scholarship Analysis</h3>
                  <p className="text-gray-500">Click "Analyze Eligibility" to get personalized scholarship recommendations based on academic performance.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedStudentProfile;
