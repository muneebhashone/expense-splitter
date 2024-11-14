import { Expense, Settlement } from '@/types';

export const calculateBalances = (friends: string[], expenses: Expense[], settlements: Settlement[]): { [key: string]: number } => {
  const balances: { [key: string]: number } = {};
  friends.forEach(friend => {
    balances[friend] = 0;
  });

  // Process expenses
  expenses.forEach(expense => {
    // Add paid amounts to payers' balances
    Object.entries(expense.payers).forEach(([payer, amount]) => {
      balances[payer] += amount;
    });
    
    // Subtract split amount from each participant's balance
    expense.participants.forEach(participant => {
      balances[participant] -= expense.splitAmount;
    });
  });

  // Process completed settlements
  settlements.forEach(settlement => {
    if (settlement.paid) {
      balances[settlement.from] += settlement.amount;
      balances[settlement.to] -= settlement.amount;
    }
  });

  return balances;
};

export const calculateSettlements = (friends: string[], expenses: Expense[], settlements: Settlement[]): Settlement[] => {
  const balances = calculateBalances(friends, expenses, settlements);
  const newSettlements: Settlement[] = [];
  
  const debtors = friends.filter(f => balances[f] < -0.01)
    .sort((a, b) => balances[a] - balances[b]);
  const creditors = friends.filter(f => balances[f] > 0.01)
    .sort((a, b) => balances[b] - balances[a]);
  
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    
    const debtAmount = -balances[debtor];
    const creditAmount = balances[creditor];
    const settleAmount = Math.min(debtAmount, creditAmount);
    
    if (settleAmount > 0.01) {
      newSettlements.push({
        
        from: debtor,
        to: creditor,
        amount: Math.round(settleAmount * 100) / 100,
        paid: false,
        date: null
      });
    }
    
    balances[debtor] += settleAmount;
    balances[creditor] -= settleAmount;
    
    if (Math.abs(balances[debtor]) < 0.01) i++;
    if (Math.abs(balances[creditor]) < 0.01) j++;
  }
  
  return newSettlements;
};
