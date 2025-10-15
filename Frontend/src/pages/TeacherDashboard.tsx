import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bar, Line } from 'react-chartjs-2';
import { courseService, studentService } from '../api/apiService';
import AttendanceManagement from '../components/AttendanceManagement';
import ResultUpload from '../components/ResultUpload';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

export {};

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TeacherDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Add header animation effect
  useEffect(() => {
    const header = document.querySelector('.teacher-header');
    if (header) {
      header.classList.add('animate-fadeIn');
    }
  }, []);

  // Instructor data state
  const [instructorData, setInstructorData] = useState({
    courses: [] as any[],
    students: [] as any[],
    departments: [] as any[],
    stats: {
      totalCourses: 5,
      totalStudents: 120,
      totalDepartments: 0,
      avgAttendance: 85,
      pendingResults: 3,
    },
  });

  // Fetch real data for instructor dashboard stats
  useEffect(() => {
    const fetchInstructorData = async () => {
      try {
        const [coursesRes, studentsRes] = await Promise.all([
          courseService.getAllCourses(),
          studentService.getAllStudents(),
        ]);

        // Filter courses assigned to current instructor (assuming instructor ID is available)
        const assignedCourses = coursesRes.data.filter((course: any) =>
          course.instructor === currentUser?.id
        );

        // Calculate total students across assigned courses
        const totalStudents = studentsRes.data.length; // Simplified, would need proper filtering

        setInstructorData({
          courses: assignedCourses,
          students: studentsRes.data,
          departments: [], // Will be populated if needed
          stats: {
            totalCourses: assignedCourses.length,
            totalStudents,
            totalDepartments: 0, // Will be updated if departments are fetched
            avgAttendance: 85, // Would need real calculation
            pendingResults: 3, // Would need real calculation
          },
        });
      } catch (error) {
        console.error('Failed to fetch instructor dashboard data:', error);
        // Keep default values if fetch fails
      }
    };

    fetchInstructorData();
  }, [currentUser]);

  // Navigation tabs for instructor - limited access
  const tabs = useMemo(() => {
    return [
      { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      { id: 'attendance', label: 'Mark Attendance', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
      { id: 'results', label: 'Upload Results', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    ];
  }, []);

  // Render navigation tabs
  const renderTabs = () => {
    return (
      <div className="w-64 bg-gradient-to-b from-blue-800 to-indigo-900 text-white p-4 space-y-2 min-h-screen shadow-xl">
        <div className="mb-8 text-center">
          <div className="h-16 w-16 rounded-full bg-white mx-auto mb-2 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-700" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">FGPG Instructor</h3>
          <p className="text-xs text-indigo-200">Teaching Portal</p>
        </div>

        <nav>
          <ul className="space-y-1">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-2 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-700'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  <span>{tab.label}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="absolute bottom-4 right-4 text-center text-xs text-indigo-300">
            <p>Teaching Portal</p>
            <p>Version 1.0.0</p>
          </div>
        </nav>
      </div>
    );
  };

  // Chart data for instructor performance
  const performanceChartData = useMemo(() => {
    return {
      labels: ['Assignments', 'Quizzes', 'Mid-term', 'Final', 'Projects'],
      datasets: [
        {
          label: 'Average Score',
          data: [78, 82, 75, 80, 85],
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
        },
      ],
    };
  }, []);

  // Attendance trend chart data
  const attendanceChartData = useMemo(() => {
    return {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
      datasets: [
        {
          label: 'Attendance Rate',
          data: [88, 92, 85, 90, 87, 93],
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
        },
      ],
    };
  }, []);

  // Chart options
  const performanceChartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: 'Student Performance',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
        },
      },
    };
  }, []);

  const attendanceChartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: 'Attendance Trends',
        },
      },
    };
  }, []);

  // Recent activities state - limited to attendance and results
  const [recentActivities] = useState([
    { id: 1, type: 'attendance_marked', user: 'CS101', timestamp: '2023-06-15T10:30:00Z', details: 'Marked attendance for 45 students' },
    { id: 2, type: 'result_uploaded', user: 'PHY101', timestamp: '2023-06-14T16:20:00Z', details: 'Uploaded final exam results' },
    { id: 3, type: 'attendance_marked', user: 'ENG202', timestamp: '2023-06-14T09:45:00Z', details: 'Marked attendance for 32 students' },
    { id: 4, type: 'result_uploaded', user: 'MATH301', timestamp: '2023-06-13T14:20:00Z', details: 'Uploaded midterm results' },
    { id: 5, type: 'attendance_marked', user: 'BIO201', timestamp: '2023-06-13T10:30:00Z', details: 'Marked attendance for 28 students' },
  ]);

  // Main render function
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      {renderTabs()}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg border-b border-indigo-300 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 rounded-full p-2">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {tabs.find(tab => tab.id === activeTab)?.label || 'Dashboard'}
                </h1>
                <p className="text-indigo-100 mt-1 flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Welcome back, {currentUser?.username || 'Instructor'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right bg-white bg-opacity-10 rounded-lg p-3">
                <p className="text-xs text-indigo-200 uppercase tracking-wide">Last Login</p>
                <p className="text-sm font-semibold text-white flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {new Date().toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 shadow-md"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Dashboard Overview */}
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">Instructor Dashboard Overview</h2>
                  <p className="text-gray-600">Mark attendance and upload results for all departments added by admin.</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
                  >
                    <div className="flex items-center">
                      <div className="p-3 bg-indigo-100 rounded-lg">
                        <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">My Courses</p>
                        <p className="text-2xl font-bold text-gray-900">{instructorData.stats.totalCourses}</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
                  >
                    <div className="flex items-center">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Students</p>
                        <p className="text-2xl font-bold text-gray-900">{instructorData.stats.totalStudents}</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
                  >
                    <div className="flex items-center">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
                        <p className="text-2xl font-bold text-gray-900">{instructorData.stats.avgAttendance}%</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
                  >
                    <div className="flex items-center">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Pending Results</p>
                        <p className="text-2xl font-bold text-gray-900">{instructorData.stats.pendingResults}</p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Performance Chart */}
                  <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Performance</h3>
                    <div className="h-48">
                      <Bar data={performanceChartData} options={performanceChartOptions} />
                    </div>
                  </div>

                  {/* Attendance Chart */}
                  <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Trends</h3>
                    <div className="h-48">
                      <Line data={attendanceChartData} options={attendanceChartOptions} />
                    </div>
                  </div>
                </div>

                {/* Recent Activities */}
                <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
                  <div className="space-y-3">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            activity.type === 'attendance_marked' ? 'bg-green-500' :
                            activity.type === 'grade_updated' ? 'bg-blue-500' :
                            activity.type === 'assignment_graded' ? 'bg-yellow-500' :
                            activity.type === 'result_uploaded' ? 'bg-purple-500' :
                            'bg-gray-500'
                          }`}></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{activity.user}</p>
                            <p className="text-xs text-gray-600">{activity.details}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'attendance' && (
              <AttendanceManagement />
            )}

            {activeTab === 'results' && (
              <ResultUpload />
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboard;
