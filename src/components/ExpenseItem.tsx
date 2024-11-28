'use client';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Expense } from '@/hooks/useSupabaseData';
import { format } from 'date-fns';
import { DollarSign, Trash2, Users } from 'lucide-react';

interface ExpenseItemProps {
  expense: Expense;
  index: number;
  onDeleteExpense: (indices: number[]) => void;
  selected: boolean;
  onSelectChange: (checked: boolean) => void;
  showDeleteButton: boolean;
}

export function ExpenseItem({ 
  expense, 
  index, 
  onDeleteExpense, 
  selected, 
  onSelectChange,
  showDeleteButton 
}: ExpenseItemProps) {
  return (
    <div className="bg-white p-4 rounded-lg border hover:border-purple-200 transition-colors relative">
      <div className="flex items-start gap-3">
        <div className="pt-1">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelectChange(e.target.checked)}
            className="h-5 w-5 text-purple-500 rounded border-gray-300 focus:ring-purple-500"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-medium text-gray-900 truncate">{expense.description}</h3>
            <span className="text-base font-medium text-gray-900">${expense.amount?.toFixed(2)}</span>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-sm text-purple-600 hover:text-purple-800 mt-2">
                View Details
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{expense.description}</DialogTitle>
                <DialogDescription>
                  Created on {format(new Date(expense?.date || ''), 'MMM d, yyyy')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-col gap-3">
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
                  {expense?.expense_payers?.map((payer, idx) => (
                    <span 
                      key={idx} 
                      className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-green-100 text-green-800"
                    >
                      {payer.payer}: ${payer.amount.toFixed(2)}
                    </span>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {showDeleteButton && (
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
  );
}
