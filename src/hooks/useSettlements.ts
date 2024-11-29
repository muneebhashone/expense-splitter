import { useUser } from "@supabase/auth-helpers-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import { Settlement as FrontendSettlement } from "@/types";

export type Settlement = Database["public"]["Tables"]["settlements"]["Row"];

export const useSettlements = () => {
  const user = useUser();
  const queryClient = useQueryClient();

  const { data: settlements = [], isLoading, error } = useQuery({
    queryKey: ["settlements", user?.id],
    queryFn: async () => {
      const { data, error: settlementsError } = await supabase
        .from("settlements")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (settlementsError) throw settlementsError;
      return data;
    },
    enabled: !!user,
  });

  const updateSettlementMutation = useMutation({
    mutationFn: async (settlement: FrontendSettlement) => {
      const { data: existingSettlement, error: findError } = await supabase
        .from("settlements")
        .select("id, amount")
        .eq("user_id", user!.id)
        .eq("id", settlement.id!)
        .single();

      if (findError) throw findError;
      if (!existingSettlement) {
        throw new Error("Settlement not found");
      }

      if (settlement.paid) {
        if (existingSettlement.amount === settlement.amount) {
          const { error: updateError } = await supabase
            .from("settlements")
            .update({
              paid: true,
              date: new Date().toISOString(),
            })
            .eq("id", existingSettlement.id);

          if (updateError) throw updateError;
        } else {
          // Create a new completed settlement entry for the partial amount
          const { error: insertError } = await supabase
            .from("settlements")
            .insert({
              user_id: user!.id,
              from_friend: settlement.from_friend,
              to_friend: settlement.to_friend,
              amount: settlement.amount,
              paid: true,
              date: settlement.date,
              expense_id: Number(settlement.expense_id!),
              group_id: settlement.group_id!,
            });

          if (insertError) throw insertError;

          const { error: updateError } = await supabase
            .from("settlements")
            .update({
              amount: settlement.remaining,
              date: new Date().toISOString(),
            })
            .eq("id", existingSettlement.id);

          if (updateError) throw updateError;
        }
      } else {
        const { error: updateError } = await supabase
          .from("settlements")
          .update({
            amount: settlement.amount,
            date: settlement.date,
          })
          .eq("id", existingSettlement.id);

        if (updateError) throw updateError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settlements", user?.id] });
    },
  });

  const clearSettlementsMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("settlements")
        .delete()
        .eq("user_id", user!.id)
        .eq("paid", true);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settlements", user?.id] });
    },
  });

  const calculateSettlementsMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      // Get the expense details
      const { data: expense, error: expenseError } = await supabase
        .from("expenses")
        .select(`
          *,
          expense_payers!inner (
            id,
            payer,
            amount
          ),
          expense_participants!inner (
            id,
            participant
          )
        `)
        .eq("id", expenseId)
        .single();

      if (expenseError) throw expenseError;
      if (!expense) throw new Error("Expense not found");

      // Calculate balances
      const balances: { [key: string]: number } = {};

      // Add amounts paid by each person
      expense.expense_payers?.forEach((p) => {
        if (p.payer && p.amount) {
          balances[p.payer] = (balances[p.payer] || 0) + p.amount;
        }
      });

      // Subtract split amounts for each participant
      expense.expense_participants?.forEach((p) => {
        if (p.participant) {
          balances[p.participant] = (balances[p.participant] || 0) - expense.split_amount!;
        }
      });

      // Create settlements based on remaining balances
      const settlements: Database["public"]["Tables"]["settlements"]["Insert"][] = [];
      const people = Object.keys(balances);
      people.sort((a, b) => balances[b] - balances[a]);

      while (people.length > 1) {
        const creditor = people[0];
        const debtor = people[people.length - 1];

        const creditorBalance = balances[creditor];
        const debtorBalance = balances[debtor];

        if (Math.abs(creditorBalance) < 0.01 || Math.abs(debtorBalance) < 0.01) {
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
          group_id: expense.group_id,
        });

        balances[creditor] -= settlementAmount;
        balances[debtor] += settlementAmount;

        people.sort((a, b) => balances[b] - balances[a]);
      }

      if (settlements.length > 0) {
        const { error: insertError } = await supabase
          .from("settlements")
          .insert(settlements);

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settlements", user?.id] });
    },
  });

  return {
    settlements,
    isLoading,
    error: error?.message || null,
    updateSettlement: updateSettlementMutation.mutate,
    clearSettlements: clearSettlementsMutation.mutate,
    calculateSettlements: calculateSettlementsMutation.mutate,
    isUpdatingSettlement: updateSettlementMutation.isPending,
    isClearingSettlements: clearSettlementsMutation.isPending,
    isCalculatingSettlements: calculateSettlementsMutation.isPending,
  };
};
