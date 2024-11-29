export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          username: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          created_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_by?: string
          created_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          description: string
          amount: number
          split_amount: number
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          description: string
          amount: number
          split_amount: number
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          description?: string
          amount?: number
          split_amount?: number
          date?: string
          created_at?: string
        }
      }
      expense_participants: {
        Row: {
          id: string
          expense_id: string
          participant: string
          created_at: string
        }
        Insert: {
          id?: string
          expense_id: string
          participant: string
          created_at?: string
        }
        Update: {
          id?: string
          expense_id?: string
          participant?: string
          created_at?: string
        }
      }
      expense_payers: {
        Row: {
          id: string
          expense_id: string
          payer: string
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          expense_id: string
          payer: string
          amount: number
          created_at?: string
        }
        Update: {
          id?: string
          expense_id?: string
          payer?: string
          amount?: number
          created_at?: string
        }
      }
      settlements: {
        Row: {
          id: string
          user_id: string
          from_friend: string
          to_friend: string
          amount: number
          paid: boolean
          date: string | null
          created_at: string
          expense_id: number
          group_id: string
        }
        Insert: {
          id?: string
          user_id: string
          from_friend: string
          to_friend: string
          amount: number
          paid: boolean
          date?: string | null
          created_at?: string
          expense_id: number
          group_id: string
        }
        Update: {
          id?: string
          user_id?: string
          from_friend?: string
          to_friend?: string
          amount?: number
          paid?: boolean
          date?: string | null
          created_at?: string
          expense_id?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
