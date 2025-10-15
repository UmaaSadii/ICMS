import React, { useState, useEffect } from 'react';
import { instructorService, departmentService } from '../../api/studentInstructorService';

interface InstructorModalProps {
  isOpen: boolean;
  onClose: () => void;
  instructorId?: number;
  onSuccess: () => void;
}

interface Department {
  id: number;
  name: string;
  code: string;
}

const InstructorModal: React.FC<InstructorModalProps> = ({ isOpen, onClose, instructorId, onSuccess }): React.ReactElement | null => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    employee_id: '',
    department_id: '',  // Changed from department to department_id
    designation: '',
    specialization: '',
    experience_years: '',
    hire_date: '',
    address: '',
  });

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await departmentService.getAllDepartments();
        setDepartments(response.data);
      } catch (error) {
        console.error('Failed to fetch departments:', error);
        setError('Failed to load departments. Please try again.');
      }
    };

    fetchDepartments();
  }, []);

  // Generate unique employee ID for new instructors
  useEffect(() => {
    if (!instructorId) {
      const generateEmployeeId = () => {
        const timestamp = Date.now().toString().slice(-4);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${timestamp}${random}`;
      };

      setFormData(prev => ({
        ...prev,
        employee_id: generateEmployeeId()
      }));
    }
  }, [instructorId]);

  // Fetch instructor data if editing
  useEffect(() => {
    if (instructorId) {
      const fetchInstructorData = async () => {
        setIsLoading(true);
        try {
          const response = await instructorService.getInstructorById(instructorId);
          const instructor = response.data;
          
          // For instructors, department is stored as object with id
          const departmentId = (instructor.department && typeof instructor.department === 'object' && instructor.department.id)
            ? instructor.department.id
            : instructor.department_id || '';

          setFormData({
            name: instructor.name || '',
            email: instructor.user?.email || '',
            phone: instructor.phone || '',
            employee_id: instructor.employee_id || '',
            department_id: departmentId ? departmentId.toString() : '',
            designation: instructor.designation || '',
            specialization: instructor.specialization || '',
            experience_years: instructor.experience_years?.toString() || '',
            hire_date: instructor.hire_date ? new Date(instructor.hire_date).toISOString().split('T')[0] : '',
            address: instructor.address || '',
          });
          
          if (instructor.image) {
            setImagePreview(instructor.image);
          }
        } catch (error) {
          console.error('Failed to fetch instructor data:', error);
          setError('Failed to load instructor data. Please try again.');
        } finally {
          setIsLoading(false);
        }
      };

      fetchInstructorData();
    }
  }, [instructorId, departments]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setError('Name is required.');
        setIsLoading(false);
        return;
      }

      if (!formData.email.trim()) {
        setError('Email is required.');
        setIsLoading(false);
        return;
      }

      if (!formData.phone.trim()) {
        setError('Phone number is required.');
        setIsLoading(false);
        return;
      }

      if (!formData.department_id) {
        setError('Department is required.');
        setIsLoading(false);
        return;
      }

      if (!formData.specialization.trim()) {
        setError('Specialization is required.');
        setIsLoading(false);
        return;
      }

      const formDataToSend = new FormData();

      // Add all form fields to FormData
      formDataToSend.append('name', formData.name);
      formDataToSend.append('phone', formData.phone);

      // Send the department ID as required by the backend
      if (formData.department_id) {
        formDataToSend.append('department_id', formData.department_id);
      }

      if (formData.employee_id) formDataToSend.append('employee_id', formData.employee_id);
      if (formData.designation) formDataToSend.append('designation', formData.designation);
      if (formData.specialization) formDataToSend.append('specialization', formData.specialization);
      if (formData.experience_years) formDataToSend.append('experience_years', String(parseInt(formData.experience_years, 10) || 0));
      if (formData.hire_date) formDataToSend.append('hire_date', formData.hire_date);
      if (formData.address) formDataToSend.append('address', formData.address);

      // Add email for user association - this is crucial for both create and update
      if (formData.email) {
        formDataToSend.append('user_email', formData.email);
      }

      console.log('Instructor data to send:', {
        name: formData.name,
        email: formData.email,
        department_id: formData.department_id,
        formData: Object.fromEntries(formDataToSend.entries())
      });

      let instructorResponse;
          if (instructorId) {
            // Update existing instructor
            instructorResponse = await instructorService.updateInstructor(instructorId, formDataToSend);
          } else {
            // Create new instructor
            instructorResponse = await instructorService.createInstructor(formDataToSend);
          }

      // Upload image separately after instructor creation/update if image is selected
      if (imageFile && imageFile instanceof File) {
        try {
          const imageFormData = new FormData();
          imageFormData.append('image', imageFile);
          const instructorIdToUse = instructorId || instructorResponse.data.id;
          await instructorService.uploadInstructorImage(instructorIdToUse, imageFormData);
        } catch (uploadError) {
          console.error('Failed to upload instructor image:', uploadError);
          setError('Instructor saved but failed to upload image. Please try uploading the image separately.');
        }
      }



      onSuccess();
    } catch (error: any) {
      console.error('Failed to save instructor:', error);
      setError(error.response?.data?.message || 'Failed to save instructor. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {instructorId ? 'Edit Instructor' : 'Add New Instructor'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID {!instructorId && <span className="text-sm text-gray-500">(Auto-generated)</span>}</label>
              <input
                type="text"
                name="employee_id"
                value={formData.employee_id}
                onChange={instructorId ? handleInputChange : undefined}
                readOnly={!instructorId}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${!instructorId ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              <select
                name="department_id"
                value={formData.department_id}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization *</label>
              <input
                type="text"
                name="specialization"
                value={formData.specialization}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
              <input
                type="number"
                name="experience_years"
                value={formData.experience_years}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date</label>
              <input
                type="date"
                name="hire_date"
                value={formData.hire_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Profile Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-32 w-32 object-cover rounded-md"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                'Save Instructor'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InstructorModal;