import { Database } from './supabase';

export interface User {
  id: string;
  email: string;
  username: string;
  created_at?: string;
}

export interface Group {
  id: string;
  name: string;
  created_by: string;
  created_at?: string;
  group_members: User[];  // Removed optional marker since useGroups always provides members
}

export interface ExpensePayer {
  id?: string;
  expense_id?: string;
  payer: string;
  amount: number;
  created_at?: string;
}

export interface ExpenseParticipant {
  id?: string;
  expense_id?: string;
  participant: string;
  created_at?: string;
}

export type Expense = {
  id?: string;
  user_id?: string;
  description?: string;
  amount?: number;
  split_amount?: number;
  date?: string;
  created_at?: string;
  group_id?: string;
  expense_payers?: ExpensePayer[];
  expense_participants?: ExpenseParticipant[];
};

export interface Settlement {
  id?: string;
  user_id?: string;
  from_friend: string;
  to_friend: string;
  amount: number;
  paid: boolean;
  date: string | null;
  created_at?: string;
  expense_id: number;
  group_id?: string;
  remaining?: number;
}

// Legacy type for backward compatibility
export interface Payers {
  [key: string]: number;
}

// Type-safe database types
export type Tables = Database['public']['Tables'];
export type TableRow<T extends keyof Tables> = Tables[T]['Row'];
export type TableInsert<T extends keyof Tables> = Tables[T]['Insert'];
export type TableUpdate<T extends keyof Tables> = Tables[T]['Update'];

// Record type for mapping user IDs to usernames
export type UserMap = Record<string, string>;
