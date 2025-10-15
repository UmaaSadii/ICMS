import React, { useState, useEffect } from 'react';
import { academicsService } from '../api/academicsService';
import { api } from '../api/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard, faCheckCircle, faFilter, faExclamationTriangle, faFileAlt, faHistory, faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';

interface Fee {
  fee_id: number;
  student: number;
  semester: number;
  amount: string;
  paid_amount: string;
  status: 'Paid' | 'Unpaid' | 'Partial';
  due_date: string;
  paid_on?: string;
  balance: number;
  department_id: number;
  semester_id: number;
}

interface Student {
  id: number;
  first_name?: string;
  last_name?: string;
  name?: string;
  registration_number?: string;
  department_id?: number;
  semester_id?: number;
}

interface Department {
  id: number;
  name: string;
  code: string;
}

interface Semester {
  id: number;
  name: string;
  semester_code: string;
}

interface SearchableStudentSelectProps {
  students: Student[];
  selectedStudent: number | null;
  onStudentSelect: (studentId: number | null) => void;
  disabled: boolean;
}

const SearchableStudentSelect: React.FC<SearchableStudentSelectProps> = ({
  students,
  selectedStudent,
  onStudentSelect,
  disabled
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>(students);

  useEffect(() => {
    const filtered = students.filter(student =>
      formatStudentName(student).toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.registration_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [students, searchTerm]);

  const selectedStudentData = students.find(s => s.id === selectedStudent);

  const formatStudentName = (student: Student) => {
    if (student.first_name && student.last_name) {
      return `${student.first_name.trim()} ${student.last_name.trim()}`;
    } else if (student.name) {
      return student.name.trim();
    } else {
      return 'Unknown Student';
    }
  };

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={selectedStudentData ? `${capitalizeFirstLetter(formatStudentName(selectedStudentData))} (${selectedStudentData.registration_number})` : searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          disabled={disabled}
          placeholder={disabled ? 'No students available' : 'Search students by name or registration...'}
          className="shadow appearance-none border rounded w-full py-2 px-3 pr-10 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="absolute inset-y-0 right-0 flex items-center pr-3 disabled:cursor-not-allowed"
        >
          <FontAwesomeIcon icon={faFilter} className="text-gray-400" />
        </button>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
          {filteredStudents.length === 0 ? (
            <div className="px-3 py-2 text-gray-500">No students found</div>
          ) : (
            <>
              <div
                onClick={() => {
                  onStudentSelect(null);
                  setSearchTerm('');
                  setIsOpen(false);
                }}
                className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100"
              >
                <span className="font-normal block truncate text-gray-500">Clear selection</span>
              </div>
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  onClick={() => {
                    onStudentSelect(student.id);
                    setSearchTerm('');
                    setIsOpen(false);
                  }}
                  className={`cursor-pointer select-none relative py-2 pl-3 pr-9 ${
                    selectedStudent === student.id ? 'bg-indigo-100 text-indigo-900' : 'hover:bg-gray-100'
                  }`}
                >
                  <span className={`font-normal block truncate ${selectedStudent === student.id ? 'font-semibold' : ''}`}>
                    {capitalizeFirstLetter(formatStudentName(student))} ({student.registration_number})
                  </span>
                  {selectedStudent === student.id && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-indigo-600" />
                    </span>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

const FeeManagement: React.FC = () => {
  const [fees, setFees] = useState<Fee[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [filteredFees, setFilteredFees] = useState<Fee[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [studentError, setStudentError] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastPayment, setLastPayment] = useState<{amount: number, date: string} | null>(null);
  const [showAddFeeModal, setShowAddFeeModal] = useState(false);
  const [newFeeData, setNewFeeData] = useState({
    student_id: '',
    term: '',
    amount: '',
    due_date: ''
  });
  const [showDepartmentFeeModal, setShowDepartmentFeeModal] = useState(false);
  const [departmentFeeData, setDepartmentFeeData] = useState({
    department_id: '',
    semester_id: '',
    amount: '',
    due_date: ''
  });
  const [showStudentReceiptModal, setShowStudentReceiptModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [showGenerateReceiptModal, setShowGenerateReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [showDepartmentReportModal, setShowDepartmentReportModal] = useState(false);
  const [studentReceiptData, setStudentReceiptData] = useState<any>(null);
  const [departmentReportData, setDepartmentReportData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'payment' | 'status' | 'history'>('status');
  const [studentFeeStatuses, setStudentFeeStatuses] = useState<any[]>([]);
  const [filteredStudentFeeStatuses, setFilteredStudentFeeStatuses] = useState<any[]>([]);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<number | null>(null);
  const [selectedStudentsForPayment, setSelectedStudentsForPayment] = useState<number[]>([]);
  const [showBulkPaymentModal, setShowBulkPaymentModal] = useState(false);
  const [aggregatedPayments, setAggregatedPayments] = useState<any>(null);
  const [isLoadingAggregated, setIsLoadingAggregated] = useState(false);
  const [studentPaymentHistory, setStudentPaymentHistory] = useState<any[]>([]);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  useEffect(() => {
    fetchDepartments();
    fetchStudents();
  }, []);

  useEffect(() => {
    fetchSemesters();
  }, [selectedDepartment]);

  // Fetch semesters when department changes
  useEffect(() => {
    if (selectedDepartment) {
      fetchSemesters(selectedDepartment);
      setSelectedSemester(null); // Reset semester when department changes
    } else {
      fetchSemesters(); // Fetch all semesters if no department selected
    }
  }, [selectedDepartment]);

  useEffect(() => {
    if (selectedDepartment && selectedSemester) {
      fetchStudentFeeStatuses();
    } else {
      setFees([]);
      setStudentFeeStatuses([]);
      setFilteredStudentFeeStatuses([]);
    }
  }, [selectedDepartment, selectedSemester]);

  useEffect(() => {
    filterFees();
  }, [fees, statusFilter]);

  // Filter students based on selected department, semester, and fee status
  useEffect(() => {
    let filtered = students;
    if (selectedDepartment) {
      filtered = filtered.filter(student => student.department_id === selectedDepartment);
    }
    if (selectedSemester) {
      filtered = filtered.filter(student => student.semester_id === selectedSemester);
    }
    setFilteredStudents(filtered);
  }, [students, selectedDepartment, selectedSemester]);

  // Filter student fee statuses based on status filter
  useEffect(() => {
    let filtered = studentFeeStatuses;
    if (statusFilter !== 'All') {
      filtered = filtered.filter(student =>
        student.fee_info && student.fee_info.status === statusFilter
      );
    }
    setFilteredStudentFeeStatuses(filtered);
  }, [studentFeeStatuses, statusFilter]);

  // Fetch student details when selectedStudent changes
  useEffect(() => {
    const loadStudentData = async () => {
      if (selectedStudent) {
        try {
          const response = await academicsService.getStudent(selectedStudent.toString());
          const student = response.data;
          setSelectedDepartment(student.department_id);
          setSelectedSemester(student.semester_id);
          // Refetch students list
          fetchStudents();
        } catch (err) {
          console.error('Failed to fetch student:', err);
        }
      } else {
        setSelectedDepartment(null);
        setSelectedSemester(null);
      }
    };

    loadStudentData();
  }, [selectedStudent]);

  // Fetch aggregated payments when department and semester change
  useEffect(() => {
    if (selectedDepartment && selectedSemester && activeTab === 'history') {
      fetchAggregatedPayments();
    } else {
      setAggregatedPayments(null);
    }
  }, [selectedDepartment, selectedSemester, activeTab]);

  const fetchDepartments = async () => {
    try {
      const response = await academicsService.getDepartments();
      console.log('Departments fetched:', response.data);
      setDepartments(response.data);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  const fetchSemesters = async (departmentId?: number) => {
    try {
      if (departmentId) {
        const response = await academicsService.getSemestersByDepartment(departmentId);
        setSemesters(response.data);
      } else {
        setSemesters([]); // Do not fetch all semesters if no department is selected
      }
    } catch (err) {
      console.error('Failed to fetch semesters:', err);
      setSemesters([]);
    }
  };

  const fetchStudents = async () => {
    setIsLoadingStudents(true);
    setStudentError(null);
    try {
      const response = await academicsService.getStudents();
      // Validate and clean student data
      const validStudents = response.data.filter((student: any) => {
        if (!student.id) {
          console.warn('Student missing id:', student);
          return false;
        }
        return true;
      }).map((student: any) => ({
        ...student,
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        name: student.name || '',
        registration_number: student.registration_number || 'N/A',
        department_id: student.department_id || null,
        semester_id: student.semester_id || null,
      }));
      setStudents(validStudents);
    } catch (err: any) {
      console.error('Failed to fetch students:', err);
      setStudentError(err.message || 'Failed to load students. Please try again.');
    } finally {
      setIsLoadingStudents(false);
    }
  };


  const fetchStudentFees = async (studentId: number) => {
    try {
      const response = await academicsService.getStudentFees(studentId);
      setFees(response.data.fees || []);
    } catch (err) {
      console.error('Failed to fetch student fees:', err);
    }
  };

  const fetchStudentFeeStatuses = async () => {
    if (!selectedDepartment || !selectedSemester) return;

    try {
      const response = await api.get(`academics/departments/${selectedDepartment}/semesters/${selectedSemester}/students/fees/`);
      const students = response.data.students || [];
      setStudentFeeStatuses(students);
      setFilteredStudentFeeStatuses(students); // Initially show all
      // Extract fees from student fee statuses for the fee records table
      const feeList = students.filter((s: any) => s.fee_info && s.fee_info.fee_id).map((s: any) => s.fee_info);
      setFees(feeList);
    } catch (err) {
      console.error('Failed to fetch student fee statuses:', err);
      setStudentFeeStatuses([]);
      setFilteredStudentFeeStatuses([]);
      setFees([]);
    }
  };

  const fetchAggregatedPayments = async () => {
    if (!selectedDepartment || !selectedSemester) return;

    setIsLoadingAggregated(true);
    try {
      const response = await api.get(`academics/departments/${selectedDepartment}/semesters/${selectedSemester}/payments/`);
      console.log('Aggregated payments response:', response.data); // Debug log
      setAggregatedPayments(response.data);
    } catch (err) {
      console.error('Failed to fetch aggregated payments:', err);
      setAggregatedPayments(null);
    } finally {
      setIsLoadingAggregated(false);
    }
  };

  const fetchPaymentHistory = async (feeId: number) => {
    try {
      const response = await api.get(`academics/fees/${feeId}/payments/`);
      setPaymentHistory(response.data || []);
      setShowPaymentHistoryModal(true);
    } catch (err) {
      console.error('Failed to fetch payment history:', err);
      setPaymentHistory([]);
    }
  };

  const handleCreateFee = async () => {
    if (!newFeeData.student_id || !newFeeData.term || !newFeeData.amount || !newFeeData.due_date) {
      setError('All fields are required');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const feeData = {
        student_id: parseInt(newFeeData.student_id),
        term: newFeeData.term,
        amount: parseFloat(newFeeData.amount),
        due_date: newFeeData.due_date
      };

      await academicsService.createStudentFee(parseInt(newFeeData.student_id), feeData);

      // Refresh fees if we're viewing this student's fees
      if (selectedStudent === parseInt(newFeeData.student_id)) {
        await fetchStudentFees(selectedStudent);
      }

      setShowAddFeeModal(false);
      setNewFeeData({
        student_id: '',
        term: '',
        amount: '',
        due_date: ''
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create fee record');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDepartmentFee = async () => {
    if (!departmentFeeData.department_id || !departmentFeeData.semester_id || !departmentFeeData.due_date) {
      setError('Department, semester, and due date are required');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const feeData = {
        semester_id: parseInt(departmentFeeData.semester_id),
        due_date: departmentFeeData.due_date
      };

      // Use the api service which handles authentication automatically
      const response = await api.post(`academics/departments/${departmentFeeData.department_id}/create-fees/`, feeData);

      // Refresh fees and student statuses if we're viewing this department's fees
      if (selectedDepartment === parseInt(departmentFeeData.department_id)) {
        await fetchStudentFeeStatuses();
      }

      setShowDepartmentFeeModal(false);
      setDepartmentFeeData({
        department_id: '',
        semester_id: '',
        amount: '',
        due_date: ''
      });

      alert(`Successfully created ${response.data.fees.length} fee records for the department with default amounts!`);
    } catch (err: any) {
      setError(err.message || 'Failed to create department fee records');
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async () => {
    setIsLoadingReport(true);
    try {
      let reportFees: Fee[] = [];

      if (selectedStudent) {
        // Generate report for specific student
        const response = await academicsService.getStudentFees(selectedStudent);
        reportFees = response.data.fees || [];
      } else if (selectedDepartment && selectedSemester) {
        // Generate report for department/semester
        reportFees = fees; // Use fees already fetched from studentFeeStatuses
      } else {
        throw new Error('Please select a student or department and semester to generate report');
      }

      // Calculate aggregates
      const totalFees = reportFees.length;
      const totalAmount = reportFees.reduce((sum, fee) => sum + parseFloat(fee.amount), 0);
      const totalPaid = reportFees.reduce((sum, fee) => sum + parseFloat(fee.paid_amount), 0);
      const totalBalance = reportFees.reduce((sum, fee) => sum + fee.balance, 0);

      // Status breakdown
      const statusBreakdown = {
        paid: reportFees.filter(fee => fee.status === 'Paid').length,
        unpaid: reportFees.filter(fee => fee.status === 'Unpaid').length,
        partial: reportFees.filter(fee => fee.status === 'Partial').length
      };

      // Find student if selected
      const student = selectedStudent ? students.find(s => s.id === selectedStudent) : null;

      const reportData = {
        totalFees,
        totalAmount,
        totalPaid,
        totalBalance,
        statusBreakdown,
        generatedAt: new Date().toLocaleString(),
        department: selectedDepartment ? departments.find(d => d.id === selectedDepartment)?.name : 'All Departments',
        semester: selectedSemester ? semesters.find(s => s.id === selectedSemester)?.name : 'All Semesters',
        student: student,
        fees: reportFees
      };

      if (selectedStudent) {
        // Show receipt for individual student
        const student = students.find(s => s.id === selectedStudent);
        if (student && reportFees.length > 0) {
          setReceiptData({
            student,
            fee: reportFees[0],
            payments: [],
            generatedAt: reportData.generatedAt,
            totalPaid: reportData.totalPaid,
            balance: reportData.totalBalance,
            semester: reportData.semester
          });
          setShowGenerateReceiptModal(true);
        }
      } else {
        // Show report for department/semester
        setReportData(reportData);
        setShowReportModal(true);
      }
    } catch (err: any) {
      console.error('Failed to generate report:', err);
      setError(err.message || 'Failed to generate report');
    } finally {
      setIsLoadingReport(false);
    }
  };

  const generateStudentReceipt = async (studentId: number) => {
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) {
        setError('Student not found');
        return;
      }

      const response = await academicsService.getStudentFees(studentId);
      const fees = response.data.fees || [];

      if (fees.length === 0) {
        setError('No fee records found for this student');
        return;
      }

      // Get payment history for the latest fee
      const latestFee = fees[0]; // Assuming fees are ordered by most recent
      if (!latestFee || !latestFee.fee_id || typeof latestFee.fee_id !== 'number' || latestFee.fee_id <= 0) {
        setError('No valid fee record found for this student');
        return;
      }
      const paymentResponse = await api.get(`academics/fees/${latestFee.fee_id}/payments/`);
      const payments = paymentResponse.data || [];

      const receiptData = {
        student,
        fee: latestFee,
        payments,
        generatedAt: new Date().toLocaleString(),
        totalPaid: parseFloat(latestFee.paid_amount),
        balance: latestFee.balance,
        semester: semesters.find(s => s.id === latestFee.semester)?.name || 'Unknown Semester'
      };

      setReceiptData(receiptData);
      setShowGenerateReceiptModal(true);
    } catch (err: any) {
      console.error('Failed to generate receipt:', err);
      setError(err.message || 'Failed to generate receipt');
    }
  };


  const filterFees = () => {
    let filtered = fees;
    // No need to filter by student since fees are already fetched for selected student
    if (statusFilter !== 'All') {
      filtered = filtered.filter(fee => fee.status === statusFilter);
    }
    setFilteredFees(filtered);
  };

  const handlePayment = async () => {
    if (!selectedFee || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (amount <= 0) {
      setError('Payment amount must be greater than 0');
      return;
    }

    const currentPaid = parseFloat(selectedFee.paid_amount);
    const totalAmount = parseFloat(selectedFee.amount);
    const newPaidAmount = currentPaid + amount;

    if (newPaidAmount > totalAmount) {
      setError('Payment amount exceeds remaining balance');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      let newStatus: 'Paid' | 'Unpaid' | 'Partial';
      if (newPaidAmount >= totalAmount) {
        newStatus = 'Paid';
      } else if (newPaidAmount > 0) {
        newStatus = 'Partial';
      } else {
        newStatus = 'Unpaid';
      }

      const updatedFee: Fee = {
        ...selectedFee,
        paid_amount: newPaidAmount.toString(),
        status: newStatus,
        paid_on: new Date().toISOString().split('T')[0],
      };

      // Create payment record
      const paymentData = {
        amount: amount,
        payment_method: paymentMethod,
        notes: `Payment for ${semesters.find(s => s.id === selectedFee.semester)?.name || 'Unknown Semester'}`
      };

      await api.post(`academics/fees/${selectedFee.fee_id}/payments/`, paymentData);

      // Refresh fees and student statuses
      if (selectedDepartment && selectedSemester) {
        await fetchStudentFeeStatuses();
      }

      // Set last payment for receipt
      setLastPayment({
        amount: amount,
        date: new Date().toLocaleDateString()
      });

      setIsModalOpen(false);
      setShowReceipt(true);
      setSelectedFee(null);
      setPaymentAmount('');
      setPaymentMethod('Cash');
    } catch (err: any) {
      setError(err.message || 'Failed to process payment');
    } finally {
      setIsLoading(false);
    }
  };

  const openPaymentModal = (fee: Fee) => {
    setSelectedFee(fee);
    setPaymentAmount('');
    setPaymentMethod('Cash');
    setIsModalOpen(true);
  };

  const openPaymentHistoryModal = (feeId: number) => {
    if (feeId) {
      fetchPaymentHistory(feeId);
    } else {
      console.error('Invalid fee ID for payment history');
    }
  };

  const formatStudentName = (student: Student) => {
    if (student.first_name && student.last_name) {
      return `${student.first_name.trim()} ${student.last_name.trim()}`;
    } else if (student.name) {
      return student.name.trim();
    } else {
      return 'Unknown Student';
    }
  };

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };


  console.log('Rendering FeeManagement with departments:', departments);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FontAwesomeIcon icon={faCreditCard} className="text-indigo-600 text-3xl mr-3" />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Fee Management</h1>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => generateReport()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <FontAwesomeIcon icon={faFileAlt} className="mr-2" />
            Generate Report
          </button>
          <button
            onClick={() => setShowDepartmentFeeModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
          >
            <FontAwesomeIcon icon={faCreditCard} className="mr-2" />
            Add Department Fee
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded-r-lg flex items-center">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 mr-3" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {studentError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded-r-lg flex items-center">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 mr-3" />
          <span className="text-red-700">Student Data Error: {studentError}</span>
        </div>
      )}

      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center mb-4">
          <FontAwesomeIcon icon={faFilter} className="text-gray-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-700">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Select Student</label>
            {isLoadingStudents ? (
              <div className="flex justify-center items-center h-10">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                <span className="ml-2 text-gray-600">Loading students...</span>
              </div>
            ) : studentError ? (
              <div className="border rounded p-2 bg-red-50 text-red-700">
                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                {studentError}
              </div>
            ) : (
              <SearchableStudentSelect
                students={filteredStudents}
                selectedStudent={selectedStudent}
                onStudentSelect={setSelectedStudent}
                disabled={filteredStudents.length === 0}
              />
            )}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Select Department</label>
            <select
              value={selectedDepartment || ''}
              onChange={(e) => {
                setSelectedDepartment(e.target.value ? parseInt(e.target.value) : null);
                setSelectedStudent(null); // Reset student selection when department changes
              }}
              disabled={!!selectedStudent}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {selectedStudent ? 'Auto-selected from student' : 'Choose a department...'}
              </option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Select Semester</label>
            <select
              value={selectedSemester || ''}
              onChange={(e) => {
                setSelectedSemester(e.target.value ? parseInt(e.target.value) : null);
                setSelectedStudent(null); // Reset student selection when semester changes
              }}
              disabled={!selectedDepartment}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {selectedStudent ? 'Auto-selected from student' : selectedDepartment ? (semesters.length > 0 ? 'Choose a semester...' : 'No semesters available for this department') : 'Select department first'}
              </option>
              {semesters.map(sem => (
                <option key={sem.id} value={sem.id}>
                  {sem.name} ({sem.semester_code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partial">Partial</option>
            </select>
          </div>
        </div>

        {(selectedDepartment && selectedSemester) && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Selected:</strong> {departments.find(d => d.id === selectedDepartment)?.name} - {semesters.find(s => s.id === selectedSemester)?.name}
              {filteredStudents.length > 0 && (
                <span className="ml-2">({filteredStudents.length} students found)</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('payment')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payment'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faCreditCard} className="mr-2" />
              Fee Payment
            </button>
            <button
              onClick={() => setActiveTab('status')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'status'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faMoneyBillWave} className="mr-2" />
              Student Status
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faHistory} className="mr-2" />
              Payment History
            </button>
          </nav>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div>
        </div>
      ) : !selectedDepartment || !selectedSemester ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <FontAwesomeIcon icon={faFilter} className="text-gray-400 text-4xl mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select Department and Semester</h3>
          <p className="text-gray-600">Please select a department and semester above to view and manage student fees.</p>
        </div>
      ) : activeTab === 'payment' ? (
        /* Fee Payment Tab */
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center">
            <FontAwesomeIcon icon={faCreditCard} className="text-green-600 text-4xl mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-4">Fee Payment Processing</h3>
            <p className="text-gray-600 mb-6">Process fee payments for students. All fees are now standardized at $30,000 per semester.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <button
                onClick={() => {
                  const unpaidStudents = studentFeeStatuses.filter(s =>
                    s.fee_info && (s.fee_info.status === 'Unpaid' || s.fee_info.status === 'Partial')
                  );
                  if (unpaidStudents.length === 0) {
                    alert('No unpaid fees found for this department and semester.');
                    return;
                  }
                  setSelectedStudentsForPayment(unpaidStudents.map(s => s.id));
                  setShowBulkPaymentModal(true);
                }}
                className="p-6 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors duration-200"
              >
                <FontAwesomeIcon icon={faMoneyBillWave} className="text-green-600 text-2xl mb-3" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Bulk Payment Processing</h4>
                <p className="text-sm text-gray-600">Process payments for multiple students at once</p>
              </button>

              <button
                onClick={() => setActiveTab('status')}
                className="p-6 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors duration-200"
              >
                <FontAwesomeIcon icon={faCreditCard} className="text-blue-600 text-2xl mb-3" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Individual Payments</h4>
                <p className="text-sm text-gray-600">Process payments for individual students</p>
              </button>
            </div>

            <div className="mt-8 bg-blue-50 p-4 rounded-lg">
              <h4 className="text-md font-semibold text-blue-800 mb-2">Fee Structure Information</h4>
              <p className="text-sm text-blue-700">
                All department-semester combinations now have a standardized fee of <strong>$30,000</strong>.
                Fee records are automatically created for students based on their department and semester enrollment.
              </p>
            </div>
          </div>
        </div>
      ) : activeTab === 'status' ? (
        /* Student Status Tab */
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {!selectedDepartment || !selectedSemester ? (
            <div className="p-8 text-center">
              <FontAwesomeIcon icon={faFilter} className="text-gray-400 text-4xl mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select Department and Semester</h3>
              <p className="text-gray-600">Please select a department and semester above to view student fee status.</p>
            </div>
          ) : filteredStudentFeeStatuses.length === 0 ? (
            <div className="p-8 text-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-400 text-4xl mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
              <p className="text-gray-600">
                {statusFilter === 'All'
                  ? 'No students found for the selected department and semester combination.'
                  : `No students found with "${statusFilter}" fee status for the selected department and semester.`
                }
              </p>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Student Fee Status ({filteredStudentFeeStatuses.length} students)
                    </h3>
                    <p className="text-sm text-gray-600">
                      {departments.find(d => d.id === selectedDepartment)?.name} - {semesters.find(s => s.id === selectedSemester)?.name}
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        const unpaidStudents = filteredStudentFeeStatuses.filter(s =>
                          s.fee_info && (s.fee_info.status === 'Unpaid' || s.fee_info.status === 'Partial')
                        );
                        if (unpaidStudents.length === 0) {
                          alert('No unpaid fees found for this department and semester.');
                          return;
                        }
                        setSelectedStudentsForPayment(unpaidStudents.map(s => s.id));
                        setShowBulkPaymentModal(true);
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                    >
                      <FontAwesomeIcon icon={faMoneyBillWave} className="mr-2" />
                      Bulk Pay Selected
                    </button>
                    <button
                      onClick={() => {
                        if (selectedStudentsForPayment.length === 0) {
                          alert('Please select students first.');
                          return;
                        }
                        setShowBulkPaymentModal(true);
                      }}
                      disabled={selectedStudentsForPayment.length === 0}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <FontAwesomeIcon icon={faCreditCard} className="mr-2" />
                      Pay Selected ({selectedStudentsForPayment.length})
                    </button>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {filteredStudentFeeStatuses.map((studentData, index) => (
                  <div key={studentData.id || index} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        {studentData.fee_info && studentData.fee_info.fee_id && (studentData.fee_info.status === 'Unpaid' || studentData.fee_info.status === 'Partial') && (
                          <div className="mr-4">
                            <input
                              type="checkbox"
                              checked={selectedStudentsForPayment.includes(studentData.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStudentsForPayment([...selectedStudentsForPayment, studentData.id]);
                                } else {
                                  setSelectedStudentsForPayment(selectedStudentsForPayment.filter(id => id !== studentData.id));
                                }
                              }}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                          </div>
                        )}
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                            studentData.fee_info?.status === 'Paid' ? 'bg-green-500' :
                            studentData.fee_info?.status === 'Partial' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}>
                            {studentData.first_name?.charAt(0) || studentData.name?.charAt(0) || '?'}
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <h4 className="text-lg font-medium text-gray-900">
                            {formatStudentName(studentData)}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Registration: {studentData.registration_number || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {studentData.fee_info && studentData.fee_info.fee_id ? (
                          <>
                            <div className="text-right">
                              <div className="text-sm text-gray-900">
                                <span className="font-medium">${studentData.fee_info.amount}</span> total
                              </div>
                              <div className="text-sm text-gray-600">
                                ${studentData.fee_info.balance?.toFixed(2) || '0.00'} remaining
                              </div>
                            </div>
                            <div className="flex items-center">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                studentData.fee_info.status === 'Paid' ? 'bg-green-100 text-green-800' :
                                studentData.fee_info.status === 'Unpaid' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {studentData.fee_info.status === 'Paid' && <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />}
                                {studentData.fee_info.status}
                              </span>
                            </div>
                            <div className="flex space-x-2">
                              {(studentData.fee_info.status === 'Unpaid' || studentData.fee_info.status === 'Partial') && (
                                <button
                                  onClick={() => {
                                    const fee = studentData.fee_info;
                                    setSelectedFee({
                                      ...fee,
                                      student: studentData.id,
                                      semester: selectedSemester,
                                      department_id: selectedDepartment,
                                      semester_id: selectedSemester
                                    });
                                    setIsModalOpen(true);
                                  }}
                                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                                >
                                  <FontAwesomeIcon icon={faCreditCard} className="mr-1" />
                                  Pay Now
                                </button>
                              )}
                              <button
                                onClick={() => openPaymentHistoryModal(studentData.fee_info.fee_id)}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                              >
                                <FontAwesomeIcon icon={faHistory} className="mr-2" />
                                History
                              </button>
                              <button
                                onClick={() => generateStudentReceipt(studentData.id)}
                                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                              >
                                <FontAwesomeIcon icon={faFileAlt} className="mr-2" />
                                Receipt
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="text-right">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                              No Fee Record
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : activeTab === 'history' ? (
        /* Payment History Tab */
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Payment History - All Students
            </h3>
            <p className="text-sm text-gray-600">
              {departments.find(d => d.id === selectedDepartment)?.name} - {semesters.find(s => s.id === selectedSemester)?.name}
            </p>
          </div>

          {!selectedDepartment || !selectedSemester ? (
            <div className="p-8 text-center">
              <FontAwesomeIcon icon={faFilter} className="text-gray-400 text-4xl mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select Department and Semester</h3>
              <p className="text-gray-600">Please select a department and semester above to view payment history.</p>
            </div>
          ) : filteredStudentFeeStatuses.length === 0 ? (
            <div className="p-8 text-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-400 text-4xl mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
              <p className="text-gray-600">
                {statusFilter === 'All'
                  ? 'No students found for the selected department and semester combination.'
                  : `No students found with "${statusFilter}" fee status for the selected department and semester.`
                }
              </p>
            </div>
          ) : (
            <>
              {/* Aggregated Payments Section */}
              {isLoadingAggregated ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading aggregated payment history...</p>
                </div>
              ) : aggregatedPayments ? (
                <div className="p-6 bg-blue-50 border-b border-blue-200">
                  <h4 className="text-md font-semibold text-blue-800 mb-3">Aggregated Payment Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-blue-600">
                        {aggregatedPayments.total_payments || aggregatedPayments.payments?.length || 0}
                      </div>
                      <div className="text-sm text-blue-800">Total Payments</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-green-600">
                        ${(() => {
                          const totalAmount = aggregatedPayments.total_amount ||
                                            aggregatedPayments.total_collected ||
                                            (aggregatedPayments.payments ?
                                              aggregatedPayments.payments.reduce((sum: number, payment: any) =>
                                                sum + (parseFloat(payment.amount) || 0), 0) : 0);
                          return typeof totalAmount === 'number' ? totalAmount.toFixed(2) : '0.00';
                        })()}
                      </div>
                      <div className="text-sm text-green-800">Total Collected</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-indigo-600">
                        {aggregatedPayments.payments?.length || aggregatedPayments.total_records || 0}
                      </div>
                      <div className="text-sm text-indigo-800">Payment Records</div>
                    </div>
                  </div>

                  {aggregatedPayments.payments && aggregatedPayments.payments.length > 0 && (
                    <div className="overflow-x-auto mb-4">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-blue-100">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">Student</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">Amount</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">Method</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {aggregatedPayments.payments.slice(0, 10).map((payment: any, index: number) => (
                            <tr key={payment.payment_id || index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{payment.student_name}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-green-600">${payment.amount}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{new Date(payment.payment_date).toLocaleDateString()}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{payment.payment_method || 'N/A'}</td>
                            </tr>
                          ))}
                          {aggregatedPayments.payments.length > 10 && (
                            <tr>
                              <td colSpan={4} className="px-4 py-3 text-center text-sm text-gray-500">
                                Showing first 10 of {aggregatedPayments.payments.length} payments.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : null}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudentFeeStatuses.map((studentData, index) => (
                      <tr key={studentData.id || index} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatStudentName(studentData)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {semesters.find(s => s.id === selectedSemester)?.name || 'Unknown Semester'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${typeof studentData.fee_info?.amount === 'number'
                            ? studentData.fee_info.amount.toFixed(2)
                            : (studentData.fee_info?.amount || '0.00')}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${typeof studentData.fee_info?.paid_amount === 'number'
                            ? studentData.fee_info.paid_amount.toFixed(2)
                            : (studentData.fee_info?.paid_amount || '0.00')}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${studentData.fee_info?.balance?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            studentData.fee_info?.status === 'Paid' ? 'bg-green-100 text-green-800' :
                            studentData.fee_info?.status === 'Unpaid' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {studentData.fee_info?.status || 'No Fee Record'}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {studentData.fee_info?.due_date || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      ) : (
        /* History Tab */
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Fee Records ({filteredFees.length} records)
            </h3>
            <p className="text-sm text-gray-600">
              {departments.find(d => d.id === selectedDepartment)?.name} - {semesters.find(s => s.id === selectedSemester)?.name}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFees.map(fee => {
                  const student = students.find(s => s.id === fee.student);
                  return (
                    <tr key={fee.fee_id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student ? formatStudentName(student) : 'Unknown Student'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {semesters.find(s => s.id === fee.semester)?.name || 'Unknown Semester'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">${fee.amount}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">${fee.paid_amount}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">${fee.balance.toFixed(2)}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          fee.status === 'Paid' ? 'bg-green-100 text-green-800' :
                          fee.status === 'Unpaid' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {fee.status === 'Paid' && <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />}
                          {fee.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{fee.due_date}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {fee.paid_on ? new Date(fee.paid_on).toLocaleDateString() : 'No payments'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openPaymentHistoryModal(fee.fee_id)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                        >
                          <FontAwesomeIcon icon={faHistory} className="mr-2" />
                          View History
                        </button>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => generateStudentReceipt(fee.student)}
                          className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                        >
                          <FontAwesomeIcon icon={faFileAlt} className="mr-2" />
                          Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && selectedFee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <FontAwesomeIcon icon={faCreditCard} className="text-indigo-600 text-xl mr-2" />
                <h2 className="text-xl font-bold text-gray-800">Make Payment</h2>
              </div>
              <div className="mb-4">
                <p className="text-gray-600">Fee for <span className="font-semibold">{semesters.find(s => s.id === selectedFee.semester)?.name || 'Unknown Semester'}</span></p>
                <p className="text-gray-600">Total Amount: <span className="font-semibold">${selectedFee.amount}</span></p>
                <p className="text-gray-600">Balance: <span className="font-semibold">${selectedFee.balance.toFixed(2)}</span></p>
              </div>
              <div className="mb-4 space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Payment Amount</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter amount"
                    min="0.01"
                    step="0.01"
                    max={selectedFee ? (parseFloat(selectedFee.amount) - parseFloat(selectedFee.paid_amount)).toFixed(2) : undefined}
                  />
                  {selectedFee && (
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum: ${(parseFloat(selectedFee.amount) - parseFloat(selectedFee.paid_amount)).toFixed(2)}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Online">Online</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={isLoading || !paymentAmount}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors duration-200"
                >
                  {isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : <FontAwesomeIcon icon={faCreditCard} className="mr-2" />}
                  {isLoading ? 'Processing...' : 'Pay'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReceipt && selectedStudent && lastPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Payment Receipt</h2>
                <button
                  onClick={() => setShowReceipt(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FontAwesomeIcon icon={faCheckCircle} size="lg" />
                </button>
              </div>

              <div className="border-t border-b border-gray-200 py-4 mb-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">University Fee Payment</h3>
                  <p className="text-sm text-gray-600">Receipt #{Date.now()}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Student:</span>
                    <span>{students.find(s => s.id === selectedStudent) ? formatStudentName(students.find(s => s.id === selectedStudent)!) : 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Registration:</span>
                    <span>{students.find(s => s.id === selectedStudent)?.registration_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Semester:</span>
                    <span>{semesters.find(s => s.id === selectedSemester)?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Payment Date:</span>
                    <span>{lastPayment.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Amount Paid:</span>
                    <span className="font-semibold text-green-600">${lastPayment.amount.toFixed(2)}</span>
                  </div>
                  {(() => {
                    const studentData = studentFeeStatuses.find(s => s.id === selectedStudent);
                    if (studentData && studentData.fee_info && studentData.fee_info.payments && studentData.fee_info.payments.length > 0) {
                      const firstPayment = studentData.fee_info.payments[0];
                      return (
                        <div className="flex justify-between">
                          <span className="font-medium">First Payment:</span>
                          <span className="text-xs text-gray-600">
                            ${firstPayment.amount} on {new Date(firstPayment.payment_date).toLocaleDateString()}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-500 mb-4">
                  Thank you for your payment. This receipt serves as proof of payment.
                </p>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FontAwesomeIcon icon={faCreditCard} className="mr-2" />
                  Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddFeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <FontAwesomeIcon icon={faCreditCard} className="text-green-600 text-xl mr-2" />
                <h2 className="text-xl font-bold text-gray-800">Add New Fee Record</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Select Student</label>
                  <select
                    value={newFeeData.student_id}
                    onChange={(e) => setNewFeeData({...newFeeData, student_id: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select a student...</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {capitalizeFirstLetter(formatStudentName(student))} ({student.registration_number})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Term</label>
                  <input
                    type="text"
                    value={newFeeData.term}
                    onChange={(e) => setNewFeeData({...newFeeData, term: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Fall-2024, Semester-1"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Amount</label>
                  <input
                    type="number"
                    value={newFeeData.amount}
                    onChange={(e) => setNewFeeData({...newFeeData, amount: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter amount"
                    min="0.01"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Due Date</label>
                  <input
                    type="date"
                    value={newFeeData.due_date}
                    onChange={(e) => setNewFeeData({...newFeeData, due_date: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddFeeModal(false);
                    setNewFeeData({
                      student_id: '',
                      term: '',
                      amount: '',
                      due_date: ''
                    });
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFee}
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors duration-200"
                >
                  {isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : <FontAwesomeIcon icon={faCreditCard} className="mr-2" />}
                  {isLoading ? 'Creating...' : 'Create Fee'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDepartmentFeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <FontAwesomeIcon icon={faCreditCard} className="text-purple-600 text-xl mr-2" />
                <h2 className="text-xl font-bold text-gray-800">Add Department Fee</h2>
              </div>

              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  This will create fee records for ALL students in the selected department and semester with default amounts:
                  <br />• Even semesters: $25,000
                  <br />• Odd semesters: $30,000
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Select Department</label>
                  <select
                    value={departmentFeeData.department_id}
                    onChange={(e) => setDepartmentFeeData({...departmentFeeData, department_id: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select a department...</option>
                    {departments.map(department => (
                      <option key={department.id} value={department.id}>
                        {department.name} ({department.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Semester</label>
                  <select
                    value={departmentFeeData.semester_id}
                    onChange={(e) => setDepartmentFeeData({...departmentFeeData, semester_id: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select a semester...</option>
                    {semesters.map(semester => (
                      <option key={semester.id} value={semester.id}>
                        {semester.name} ({semester.semester_code}) - Default: ${(parseInt(semester.name.split(' ')[1]) % 2 === 0 ? '25,000' : '30,000')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Due Date</label>
                  <input
                    type="date"
                    value={departmentFeeData.due_date}
                    onChange={(e) => setDepartmentFeeData({...departmentFeeData, due_date: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowDepartmentFeeModal(false);
                    setDepartmentFeeData({
                      department_id: '',
                      semester_id: '',
                      amount: '',
                      due_date: ''
                    });
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateDepartmentFee}
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-colors duration-200"
                >
                  {isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : <FontAwesomeIcon icon={faCreditCard} className="mr-2" />}
                  {isLoading ? 'Creating...' : 'Create Department Fees'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReportModal && reportData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-auto max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faFileAlt} className="text-blue-600 text-xl mr-2" />
                  <h2 className="text-xl font-bold text-gray-800">Fee Report</h2>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <FontAwesomeIcon icon={faFileAlt} className="mr-2" />
                    Print
                  </button>
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FontAwesomeIcon icon={faCheckCircle} size="lg" />
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{reportData.totalFees}</div>
                    <div className="text-sm text-blue-800">Total Fees</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">${reportData.totalAmount.toFixed(2)}</div>
                    <div className="text-sm text-green-800">Total Amount</div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">${reportData.totalPaid.toFixed(2)}</div>
                    <div className="text-sm text-yellow-800">Total Paid</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">${reportData.totalBalance.toFixed(2)}</div>
                    <div className="text-sm text-red-800">Total Balance</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">{reportData.statusBreakdown.paid}</div>
                    <div className="text-sm text-gray-600">Paid</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-600">{reportData.statusBreakdown.unpaid}</div>
                    <div className="text-sm text-gray-600">Unpaid</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-yellow-600">{reportData.statusBreakdown.partial}</div>
                    <div className="text-sm text-gray-600">Partial</div>
                  </div>
                </div>

                <div className="text-sm text-gray-600 mb-4">
                  <p><strong>Report Generated:</strong> {reportData.generatedAt}</p>
                  <p><strong>Department:</strong> {reportData.department}</p>
                  <p><strong>Semester:</strong> {reportData.semester}</p>
                  {reportData.student && (
                    <p><strong>Student:</strong> {capitalizeFirstLetter(formatStudentName(reportData.student))} ({reportData.student.registration_number})</p>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.fees.map((fee: Fee) => {
                      const student = students.find(s => s.id === fee.student);
                      return (
                        <tr key={fee.fee_id}>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student ? capitalizeFirstLetter(formatStudentName(student)) : 'Unknown'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {semesters.find(s => s.id === fee.semester)?.name || 'Unknown Semester'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">${fee.amount}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">${fee.paid_amount}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">${fee.balance.toFixed(2)}</td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              fee.status === 'Paid' ? 'bg-green-100 text-green-800' :
                              fee.status === 'Unpaid' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {fee.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{fee.due_date}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPaymentHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-auto max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faHistory} className="text-blue-600 text-xl mr-2" />
                  <h2 className="text-xl font-bold text-gray-800">Payment History</h2>
                </div>
                <button
                  onClick={() => setShowPaymentHistoryModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FontAwesomeIcon icon={faCheckCircle} size="lg" />
                </button>
              </div>

              {paymentHistory.length === 0 ? (
                <div className="text-center py-8">
                  <FontAwesomeIcon icon={faHistory} className="text-gray-400 text-4xl mb-4" />
                  <p className="text-gray-600">No payment history found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paymentHistory.map((payment: any, index: number) => (
                        <tr key={payment.payment_id || index} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(payment.payment_date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold text-green-600">
                            ${payment.amount}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              payment.payment_method === 'Cash' ? 'bg-green-100 text-green-800' :
                              payment.payment_method === 'Online' ? 'bg-blue-100 text-blue-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {payment.payment_method}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {payment.notes || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowPaymentHistoryModal(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBulkPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faCreditCard} className="text-green-600 text-xl mr-2" />
                  <h2 className="text-xl font-bold text-gray-800">Bulk Payment Processing</h2>
                </div>
                <button
                  onClick={() => setShowBulkPaymentModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FontAwesomeIcon icon={faCheckCircle} size="lg" />
                </button>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Selected Students ({selectedStudentsForPayment.length})
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                  {selectedStudentsForPayment.map(studentId => {
                    const studentData = studentFeeStatuses.find(s => s.id === studentId);
                    return studentData ? (
                      <div key={studentId} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                        <div>
                          <span className="font-medium">{formatStudentName(studentData)}</span>
                          <span className="text-sm text-gray-600 ml-2">
                            (${studentData.fee_info?.balance?.toFixed(2) || '0.00'} remaining)
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedStudentsForPayment(selectedStudentsForPayment.filter(id => id !== studentId));
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FontAwesomeIcon icon={faCheckCircle} />
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Online">Online</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> This will process full payment for all selected students.
                    Each student will receive a separate receipt.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowBulkPaymentModal(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      for (const studentId of selectedStudentsForPayment) {
                        const studentData = studentFeeStatuses.find(s => s.id === studentId);
                        if (studentData && studentData.fee_info) {
                          const paymentData = {
                            amount: studentData.fee_info.balance || 0,
                            payment_method: paymentMethod,
                            notes: `Bulk payment for ${semesters.find(s => s.id === selectedSemester)?.name || 'Unknown Semester'}`
                          };

                          await api.post(`academics/fees/${studentData.fee_info.fee_id}/payments/`, paymentData);
                        }
                      }

                      // Refresh data
                      await fetchStudentFeeStatuses();
                      setSelectedStudentsForPayment([]);
                      setShowBulkPaymentModal(false);

                      alert(`Successfully processed payments for ${selectedStudentsForPayment.length} students!`);
                    } catch (err: any) {
                      setError(err.message || 'Failed to process bulk payments');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading || selectedStudentsForPayment.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors duration-200"
                >
                  {isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : <FontAwesomeIcon icon={faCreditCard} className="mr-2" />}
                  {isLoading ? 'Processing...' : `Process Payments (${selectedStudentsForPayment.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showGenerateReceiptModal && receiptData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-auto max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faFileAlt} className="text-blue-600 text-xl mr-2" />
                  <h2 className="text-xl font-bold text-gray-800">Fee Receipt</h2>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <FontAwesomeIcon icon={faFileAlt} className="mr-2" />
                    Print
                  </button>
                  <button
                    onClick={() => setShowGenerateReceiptModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FontAwesomeIcon icon={faCheckCircle} size="lg" />
                  </button>
                </div>
              </div>

              <div className="border-t border-b border-gray-200 py-4 mb-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">University Fee Payment</h3>
                  <p className="text-sm text-gray-600">Receipt #{receiptData.fee?.fee_id || Date.now()}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Student:</span>
                    <span>{formatStudentName(receiptData.student)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Registration:</span>
                    <span>{receiptData.student.registration_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Semester:</span>
                    <span>{receiptData.semester}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Fee Amount:</span>
                    <span>${receiptData.fee?.amount || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Total Paid:</span>
                    <span className="font-semibold text-green-600">${receiptData.totalPaid?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Balance:</span>
                    <span>${receiptData.balance?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h5 className="text-md font-medium text-gray-800 mb-2">Payment History</h5>
                {receiptData.payments && receiptData.payments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submission Date</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {receiptData.payments.map((payment: any, index: number) => (
                          <tr key={payment.payment_id || index} className="hover:bg-gray-50">
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {new Date(payment.payment_date).toLocaleDateString()}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-green-600">
                              ${payment.amount}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {payment.payment_method}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {payment.notes || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">No payment history available.</p>
                )}
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-500 mb-4">
                  Thank you for your payment. This receipt serves as proof of payment.
                </p>
                <p className="text-xs text-gray-500">
                  Generated on {receiptData.generatedAt}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeManagement;
