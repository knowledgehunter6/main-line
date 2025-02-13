export interface FeedbackScores {
  clarity: number;      // 1-10
  problemSolving: number;
  empathy: number;
  control: number;
  speed: number;
}

export const SCORE_RANGE = {
  MIN: 1,
  MAX: 10,
  THRESHOLDS: {
    OUTSTANDING: 8,
    SATISFACTORY: 6,
    NEEDS_IMPROVEMENT: 4
  }
} as const;

export const scoreCategories = {
  clarity: 'Clear Communication',
  problemSolving: 'Problem Solving',
  empathy: 'Empathy',
  control: 'Call Control',
  speed: 'Response Speed'
} as const; 