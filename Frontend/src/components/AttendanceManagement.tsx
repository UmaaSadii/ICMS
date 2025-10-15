import React, { useState, useEffect } from 'react';
import { instructorAttendanceService, Department, Semester, Student, BulkAttendanceRequest } from '../api/instructorAttendanceService';

const AttendanceManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceStatuses, setAttendanceStatuses] = useState<{ [key: string]: 'Present' | 'Absent' | 'Late' }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      const deptId = parseInt(selectedDepartment);
      if (!isNaN(deptId)) {
        fetchSemesters(deptId);
      }
      setSelectedSemester(null);
      setStudents([]);
      setAttendanceStatuses({});
    }
  }, [selectedDepartment]);

  useEffect(() => {
    if (selectedDepartment && selectedSemester) {
      const deptId = parseInt(selectedDepartment);
      if (!isNaN(deptId)) {
        fetchStudents(deptId, selectedSemester);
      }
    }
  }, [selectedDepartment, selectedSemester]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await instructorAttendanceService.getDepartments();
      console.log('Fetched departments:', response);  // Debug log
      setDepartments(response);
    } catch (err: any) {
      console.error('Error fetching departments:', err);  // Debug log
      setError('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const fetchSemesters = async (departmentId: number) => {
    try {
      setLoading(true);
      const response = await instructorAttendanceService.getSemestersByDepartment(departmentId);
      setSemesters(response);
    } catch (err: any) {
      setError('Failed to fetch semesters');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (departmentId: number, semesterId: number) => {
    try {
      setLoading(true);
      const response = await instructorAttendanceService.getStudentsByDepartmentAndSemester(departmentId, semesterId);
      setStudents(response);

      // Initialize attendance statuses to 'Present' for all students
      const initialStatuses: { [key: string]: 'Present' | 'Absent' | 'Late' } = {};
      response.forEach(student => {
        initialStatuses[student.student_id] = 'Present';
      });
      setAttendanceStatuses(initialStatuses);
    } catch (err: any) {
      setError('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceStatusChange = (studentId: string, status: 'Present' | 'Absent' | 'Late') => {
    setAttendanceStatuses(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSubmitAttendance = async () => {
    if (!selectedDepartment || !selectedSemester || students.length === 0) {
      setError('Please select department, semester, and ensure students are loaded');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const attendances = students.map(student => ({
        student_id: student.student_id,
        status: attendanceStatuses[student.student_id] || 'Present'
      }));

      const requestData: BulkAttendanceRequest = {
        date: attendanceDate,
        attendances: attendances
      };

      const response = await instructorAttendanceService.markBulkAttendance(requestData);
      setSuccess(response.message);

      // Reset attendance statuses to Present after successful submission
      const resetStatuses: { [key: string]: 'Present' | 'Absent' | 'Late' } = {};
      students.forEach(student => {
        resetStatuses[student.student_id] = 'Present';
      });
      setAttendanceStatuses(resetStatuses);

    } catch (err: any) {
      setError('Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  const markAllPresent = () => {
    const newStatuses: { [key: string]: 'Present' | 'Absent' | 'Late' } = {};
    students.forEach(student => {
      newStatuses[student.student_id] = 'Present';
    });
    setAttendanceStatuses(newStatuses);
  };

  const markAllAbsent = () => {
    const newStatuses: { [key: string]: 'Present' | 'Absent' | 'Late' } = {};
    students.forEach(student => {
      newStatuses[student.student_id] = 'Absent';
    });
    setAttendanceStatuses(newStatuses);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Bulk Attendance Management</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Selection Controls */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Department</label>
            <select
              value={selectedDepartment || ''}
              onChange={(e) => setSelectedDepartment(e.target.value || null)}
              className="w-full p-2 border rounded"
            >
              <option value="">Select Department</option>
              {departments
                .filter((dept): dept is Department => dept.id != null && typeof dept.id === 'number')
                .map((dept) => (
                  <option key={dept.id} value={dept.id.toString()}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Semester</label>
            <select
              value={selectedSemester || ''}
              onChange={(e) => setSelectedSemester(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full p-2 border rounded"
              disabled={!selectedDepartment}
            >
              <option value="">Select Semester</option>
              {semesters
                .filter((sem): sem is Semester => sem.id != null && typeof sem.id === 'number')
                .map((sem) => (
                  <option key={sem.id} value={sem.id}>
                    {sem.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Date</label>
            <input
              type="date"
              value={attendanceDate}
              max={new Date().toISOString().split('T')[0]}  // Prevent future dates
              onChange={(e) => {
                if (e.target.value <= new Date().toISOString().split('T')[0]) {
                  setAttendanceDate(e.target.value);
                }
              }}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </div>

      {/* Students List and Attendance */}
      {students.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Students ({students.length}) - {departments.find(d => {
                  const deptId = selectedDepartment ? parseInt(selectedDepartment) : -1;
                  return !isNaN(deptId) && d.id === deptId;
                })?.name} - {semesters.find(s => s.id === selectedSemester)?.name}
              </h3>
            <div className="flex space-x-2">
              <button
                onClick={markAllPresent}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                Mark All Present
              </button>
              <button
                onClick={markAllAbsent}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Mark All Absent
              </button>
              <button
                onClick={handleSubmitAttendance}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Submit Attendance'}
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {students.map((student) => (
              <div key={student.student_id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex-1">
                  <div className="font-medium">{student.name}</div>
                  <div className="text-sm text-gray-600">
                    ID: {student.student_id} | Email: {student.email}
                  </div>
                </div>
                <div className="flex space-x-2">
                  {(['Present', 'Absent', 'Late'] as const).map((status) => (
                    <label key={status} className="flex items-center">
                      <input
                        type="radio"
                        name={`attendance-${student.student_id}`}
                        value={status}
                        checked={attendanceStatuses[student.student_id] === status}
                        onChange={() => handleAttendanceStatusChange(student.student_id, status)}
                        className="mr-1"
                      />
                      <span className={`text-sm ${
                        status === 'Present' ? 'text-green-600' :
                        status === 'Absent' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {status}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedDepartment && selectedSemester && students.length === 0 && !loading && (
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 text-center py-8">
            No students found for the selected department and semester.
          </div>
        </div>
      )}

      {!selectedDepartment && (
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 text-center py-8">
            Please select a department and semester to view students and mark attendance.
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceManagement;
