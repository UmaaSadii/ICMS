import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { instructorService, departmentService, Instructor, Department } from '../../api/studentInstructorService';
import InstructorModal from '../modals/InstructorModal';
import InstructorProfileModal from '../modals/InstructorProfileModal';

interface TeacherManagementProps {
  activeTab: string;
}

const TeacherManagement: React.FC<TeacherManagementProps> = ({ activeTab }) => {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [viewingInstructor, setViewingInstructor] = useState<Instructor | null>(null);

  // Fetch instructors on component mount
  useEffect(() => {
    const fetchInstructors = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await instructorService.getAllInstructors();
        if (Array.isArray(response.data)) {
          setInstructors(response.data);
        } else {
          console.error('Invalid instructors data format:', response.data);
          setInstructors([]);
          setError('Invalid data format received from server');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch instructors');
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'instructors') {
      fetchInstructors();
    }
  }, [activeTab]);

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await departmentService.getAllDepartments();
        setDepartments(response.data);
      } catch (err: any) {
        console.error('Failed to fetch departments:', err);
      }
    };

    fetchDepartments();
  }, []);

  const handleInstructorUpdate = useCallback((updatedInstructor: Instructor) => {
    setInstructors(prev =>
      prev.map(instructor =>
        instructor.id === updatedInstructor.id ? updatedInstructor : instructor
      )
    );
  }, []);

  const handleInstructorDelete = useCallback(async (instructorId: number) => {
    if (window.confirm('Are you sure you want to delete this instructor?')) {
      try {
        await instructorService.deleteInstructor(instructorId);
        setInstructors(prev => prev.filter(instructor => instructor.id !== instructorId));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete instructor');
      }
    }
  }, []);

  const handleAddInstructor = useCallback(() => {
    setEditingInstructor(null);
    setShowModal(true);
  }, []);

  const handleEditInstructor = useCallback((instructor: Instructor) => {
    setEditingInstructor(instructor);
    setShowModal(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setShowModal(false);
    setEditingInstructor(null);
  }, []);

  const handleInstructorSave = useCallback(async (instructorData: any) => {
    try {
      if (editingInstructor && typeof editingInstructor.id === 'number') {
        // Update existing instructor
        const response = await instructorService.updateInstructor(editingInstructor.id, instructorData);
        setInstructors(prev =>
          prev.map(instructor =>
            instructor.id === editingInstructor.id ? response.data : instructor
          )
        );
      } else {
        // Create new instructor
        const response = await instructorService.createInstructor(instructorData);
        setInstructors(prev => [...prev, response.data]);
      }
      setShowModal(false);
      setEditingInstructor(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save instructor');
    }
  }, [editingInstructor]);

  const instructorStats = useMemo(() => {
    const total = Array.isArray(instructors) ? instructors.length : 0;
    const byDepartment = Array.isArray(instructors) ? instructors.reduce((acc, instructor) => {
      const deptName = instructor.department_name || 'Unknown';
      acc[deptName] = (acc[deptName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) : {};

    // Remove 'Unknown' key and add its count to 'Student' key
    if (byDepartment['Unknown']) {
      const unknownCount = byDepartment['Unknown'];
      delete byDepartment['Unknown'];
      byDepartment['Student'] = (byDepartment['Student'] || 0) + unknownCount;
    }

    return { total, byDepartment };
  }, [instructors]);
  
  // Add search state
  const [searchTerm, setSearchTerm] = React.useState('');
  
  // Filtered instructors based on search term
  const filteredInstructors = useMemo(() => {
    if (!searchTerm.trim()) return instructors;
    const lowerSearch = searchTerm.toLowerCase();
    return instructors.filter(inst =>
      (inst.name && inst.name.toLowerCase().includes(lowerSearch)) ||
      (inst.department_name && inst.department_name.toLowerCase().includes(lowerSearch)) ||
      (inst.designation && inst.designation.toLowerCase().includes(lowerSearch))
    );
  }, [searchTerm, instructors]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6" role="main" aria-labelledby="instructor-management-heading">
      <div className="flex justify-between items-center mb-6">
        <h2 id="instructor-management-heading" className="text-2xl font-bold text-gray-800">
          Instructors ({filteredInstructors.length})
        </h2>
        <div className="flex items-center space-x-4">
          <input
            id="instructor-search"
            type="text"
            placeholder="Search instructors..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-describedby="instructor-search-help"
          />
          <span id="instructor-search-help" className="sr-only">
            Search by instructor name, department, or designation
          </span>
          <button
            onClick={handleAddInstructor}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Instructor</span>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(instructorStats.byDepartment).map(([dept, count]) => (
            <div key={dept} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-800">{dept}</h4>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-sm text-gray-600">instructors</p>
            </div>
          ))}
        </div>
      </div>

      {/* Instructors List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              Instructors ({filteredInstructors.length})
            </h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-sm text-gray-600">Active</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Instructor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Designation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Experience
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInstructors.map((instructor) => (
                <tr key={instructor.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {instructor.image ? (
                        <img className="h-10 w-10 rounded-full object-cover" src={typeof instructor.image === 'string' ? instructor.image : ''} alt={instructor.name || 'Instructor'} />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {instructor.name ? instructor.name.charAt(0).toUpperCase() : ''}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{instructor.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{instructor.user_email || 'N/A'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{instructor.department_name || 'N/A'}</div>
                  <div className="text-sm text-gray-500">{instructor.specialization || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {instructor.designation || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {typeof instructor.experience_years === 'number' ? `${instructor.experience_years} years` : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setViewingInstructor(instructor);
                        setShowProfileModal(true);
                      }}
                      title="View"
                      className="p-1 rounded-md hover:bg-gray-100 text-gray-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEditInstructor(instructor)}
                      title="Edit"
                      className="p-1 rounded-md hover:bg-blue-100 text-blue-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleInstructorDelete(instructor.id!)}
                      title="Delete"
                      className="p-1 rounded-md hover:bg-red-100 text-red-600"
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

        {filteredInstructors.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No instructors found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding a new instructor.</p>
            <div className="mt-6">
              <button
                onClick={handleAddInstructor}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Instructor
              </button>
            </div>
          </div>
        )}
      </div>

      {showProfileModal && viewingInstructor && (
        <InstructorProfileModal
          instructor={viewingInstructor}
          onClose={() => {
            setShowProfileModal(false);
            setViewingInstructor(null);
          }}
          departmentName={viewingInstructor.department_name || ''}
          isOpen={showProfileModal}
          onSuccess={() => {
            setShowProfileModal(false);
            setViewingInstructor(null);
          }}
        />
      )}

      {showModal && (
        <InstructorModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingInstructor(null);
          }}
          instructorId={editingInstructor?.id}
          onSuccess={() => {
            setShowModal(false);
            setEditingInstructor(null);
            // Refetch instructors after save
            if (activeTab === 'instructors') {
              const fetchInstructors = async () => {
                try {
                  const response = await instructorService.getAllInstructors();
                  if (Array.isArray(response.data)) {
                    setInstructors(response.data);
                  }
                } catch (err: any) {
                  console.error('Failed to refetch instructors:', err);
                }
              };
              fetchInstructors();
            }
          }}
        />
      )}
    </div>
  );
};

export default React.memo(TeacherManagement);
