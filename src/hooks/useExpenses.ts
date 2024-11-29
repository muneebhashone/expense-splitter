import { useUser } from "@supabase/auth-helpers-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Expense as ExpenseType } from "@/types";

export const useExpenses = () => {
  const user = useUser();
  const queryClient = useQueryClient();

  const fetchExpenses = async () => {
    const { data, error } = await supabase
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

    if (error) throw new Error(error.message);
    return data as ExpenseType[];
  };

  const { data: expenses, isLoading: loading, error } = useQuery(
    ["expenses", user?.id],
    fetchExpenses,
    {
      enabled: !!user,
    }
  );

  const addExpenseMutation = useMutation(
    async (expense: ExpenseType) => {
      if (!expense.amount || !expense.expense_participants) {
        throw new Error("Invalid expense data");
      }

      const splitAmount = expense.amount / expense.expense_participants.length;

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

      if (expenseError) throw new Error(expenseError.message);

      if (expense.expense_payers && expense.expense_payers.length > 0) {
        const payersToInsert = expense.expense_payers.map((p) => ({
          expense_id: expenseData.id,
          payer: p.payer,
          amount: p.amount,
        }));

        const { error: payersError } = await supabase
          .from("expense_payers")
          .insert(payersToInsert);

        if (payersError) throw new Error(payersError.message);
      }

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

        if (participantsError) throw new Error(participantsError.message);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["expenses", user?.id]);
      },
    }
  );

  const deleteExpenseMutation = useMutation(
    async (expenseId: string) => {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expenseId);

      if (error) throw new Error(error.message);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["expenses", user?.id]);
      },
    }
  );

  return {
    expenses: expenses || [],
    loading,
    error,
    addExpense: addExpenseMutation.mutate,
    deleteExpense: deleteExpenseMutation.mutate,
  };
};
