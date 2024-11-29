import { useUser } from "@supabase/auth-helpers-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Settlement as FrontendSettlement } from "@/types";

export const useSettlements = () => {
  const user = useUser();
  const queryClient = useQueryClient();

  const fetchSettlements = async () => {
    const { data, error } = await supabase
      .from("settlements")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  };

  const { data: settlements, isLoading: loading, error } = useQuery(
    ["settlements", user?.id],
    fetchSettlements,
    {
      enabled: !!user,
    }
  );

  const updateSettlementMutation = useMutation(
    async (settlement: FrontendSettlement) => {
      const { data: existingSettlement, error: findError } = await supabase
        .from("settlements")
        .select("id, amount")
        .eq("user_id", user!.id)
        .eq("id", settlement.id)
        .single();

      if (findError) throw new Error(findError.message);

      if (!existingSettlement) {
        throw new Error("Settlement not found");
      }

      if (settlement.paid) {
        if (existingSettlement.amount === settlement.amount) {
          const { error: updateErrorV1 } = await supabase
            .from("settlements")
            .update({
              paid: true,
              date: new Date().toISOString(),
            })
            .eq("id", existingSettlement.id);

          if (updateErrorV1) throw new Error(updateErrorV1.message);
        } else {
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

          if (insertError) throw new Error(insertError.message);

          const { error: updateError } = await supabase
            .from("settlements")
            .update({
              amount: settlement.remaining,
              date: new Date().toISOString(),
            })
            .eq("id", existingSettlement.id);

          if (updateError) throw new Error(updateError.message);
        }
      } else {
        const { error: updateError } = await supabase
          .from("settlements")
          .update({
            amount: settlement.amount,
            date: settlement.date,
          })
          .eq("id", existingSettlement.id);

        if (updateError) throw new Error(updateError.message);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["settlements", user?.id]);
      },
    }
  );

  const clearSettlementsMutation = useMutation(
    async () => {
      const { error } = await supabase
        .from("settlements")
        .delete()
        .eq("user_id", user!.id)
        .eq("paid", true);

      if (error) throw new Error(error.message);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["settlements", user?.id]);
      },
    }
  );

  return {
    settlements: settlements || [],
    loading,
    error,
    updateSettlement: updateSettlementMutation.mutate,
    clearSettlements: clearSettlementsMutation.mutate,
  };
};
