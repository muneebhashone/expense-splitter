import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Payers } from '@/types';
import { DollarSign, Percent, Receipt, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NewExpenseProps {
  friends: string[];
  totalAmount: string;
  description: string;
  payers: Payers;
  participants: Set<string>;
  onTotalAmountChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPayerAmountChange: (friend: string, amount: string) => void;
  onParticipantToggle: (participant: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

interface ValidationErrors {
  description?: string;
  totalAmount?: string;
  participants?: string;
  payers?: string;
}

type SplitType = 'equal' | 'percentage' | 'custom';

interface LockedState {
  [key: string]: boolean;
}

export function NewExpense({
  friends,
  totalAmount,
  description,
  payers,
  participants,
  onTotalAmountChange,
  onDescriptionChange,
  onPayerAmountChange,
  onParticipantToggle,
  onSubmit,
  disabled
}: NewExpenseProps) {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [percentages, setPercentages] = useState<{ [key: string]: string }>({});
  const [lockedInputs, setLockedInputs] = useState<LockedState>({});

  const calculateRemainingAmount = () => {
    const total = parseFloat(totalAmount) || 0;
    // Don't consider locked amounts in remaining calculation
    return total;
  };

  const distributeRemainingAmount = () => {
    const remainingAmount = calculateRemainingAmount();
    const unlockedPayers = Array.from(participants).filter(
      friend => !lockedInputs[friend]
    );

    if (unlockedPayers.length > 0) {
      const amountPerPayer = (remainingAmount / unlockedPayers.length).toFixed(2);
      unlockedPayers.forEach(friend => {
        onPayerAmountChange(friend, amountPerPayer);
      });
    }
  };

  const toggleLock = (friend: string) => {
    const newLockedInputs = { ...lockedInputs };
    newLockedInputs[friend] = !newLockedInputs[friend];
    setLockedInputs(newLockedInputs);

    // If locking, preserve the current amount
    // If unlocking, include in the redistribution
    if (!newLockedInputs[friend]) {
      distributeRemainingAmount();
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.length < 3) {
      newErrors.description = 'Description must be at least 3 characters';
    } else if (description.length > 50) {
      newErrors.description = 'Description must be less than 50 characters';
    }

    const amount = parseFloat(totalAmount);
    if (!totalAmount) {
      newErrors.totalAmount = 'Amount is required';
    } else if (isNaN(amount) || amount <= 0) {
      newErrors.totalAmount = 'Amount must be a positive number';
    }

    if (participants.size < 2) {
      newErrors.participants = 'At least 2 participants are required';
    }

    const totalPaid = Object.values(payers).reduce((sum, paid) => sum + paid, 0);
    if (Math.abs(totalPaid - amount) > 0.01) {
      newErrors.payers = 'Total paid amounts must equal the total expense amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSplitEqually = () => {
    setSplitType('equal');
    const amount = parseFloat(totalAmount);
    if (!isNaN(amount) && amount > 0 && participants.size > 0) {
      const splitAmount = (amount / participants.size).toFixed(2);
      const participantsArray = Array.from(participants);
      participantsArray.forEach(participant => {
        onPayerAmountChange(participant, splitAmount);
      });
    }
  };

  const handleCustomSplit = () => {
    setSplitType('custom');
    const equalPercentage = (100 / participants.size).toFixed(2);
    const newPercentages: { [key: string]: string } = {};
    participants.forEach(participant => {
      newPercentages[participant] = equalPercentage;
      const amount = parseFloat(totalAmount);
      if (!isNaN(amount) && amount > 0) {
        const splitAmount = ((amount * parseFloat(equalPercentage)) / 100).toFixed(2);
        onPayerAmountChange(participant, splitAmount);
      }
    });
    setPercentages(newPercentages);
  };

  const handlePercentageChange = (friend: string, value: string) => {
    const newPercentages = { ...percentages, [friend]: value };
    setPercentages(newPercentages);

    const amount = parseFloat(totalAmount);
    if (!isNaN(amount) && amount > 0) {
      const percentage = parseFloat(value) || 0;
      const splitAmount = ((amount * percentage) / 100).toFixed(2);
      onPayerAmountChange(friend, splitAmount);
    }
  };

  useEffect(() => {
    Object.keys(payers).forEach(payer => {
      if (!participants.has(payer)) {
        onPayerAmountChange(payer, '');
        if (splitType === 'custom') {
          const newPercentages = { ...percentages };
          delete newPercentages[payer];
          setPercentages(newPercentages);
        }
      }
    });

    if (splitType === 'equal') {
      handleSplitEqually();
    } else if (splitType === 'custom') {
      handleCustomSplit();
    }
  }, [participants]);

  useEffect(() => {
    if (splitType === 'equal') {
      handleSplitEqually();
    } else if (splitType === 'custom') {
      Object.entries(percentages).forEach(([friend, percentage]) => {
        handlePercentageChange(friend, percentage);
      });
    }
  }, [totalAmount]);

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit();
    }
  };

  return (
    <Card className="border-t-4 border-t-green-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Receipt className="h-5 w-5 text-green-500" />
              New Expense
            </CardTitle>
            <CardDescription>Add a new shared expense</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <input
              type="text"
              value={description}
              onChange={e => onDescriptionChange(e.target.value)}
              className={`w-full h-12 px-4 border rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Dinner, Movie tickets, etc."
              disabled={disabled}
            />
            {errors.description && (
              <p className="mt-2 text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                value={totalAmount}
                onChange={e => onTotalAmountChange(e.target.value)}
                className={`w-full h-12 pl-11 pr-4 border rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base ${
                  errors.totalAmount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
                step="0.01"
                min="0"
                disabled={disabled}
              />
            </div>
            {errors.totalAmount && (
              <p className="mt-2 text-sm text-red-500">{errors.totalAmount}</p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">Split Between</label>
              <button
                type="button"
                onClick={() => friends.forEach(friend => onParticipantToggle(friend))}
                className="text-sm text-green-600 hover:text-green-700 bg-green-50 px-3 py-1.5 rounded-lg"
                disabled={disabled}
              >
                Select All
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {friends.map(friend => (
                <button
                  key={friend}
                  onClick={() => onParticipantToggle(friend)}
                  className={`h-12 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    participants.has(friend)
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                  disabled={disabled}
                >
                  <Users className="h-4 w-4" />
                  {friend}
                </button>
              ))}
            </div>
            {errors.participants && (
              <p className="mt-2 text-sm text-red-500">{errors.participants}</p>
            )}
          </div>

          <div>
            <div className="flex flex-col gap-3 mb-4">
              <label className="block text-sm font-medium text-gray-700">Amount Paid by Each</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSplitEqually}
                  className={`flex-1 sm:flex-none h-10 px-4 rounded-lg text-sm font-medium transition-colors ${
                    splitType === 'equal'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                  disabled={disabled || !totalAmount || participants.size === 0}
                >
                  Split Equally
                </button>
                <button
                  type="button"
                  onClick={handleCustomSplit}
                  className={`flex-1 sm:flex-none h-10 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                    splitType === 'custom'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                  disabled={disabled || !totalAmount || participants.size === 0}
                >
                  <Percent className="h-4 w-4" />
                  Custom Split
                </button>
                <button
                  type="button"
                  onClick={distributeRemainingAmount}
                  className="flex-1 sm:flex-none h-10 px-4 rounded-lg text-sm font-medium transition-colors bg-blue-100 text-blue-800 hover:bg-blue-200 flex items-center justify-center gap-1"
                  disabled={disabled || !totalAmount || participants.size === 0}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                    <path d="M3 3v5h5"></path>
                  </svg>
                  Recalculate
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {friends.map(friend => (
                <div
                  key={friend}
                  className={`transition-opacity ${participants.has(friend) ? 'opacity-100' : 'opacity-50'}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-2 w-full sm:w-40">
                      <button
                        type="button"
                        onClick={() => toggleLock(friend)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          lockedInputs[friend]
                            ? 'bg-gray-200 text-gray-700'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                        disabled={disabled || !participants.has(friend)}
                      >
                        {lockedInputs[friend] ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                          </svg>
                        )}
                      </button>
                      <span className="text-sm font-medium">{friend}</span>
                    </div>
                    {splitType === 'custom' ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            value={percentages[friend] || ''}
                            onChange={e => handlePercentageChange(friend, e.target.value)}
                            className="w-full h-12 pr-8 pl-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                            placeholder="0"
                            step="0.01"
                            min="0"
                            max="100"
                            disabled={disabled || !participants.has(friend) || lockedInputs[friend]}
                          />
                          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                            <span className="text-gray-400">%</span>
                          </div>
                        </div>
                        <div className="relative w-full sm:w-32">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="number"
                            value={payers[friend] || ''}
                            readOnly
                            className="w-full h-12 pl-11 pr-4 border border-gray-300 rounded-lg bg-gray-50 text-base"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          value={payers[friend] || ''}
                          onChange={e => onPayerAmountChange(friend, e.target.value)}
                          className="w-full h-12 pl-11 pr-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          disabled={disabled || !participants.has(friend) || lockedInputs[friend]}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {errors.payers && (
              <p className="mt-3 text-sm text-red-500">{errors.payers}</p>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={disabled}
            className="w-full h-12 bg-green-500 text-white rounded-lg text-base font-medium hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Expense
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
