import { ArrowRight, CheckCircle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingCard } from './ui/loading-card';
import { Settlement as SettlementType } from '@/hooks/useSupabaseData';
import { formatDistanceToNow } from 'date-fns';
import { Settlement } from '@/types';

interface SettlementsProps {
  settlements: SettlementType[];
  onSettlementPaid: (settlement: Settlement) => void;
  onClearSettlements: () => void;
  loading?: boolean;
}

export function Settlements({ settlements, onSettlementPaid, onClearSettlements, loading }: SettlementsProps) {
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

  const unpaidSettlements = settlements.filter(s => !s.paid);
  const paidSettlements = settlements.filter(s => s.paid);

  return (
    <Card className="border-t-4 border-t-yellow-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-yellow-500" />
              Settlements
            </CardTitle>
            <CardDescription>Review and mark settlements as paid</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Unpaid Settlements */}
          {unpaidSettlements.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Pending Settlements</h3>
              {unpaidSettlements.map((settlement, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border hover:border-yellow-200 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">{settlement.from_friend}</span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{settlement.to_friend}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">${settlement.amount?.toFixed(2)}</span>
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
                              element.setCustomValidity(`Cannot exceed ${settlement.amount}`);
                            } else {
                              element.setCustomValidity('');
                            }
                          }}
                        />
                        <button
                          onClick={(e) => {
                            const input = (e.target as HTMLElement)
                              .parentElement?.querySelector('input') as HTMLInputElement;
                            const partialAmount = parseFloat(input.value);
                            
                            if (isNaN(partialAmount) || partialAmount <= 0 || partialAmount > settlement.amount!) {
                              return;
                            }

                            // Handle partial settlement
                            onSettlementPaid({
                              from: settlement.from_friend!,
                              to: settlement.to_friend!,
                              amount: partialAmount,
                              paid: true,
                              date: new Date().toISOString()
                            });

                            input.value = '';
                          }}
                          className="px-2 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                        >
                          Settle
                        </button>
                        <button
                          onClick={() => onSettlementPaid({
                            from: settlement.from_friend!,
                            to: settlement.to_friend!,
                            amount: settlement.amount!,
                            paid: true,
                            date: new Date().toISOString()
                          })}
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
                <h3 className="font-medium text-gray-900">Completed Settlements</h3>
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
                      <span className="text-gray-500">{settlement.from_friend}</span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-500">{settlement.to_friend}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500">${settlement.amount?.toFixed(2)}</span>
                      <span className="text-sm text-gray-500">
                        {settlement.date ? formatDistanceToNow(new Date(settlement.date), {
                          addSuffix: true
                        }) : ''}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
