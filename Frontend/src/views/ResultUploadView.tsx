import React from 'react';
import { Department, Semester } from '../api/instructorAttendanceService';
import { Student } from '../models/StudentModel';
import { Result } from '../models/ResultModel';

interface ResultUploadViewProps {
  departments: Department[];
  semesters: Semester[];
  students: Student[];
  selectedDepartment: string | null;
  setSelectedDepartment: (dept: string | null) => void;
  selectedSemester: number | null;
  setSelectedSemester: (sem: number | null) => void;
  selectedStudent: Student | null;
  results: Result[];
  assignedCourses: { course_id: number; name: string }[];
  loading: boolean;
  error: string | null;
  success: string | null;
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  formData: {
    subject: string;
    exam_type: string;
    exam_date: string;
    total_marks: number;
    obtained_marks: number;
    grade: string;
  };
  setFormData: (data: any) => void;
  handleStudentSelect: (student: Student) => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleDelete: (resultId: number) => void;
  calculateGrade: (obtained: number, total: number) => string;
  getDefaultTotalMarks: (examType: string) => number;
}

const ResultUploadView: React.FC<ResultUploadViewProps> = ({
  departments,
  semesters,
  students,
  selectedDepartment,
  setSelectedDepartment,
  selectedSemester,
  setSelectedSemester,
  selectedStudent,
  results,
  assignedCourses,
  loading,
  error,
  success,
  showForm,
  setShowForm,
  formData,
  setFormData,
  handleStudentSelect,
  handleSubmit,
  handleDelete,
  calculateGrade,
  getDefaultTotalMarks
}) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Result Upload</h2>

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Students List */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Select Student</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {students.map((student) => (
              <div
                key={student.id}
                onClick={() => handleStudentSelect(student)}
                className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                  selectedStudent?.id === student.id ? 'bg-blue-50 border-blue-300' : ''
                }`}
              >
                <div className="font-medium">{student.name}</div>
                <div className="text-sm text-gray-600">
                  Roll: {student.roll_number} | Dept: {student.department?.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Results Records */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              Results {selectedStudent ? `for ${selectedStudent.name}` : ''}
            </h3>
            {selectedStudent && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Add Result
              </button>
            )}
          </div>

          {selectedStudent ? (
            <div className="space-y-2">
              {results.map((result) => (
                <div key={result.result_id} className="p-3 border rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{result.subject}</div>
                      <div className="text-sm text-gray-600">
                        {result.exam_type} - {result.exam_date}
                      </div>
                      <div className="text-sm">
                        Marks: {result.obtained_marks}/{result.total_marks} ({((result.obtained_marks / result.total_marks) * 100).toFixed(1)}%)
                      </div>
                      <div className={`text-sm font-medium ${
                        result.grade === 'F' ? 'text-red-600' :
                        result.grade.startsWith('A') ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        Grade: {result.grade}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(result.result_id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {results.length === 0 && (
                <div className="text-gray-500 text-center py-4">No results found</div>
              )}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-4">Select a student to view results</div>
          )}
        </div>
      </div>

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
            Please select a department and semester to view students and upload results.
          </div>
        </div>
      )}

      {/* Add Result Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Add Result</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Subject</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="" disabled>Select subject</option>
                  {assignedCourses.map((course) => (
                    <option key={course.course_id} value={course.name}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Exam Type</label>
                <select
                  value={formData.exam_type}
                  onChange={(e) => {
                    const examType = e.target.value;
                    let totalMarks = 25;
                    if (examType.includes('Quiz')) totalMarks = 5;
                    else if (examType.includes('Assignment')) totalMarks = 5;
                    else if (examType.includes('Mid')) totalMarks = 25;
                    else if (examType.includes('Final')) totalMarks = 60;
                    setFormData({...formData, exam_type: examType, total_marks: totalMarks});
                  }}
                  className="w-full p-2 border rounded"
                >
                  <option value="Quiz 1">Quiz 1 (5 marks)</option>
                  <option value="Quiz 2">Quiz 2 (5 marks)</option>
                  <option value="Assignment 1">Assignment 1 (5 marks)</option>
                  <option value="Assignment 2">Assignment 2 (5 marks)</option>
                  <option value="Mid Term">Mid Term (25 marks)</option>
                  <option value="Final Exam">Final Exam (60 marks)</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Exam Date</label>
                <input
                  type="date"
                  value={formData.exam_date}
                  onChange={(e) => setFormData({...formData, exam_date: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Total Marks</label>
                <input
                  type="number"
                  value={formData.total_marks}
                  onChange={(e) => setFormData({...formData, total_marks: parseInt(e.target.value)})}
                  className="w-full p-2 border rounded"
                  min="1"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Auto-set based on exam type (Assignment: 5, Mid: 25, Final: 60)</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Obtained Marks</label>
                <input
                  type="number"
                  value={formData.obtained_marks}
                  onChange={(e) => setFormData({...formData, obtained_marks: parseInt(e.target.value)})}
                  className="w-full p-2 border rounded"
                  min="0"
                  max={formData.total_marks}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Grade (Auto-calculated)</label>
                <input
                  type="text"
                  value={calculateGrade(formData.obtained_marks, formData.total_marks)}
                  className="w-full p-2 border rounded bg-gray-100"
                  readOnly
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultUploadView;
