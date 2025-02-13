import React, { useState, useEffect } from 'react';
import { MessageSquare, Play, Pause, Star, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import FeedbackForm from './FeedbackForm';

interface CallReviewProps {
  sessionId: string;
  onClose: () => void;
}

interface CallSession {
  id: string;
  trainee_id: string;
  scenario_type: string;
  emotional_state: string;
  transcript: any[];
  recording_url: string;
  duration: number;
  created_at: string;
}

interface Feedback {
  id: string;
  scores: Record<string, number>;
  comments: string;
  is_automated: boolean;
  created_at: string;
}

const CallReview: React.FC<CallReviewProps> = ({ sessionId, onClose }) => {
  const [session, setSession] = useState<CallSession | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [audio] = useState(new Audio());

  useEffect(() => {
    fetchCallData();
  }, [sessionId]);

  const fetchCallData = async () => {
    try {
      // Fetch call session data
      const { data: sessionData, error: sessionError } = await supabase
        .from('call_sessions')
        .select(`
          id,
          trainee_id,
          transcript,
          recording_url,
          duration,
          created_at
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;
      setSession(sessionData);

      // Fetch feedback data
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('call_feedback')
        .select('*')
        .eq('call_session_id', sessionId)
        .single();

      if (!feedbackError) {
        setFeedback(feedbackData);
      }
    } catch (err) {
      console.error('Error fetching call data:', err);
      setError('Failed to load call data');
    } finally {
      setLoading(false);
    }
  };

  const togglePlayback = () => {
    if (!session?.recording_url) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.src = session.recording_url;
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleFeedbackSubmit = () => {
    setShowFeedbackForm(false);
    fetchCallData(); // Refresh data to show new feedback
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error || 'Call session not found'}</p>
        <button
          onClick={onClose}
          className="mt-4 text-indigo-600 hover:text-indigo-500"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-4xl mx-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Call Review</h2>
            <p className="text-sm text-gray-500">
              {new Date(session.created_at).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Status Banner */}
        <div className={`mb-6 p-4 rounded-md ${
          feedback?.is_automated 
            ? 'bg-blue-50 border border-blue-200' 
            : feedback 
              ? 'bg-green-50 border border-green-200'
              : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center">
            {feedback?.is_automated ? (
              <>
                <AlertCircle className="h-5 w-5 text-blue-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-blue-700">AI-Generated Feedback Available</p>
                  <p className="text-sm text-blue-600">A trainer can review and provide additional feedback</p>
                </div>
              </>
            ) : feedback ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-green-700">Trainer Feedback Provided</p>
                  <p className="text-sm text-green-600">This call has been reviewed by a trainer</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-yellow-700">Awaiting Review</p>
                  <p className="text-sm text-yellow-600">This call has not been reviewed yet</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Call Details</h3>
            <dl className="grid grid-cols-1 gap-4">
              <div className="bg-gray-50 px-4 py-3 rounded-md">
                <dt className="text-sm font-medium text-gray-500">Scenario</dt>
                <dd className="mt-1 text-sm text-gray-900">{session.scenario_type}</dd>
              </div>
              <div className="bg-gray-50 px-4 py-3 rounded-md">
                <dt className="text-sm font-medium text-gray-500">Emotional State</dt>
                <dd className="mt-1 text-sm text-gray-900">{session.emotional_state}</dd>
              </div>
              <div className="bg-gray-50 px-4 py-3 rounded-md">
                <dt className="text-sm font-medium text-gray-500">Duration</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {Math.floor(session.duration / 60)}:{(session.duration % 60).toString().padStart(2, '0')}
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recording</h3>
            {session.recording_url ? (
              <div className="bg-gray-50 p-4 rounded-md">
                <button
                  onClick={togglePlayback}
                  className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-500"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                  <span>{isPlaying ? 'Pause' : 'Play'} Recording</span>
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No recording available</p>
            )}
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Transcript</h3>
          <div className="bg-gray-50 rounded-md p-4 max-h-96 overflow-y-auto">
            {session.transcript ? (
              <div className="space-y-4">
                {session.transcript.map((message: any, index: number) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-indigo-100 text-indigo-900'
                          : 'bg-white text-gray-900'
                      }`}
                    >
                      <div className="flex items-start">
                        <MessageSquare className="h-4 w-4 mt-1 mr-2" />
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No transcript available</p>
            )}
          </div>
        </div>

        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Feedback</h3>
            {(!feedback || feedback.is_automated) && !showFeedbackForm && (
              <button
                onClick={() => setShowFeedbackForm(true)}
                className="inline-flex items-center px-3 py-1.5 border border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-md text-sm font-medium transition-colors"
              >
                {feedback?.is_automated ? 'Add Trainer Feedback' : 'Add Feedback'}
              </button>
            )}
          </div>

          {showFeedbackForm ? (
            <FeedbackForm
              callSessionId={sessionId}
              onSubmit={handleFeedbackSubmit}
              onCancel={() => setShowFeedbackForm(false)}
            />
          ) : feedback ? (
            <div className="bg-gray-50 rounded-md p-4">
              {feedback.is_automated && (
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-blue-400 mr-2" />
                    <span className="text-sm text-blue-700">AI-Generated Assessment</span>
                  </div>
                  <button
                    onClick={() => setShowFeedbackForm(true)}
                    className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                  >
                    Add Human Review
                  </button>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {Object.entries(feedback.scores).map(([category, score]) => (
                  <div key={category} className="bg-white p-4 rounded-lg shadow-sm">
                    <dt className="text-sm font-medium text-gray-900 capitalize mb-2">
                      {category.replace(/([A-Z])/g, ' $1').trim()}
                    </dt>
                    <dd className="flex items-center space-x-1">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={`h-6 w-6 ${
                            index < score
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                          fill={index < score ? 'currentColor' : 'none'}
                        />
                      ))}
                      <span className="ml-2 text-lg font-medium text-gray-900">
                        {score}/5
                      </span>
                    </dd>
                  </div>
                ))}
              </div>
              {feedback.comments && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Detailed Feedback</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{feedback.comments}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No feedback provided yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallReview;