/**
 * @deprecated This hook has been split into separate hooks for better maintainability and performance.
 * Please use the following hooks instead:
 * - useFriends() for friends management
 * - useExpenses() for expenses management
 * - useSettlements() for settlements management
 * 
 * Example migration:
 * ```tsx
 * // Before
 * const { friends, addFriend, expenses, settlements } = useSupabaseData();
 * 
 * // After
 * const { friends, addFriend } = useFriends();
 * const { expenses } = useExpenses();
 * const { settlements } = useSettlements();
 * ```
 */

import { Database } from "@/types/supabase";
import { useFriends } from "./useFriends";
import { useExpenses } from "./useExpenses";
import { useSettlements } from "./useSettlements";

console.warn(
  "useSupabaseData is deprecated. Please use useFriends, useExpenses, and useSettlements hooks instead."
);

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
  const {
    friends,
    addFriend,
    deleteFriend,
    isLoading: isFriendsLoading,
    error: friendsError
  } = useFriends();

  const {
    expenses,
    addExpense,
    deleteExpense,
    isLoading: isExpensesLoading,
    error: expensesError
  } = useExpenses();

  const {
    settlements,
    updateSettlement,
    clearSettlements,
    isLoading: isSettlementsLoading,
    error: settlementsError
  } = useSettlements();

  const loading = {
    friends: isFriendsLoading,
    expenses: isExpensesLoading,
    settlements: isSettlementsLoading
  };

  const error = friendsError || expensesError || settlementsError;

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
    refreshData: () => {
      console.warn("refreshData is deprecated. Data is now automatically refreshed using react-query");
    }
  };
};
