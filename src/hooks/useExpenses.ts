import { useUser } from "@supabase/auth-helpers-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";

export type Expense = Partial<Database["public"]["Tables"]["expenses"]["Row"]> & {
  expense_payers?: ExpensePayer[];
  expense_participants?: ExpenseParticipant[];
};

export type ExpensePayer = Database["public"]["Tables"]["expense_payers"]["Row"];
export type ExpenseParticipant = Database["public"]["Tables"]["expense_participants"]["Row"];

export const useExpenses = () => {
  const user = useUser();
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading, error } = useQuery({
    queryKey: ["expenses", user?.id],
    queryFn: async () => {
      const { data, error: expensesError } = await supabase
        .from("expenses")
        .select(`
          *,
          expense_payers (id, payer, amount),
          expense_participants (id, participant)
        `)
        .eq("user_id", user!.id)
        .order("date", { ascending: false });

      if (expensesError) throw expensesError;
      return data as Expense[];
    },
    enabled: !!user,
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (expense: Expense) => {
      if (!expense.amount || !expense.expense_participants) {
        throw new Error("Invalid expense data");
      }

      const splitAmount = expense.amount / expense.expense_participants.length;

      // Insert expense
      const { data: expenseData, error: expenseError } = await supabase
        .from("expenses")
        .insert({
          user_id: user!.id,
          group_id: expense.group_id || "",
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
      if (expense.expense_participants && expense.expense_participants.length > 0) {
        const participantsToInsert = expense.expense_participants.map((p) => ({
          expense_id: expenseData.id,
          participant: p.participant,
        }));

        const { error: participantsError } = await supabase
          .from("expense_participants")
          .insert(participantsToInsert);

        if (participantsError) throw participantsError;
      }

      return expenseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", user?.id] });
      // Also invalidate settlements as they might be affected
      queryClient.invalidateQueries({ queryKey: ["settlements", user?.id] });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expenseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", user?.id] });
      // Also invalidate settlements as they might be affected
      queryClient.invalidateQueries({ queryKey: ["settlements", user?.id] });
    },
  });

  return {
    expenses,
    isLoading,
    error: error?.message || null,
    addExpense: addExpenseMutation.mutate,
    deleteExpense: deleteExpenseMutation.mutate,
    isAddingExpense: addExpenseMutation.isPending,
    isDeletingExpense: deleteExpenseMutation.isPending,
  };
};
