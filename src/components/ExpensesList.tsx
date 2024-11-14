import { Receipt, Trash2, Users, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingCard } from './ui/loading-card';
import { format } from 'date-fns';
import { Expense } from '@/hooks/useSupabaseData';

interface ExpensesListProps {
  expenses: Expense[];
  onDeleteExpense: (index: number) => void;
  loading?: boolean;
}

export function ExpensesList({ expenses, onDeleteExpense, loading }: ExpensesListProps) {
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
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-purple-500" />
              Expenses
            </CardTitle>
            <CardDescription>Review all shared expenses</CardDescription>
          </div>
          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
            {expenses.length} expenses
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900">No expenses yet</h3>
            <p className="text-sm text-gray-500 mt-1">Add your first expense to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {expenses.map((expense, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border hover:border-purple-200 transition-colors group">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-gray-900">{expense.description}</h3>
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                        {format(new Date(expense?.date || ''), 'MMM d, yyyy')}
                      </span>
                    </div>
                    
                    <div className="mt-2 flex items-center gap-4">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <DollarSign className="h-4 w-4" />
                        <span>Total: {expense.amount?.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Users className="h-4 w-4" />
                        <span>Split: {expense.split_amount?.toFixed(2)} each</span>
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="flex flex-wrap gap-2">
                        {expense?.expense_payers?.map((payer, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {payer.payer}: ${JSON.stringify(payer.amount)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onDeleteExpense(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete expense"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
