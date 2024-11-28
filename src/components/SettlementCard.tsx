import { ArrowRight, CheckCircle, Info } from "lucide-react";
import { Settlement } from "@/types";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

interface SettlementCardProps {
  settlement: Settlement;
  expenseDescription?: string;
  onSettlementPaid: (settlement: Settlement & { remaining: number }) => void;
  isPaid?: boolean;
}

export function SettlementCard({
  settlement,
  expenseDescription,
  onSettlementPaid,
  isPaid = false,
}: SettlementCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <div
        className={`${
          isPaid ? "bg-gray-50" : "bg-white border"
        } p-4 rounded-lg transition-all hover:shadow-md`}
      >
        <div className="flex flex-col gap-2">
          {/* Header with amount and names */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`font-medium ${isPaid ? "text-gray-600" : "text-gray-900"}`}>
                {settlement.from}
              </span>
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <span className={`font-medium ${isPaid ? "text-gray-600" : "text-gray-900"}`}>
                {settlement.to}
              </span>
            </div>
            <span className={`font-semibold text-lg ${isPaid ? "text-gray-600" : "text-green-600"}`}>
              ${settlement.amount?.toFixed(2)}
            </span>
          </div>

          {/* Description and date */}
          <div className="flex items-center justify-between text-sm">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-md ${
              isPaid ? "bg-gray-100 text-gray-600" : "bg-green-50 text-green-700"
            }`}>
              {expenseDescription}
            </span>
            {settlement.date && (
              <span className="text-gray-500">
                {formatDistanceToNow(new Date(settlement.date), { addSuffix: true })}
              </span>
            )}
          </div>

          {/* Actions */}
          {!isPaid && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setShowDetails(true)}
                className="flex-1 h-10 px-4 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Info className="h-4 w-4" />
                Details
              </button>
              <button
                onClick={() =>
                  onSettlementPaid({
                    ...settlement,
                    remaining: 0,
                    paid: true,
                    date: new Date().toISOString(),
                  })
                }
                className="flex-1 h-10 px-4 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Settle
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Settlement Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">From</label>
                <p className="text-lg font-medium">{settlement.from}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">To</label>
                <p className="text-lg font-medium">{settlement.to}</p>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Amount</label>
              <p className="text-lg font-medium text-green-600">
                ${settlement.amount?.toFixed(2)}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">For Expense</label>
              <p className="text-base">{expenseDescription}</p>
            </div>

            <div className="pt-4 space-y-2">
              <input
                type="number"
                inputMode="decimal"
                placeholder="Enter partial amount"
                className="w-full h-12 px-4 border rounded-lg text-base focus:border-yellow-300 focus:ring-1 focus:ring-yellow-300"
                min="0"
                max={settlement.amount}
                step="0.01"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const input = document.querySelector('input[type="number"]') as HTMLInputElement;
                    const partialAmount = parseFloat(input.value);
                    
                    if (isNaN(partialAmount) || partialAmount <= 0 || partialAmount > settlement.amount!) {
                      return;
                    }

                    onSettlementPaid({
                      ...settlement,
                      amount: partialAmount,
                      remaining: settlement.amount! - partialAmount,
                      paid: true,
                      date: new Date().toISOString(),
                    });
                    setShowDetails(false);
                  }}
                  className="h-10 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Settle Partial
                </button>
                <button
                  onClick={() => {
                    onSettlementPaid({
                      ...settlement,
                      remaining: 0,
                      paid: true,
                      date: new Date().toISOString(),
                    });
                    setShowDetails(false);
                  }}
                  className="h-10 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Settle Full
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
