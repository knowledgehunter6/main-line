import React from 'react';
import { useState, useEffect } from 'react';
import { Phone, Clock, TrendingUp, Award, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import CallReview from '../feedback/CallReview';

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalCalls: 0,
    avgDuration: 0,
    successRate: 0,
    avgScore: 0
  });
  const [recentCalls, setRecentCalls] = useState<any[]>([]);
  const [selectedCall, setSelectedCall] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch call sessions
      const { data: calls, error: callsError } = await supabase
        .from('call_sessions')
        .select(`
          id,
          trainee_id,
          duration,
          created_at,
          call_feedback (
            scores,
            comments
          )
        `)
        .eq('trainee_id', user?.id)
        .order('created_at', { ascending: false });

      if (callsError) throw callsError;

      // Calculate stats
      const totalCalls = calls?.length || 0;
      const avgDuration = calls?.reduce((acc, call) => acc + (call.duration || 0), 0) / totalCalls || 0;
      
      const callsWithFeedback = calls?.filter(call => call.call_feedback?.length > 0) || [];
      const avgScores = callsWithFeedback.reduce((acc, call) => {
        const scores = Object.values(call.call_feedback[0]?.scores || {});
        return acc + (scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length);
      }, 0) / (callsWithFeedback.length || 1);

      setStats({
        totalCalls,
        avgDuration: Math.round(avgDuration),
        successRate: Math.round((callsWithFeedback.length / totalCalls) * 100) || 0,
        avgScore: Math.round(avgScores * 10) / 10
      });

      setRecentCalls(calls?.slice(0, 5) || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const statItems = [
    { 
      name: 'Total Calls', 
      value: stats.totalCalls.toString(), 
      icon: Phone 
    },
    { 
      name: 'Average Duration', 
      value: `${Math.floor(stats.avgDuration / 60)}:${(stats.avgDuration % 60).toString().padStart(2, '0')}`, 
      icon: Clock 
    },
    { 
      name: 'Completion Rate', 
      value: `${stats.successRate}%`, 
      icon: TrendingUp 
    },
    { 
      name: 'Average Score', 
      value: stats.avgScore ? `${stats.avgScore}/5` : 'N/A', 
      icon: Award 
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.firstName}!</h1>
        <p className="mt-2 text-gray-600">Track your progress and start new training sessions</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statItems.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stat.value}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              <Link
                to="/simulator"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Start New Call
              </Link>
            </div>
            <div className="border-t border-gray-200 -mx-6">
              <div className="px-6 py-4">
                {loading ? (
                  <div className="animate-pulse flex space-x-4 py-4">
                    <div className="flex-1 space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ) : recentCalls.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {recentCalls.map((call) => (
                      <div key={call.id} className="py-4">
                        <button
                          onClick={() => setSelectedCall(call.id)}
                          className="w-full text-left hover:bg-gray-50 p-2 rounded-md transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                Call Session
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(call.created_at).toLocaleString()}
                              </p>
                            </div>
                            {call.call_feedback?.length > 0 && (
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-yellow-400" fill="currentColor" />
                                <span className="ml-1 text-sm text-gray-600">
                                  {Object.values(call.call_feedback[0].scores).reduce((a: number, b: number) => a + b, 0) / 
                                   Object.values(call.call_feedback[0].scores).length}
                                </span>
                              </div>
                            )}
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Phone className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No calls yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Start your training by simulating your first call
                    </p>
                    <div className="mt-6">
                      <Link
                        to="/simulator"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        Begin Training
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Performance Overview</h3>
              <button className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                View Report
              </button>
            </div>
            <div className="border-t border-gray-200 -mx-6">
              <div className="px-6 py-4">
                {loading ? (
                  <div className="animate-pulse space-y-4 py-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                ) : stats.totalCalls > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Call Duration Trend</h4>
                      <div className="h-32 flex items-end space-x-2">
                        {recentCalls.map((call, index) => (
                          <div
                            key={call.id}
                            className="bg-indigo-200 rounded-t"
                            style={{
                              height: `${(call.duration / stats.avgDuration) * 50}%`,
                              width: '20%'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Feedback</h4>
                      {recentCalls.some(call => call.call_feedback?.length > 0) ? (
                        <div className="space-y-2">
                          {recentCalls
                            .filter(call => call.call_feedback?.length > 0)
                            .slice(0, 3)
                            .map(call => (
                              <div key={call.id} className="text-sm">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">
                                    {new Date(call.created_at).toLocaleDateString()}
                                  </span>
                                  <div className="flex items-center">
                                    <Star className="h-4 w-4 text-yellow-400" fill="currentColor" />
                                    <span className="ml-1 text-gray-600">
                                      {Object.values(call.call_feedback[0].scores).reduce((a: number, b: number) => a + b, 0) / 
                                       Object.values(call.call_feedback[0].scores).length}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No feedback received yet</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Complete training sessions to see your performance metrics
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Call Review Modal */}
        {selectedCall && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl">
              <CallReview
                sessionId={selectedCall}
                onClose={() => setSelectedCall(null)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;