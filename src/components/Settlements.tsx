"use client";

import { ArrowRight, CheckCircle, Eye, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingCard } from "./ui/loading-card";
import { Settlement as SettlementType } from "@/hooks/useSupabaseData";
import { formatDistanceToNow } from "date-fns";
import { Expense, Settlement } from "@/types";
import { useMemo, useState } from "react";

interface SettlementsProps {
  settlements: SettlementType[];
  onSettlementPaid: (settlement: Settlement & { remaining: number }) => void;
  onClearSettlements: () => void;
  loading?: boolean;
  expenses: Expense[];
}

interface NetSettlement {
  from: string;
  to: string;
  amount: number;
}

export function Settlements({
  settlements,
  onSettlementPaid,
  onClearSettlements,
  loading,
  expenses,
}: SettlementsProps) {
  const [isEasyViewOpen, setIsEasyViewOpen] = useState(false);

  const expenseIdToExpenseMapper = useMemo(() => {
    return expenses.reduce((acc, expense) => {
      acc[expense.id] = expense;
      return acc;
    }, {} as Record<number, Expense>);
  }, [expenses]);

  const netSettlements = useMemo(() => {
    const unpaidSettlements = settlements.filter((s) => !s.paid);
    const settlementMap = new Map<string, number>();

    // Calculate net amounts between friends
    unpaidSettlements.forEach((settlement) => {
      const key = [settlement.from_friend, settlement.to_friend].sort().join('-');
      const amount = settlement.amount || 0;
      
      if (settlement.from_friend && settlement.to_friend) {
        if (settlement.from_friend < settlement.to_friend) {
          settlementMap.set(key, (settlementMap.get(key) || 0) + amount);
        } else {
          settlementMap.set(key, (settlementMap.get(key) || 0) - amount);
        }
      }
    });

    // Convert to final settlements
    const result: NetSettlement[] = [];
    settlementMap.forEach((amount, key) => {
      if (amount !== 0) {
        const [friend1, friend2] = key.split('-');
        if (amount > 0) {
          result.push({ from: friend1, to: friend2, amount });
        } else {
          result.push({ from: friend2, to: friend1, amount: Math.abs(amount) });
        }
      }
    });

    return result;
  }, [settlements]);

  if (loading) {
    return (
      <LoadingCard
        icon={CheckCircle}
        title="Settlements"
        description="Review and mark settlements as paid"
        color="yellow"
        items={3}
      />
    );
  }

  const unpaidSettlements = settlements.filter((s) => !s.paid);
  const paidSettlements = settlements.filter((s) => s.paid);

  return (
    <Card className="border-t-4 border-t-yellow-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-yellow-500" />
              Settlements
            </CardTitle>
            <CardDescription>
              Review and mark settlements as paid
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Unpaid Settlements */}
          {unpaidSettlements.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Pending Settlements</h3>
                <button
                  onClick={() => setIsEasyViewOpen(true)}
                  className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 transition-colors rounded-md hover:bg-blue-50"
                >
                  <Eye className="h-4 w-4" />
                  Easy View
                </button>
              </div>
              {unpaidSettlements.map((settlement, index) => (
                <div
                  key={index}
                  className="bg-white p-4 rounded-lg border hover:border-yellow-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">
                        {settlement.from_friend}
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {settlement.to_friend}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                        {expenseIdToExpenseMapper[settlement.expense_id]?.description} - {settlement.date ? new Date(settlement.date).toDateString() : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          ${settlement.amount?.toFixed(2)}
                        </span>
                        <input
                          type="number"
                          placeholder="Partial amount"
                          className="w-24 px-2 py-1 border rounded"
                          min="0"
                          max={settlement.amount}
                          step="0.01"
                          onChange={(e) => {
                            const input = e.target.value;
                            const element = e.target;
                            const value = parseFloat(input);
                            if (value > settlement.amount!) {
                              element.setCustomValidity(
                                `Cannot exceed ${settlement.amount}`
                              );
                            } else {
                              element.setCustomValidity("");
                            }
                          }}
                        />
                        <button
                          onClick={(e) => {
                            const input = (
                              e.target as HTMLElement
                            ).parentElement?.querySelector(
                              "input"
                            ) as HTMLInputElement;
                            const partialAmount = parseFloat(input.value);

                            if (
                              isNaN(partialAmount) ||
                              partialAmount <= 0 ||
                              partialAmount > settlement.amount!
                            ) {
                              return;
                            }

                            // Handle partial settlement
                            onSettlementPaid({
                              from: settlement.from_friend!,
                              to: settlement.to_friend!,
                              amount: partialAmount,
                              remaining: settlement.amount! - partialAmount,
                              paid: true,
                              date: new Date().toISOString(),
                              expense_id: settlement.expense_id,
                            });

                            input.value = "";
                          }}
                          className="px-2 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                        >
                          Settle
                        </button>
                        <button
                          onClick={() =>
                            onSettlementPaid({
                              from: settlement.from_friend!,
                              to: settlement.to_friend!,
                              amount: settlement.amount!,
                              remaining: 0,
                              paid: true,
                              date: new Date().toISOString(),
                              expense_id: settlement.expense_id,
                            })
                          }
                          className="text-green-500 hover:text-green-600 transition-colors"
                          title="Settle full amount"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paid Settlements */}
          {paidSettlements.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-900">
                  Completed Settlements
                </h3>
                <button
                  onClick={onClearSettlements}
                  className="flex items-center gap-2 px-3 py-1 text-sm text-red-600 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Completed
                </button>
              </div>
              {paidSettlements.map((settlement, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500">
                        {settlement.from_friend}
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-500">
                        {settlement.to_friend}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">
                        {expenseIdToExpenseMapper[settlement.expense_id]?.description} - {settlement.date ? new Date(settlement.date).toDateString() : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500">
                        ${settlement.amount?.toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {settlement.date
                          ? formatDistanceToNow(new Date(settlement.date), {
                              addSuffix: true,
                            })
                          : ""}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Easy View Dialog */}
        <Dialog open={isEasyViewOpen} onOpenChange={setIsEasyViewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Settlement Summary</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {netSettlements.length === 0 ? (
                <p className="text-gray-500 text-center">No pending settlements</p>
              ) : (
                netSettlements.map((settlement, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{settlement.from}</span>
                      <span className="text-gray-500">will pay</span>
                      <span className="font-medium text-green-600">
                        ${settlement.amount.toFixed(2)}
                      </span>
                      <span className="text-gray-500">to</span>
                      <span className="font-medium">{settlement.to}</span>
                    </div>
                    <button
                      onClick={() => {
                        // Find all unpaid settlements between these two friends
                        const relevantSettlements = unpaidSettlements.filter(
                          (s) =>
                            (s.from_friend === settlement.from &&
                              s.to_friend === settlement.to) ||
                            (s.from_friend === settlement.to &&
                              s.to_friend === settlement.from)
                        );

                        // Mark each settlement as paid
                        relevantSettlements.forEach((s) => {
                          onSettlementPaid({
                            from: s.from_friend!,
                            to: s.to_friend!,
                            amount: s.amount!,
                            remaining: 0,
                            paid: true,
                            date: new Date().toISOString(),
                            expense_id: s.expense_id,
                          });
                        });

                        // Close the dialog
                        setIsEasyViewOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-1 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Settle All
                    </button>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
