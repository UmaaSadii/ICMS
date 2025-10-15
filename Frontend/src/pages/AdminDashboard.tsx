import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { messagingService, departmentService, courseService, studentService as apiStudentService } from '../api/apiService';
import { instructorService, studentService } from '../api/studentInstructorService';
import { academicsService } from '../api/academicsService_enhanced';
import StudentManagement from '../components/pages/StudentManagement';
import DepartmentManagement from '../components/pages/DepartmentManagement';
import CourseManagement from '../components/pages/CourseManagement';
import TeacherManagement from '../components/pages/TeacherManagement';
import FeeManagement from '../components/FeeManagement';
import MessagingSystem from '../components/messaging/MessagingSystem';
import SystemHealthWidget from '../components/dashboard/SystemHealthWidget';
import NotificationPanel from '../components/dashboard/NotificationPanel';
import QuickActions from '../components/dashboard/QuickActions';
import AIInsights from '../components/dashboard/AIInsights';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import CalendarWidget from '../components/dashboard/CalendarWidget';
import WeatherWidget from '../components/dashboard/WeatherWidget';
import { jsPDF } from 'jspdf';
import LibraryManagement from '../components/pages/LibraryManagement';
import TransportManagement from '../components/pages/TransportManagement';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

type TabId = 'dashboard' | 'students' | 'instructors' | 'departments' | 'courses' | 'results' | 'fees' | 'events' | 'messaging' | 'scholarships'|'library'|'transport';

const AdminDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  // Results tab state
  const [departments, setDepartments] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [studentCourses, setStudentCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [showResultDetailsModal, setShowResultDetailsModal] = useState(false);
  const [selectedResultForDetails, setSelectedResultForDetails] = useState<any>(null);
  const [resultDetailsActiveTab, setResultDetailsActiveTab] = useState<'course' | 'all'>('course');

  // Add header animation effect
  useEffect(() => {
    const header = document.querySelector('.admin-header');
    if (header) {
      header.classList.add('animate-fadeIn');
    }
  }, []);

  // Admin data state
  const [adminData, setAdminData] = useState({
    users: [] as any[],
    departments: [] as any[],
    stats: {
      totalUsers: 1200,
      activeUsers: 850,
      totalDepartments: 25,
      totalCourses: 40,
      totalStudents: 1000,
      totalStaff: 200,
    },
  });

  // Department counts for pie chart
  const [departmentCounts, setDepartmentCounts] = useState<Record<number, number>>({});

  // Fetch real data for dashboard stats
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [studentsRes, departmentsRes, coursesRes, instructorsRes] = await Promise.all([
          apiStudentService.getAllStudents(),
          departmentService.getAllDepartments(),
          courseService.getAllCourses(),
          instructorService.getAllInstructors(),
        ]);

        const totalUsers = studentsRes.data.length + instructorsRes.data.length;
        const activeUsers = Math.floor(totalUsers * 0.7); // Assuming 70% are active

        // Calculate counts per department with better error handling
        const counts: Record<number, number> = {};
        studentsRes.data.forEach((student: any) => {
          let departmentId: number | null = null;

          // Handle different possible department structures
          if (student.department) {
            if (typeof student.department === 'object' && student.department !== null) {
              // If department is an object, try different ID fields
              if (student.department.id) {
                departmentId = student.department.id;
              } else if (student.department.department_id) {
                departmentId = student.department.department_id;
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

        setDepartmentCounts(counts);

        setAdminData({
          users: [...studentsRes.data, ...instructorsRes.data],
          departments: departmentsRes.data,
          stats: {
            totalUsers,
            activeUsers,
            totalDepartments: departmentsRes.data.length,
            totalCourses: coursesRes.data.length,
            totalStudents: studentsRes.data.length,
            totalStaff: instructorsRes.data.length,
          },
        });
      } catch (error) {
        console.error('Failed to fetch admin dashboard data:', error);
        // Keep default values if fetch fails
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch departments for results tab
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setResultsLoading(true);
        const response = await academicsService.getDepartments();
        setDepartments(response.data);
      } catch (error) {
        console.error('Failed to fetch departments:', error);
        setDepartments([]);
      } finally {
        setResultsLoading(false);
      }
    };

    if (activeTab === 'results') {
      fetchDepartments();
    }
  }, [activeTab]);

  // Fetch semesters when department is selected
  useEffect(() => {
    const fetchSemesters = async () => {
      if (!selectedDepartment) {
        setSemesters([]);
        setSelectedSemester(null);
        return;
      }

      try {
        const response = await academicsService.getSemestersByDepartment(selectedDepartment);
        // Filter to only semesters that have students
        try {
          const studentsResponse = await apiStudentService.getAllStudents({ department: selectedDepartment });
          const students = studentsResponse.data;
          const semesterIds = Array.from(new Set(
            students
              .map((student: any) => student.semester?.id || student.semester)
              .filter((id: any) => id != null)
          ));
          const semestersWithStudents = response.data.filter((sem: any) => semesterIds.includes(sem.id));
          setSemesters(semestersWithStudents);
        } catch (error) {
          console.error('Failed to filter semesters:', error);
          // Keep all semesters if filtering fails
          setSemesters(response.data);
        }
        setSelectedSemester(null); // Reset semester selection
        setSelectedStudent(null); // Reset student selection
        setStudentResults([]);
      } catch (error) {
        console.error('Failed to fetch semesters:', error);
        setSemesters([]);
      }
    };

    if (selectedDepartment) {
      fetchSemesters();
    }
  }, [selectedDepartment]);

  // Fetch students when semester is selected
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedDepartment || !selectedSemester) {
        setStudents([]);
        setSelectedStudent(null);
        setStudentResults([]);
        return;
      }

      try {
        setLoading(true);
        // Use server-side filtering instead of client-side filtering
        const response = await apiStudentService.getAllStudents({
          department: selectedDepartment,
          semester: selectedSemester
        });
        setStudents(response.data);
        setSelectedStudent(null); // Reset student selection
        setStudentResults([]);
      } catch (error) {
        console.error('Failed to fetch students:', error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedDepartment && selectedSemester) {
      fetchStudents();
    }
  }, [selectedDepartment, selectedSemester]);

  // Fetch student results and courses when student is selected
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!selectedStudent) return;

      try {
        setResultsLoading(true);

        // Fetch results and assigned courses for the student
        const [resultsResponse, coursesResponse] = await Promise.all([
          academicsService.getStudentResults(selectedStudent.toString()),
          studentService.getStudentCourses(selectedStudent.toString())
        ]);

        // Extract results array from the API response (handles both basic and enhanced endpoints)
        const resultsData = resultsResponse.data;
        const results = Array.isArray(resultsData) ? resultsData : (resultsData.results || []);
        setStudentResults(results);
        setStudentCourses(coursesResponse.data);
      } catch (error) {
        console.error('Failed to fetch student results:', error);
        setStudentResults([]);
        setStudentCourses([]);
      } finally {
        setResultsLoading(false);
      }
    };

    if (selectedStudent) {
      fetchStudentData();
    }
  }, [selectedStudent, selectedSemester]);

  // Helper function to safely get course name
  const getCourseName = (courseData: any): string => {
    if (!courseData || courseData === null || courseData === undefined) return 'N/A';

    try {
      // If it's an object with a name property, extract the name
      if (typeof courseData === 'object' && courseData !== null && 'name' in courseData) {
        return courseData.name || 'N/A';
      }

      // If it's an object with course_name property, extract the course_name
      if (typeof courseData === 'object' && courseData !== null && 'course_name' in courseData) {
        return courseData.course_name || 'N/A';
      }

      // If it's an object with title property
      if (typeof courseData === 'object' && courseData !== null && 'title' in courseData) {
        return courseData.title || 'N/A';
      }

      // If it's an object with code property
      if (typeof courseData === 'object' && courseData !== null && 'code' in courseData) {
        return courseData.code || 'N/A';
      }

      // If it's an object with subject property
      if (typeof courseData === 'object' && courseData !== null && 'subject' in courseData) {
        return courseData.subject || 'N/A';
      }

      // Fallback for object with id
      if (typeof courseData === 'object' && courseData !== null && courseData.id) {
        return `Course ${courseData.id}`;
      }

      // If it's a string, return as is
      if (typeof courseData === 'string') {
        return courseData || 'N/A';
      }

      // Fallback
      return 'N/A';
    } catch (error) {
      console.error('Error extracting course name:', error, courseData);
      return 'N/A';
    }
  };


  // Helper function to safely get department name
  const getDepartmentName = (departmentData: any): string => {
    if (!departmentData || departmentData === null || departmentData === undefined) return 'N/A';

    try {
      // If it's an object with a name property, extract the name
      if (typeof departmentData === 'object' && departmentData !== null && 'name' in departmentData) {
        return departmentData.name || 'N/A';
      }

      // If it's an object with department_name property
      if (typeof departmentData === 'object' && departmentData !== null && 'department_name' in departmentData) {
        return departmentData.department_name || 'N/A';
      }

      // If it's an object with title property
      if (typeof departmentData === 'object' && departmentData !== null && 'title' in departmentData) {
        return departmentData.title || 'N/A';
      }

      // If it's an object with code property
      if (typeof departmentData === 'object' && departmentData !== null && 'code' in departmentData) {
        return departmentData.code || 'N/A';
      }

      // If it's a string, return as is
      if (typeof departmentData === 'string') {
        return departmentData || 'N/A';
      }

      // If it's an object with other properties, try to find a suitable name
      if (typeof departmentData === 'object' && departmentData !== null) {
        if (departmentData.id) return `Department ${departmentData.id}`;
      }

      return 'N/A';
    } catch (error) {
      console.error('Error extracting department name:', error, departmentData);
      return 'N/A';
    }
  };

  // Helper function to safely get semester name
  const getSemesterName = (semesterData: any): string => {
    if (!semesterData || semesterData === null || semesterData === undefined) return 'N/A';

    try {
      // If it's an object with a name property, extract the name
      if (typeof semesterData === 'object' && semesterData !== null && 'name' in semesterData) {
        return semesterData.name || 'N/A';
      }

      // If it's an object with semester_name property
      if (typeof semesterData === 'object' && semesterData !== null && 'semester_name' in semesterData) {
        return semesterData.semester_name || 'N/A';
      }

      // If it's an object with title property
      if (typeof semesterData === 'object' && semesterData !== null && 'title' in semesterData) {
        return semesterData.title || 'N/A';
      }

      // If it's an object with code property
      if (typeof semesterData === 'object' && semesterData !== null && 'code' in semesterData) {
        return semesterData.code || 'N/A';
      }

      // If it's an object with semester_code property
      if (typeof semesterData === 'object' && semesterData !== null && 'semester_code' in semesterData) {
        return semesterData.semester_code || 'N/A';
      }

      // If it's a string, return as is
      if (typeof semesterData === 'string') {
        return semesterData || 'N/A';
      }

      // If it's an object with other properties, try to find a suitable name
      if (typeof semesterData === 'object' && semesterData !== null) {
        if (semesterData.id) return `Semester ${semesterData.id}`;
      }

      return 'N/A';
    } catch (error) {
      console.error('Error extracting semester name:', error, semesterData);
      return 'N/A';
    }
  };

  // Helper function to safely get student name
  const getStudentName = (studentData: any): string => {
    if (!studentData || studentData === null || studentData === undefined) return 'N/A';

    try {
      // If it's an object with user property containing first_name and last_name
      if (typeof studentData === 'object' && studentData !== null && studentData.user) {
        const user = studentData.user;
        if (!user || user === null || user === undefined) return 'N/A';
        const firstName = user.first_name || '';
        const lastName = user.last_name || '';
        return `${firstName} ${lastName}`.trim() || 'N/A';
      }

      // If it's an object with name property
      if (typeof studentData === 'object' && studentData !== null && 'name' in studentData) {
        return studentData.name || 'N/A';
      }

      // If it's an object with student_name property
      if (typeof studentData === 'object' && studentData !== null && 'student_name' in studentData) {
        return studentData.student_name || 'N/A';
      }

      // If it's an object with first_name and last_name properties
      if (typeof studentData === 'object' && studentData !== null && 'first_name' in studentData && 'last_name' in studentData) {
        return `${studentData.first_name || ''} ${studentData.last_name || ''}`.trim() || 'N/A';
      }

      // If it's an object with full_name property
      if (typeof studentData === 'object' && studentData !== null && 'full_name' in studentData) {
        return studentData.full_name || 'N/A';
      }

      // If it's a string, return as is
      if (typeof studentData === 'string') {
        return studentData || 'N/A';
      }

      // If it's an object with other properties, try to find a suitable name
      if (typeof studentData === 'object' && studentData !== null) {
        if (studentData.student_id) return `Student ${studentData.student_id}`;
        if (studentData.id) return `Student ${studentData.id}`;
      }

      return 'N/A';
    } catch (error) {
      console.error('Error extracting student name:', error, studentData);
      return 'N/A';
    }
  };

  // Generate PDF Report Card
  const handleViewResultDetails = (result: any) => {
    setSelectedResultForDetails(result);
    setShowResultDetailsModal(true);
  };

  const generateReportCard = useCallback(() => {
    if (!selectedStudent || studentResults.length === 0) return;

    const doc = new jsPDF();
    const selectedStudentData = students.find(s => s.id === selectedStudent);

    // Header
    doc.setFontSize(20);
    doc.text('FGPG University', 105, 20, { align: 'center' });
    doc.setFontSize(16);
    doc.text('Student Report Card', 105, 30, { align: 'center' });

    // Student Information
    doc.setFontSize(12);
    doc.text(`Student Name: ${selectedStudentData?.user?.first_name} ${selectedStudentData?.user?.last_name}`, 20, 50);
    doc.text(`Student ID: ${selectedStudentData?.student_id}`, 20, 60);
    doc.text(`Department: ${departments.find(d => d.id === selectedDepartment)?.name}`, 20, 70);
    doc.text(`Semester: ${getSemesterName(selectedStudentData?.semester)}`, 20, 80);

    // Results Table
    let yPosition = 100;
    doc.setFontSize(14);
    doc.text('Academic Results', 20, yPosition);
    yPosition += 10;

    // Table headers
    doc.setFontSize(10);
    doc.text('Course', 20, yPosition);
    doc.text('Grade', 120, yPosition);
    doc.text('GPA', 160, yPosition);
    yPosition += 5;

    // Draw line
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 10;

    // Results data
    if (studentResults && Array.isArray(studentResults)) {
      studentResults.forEach((result: any) => {
        doc.text(result.subject || 'N/A', 20, yPosition);
        doc.text(result.grade || 'N/A', 120, yPosition);
        doc.text(result.gpa?.toString() || 'N/A', 160, yPosition);
        yPosition += 10;
      });
    }

    // Footer
    yPosition += 20;
    doc.setFontSize(8);
    doc.text('Generated on: ' + new Date().toLocaleDateString(), 20, yPosition);
    doc.text('FGPG University Management System', 20, yPosition + 10);

    // Save the PDF
    doc.save(`report_card_${selectedStudentData?.student_id}.pdf`);
  }, [selectedStudent, studentResults, students, departments, selectedDepartment]);

  // Navigation tabs
  const tabs = useMemo<{ id: TabId; label: string; icon: string }[]>(() => {
    return [
      { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      { id: 'students', label: 'Students', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
      { id: 'instructors', label: 'Instructors', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
      { id: 'departments', label: 'Departments', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
      { id: 'results', label: 'Results', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
      { id: 'fees', label: 'Fees', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
      { id: 'events', label: 'Events', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { id: 'messaging', label: 'Messaging', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
      { id: 'scholarships', label: 'Scholarships', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
      { id: 'library', label: 'Library',icon: 'M4 6a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm2 0h10v12H6V6zm3 2h4v2H9V8z' },
      { id: 'transport', label: 'Transport', icon: 'M3 10h.01M12 10h.01M16 10h.01M4 20h16a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2zm2-4h12v2H5v-2zm0-4h12v2H5v-2zm0-4h12v2H5V8z' },
    ]
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
          <h3 className="text-lg font-semibold">FGPG Admin</h3>
          <p className="text-xs text-indigo-200">University Management</p>
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
          <div className="mt-8">
            <button
              onClick={logout}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
              Logout
            </button>
          </div>
          <div className="absolute bottom-4 right-4 text-center text-xs text-indigo-300">
            <p>University Management</p>
            <p>Version 1.0.0</p>
          </div>
        </nav>
      </div>
    );
  };

  // Render Results Tab
  const renderResultsTab = () => {
    const selectedStudentData = students.find(s => s.id === selectedStudent);

    return (
      <motion.div
        key="results"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
          <motion.h2
            className="text-2xl font-bold text-gray-900 dark:text-white dark:bg-gradient-to-r dark:from-indigo-600 dark:to-purple-600 dark:bg-clip-text dark:text-transparent mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          >
            Student Results Management
          </motion.h2>

          {/* Selection Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Department
              </label>
              <select
                value={selectedDepartment || ''}
                onChange={(e) => setSelectedDepartment(Number(e.target.value) || null)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Choose a department...</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {getDepartmentName(dept)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Semester
              </label>
              <select
                value={selectedSemester || ''}
                onChange={(e) => setSelectedSemester(Number(e.target.value) || null)}
                disabled={!selectedDepartment || !semesters.length}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">
                  {selectedDepartment ? (semesters.length ? 'Choose a semester...' : 'No semesters available') : 'Select department first'}
                </option>
                {semesters.map((sem) => (
                  <option key={sem.id} value={sem.id}>
                    {getSemesterName(sem)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Student
              </label>
              <select
                value={selectedStudent || ''}
                onChange={(e) => setSelectedStudent(Number(e.target.value) || null)}
                disabled={!selectedDepartment || !selectedSemester || loading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">
                  {loading ? 'Loading students...' : (selectedDepartment && selectedSemester) ? 'Choose a student...' : 'Select department and semester first'}
                </option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {getStudentName(student)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Student Information */}
          {selectedStudentData && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Student Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                  <p className="font-medium text-gray-900 dark:text-white">{getStudentName(selectedStudentData)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Student ID</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedStudentData.student_id || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Department</p>
                  <p className="font-medium text-gray-900 dark:text-white">{getDepartmentName(departments.find(d => d.id === selectedDepartment))}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Semester</p>
                  <p className="font-medium text-gray-900 dark:text-white">{getSemesterName(selectedStudentData?.semester)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

          {/* Results Display */}
          {selectedStudent && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Academic Results</h3>
                <button
                  onClick={generateReportCard}
                  disabled={studentResults.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:dark:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Generate Report Card</span>
                </button>
              </div>

              {resultsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">Loading results...</p>
                </div>
              ) : (
                <div>
                  {/* Course Overview */}
                  {studentCourses.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Course Overview</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {studentCourses.map((course, index) => {
                          const result = studentResults && Array.isArray(studentResults)
                            ? studentResults.find(r => r.subject === getCourseName(course))
                            : null;

                          return (
                            <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="font-medium text-gray-900 dark:text-white">{getCourseName(course)}</h5>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${result ? (result.grade === 'A' || result.grade === 'A-' || result.grade === 'B+' || result.grade === 'B' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : result.grade === 'C' || result.grade === 'C-' || result.grade === 'D' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200') : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'}`}>
                                  {result ? 'Completed' : 'Pending'}
                                </span>
                              </div>
                              {result && (
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  <p>Grade: <span className="font-medium">{result.grade || 'N/A'}</span></p>
                                  <p>GPA: <span className="font-medium">{result.gpa || 'N/A'}</span></p>
                                </div>
                              )}
                              {!result && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">Result pending</p>
                              )}
                            </div>
                          );
                              })}
                      </div>
                    </div>
                  )}

                  {/* Detailed Results Table */}
                  {studentResults.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Course
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Grade
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              GPA
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                          {studentResults.map((result, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {result.subject}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {result.grade || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {result.gpa || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${result.grade === 'A' || result.grade === 'A-' || result.grade === 'B+' || result.grade === 'B' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : result.grade === 'C' || result.grade === 'C-' || result.grade === 'D' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                  {result.grade ? 'Completed' : 'Pending'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => handleViewResultDetails(result)}
                                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="mt-2">No results found for this student.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        {/* Result Details Modal */}
        {showResultDetailsModal && selectedResultForDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Result Details</h3>
                  <button
                    onClick={() => setShowResultDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-gray-200 mb-6">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setResultDetailsActiveTab('course')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        resultDetailsActiveTab === 'course'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Course Details
                    </button>
                    <button
                      onClick={() => setResultDetailsActiveTab('all')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        resultDetailsActiveTab === 'all'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      All Courses
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                <div>
                  {resultDetailsActiveTab === 'course' ? (
                    <div className="space-y-6">
                      {/* Basic Information */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Course Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Course</p>
                            <p className="font-medium">{selectedResultForDetails.subject || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Exam Type</p>
                            <p className="font-medium">{selectedResultForDetails.exam_type || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Exam Date</p>
                            <p className="font-medium">
                              {selectedResultForDetails.exam_date
                                ? new Date(selectedResultForDetails.exam_date).toLocaleDateString()
                                : 'N/A'
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Grade</p>
                            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${selectedResultForDetails.grade === 'F' ? 'bg-red-100 text-red-800' : selectedResultForDetails.grade?.startsWith('A') ? 'bg-green-100 text-green-800' : selectedResultForDetails.grade?.startsWith('B') ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {selectedResultForDetails.grade || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Marks Breakdown */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Marks Breakdown</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Obtained Marks</span>
                            <span className="font-medium">{selectedResultForDetails.obtained_marks || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Total Marks</span>
                            <span className="font-medium">{selectedResultForDetails.total_marks || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Percentage</span>
                            <span className="font-medium">{selectedResultForDetails.percentage?.toFixed(1) || 0}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">GPA Points</span>
                            <span className="font-medium">{selectedResultForDetails.gpa || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Assessment Breakdown */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Complete Assessment Breakdown</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Detailed marks for all assessments in this course
                        </p>

                        {/* Get all results for this course */}
                        {(() => {
                          const courseResults = studentResults.filter(r => r.subject === selectedResultForDetails.subject);
                          const quiz1 = courseResults.find(r => r.exam_type.toLowerCase().includes('quiz 1'));
                          const quiz2 = courseResults.find(r => r.exam_type.toLowerCase().includes('quiz 2'));
                          const assignment1 = courseResults.find(r => r.exam_type.toLowerCase().includes('assignment 1'));
                          const assignment2 = courseResults.find(r => r.exam_type.toLowerCase().includes('assignment 2'));
                          const midTerm = courseResults.find(r => r.exam_type.toLowerCase().includes('mid'));
                          const finalExam = courseResults.find(r => r.exam_type.toLowerCase().includes('final'));

                          return (
                            <div className="space-y-3">
                              {/* Quizzes */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-3 rounded border">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Quiz 1</span>
                                    <span className={`text-sm font-bold ${quiz1 ? 'text-green-600' : 'text-gray-400'}`}>
                                      {quiz1 ? `${quiz1.obtained_marks}/5` : 'Not submitted'}
                                    </span>
                                  </div>
                                  {quiz1 && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {new Date(quiz1.exam_date).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                                <div className="bg-white p-3 rounded border">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Quiz 2</span>
                                    <span className={`text-sm font-bold ${quiz2 ? 'text-green-600' : 'text-gray-400'}`}>
                                      {quiz2 ? `${quiz2.obtained_marks}/5` : 'Not submitted'}
                                    </span>
                                  </div>
                                  {quiz2 && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {new Date(quiz2.exam_date).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Assignments */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-3 rounded border">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Assignment 1</span>
                                    <span className={`text-sm font-bold ${assignment1 ? 'text-green-600' : 'text-gray-400'}`}>
                                      {assignment1 ? `${assignment1.obtained_marks}/5` : 'Not submitted'}
                                    </span>
                                  </div>
                                  {assignment1 && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {new Date(assignment1.exam_date).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                                <div className="bg-white p-3 rounded border">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Assignment 2</span>
                                    <span className={`text-sm font-bold ${assignment2 ? 'text-green-600' : 'text-gray-400'}`}>
                                      {assignment2 ? `${assignment2.obtained_marks}/5` : 'Not submitted'}
                                    </span>
                                  </div>
                                  {assignment2 && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {new Date(assignment2.exam_date).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Mid-term and Final */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-3 rounded border">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Mid-term Exam</span>
                                    <span className={`text-sm font-bold ${midTerm ? 'text-green-600' : 'text-gray-400'}`}>
                                      {midTerm ? `${midTerm.obtained_marks}/25` : 'Not submitted'}
                                    </span>
                                  </div>
                                  {midTerm && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {new Date(midTerm.exam_date).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                                <div className="bg-white p-3 rounded border">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Final Exam</span>
                                    <span className={`text-sm font-bold ${finalExam ? 'text-green-600' : 'text-gray-400'}`}>
                                      {finalExam ? `${finalExam.obtained_marks}/60` : 'Not submitted'}
                                    </span>
                                  </div>
                                  {finalExam && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {new Date(finalExam.exam_date).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Total Calculation */}
                              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
                                <h5 className="text-sm font-semibold text-blue-900 mb-2">Grade Calculation</h5>
                                <div className="text-sm text-blue-800 space-y-1">
                                  <div className="flex justify-between">
                                    <span>Quizzes (10 marks total):</span>
                                    <span>{((quiz1?.obtained_marks || 0) + (quiz2?.obtained_marks || 0))}/10</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Assignments (10 marks total):</span>
                                    <span>{((assignment1?.obtained_marks || 0) + (assignment2?.obtained_marks || 0))}/10</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Mid-term (25 marks):</span>
                                    <span>{midTerm?.obtained_marks || 0}/25</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Final Exam (60 marks):</span>
                                    <span>{finalExam?.obtained_marks || 0}/60</span>
                                  </div>
                                  <hr className="my-2" />
                                  <div className="flex justify-between font-semibold">
                                    <span>Total Score:</span>
                                    <span>
                                      {((quiz1?.obtained_marks || 0) + (quiz2?.obtained_marks || 0) +
                                        (assignment1?.obtained_marks || 0) + (assignment2?.obtained_marks || 0) +
                                        (midTerm?.obtained_marks || 0) + (finalExam?.obtained_marks || 0))}/105
                                    </span>
                                  </div>
                                  <div className="flex justify-between font-semibold text-lg">
                                    <span>Final Grade:</span>
                                    <span className={selectedResultForDetails.grade === 'F' ? 'text-red-600' : selectedResultForDetails.grade?.startsWith('A') ? 'text-green-600' : 'text-blue-600'}>
                                      {selectedResultForDetails.grade}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Remarks */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Remarks</h4>
                        <p className="text-sm text-gray-700">
                          {selectedResultForDetails.remarks || (selectedResultForDetails.grade === 'F' ? 'Failed - Needs improvement' : selectedResultForDetails.grade?.startsWith('A') ? 'Excellent performance' : selectedResultForDetails.grade?.startsWith('B') ? 'Good performance' : 'Satisfactory performance')}
                        </p>
                      </div>
                    </div>
                  ) : resultDetailsActiveTab === 'all' ? (
                    <div className="space-y-6">
                      {/* All Courses Overview */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">All Courses Assessment Status</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Overview of all courses and their assessment completion status
                        </p>

                        <div className="space-y-4">
                          {studentCourses.map((course, index) => {
                            const courseResults = studentResults.filter(r => r.subject === getCourseName(course));
                            const finalResult = courseResults.find(r => r.exam_type.toLowerCase().includes('final'));

                            // Count completed assessments
                            const quiz1 = courseResults.find(r => r.exam_type.toLowerCase().includes('quiz 1'));
                            const quiz2 = courseResults.find(r => r.exam_type.toLowerCase().includes('quiz 2'));
                            const assignment1 = courseResults.find(r => r.exam_type.toLowerCase().includes('assignment 1'));
                            const assignment2 = courseResults.find(r => r.exam_type.toLowerCase().includes('assignment 2'));
                            const midTerm = courseResults.find(r => r.exam_type.toLowerCase().includes('mid'));
                            const finalExam = courseResults.find(r => r.exam_type.toLowerCase().includes('final'));

                            const completedAssessments = [quiz1, quiz2, assignment1, assignment2, midTerm, finalExam].filter(Boolean).length;
                            const totalAssessments = 6;

                            return (
                              <div key={index} className="bg-white p-4 rounded-lg border">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h5 className="font-semibold text-gray-900">{getCourseName(course)}</h5>
                                    <p className="text-sm text-gray-600">
                                      {completedAssessments}/{totalAssessments} assessments completed
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    {finalResult ? (
                                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${finalResult.grade === 'F' ? 'bg-red-100 text-red-800' : finalResult.grade?.startsWith('A') ? 'bg-green-100 text-green-800' : finalResult.grade?.startsWith('B') ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {finalResult.grade}
                                      </span>
                                    ) : (
                                      <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-800">
                                        Pending
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Assessment Status Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                                  <div className={`p-2 rounded ${quiz1 ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                                    Quiz 1: {quiz1 ? '✓' : 'Pending'}
                                  </div>
                                  <div className={`p-2 rounded ${quiz2 ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                                    Quiz 2: {quiz2 ? '✓' : 'Pending'}
                                  </div>
                                  <div className={`p-2 rounded ${assignment1 ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                                    Assignment 1: {assignment1 ? '✓' : 'Pending'}
                                  </div>
                                  <div className={`p-2 rounded ${assignment2 ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                                    Assignment 2: {assignment2 ? '✓' : 'Pending'}
                                  </div>
                                  <div className={`p-2 rounded ${midTerm ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                                    Mid-term: {midTerm ? '✓' : 'Pending'}
                                  </div>
                                  <div className={`p-2 rounded ${finalExam ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                                    Final Exam: {finalExam ? '✓' : 'Pending'}
                                  </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mt-3">
                                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                                    <span>Progress</span>
                                    <span>{Math.round((completedAssessments / totalAssessments) * 100)}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${(completedAssessments / totalAssessments) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowResultDetailsModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  // Chart data for performance overview
  const performanceChartData = useMemo(() => {
    return {
      labels: ['Attendance', 'Assignments', 'Mid-term', 'Final', 'Projects'],
      datasets: [
        {
          label: 'Average Score',
          data: [85, 90, 75, 88, 82],
          backgroundColor: 'rgba(79, 70, 229, 0.2)',
          borderColor: 'rgba(79, 70, 229, 1)',
          borderWidth: 1,
        }
      ]
    };
  }, []);

  // Main render
  return (
    <div className="flex min-h-screen bg-gray-50">
      {renderTabs()}
      <div className="flex-1 p-8">
        <div className="mb-8">
          <motion.h1
            className="text-3xl font-bold text-gray-900 dark:text-white dark:bg-gradient-to-r dark:from-indigo-600 dark:to-purple-600 dark:bg-clip-text dark:text-transparent"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            Admin Dashboard
          </motion.h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Welcome to the University Management System</p>
        </div>

        {activeTab === 'dashboard' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">{adminData.stats.totalStudents}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 016 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Instructors</p>
                    <p className="text-2xl font-bold text-gray-900">{adminData.stats.totalStaff}</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Departments</p>
                    <p className="text-2xl font-bold text-gray-900">{adminData.stats.totalDepartments}</p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Courses</p>
                    <p className="text-2xl font-bold text-gray-900">{adminData.stats.totalCourses}</p>
                  </div>
                  <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
            >
              <NotificationPanel />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
                <div className="h-64">
                  <Bar data={performanceChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
                <SystemHealthWidget />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
            >
              <QuickActions />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
            >
              <AIInsights />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
            >
              <ActivityFeed />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
            >
              <CalendarWidget />
            </motion.div>

          </motion.div>
        )}

        {activeTab === 'students' && <StudentManagement activeTab={activeTab} />}
        {activeTab === 'instructors' && <TeacherManagement activeTab={activeTab} />}
        {activeTab === 'departments' && <DepartmentManagement activeTab={activeTab} />}
        {activeTab === 'courses' && <CourseManagement activeTab={activeTab} />}
        {activeTab === 'results' && renderResultsTab()}
        {activeTab === 'fees' && <FeeManagement />}
        {activeTab === 'library' && <LibraryManagement />}
        {activeTab === 'transport' && <TransportManagement />}
       
        {activeTab === 'events' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Events Management</h2>
            <p className="text-gray-600">Events management functionality will be implemented here.</p>
          </motion.div>
        )}
        {activeTab === 'messaging' && <MessagingSystem />}
        {activeTab === 'scholarships' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Scholarships</h2>
            <p className="text-gray-600">Scholarship management functionality will be implemented here.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
