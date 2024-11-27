import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import { useUser } from "@supabase/auth-helpers-react";
import { Settlement as FrontendSettlement } from "@/types";

export type Expense = Partial<
  Database["public"]["Tables"]["expenses"]["Row"]
> & {
  expense_payers?: ExpensePayer[];
  expense_participants?: ExpenseParticipant[];
};
export type Settlement = Database["public"]["Tables"]["settlements"]["Row"];
export type ExpensePayer =
  Database["public"]["Tables"]["expense_payers"]["Row"];
export type ExpenseParticipant =
  Database["public"]["Tables"]["expense_participants"]["Row"];

export const useSupabaseData = () => {
  const user = useUser();
  const [friends, setFriends] = useState<string[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState({
    friends: true,
    expenses: true,
    settlements: true,
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
      setLoading((prev) => ({ ...prev, friends: true }));
      const { data: friendsData, error: friendsError } = await supabase
        .from("friends")
        .select("name")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true });

      if (friendsError) throw friendsError;
      setFriends(friendsData.map((f) => f.name));
      setLoading((prev) => ({ ...prev, friends: false }));

      // Fetch expenses
      setLoading((prev) => ({ ...prev, expenses: true }));
      const { data: expensesData, error: expensesError } = await supabase
        .from("expenses")
        .select(
          `
          *,
          expense_payers (id, payer, amount),
          expense_participants (id, participant)
        `
        )
        .eq("user_id", user!.id)
        .order("date", { ascending: false });

      if (expensesError) throw expensesError;
      setExpenses(expensesData as Expense[]);
      setLoading((prev) => ({ ...prev, expenses: false }));

      // Fetch settlements
      setLoading((prev) => ({ ...prev, settlements: true }));
      const { data: settlementsData, error: settlementsError } = await supabase
        .from("settlements")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (settlementsError) throw settlementsError;
      setSettlements(settlementsData);
      setLoading((prev) => ({ ...prev, settlements: false }));
    } catch (err: unknown) {
      setError((err as Error).message);
      setLoading({
        friends: false,
        expenses: false,
        settlements: false,
      });
    }
  };

  const addFriend = async (name: string) => {
    try {
      const { error } = await supabase
        .from("friends")
        .insert({ user_id: user!.id, name });

      if (error) throw error;
      await fetchData();
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  };

  const deleteFriend = async (name: string) => {
    try {
      const { error } = await supabase
        .from("friends")
        .delete()
        .eq("user_id", user!.id)
        .eq("name", name);

      if (error) throw error;
      await fetchData();
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  };

  const calculateAndCreateSettlements = async (
    currentExpenses: Expense[],
    expenseId: string
  ) => {
    try {
      // Calculate balances only for the new expense
      const balances: { [key: string]: number } = {};
      
      const newExpense = currentExpenses.find(expense => expense.id === expenseId);
      if (!newExpense) {
        throw new Error("New expense not found");
      }

      // Process only the new expense
      if (
        !newExpense.expense_payers ||
        !newExpense.expense_participants ||
        !newExpense.split_amount
      ) {
        return;
      }

      // Add amounts paid by each person
      newExpense.expense_payers.forEach((p) => {
        if (p.payer && p.amount) {
          balances[p.payer] = (balances[p.payer] || 0) + p.amount;
        }
      });

      // Subtract split amounts for each participant
      newExpense.expense_participants.forEach((p) => {
        if (p.participant) {
          balances[p.participant] =
            (balances[p.participant] || 0) - newExpense.split_amount!;
        }
      });

      // Create settlements based on remaining balances
      const settlements: Database["public"]["Tables"]["settlements"]["Insert"][] =
        [];

      const people = Object.keys(balances);

      // Sort people by their balances (descending)
      people.sort((a, b) => balances[b] - balances[a]);

      // Create settlements until all balances are close to zero
      while (people.length > 1) {
        const creditor = people[0];
        const debtor = people[people.length - 1];

        const creditorBalance = balances[creditor];
        const debtorBalance = balances[debtor];

        if (
          Math.abs(creditorBalance) < 0.01 ||
          Math.abs(debtorBalance) < 0.01
        ) {
          // Remove people with zero balance
          if (Math.abs(creditorBalance) < 0.01) people.shift();
          if (Math.abs(debtorBalance) < 0.01) people.pop();
          continue;
        }

        const settlementAmount = Math.min(creditorBalance, -debtorBalance);

        settlements.push({
          user_id: user!.id,
          from_friend: debtor,
          to_friend: creditor,
          amount: settlementAmount,
          paid: false,
          date: new Date().toISOString(),
          expense_id: Number(expenseId),
        });

        balances[creditor] -= settlementAmount;
        balances[debtor] += settlementAmount;

        // Re-sort people by their updated balances
        people.sort((a, b) => balances[b] - balances[a]);
      }


      // Insert new settlements if there are any
      if (settlements.length > 0) {
        const { error: insertError } = await supabase
          .from("settlements")
          .insert(settlements);

        if (insertError) throw insertError;
      }
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  };

  const addExpense = async (expense: Expense) => {
    try {
      if (!expense.amount || !expense.expense_participants) {
        throw new Error("Invalid expense data");
      }

      // Calculate split amount based on number of participants
      const splitAmount = expense.amount / expense.expense_participants.length;

      // Insert expense
      const { data: expenseData, error: expenseError } = await supabase
        .from("expenses")
        .insert({
          user_id: user!.id,
          description: expense.description || "",
          amount: expense.amount,
          split_amount: splitAmount,
          date: expense.date || new Date().toISOString(),
        })
        .select()
        .single();

      if (expenseError) throw expenseError;

      // Insert payers
      if (expense.expense_payers && expense.expense_payers.length > 0) {
        const payersToInsert = expense.expense_payers.map((p) => ({
          expense_id: expenseData.id,
          payer: p.payer,
          amount: p.amount,
        }));

        const { error: payersError } = await supabase
          .from("expense_payers")
          .insert(payersToInsert);

        if (payersError) throw payersError;
      }

      // Insert participants
      if (
        expense.expense_participants &&
        expense.expense_participants.length > 0
      ) {
        const participantsToInsert = expense.expense_participants.map((p) => ({
          expense_id: expenseData.id,
          participant: p.participant,
        }));

        const { error: participantsError } = await supabase
          .from("expense_participants")
          .insert(participantsToInsert);

        if (participantsError) throw participantsError;
      }

      // Get updated expenses for settlement calculation
      const { data: updatedExpenses, error: fetchError } = await supabase
        .from("expenses")
        .select(
          `
          *,
          expense_payers (id, payer, amount),
          expense_participants (id, participant)
        `
        )
        .eq("user_id", user!.id)
        .order("date", { ascending: false });

      if (fetchError) throw fetchError;

      // Calculate and create settlements with the updated expenses
      await calculateAndCreateSettlements(updatedExpenses as Expense[], expenseData.id);

      // Finally, refresh the UI
      await fetchData();
    } catch (err: unknown) {
      setError((err as Error).message);
      throw err;
    }
  };

  const deleteExpense = async (expenseId: string) => {
    try {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expenseId);

      if (error) throw error;

      // Get remaining expenses for settlement calculation
      const { error: fetchError } = await supabase
        .from("expenses")
        .select(
          `
          id
        `
        )
        .eq("user_id", user!.id)
        .order("date", { ascending: false });

      if (fetchError) throw fetchError;

      // Recalculate settlements with the remaining expenses
      // await calculateAndCreateSettlements(remainingExpenses as Expense[]);

      // Finally, refresh the UI
      await fetchData();
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  };

  const updateSettlement = async (settlement: FrontendSettlement) => {
    try {
      // Find the existing settlement
      const { data: existingSettlement, error: findError } = await supabase
        .from("settlements")
        .select("id, amount")
        .eq("user_id", user!.id)
        .eq("id", settlement.id)
        // .eq("from_friend", settlement.from)
        // .eq("to_friend", settlement.to)
        // .eq("paid", false)
        .single();

      if (findError) throw findError;

      if (!existingSettlement) {
        throw new Error("Settlement not found");
      }

      // If this is a partial settlement
      if (settlement.paid) {
        console.log("marking settlement as paid");
        // if the amount is the same then mark settlement as paid
        if (existingSettlement.amount === settlement.amount) {
          console.log("marking settlement as paid");
          const { error: updateErrorV1 } = await supabase
            .from("settlements")
            .update({
              paid: true,
              date: new Date().toISOString(),
            })
            .eq("id", existingSettlement.id);

          if (updateErrorV1) throw updateErrorV1;
        } else {
          // Create a new completed settlement entry for the partial amount
          const { error: insertError } = await supabase
            .from("settlements")
            .insert({
              user_id: user!.id,
              from_friend: settlement.from,
              to_friend: settlement.to,
              amount: settlement.amount,
              paid: true,
              date: settlement.date,
              expense_id: Number(settlement.expense_id),
            });

          if (insertError) throw insertError;
          const { error: updateError } = await supabase
            .from("settlements")
            .update({
              amount: settlement.remaining, // This will be the remaining amount
              date: new Date().toISOString(),
            })
            .eq("id", existingSettlement.id);

          if (updateError) throw updateError;
        }
      } else {
        // Just update the existing settlement

        // otherwise update the settlement

        const { error: updateError } = await supabase
          .from("settlements")
          .update({
            amount: settlement.amount,
            date: settlement.date,
          })
          .eq("id", existingSettlement.id);

        if (updateError) throw updateError;
      }

      await fetchData();
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  };

  const clearSettlements = async () => {
    try {
      const { error } = await supabase
        .from("settlements")
        .delete()
        .eq("user_id", user!.id)
        .eq("paid", true);

      if (error) throw error;
      await fetchData();
    } catch (err: unknown) {
      setError((err as Error).message);
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
    clearSettlements,
    refreshData: fetchData,
  };
};
