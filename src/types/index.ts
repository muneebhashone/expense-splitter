export interface Payers {
  [key: string]: number;
}

export interface Expense {
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
