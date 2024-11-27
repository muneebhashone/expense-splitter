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
                  className="bg-white p-4 rounded-lg border hover:border-yellow-200 transition-colors shadow-sm"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {settlement.from_friend}
                        </span>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {settlement.to_friend}
                        </span>
                      </div>
                      <span className="font-semibold text-lg text-green-600">
                        ${settlement.amount?.toFixed(2)}
                      </span>
                    </div>
                    
                    <span className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-green-800 bg-green-100 rounded-full max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                      {expenseIdToExpenseMapper[settlement.expense_id]?.description} - {settlement.date ? new Date(settlement.date).toDateString() : ""}
                    </span>

                    <div className="md:flex items-center gap-3 pt-2">
                      <input
                        type="number"
                        inputMode="decimal"
                        placeholder="Partial amount"
                        className="flex-1 px-3 py-2 w-full border rounded-md text-sm focus:border-yellow-300 focus:ring-1 focus:ring-yellow-300"
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
                      <div className="md:flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            const input = (
                              e.target as HTMLElement
                            ).closest('.flex')?.querySelector(
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
                              id: Number(settlement.id),
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
                          className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 active:bg-green-800 transition-colors flex-shrink-0"
                        >
                          Settle Partial
                        </button>
                        <button
                          onClick={() =>
                            onSettlementPaid({
                              id: Number(settlement.id),
                              from: settlement.from_friend!,
                              to: settlement.to_friend!,
                              amount: settlement.amount!,
                              remaining: 0,
                              paid: true,
                              date: new Date().toISOString(),
                              expense_id: settlement.expense_id,
                            })
                          }
                          className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 active:bg-green-200 rounded-md transition-colors flex-shrink-0 flex items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Settle Full
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
                <div key={index} className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 font-medium">
                          {settlement.from_friend}
                        </span>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 font-medium">
                          {settlement.to_friend}
                        </span>
                      </div>
                      <span className="font-medium text-gray-600">
                        ${settlement.amount?.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-red-800 bg-red-100 rounded-full">
                        {expenseIdToExpenseMapper[settlement.expense_id]?.description}
                      </span>
                      <span className="text-sm text-gray-500">
                        {settlement.date ? new Date(settlement.date).toDateString() : ""}
                      </span>
                      <span className="text-sm text-gray-400 ml-auto">
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
          <DialogContent className="sm:max-w-[500px] max-h-[85vh] w-[95vw] overflow-y-auto p-4 sm:p-6">
            <DialogHeader className="pb-4 space-y-1.5">
              <DialogTitle className="text-xl font-semibold">Settlement Summary</DialogTitle>
              <p className="text-sm text-muted-foreground">Review and settle multiple transactions at once</p>
            </DialogHeader>
            <div className="space-y-3">
              {netSettlements.length === 0 ? (
                <p className="text-gray-500 text-center">No pending settlements</p>
              ) : (
                netSettlements.map((settlement, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-lg flex flex-col gap-3"
                  >
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-base">{settlement.from}</span>
                        <span className="font-semibold text-green-600 text-lg">
                          ${settlement.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Pays to</span>
                        <span className="font-medium text-base text-foreground">{settlement.to}</span>
                      </div>
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
                            id: Number(s.id),
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
                      className="flex items-center justify-center gap-2 px-4 py-3 text-base font-medium text-white bg-green-600 hover:bg-green-700 active:bg-green-800 rounded-md transition-colors w-full"
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
