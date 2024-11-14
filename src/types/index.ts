export interface Payers {
  [key: string]: number;
}

export interface Expense {
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
  from: string;
  to: string;
  amount: number;
  paid: boolean;
  date: string | null;
}
