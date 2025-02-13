import { SCORE_RANGE } from '../types/feedback';

export const getScoreColor = (score: number): string => {
  if (score >= SCORE_RANGE.THRESHOLDS.OUTSTANDING) return 'text-green-500';
  if (score >= SCORE_RANGE.THRESHOLDS.SATISFACTORY) return 'text-yellow-500';
  return 'text-red-500';
};

export const formatScore = (score: number): string => 
  `${score.toFixed(1)}/10`;

export const categorizePerformance = (score: number): string => {
  if (score >= SCORE_RANGE.THRESHOLDS.OUTSTANDING) return 'Outstanding';
  if (score >= SCORE_RANGE.THRESHOLDS.SATISFACTORY) return 'Satisfactory';
  return 'Needs Improvement';
}; 