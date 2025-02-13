import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface AnalyticsData {
  totalCalls: number;
  avgDuration: number;
  successRate: number;
  avgScore: number;
}

interface CallSession {
  id: string;
  duration: number;
  created_at: string;
  call_feedback: Array<{
    scores: Record<string, number>;
  }>;
}

const calculateAverageScore = (scores: Record<string, number>) => {
  const values = Object.values(scores);
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
};

export const useAnalytics = (
  userId: string, 
  timeframe: 'week' | 'month' | 'all',
  page = 1,
  limit = 10
) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data: sessions, error: sessionsError, count } = await supabase
          .from('call_sessions')
          .select<any, CallSession>(`
            id,
            duration,
            created_at,
            call_feedback (scores)
          `, { count: 'exact' })
          .eq('trainee_id', userId)
          .range(from, to);

        if (sessionsError) throw sessionsError;

        setHasMore(count !== null && from + sessions.length < count);
        
        // Process analytics data
        const avgDuration = sessions.reduce((acc, s) => acc + (s.duration || 0), 0) / sessions.length;
        const successRate = sessions.filter(s => s.call_feedback?.length > 0).length / sessions.length;
        const avgScore = sessions.reduce((acc, session) => {
          const sessionScore = session.call_feedback?.[0]?.scores
            ? calculateAverageScore(session.call_feedback[0].scores)
            : 0;
          return acc + sessionScore;
        }, 0) / (sessions.length || 1);

        setData({
          totalCalls: sessions.length,
          avgDuration,
          successRate,
          avgScore
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeframe, userId, page, limit]);

  return { data, loading, error, hasMore };
}; 