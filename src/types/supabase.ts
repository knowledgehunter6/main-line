export interface FeedbackScores {
  clarity: number;
  problemSolving: number;
  empathy: number;
  control: number;
  speed: number;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]
  | FeedbackScores

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'trainer' | 'trainee'
          first_name: string
          last_name: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          role: 'admin' | 'trainer' | 'trainee'
          first_name: string
          last_name: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'trainer' | 'trainee'
          first_name?: string
          last_name?: string
          created_at?: string
        }
      }
      call_sessions: {
        Row: {
          id: string
          trainee_id: string
          transcript: Json | null
          recording_url: string | null
          duration: number | null
          created_at: string
        }
        Insert: {
          id?: string
          trainee_id: string
          transcript?: Json | null
          recording_url?: string | null
          duration?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          trainee_id?: string
          transcript?: Json | null
          recording_url?: string | null
          duration?: number | null
          created_at?: string
        }
      }
      call_feedback: {
        Row: {
          id: string
          call_session_id: string
          scores: FeedbackScores
          comments: string | null
          is_automated: boolean
          created_at: string
        }
        Insert: {
          id?: string
          call_session_id: string
          scores: FeedbackScores
          comments?: string | null
          is_automated?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          call_session_id?: string
          scores?: FeedbackScores
          comments?: string | null
          is_automated?: boolean
          created_at?: string
        }
      }
    }
  }
}