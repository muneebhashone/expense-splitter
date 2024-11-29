export interface User {
  id: string;
  email: string;
  username: string;
}

export interface Group {
  id: string;
  name: string;
  created_by: string;
  members: User[];
}

export interface Payers {
  [key: string]: number;
}

export interface Expense {
  group_id: string;
  id: number;
  payers: Payers;
  amount: number;
  description: string;
  participants: string[];
  splitAmount: number;
  date: string;

  expense_payers?: Payers[];
  expense_participants?: string[];
}

export interface Settlement {
  id: number;
  from: string;
  to: string;
  amount: number;
  remaining: number;
  paid: boolean;
  date: string | null;
  expense_id: number;
}
