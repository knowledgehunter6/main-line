import React from 'react';
import { Star, X } from 'lucide-react';

interface FeedbackProps {
  scores: Record<string, number>;
  comments: string;
  onClose: () => void;
}

const ImmediateFeedback: React.FC<FeedbackProps> = ({ scores, comments, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Call Assessment</h2>
              <p className="mt-1 text-sm text-gray-500">
                Here's your performance feedback for this call
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(scores).map(([category, score]) => (
                <div key={category} className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 capitalize mb-2">
                    {category.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${
                          star <= score
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                        fill={star <= score ? 'currentColor' : 'none'}
                      />
                    ))}
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      {score}/5
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Detailed Feedback
              </h3>
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {comments}
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImmediateFeedback;