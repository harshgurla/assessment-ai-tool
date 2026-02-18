import { useState, useEffect } from 'react';
import { X, UserPlus, Search, Check, Loader2 } from 'lucide-react';

interface Student {
  _id: string;
  name?: string;
  email: string;
}

interface AssignStudentsModalProps {
  assessmentId: string;
  assessmentTitle: string;
  currentStudents: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export const AssignStudentsModal = ({ 
  assessmentId, 
  assessmentTitle, 
  currentStudents,
  onClose, 
  onSuccess 
}: AssignStudentsModalProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/students`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setStudents(data.students);
        // Pre-select currently assigned students
        setSelectedEmails(currentStudents);
      } else {
        setError(data.error || 'Failed to fetch students');
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
      setError('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStudent = (email: string) => {
    setSelectedEmails(prev => 
      prev.includes(email) 
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const handleSelectAll = () => {
    const filtered = filteredStudents.map(s => s.email);
    const allSelected = filtered.every(email => selectedEmails.includes(email));
    
    if (allSelected) {
      setSelectedEmails(prev => prev.filter(email => !filtered.includes(email)));
    } else {
      setSelectedEmails(prev => [...new Set([...prev, ...filtered])]);
    }
  };

  const handleSubmit = async () => {
    if (selectedEmails.length === 0) {
      setError('Please select at least one student');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/assessments/${assessmentId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ studentEmails: selectedEmails })
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to assign students');
      }
    } catch (error) {
      console.error('Failed to assign students:', error);
      setError('Failed to assign students');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = students.filter(student => 
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const newStudents = filteredStudents.filter(s => !currentStudents.includes(s.email));
  const assignedStudents = filteredStudents.filter(s => currentStudents.includes(s.email));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="bg-purple-100 p-2 rounded-lg">
              <UserPlus className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                Assign Students
              </h2>
              <p className="text-sm text-gray-500 truncate">{assessmentTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg touch-manipulation"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Selection Info */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
            <span className="text-sm font-medium text-gray-700">
              {selectedEmails.length} student{selectedEmails.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleSelectAll}
              className="text-sm font-medium text-purple-600 hover:text-purple-700"
            >
              {filteredStudents.every(s => selectedEmails.includes(s.email)) ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {/* Students List */}
          <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No students found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {/* Currently Assigned */}
                {assignedStudents.length > 0 && (
                  <>
                    <div className="bg-green-50 px-4 py-2">
                      <p className="text-xs font-semibold text-green-800 uppercase">Currently Assigned</p>
                    </div>
                    {assignedStudents.map((student) => (
                      <label
                        key={student._id}
                        className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEmails.includes(student.email)}
                          onChange={() => handleToggleStudent(student.email)}
                          className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 touch-manipulation"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {student.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{student.email}</p>
                        </div>
                        {selectedEmails.includes(student.email) && (
                          <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                        )}
                      </label>
                    ))}
                  </>
                )}

                {/* New Students */}
                {newStudents.length > 0 && (
                  <>
                    {assignedStudents.length > 0 && (
                      <div className="bg-blue-50 px-4 py-2">
                        <p className="text-xs font-semibold text-blue-800 uppercase">Available Students</p>
                      </div>
                    )}
                    {newStudents.map((student) => (
                      <label
                        key={student._id}
                        className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEmails.includes(student.email)}
                          onChange={() => handleToggleStudent(student.email)}
                          className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 touch-manipulation"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {student.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{student.email}</p>
                        </div>
                        {selectedEmails.includes(student.email) && (
                          <Check className="h-5 w-5 text-purple-600 flex-shrink-0" />
                        )}
                      </label>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-5 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors font-medium touch-manipulation min-h-[44px]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || selectedEmails.length === 0}
            className="px-5 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium touch-manipulation min-h-[44px] flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                Assign ({selectedEmails.length})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
