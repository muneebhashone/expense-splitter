'use client';
import { Receipt, Trash2 } from 'lucide-react';
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
import { Expense } from '@/types';
import { useState } from 'react';
import { ExpenseItem } from './ExpenseItem';

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
            <CardTitle className="flex items-center gap-2 text-lg">
              <Receipt className="h-5 w-5 text-purple-500" />
              Expenses
            </CardTitle>
            <CardDescription>Review all shared expenses</CardDescription>
          </div>
          <div className="flex items-center gap-3">
           
            <span className="bg-purple-100 text-purple-800 px-3 py-1.5 rounded-lg text-sm font-medium">
              {expenses.length}
            </span>
          </div>
        </div>
        <div className=''>
        {selectedExpenses.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className="h-10 px-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center gap-2 text-sm font-medium justify-center w-full"
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
              <ExpenseItem
                key={index}
                expense={expense}
                index={index}
                onDeleteExpense={onDeleteExpense}
                selected={selectedExpenses.includes(index)}
                onSelectChange={(checked) => {
                  if (checked) {
                    setSelectedExpenses([...selectedExpenses, index]);
                  } else {
                    setSelectedExpenses(selectedExpenses.filter(i => i !== index));
                  }
                }}
                showDeleteButton={!selectedExpenses.length}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
