import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Expense, Settlement } from '@/types';
import { useUser } from '@supabase/auth-helpers-react';

export const useSupabaseData = () => {
  const user = useUser();
  const [friends, setFriends] = useState<string[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState({
    friends: true,
    expenses: true,
    settlements: true
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setError(null);

      // Fetch friends
      setLoading(prev => ({ ...prev, friends: true }));
      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select('name')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: true });

      if (friendsError) throw friendsError;
      setFriends(friendsData.map(f => f.name));
      setLoading(prev => ({ ...prev, friends: false }));

      // Fetch expenses
      setLoading(prev => ({ ...prev, expenses: true }));
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select(`
          id,
          description,
          amount,
          split_amount,
          date,
          expense_payers (payer, amount),
          expense_participants (participant)
        `)
        .eq('user_id', user!.id)
        .order('date', { ascending: false });

      if (expensesError) throw expensesError;

      const formattedExpenses: Expense[] = expensesData.map(exp => ({
        description: exp.description,
        amount: exp.amount,
        splitAmount: exp.split_amount,
        date: exp.date,
        payers: exp.expense_payers.reduce((acc: { [key: string]: number }, p: any) => {
          acc[p.payer] = p.amount;
          return acc;
        }, {}),
        participants: exp.expense_participants.map((p: any) => p.participant)
      }));

      setExpenses(formattedExpenses);
      setLoading(prev => ({ ...prev, expenses: false }));

      // Fetch settlements
      setLoading(prev => ({ ...prev, settlements: true }));
      const { data: settlementsData, error: settlementsError } = await supabase
        .from('settlements')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (settlementsError) throw settlementsError;

      const formattedSettlements: Settlement[] = settlementsData.map(s => ({
        from: s.from_friend,
        to: s.to_friend,
        amount: s.amount,
        paid: s.paid,
        date: s.date
      }));

      setSettlements(formattedSettlements);
      setLoading(prev => ({ ...prev, settlements: false }));
    } catch (err: any) {
      setError(err.message);
      setLoading({
        friends: false,
        expenses: false,
        settlements: false
      });
    }
  };

  const addFriend = async (name: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .insert({ user_id: user!.id, name });
      
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteFriend = async (name: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('user_id', user!.id)
        .eq('name', name);
      
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const calculateAndCreateSettlements = async (expenses: Expense[]) => {
    try {
      // Get existing paid settlements
      const { data: paidSettlements, error: paidSettlementsError } = await supabase
        .from('settlements')
        .select('*')
        .eq('user_id', user!.id)
        .eq('paid', true);

      if (paidSettlementsError) throw paidSettlementsError;

      // Calculate net balances for each person, considering paid settlements
      const balances: { [key: string]: number } = {};
      
      expenses.forEach(expense => {
        // Add amounts paid by each person
        Object.entries(expense.payers).forEach(([payer, amount]) => {
          balances[payer] = (balances[payer] || 0) + amount;
        });
        
        // Subtract split amounts for each participant
        expense.participants.forEach(participant => {
          balances[participant] = (balances[participant] || 0) - expense.splitAmount;
        });
      });

      // Apply paid settlements to balances
      paidSettlements?.forEach(settlement => {
        balances[settlement.from_friend] = (balances[settlement.from_friend] || 0) + settlement.amount;
        balances[settlement.to_friend] = (balances[settlement.to_friend] || 0) - settlement.amount;
      });

      // Create settlements based on remaining balances
      const settlements: { from_friend: string; to_friend: string; amount: number }[] = [];
      const people = Object.keys(balances);
      
      // Sort people by their balances (descending)
      people.sort((a, b) => balances[b] - balances[a]);
      
      // Create settlements until all balances are close to zero
      while (people.length > 1) {
        const creditor = people[0];
        const debtor = people[people.length - 1];
        
        const creditorBalance = balances[creditor];
        const debtorBalance = balances[debtor];
        
        if (Math.abs(creditorBalance) < 0.01 || Math.abs(debtorBalance) < 0.01) {
          // Remove people with zero balance
          if (Math.abs(creditorBalance) < 0.01) people.shift();
          if (Math.abs(debtorBalance) < 0.01) people.pop();
          continue;
        }
        
        const settlementAmount = Math.min(creditorBalance, -debtorBalance);
        
        settlements.push({
          from_friend: debtor,
          to_friend: creditor,
          amount: settlementAmount
        });
        
        balances[creditor] -= settlementAmount;
        balances[debtor] += settlementAmount;
        
        // Re-sort people by their updated balances
        people.sort((a, b) => balances[b] - balances[a]);
      }

      // Delete only unpaid settlements
      const { error: deleteError } = await supabase
        .from('settlements')
        .delete()
        .eq('user_id', user!.id)
        .eq('paid', false);
        
      if (deleteError) throw deleteError;

      // Insert new settlements if there are any
      if (settlements.length > 0) {
        const { error: insertError } = await supabase
          .from('settlements')
          .insert(
            settlements.map(s => ({
              user_id: user!.id,
              from_friend: s.from_friend,
              to_friend: s.to_friend,
              amount: s.amount,
              date: new Date().toISOString(),
              paid: false,
            }))
          );
          
        if (insertError) throw insertError;
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const addExpense = async (expense: Expense) => {
    try {
      // Insert expense
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          user_id: user!.id,
          description: expense.description,
          amount: expense.amount,
          split_amount: expense.splitAmount,
          date: expense.date
        })
        .select()
        .single();

      if (expenseError) throw expenseError;

      // Insert payers
      const payersToInsert = Object.entries(expense.payers).map(([payer, amount]) => ({
        expense_id: expenseData.id,
        payer,
        amount
      }));

      const { error: payersError } = await supabase
        .from('expense_payers')
        .insert(payersToInsert);

      if (payersError) throw payersError;

      // Insert participants
      const participantsToInsert = expense.participants.map(participant => ({
        expense_id: expenseData.id,
        participant
      }));

      const { error: participantsError } = await supabase
        .from('expense_participants')
        .insert(participantsToInsert);

      if (participantsError) throw participantsError;

      await fetchData();
      // Calculate and create settlements after adding a new expense
      await calculateAndCreateSettlements([...expenses, expense]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteExpense = async (expenseIndex: number) => {
    try {
      const expense = expenses[expenseIndex];
      const { data: expenseData } = await supabase
        .from('expenses')
        .select('id')
        .eq('user_id', user!.id)
        .eq('description', expense.description)
        .eq('amount', expense.amount)
        .single();

      if (expenseData) {
        const { error } = await supabase
          .from('expenses')
          .delete()
          .eq('id', expenseData.id);
        
        if (error) throw error;
        await fetchData();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateSettlement = async (settlement: Settlement) => {

    console.log({settlement});

    try {
      const { error } = await supabase
        .from('settlements')
        .update({
          paid: settlement.paid,
          date: settlement.date
        })
        .eq('user_id', user!.id)
        .eq('from_friend', settlement.from)
        .eq('to_friend', settlement.to)
        .eq('amount', settlement.amount);

      console.log({error});
      
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return {
    friends,
    expenses,
    settlements,
    loading,
    error,
    addFriend,
    deleteFriend,
    addExpense,
    deleteExpense,
    updateSettlement,
    refreshData: fetchData
  };
};
