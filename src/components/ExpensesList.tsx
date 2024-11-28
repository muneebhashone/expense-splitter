'use client';
import { Receipt, Trash2, Users, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LoadingCard } from './ui/loading-card';
import { format } from 'date-fns';
import { Expense } from '@/hooks/useSupabaseData';
import { useState } from 'react';

interface ExpensesListProps {
  expenses: Expense[];
  onDeleteExpense: (indices: number[]) => void;
  loading?: boolean;
}

export function ExpensesList({ expenses, onDeleteExpense, loading }: ExpensesListProps) {
  const [selectedExpenses, setSelectedExpenses] = useState<number[]>([]);

  if (loading) {
    return (
      <LoadingCard
        icon={Receipt}
        title="Expenses"
        description="Review all shared expenses"
        color="purple"
        items={4}
      />
    );
  }

  return (
    <Card className="border-t-4 border-t-purple-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Receipt className="h-5 w-5 text-purple-500" />
              Expenses
            </CardTitle>
            <CardDescription>Review all shared expenses</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {selectedExpenses.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className="h-10 px-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete ({selectedExpenses.length})
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Multiple Expenses</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {selectedExpenses.length} selected expenses? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setSelectedExpenses([])}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        onDeleteExpense(selectedExpenses);
                        setSelectedExpenses([]);
                      }}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <span className="bg-purple-100 text-purple-800 px-3 py-1.5 rounded-lg text-sm font-medium">
              {expenses.length} expenses
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-medium text-gray-900">No expenses yet</h3>
            <p className="text-sm text-gray-500 mt-2">Add your first expense to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {expenses.map((expense, index) => (
              <div 
                key={index} 
                className="bg-white p-4 rounded-lg border hover:border-purple-200 transition-colors relative"
              >
                <div className="flex items-start gap-3">
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      checked={selectedExpenses.includes(index)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedExpenses([...selectedExpenses, index]);
                        } else {
                          setSelectedExpenses(selectedExpenses.filter(i => i !== index));
                        }
                      }}
                      className="h-5 w-5 text-purple-500 rounded border-gray-300 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                      <h3 className="text-base font-medium text-gray-900 truncate">{expense.description}</h3>
                      <span className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-lg inline-flex items-center self-start">
                        {format(new Date(expense?.date || ''), 'MMM d, yyyy')}
                      </span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span>Total: ${expense.amount?.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>Split: ${expense.split_amount?.toFixed(2)} each</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {expense?.expense_payers?.map((payer, index) => (
                        <span 
                          key={index} 
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-green-100 text-green-800"
                        >
                          {payer.payer}: ${payer.amount.toFixed(2)}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {!selectedExpenses.length && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete expense"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this expense? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDeleteExpense([index])}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
