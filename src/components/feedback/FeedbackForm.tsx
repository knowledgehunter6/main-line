import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface FeedbackFormProps {
  callSessionId: string;
  onSubmit: () => void;
  onCancel: () => void;
}

interface ScoreCategory {
  name: string;
  key: string;
  description: string;
}

const scoreCategories: ScoreCategory[] = [
  {
    name: 'Communication Clarity',
    key: 'clarity',
    description: 'Clear and effective communication'
  },
  {
    name: 'Problem Solving',
    key: 'problemSolving',
    description: 'Ability to identify and resolve issues'
  },
  {
    name: 'Empathy',
    key: 'empathy',
    description: 'Understanding and relating to customer needs'
  },
  {
    name: 'Call Control',
    key: 'control',
    description: 'Maintaining professional direction of the conversation'
  },
  {
    name: 'Resolution Speed',
    key: 'speed',
    description: 'Efficiency in handling the call'
  }
];

const scoreOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const feedbackSchema = z.object({
  scores: z.record(
    z.number()
      .min(1, 'Score must be at least 1')
      .max(10, 'Score cannot exceed 10')
  ),
  comments: z.string().min(10, 'Please provide detailed feedback')
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

const FeedbackForm: React.FC<FeedbackFormProps> = React.memo(({ callSessionId, onSubmit, onCancel }) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      scores: {},
      comments: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleScoreChange = (category: string, score: number) => {
    setValue('scores', { ...watch('scores'), [category]: score });
  };

  const handleSubmitForm = async (data: FeedbackFormData) => {
    setLoading(true);
    setError('');

    try {
      const { error: submitError } = await supabase
        .from('call_feedback')
        .insert({
          call_session_id: callSessionId,
          scores: data.scores,
          comments: data.comments
        });

      if (submitError) throw submitError;
      onSubmit();
    } catch (err) {
      console.error('Feedback submission error:', err);
      setError('Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="bg-indigo-50 border border-indigo-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-indigo-900 mb-1">Trainer Review Guidelines</h3>
        <p className="text-sm text-indigo-700">
          Please evaluate each aspect carefully and provide constructive feedback to help the trainee improve.
          Consider both technical skills and soft skills in your assessment.
        </p>
      </div>

      <div className="space-y-4">
        {scoreCategories.map(category => (
          <div key={category.key} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-sm font-medium text-gray-900">{category.name}</h3>
                <p className="text-xs text-gray-500">{category.description}</p>
              </div>
              <div className="flex space-x-2">
                {scoreOptions.map(score => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => handleScoreChange(category.key, score)}
                    className={`p-1.5 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${
                      watch('scores')[category.key] === score
                        ? 'text-yellow-400 hover:text-yellow-500'
                        : 'text-gray-300 hover:text-gray-400'
                    }`}
                  >
                    <Star className="h-6 w-6" fill={watch('scores')[category.key] === score ? 'currentColor' : 'none'} />
                  </button>
                ))}
                {watch('scores')[category.key] && (
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    {watch('scores')[category.key]}/10
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
          Detailed Feedback
        </label>
        <p className="text-sm text-gray-500 mb-2">
          Provide specific examples and actionable suggestions for improvement
        </p>
        <textarea
          id="comments"
          rows={4}
          {...register('comments')}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 resize-y"
          placeholder="Example: 'Great job showing empathy when the customer expressed frustration. To improve, try acknowledging their concerns more explicitly before moving to solutions.'"
        />
        {errors.comments && (
          <p className="mt-1 text-sm text-red-600">{errors.comments.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || Object.keys(watch('scores')).length === 0}
          className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>
    </form>
  );
});

export default FeedbackForm;