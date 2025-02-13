export interface AnalyticsData {
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