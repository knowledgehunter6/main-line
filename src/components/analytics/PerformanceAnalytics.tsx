import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, Target, BarChart3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { SCORE_RANGE } from '../../types/feedback';
import { getScoreColor, formatScore, categorizePerformance } from '../../utils/scoreUtils';

interface AnalyticsData {
  totalCalls: number;
  avgScores: {
    clarity: number;
    problemSolving: number;
    empathy: number;
    control: number;
    speed: number;
  };
  recentScores: {
    date: string;
    avgScore: number;
  }[];
  scenarioBreakdown: {
    type: string;
    count: number;
    avgScore: number;
  }[];
  skillLevel: string;
  nextMilestone: {
    name: string;
    callsNeeded: number;
  };
}

const PerformanceAnalytics: React.FC = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, timeframe]);

  const fetchAnalytics = async () => {
    try {
      // Fetch call sessions with feedback
      const { data: sessions, error: sessionsError } = await supabase
        .from('call_sessions')
        .select(`
          id,
          trainee_id,
          duration,
          created_at,
          call_feedback (
            scores,
            comments,
            created_at
          )
        `)
        .eq('trainee_id', user?.id)
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Calculate analytics
      const totalCalls = sessions?.length || 0;
      const sessionsWithFeedback = sessions?.filter(s => s.call_feedback?.length > 0) || [];
      
      // Calculate average scores
      const avgScores = {
        clarity: 0,
        problemSolving: 0,
        empathy: 0,
        control: 0,
        speed: 0
      };

      sessionsWithFeedback.forEach(session => {
        const scores = session.call_feedback[0].scores;
        Object.keys(avgScores).forEach(key => {
          avgScores[key as keyof typeof avgScores] += scores[key] || 0;
        });
      });

      Object.keys(avgScores).forEach(key => {
        avgScores[key as keyof typeof avgScores] /= sessionsWithFeedback.length || 1;
      });

      // Calculate recent scores trend
      const recentScores = sessionsWithFeedback
        .map(session => ({
          date: new Date(session.created_at).toLocaleDateString(),
          avgScore: Object.values(session.call_feedback[0].scores as Record<string, number>)
            .reduce((a, b) => a + b, 0) / 5
        }))
        .slice(0, 10);

      // Calculate scenario breakdown
      const scenarioBreakdown = Object.entries(
        sessions?.reduce((acc: any, session) => {
          const type = 'General Call'; // Default type since we no longer track specific scenarios
          if (!acc[type]) {
            acc[type] = { count: 0, totalScore: 0 };
          }
          acc[type].count++;
          if (session.call_feedback?.length > 0) {
            const avgScore = Object.values(session.call_feedback[0].scores as Record<string, number>)
              .reduce((a, b) => a + b, 0) / 5;
            acc[type].totalScore += avgScore;
          }
          return acc;
        }, {}) || {}
      ).map(([type, data]: [string, any]) => ({
        type,
        count: data.count,
        avgScore: data.totalScore / data.count
      }));

      // Calculate skill level
      const overallAvg = Object.values(avgScores)
        .reduce((a, b) => a + b, 0) / Object.keys(avgScores).length;
      
      const skillLevel = 
        overallAvg >= 4.5 ? 'Expert' :
        overallAvg >= 4.0 ? 'Advanced' :
        overallAvg >= 3.5 ? 'Intermediate' :
        overallAvg >= 3.0 ? 'Developing' :
        'Beginner';

      // Calculate next milestone
      const nextMilestone = {
        name: skillLevel === 'Beginner' ? 'Developing' :
              skillLevel === 'Developing' ? 'Intermediate' :
              skillLevel === 'Intermediate' ? 'Advanced' :
              skillLevel === 'Advanced' ? 'Expert' : 'Master',
        callsNeeded: Math.max(0, 
          skillLevel === 'Beginner' ? 10 - totalCalls :
          skillLevel === 'Developing' ? 25 - totalCalls :
          skillLevel === 'Intermediate' ? 50 - totalCalls :
          skillLevel === 'Advanced' ? 100 - totalCalls : 
          200 - totalCalls
        )
      };

      setData({
        totalCalls,
        avgScores,
        recentScores,
        scenarioBreakdown,
        skillLevel,
        nextMilestone
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const renderScoreCard = (label: string, score: number) => (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-sm font-medium text-gray-500">{label}</h3>
      <div className={`mt-1 text-2xl font-semibold ${getScoreColor(score)}`}>
        {formatScore(score)}
      </div>
      <div className="text-sm text-gray-500">
        {categorizePerformance(score)}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error || 'No data available'}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Performance Analytics</h1>
        <p className="mt-2 text-gray-600">Track your progress and identify areas for improvement</p>
      </div>

      {/* Timeframe Selection */}
      <div className="mb-6">
        <div className="flex space-x-2">
          {(['week', 'month', 'all'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                timeframe === t
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Skill Level Card */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{data.skillLevel}</h2>
            <p className="text-gray-600">Current Skill Level</p>
          </div>
          <Award className="h-12 w-12 text-indigo-600" />
        </div>
        <div className="mt-4">
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                  Progress to {data.nextMilestone.name}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-indigo-600">
                  {Math.max(0, Math.min(100, (data.totalCalls / (data.totalCalls + data.nextMilestone.callsNeeded)) * 100))}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
              <div
                style={{ width: `${Math.max(0, Math.min(100, (data.totalCalls / (data.totalCalls + data.nextMilestone.callsNeeded)) * 100))}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600"
              ></div>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {data.nextMilestone.callsNeeded} more successful calls needed to reach {data.nextMilestone.name}
          </p>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Score Breakdown</h3>
            <Target className="h-6 w-6 text-gray-400" />
          </div>
          <div className="space-y-4">
            {Object.entries(data.avgScores).map(([category, score]) => (
              <div key={category}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-600 capitalize">
                    {category.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="text-sm text-gray-900">{renderScoreCard(category, score)}</span>
                </div>
                <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                  <div
                    style={{ width: `${(score / SCORE_RANGE.MAX) * 100}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600"
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Recent Performance</h3>
            <TrendingUp className="h-6 w-6 text-gray-400" />
          </div>
          <div className="h-64 flex items-end space-x-2">
            {data.recentScores.map((score, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-indigo-200 rounded-t"
                  style={{ height: `${(score.avgScore / 5) * 100}%` }}
                ></div>
                <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left">
                  {score.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scenario Analysis */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Scenario Analysis</h3>
          <BarChart3 className="h-6 w-6 text-gray-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.scenarioBreakdown.map((scenario) => (
            <div key={scenario.type} className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900">{scenario.type}</h4>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Completed</span>
                  <span className="font-medium">{scenario.count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Avg Score</span>
                  <span className="font-medium">{renderScoreCard(scenario.type, scenario.avgScore)}</span>
                </div>
                <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                  <div
                    style={{ width: `${(scenario.avgScore / SCORE_RANGE.MAX) * 100}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600"
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PerformanceAnalytics;