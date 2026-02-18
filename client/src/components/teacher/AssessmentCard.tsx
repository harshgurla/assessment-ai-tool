import { Clock, Users, BarChart3, Eye, Edit, Trash2, Calendar, UserPlus } from 'lucide-react';

interface Assessment {
  _id: string;
  title: string;
  topic: string;
  language: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  questions: any[];
  createdAt: string;
  status: 'draft' | 'active' | 'completed';
  studentsAssigned: number;
  submissions: number;
}

interface AssessmentCardProps {
  assessment: Assessment;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
  onAssign: () => void;
}

export const AssessmentCard = ({ assessment, onEdit, onDelete, onView, onAssign }: AssessmentCardProps) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{assessment.title}</h3>
            <p className="text-sm text-gray-500">{assessment.topic}</p>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={onView}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation"
              title="View Assessment"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={onAssign}
              className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors touch-manipulation"
              title="Assign to Students"
            >
              <UserPlus className="h-4 w-4" />
            </button>
            <button
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors touch-manipulation"
              title="Edit Assessment"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
              title="Delete Assessment"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center space-x-2 mb-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(assessment.difficulty)}`}>
            {assessment.difficulty}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assessment.status)}`}>
            {assessment.status}
          </span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            {assessment.language}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            {assessment.duration} min
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <BarChart3 className="h-4 w-4 mr-2" />
            {assessment.questions.length} questions
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-2" />
            {assessment.studentsAssigned} students
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            {assessment.submissions} submissions
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Created {new Date(assessment.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};
