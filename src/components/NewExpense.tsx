import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { User, Group } from '../types';
import { DollarSign, Receipt, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useUser } from '@supabase/auth-helpers-react';

interface NewExpenseProps {
  friends: User[];
  groups: Group[];
  totalAmount: string;
  description: string;
  payers: Record<string, number>;
  participants: Set<string>;
  onTotalAmountChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPayerAmountChange: (userId: string, amount: string) => void;
  onParticipantToggle: (userId: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  selectedGroup?: string;
  onGroupChange: (groupId: string) => void;
}

interface ValidationErrors {
  description?: string;
  totalAmount?: string;
  participants?: string;
  payers?: string;
}

type SplitType = 'equal' | 'percentage' | 'custom';

interface LockedState {
  [key: string]: 'none' | 'nonpayer' | 'payer';
}

export function NewExpense({
  friends,
  groups,
  totalAmount,
  description,
  payers,
  participants,
  onTotalAmountChange,
  onDescriptionChange,
  onPayerAmountChange,
  onParticipantToggle,
  onSubmit,
  disabled,
  selectedGroup,
  onGroupChange
}: NewExpenseProps) {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [percentages, setPercentages] = useState<{ [key: string]: string }>({});
  const [lockedInputs, setLockedInputs] = useState<LockedState>({});
  const user = useUser();

  // Filter friends based on selected group
  const filteredFriends = [...(selectedGroup
    ? friends.filter(friend => {
        const group = groups.find(g => g.id === selectedGroup);
        return group?.group_members.some(member => member.id === friend.id);
      })
    : friends), {id: user!.id, username: user!.email}];

  const calculateRemainingAmount = () => {
    const total = parseFloat(totalAmount) || 0;
    const payerLockedAmount = Object.entries(payers)
      .filter(([userId]) => lockedInputs[userId] === 'payer')
      .reduce((sum, [, amount]) => sum + (amount || 0), 0);
    return total - payerLockedAmount;
  };

  const distributeRemainingAmount = () => {
    const remainingAmount = calculateRemainingAmount();
    const unlockedPayers = Array.from(participants).filter(
      userId => lockedInputs[userId] === 'none' || !lockedInputs[userId]
    );

    if (unlockedPayers.length > 0) {
      const amountPerPayer = (remainingAmount / unlockedPayers.length).toFixed(2);
      unlockedPayers.forEach(userId => {
        onPayerAmountChange(userId, amountPerPayer);
      });
    }
  };

  const toggleLock = (userId: string) => {
    const newLockedInputs = { ...lockedInputs };
    const currentState = newLockedInputs[userId] || 'none';
    
    switch (currentState) {
      case 'none':
        newLockedInputs[userId] = 'nonpayer';
        onPayerAmountChange(userId, '0');
        break;
      case 'nonpayer':
        newLockedInputs[userId] = 'payer';
        break;
      case 'payer':
        newLockedInputs[userId] = 'none';
        distributeRemainingAmount();
        break;
    }
    
    setLockedInputs(newLockedInputs);
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
      participantsArray.forEach(userId => {
        onPayerAmountChange(userId, splitAmount);
      });
    }
  };

  const handleCustomSplit = () => {
    setSplitType('custom');
    const equalPercentage = (100 / participants.size).toFixed(2);
    const newPercentages: { [key: string]: string } = {};
    participants.forEach(userId => {
      newPercentages[userId] = equalPercentage;
      const amount = parseFloat(totalAmount);
      if (!isNaN(amount) && amount > 0) {
        const splitAmount = ((amount * parseFloat(equalPercentage)) / 100).toFixed(2);
        onPayerAmountChange(userId, splitAmount);
      }
    });
    setPercentages(newPercentages);
  };

  const handlePercentageChange = (userId: string, value: string) => {
    const newPercentages = { ...percentages, [userId]: value };
    setPercentages(newPercentages);

    const amount = parseFloat(totalAmount);
    if (!isNaN(amount) && amount > 0) {
      const percentage = parseFloat(value) || 0;
      const splitAmount = ((amount * percentage) / 100).toFixed(2);
      onPayerAmountChange(userId, splitAmount);
    }
  };

  useEffect(() => {
    Object.keys(payers).forEach(payerId => {
      if (!participants.has(payerId)) {
        onPayerAmountChange(payerId, '');
        if (splitType === 'custom') {
          const newPercentages = { ...percentages };
          delete newPercentages[payerId];
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
      Object.entries(percentages).forEach(([userId, percentage]) => {
        handlePercentageChange(userId, percentage);
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Group</label>
            <Select value={selectedGroup} onValueChange={onGroupChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a group" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
                onClick={() => filteredFriends.forEach(friend => onParticipantToggle(friend.id))}
                className="text-sm text-green-600 hover:text-green-700 bg-green-50 px-3 py-1.5 rounded-lg"
                disabled={disabled}
              >
                Select All
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {filteredFriends.map(friend => (
                <button
                  key={friend.id}
                  onClick={() => onParticipantToggle(friend.id)}
                  className={`h-12 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    participants.has(friend.id)
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                  disabled={disabled}
                >
                  <Users className="h-4 w-4" />
                  {friend.username}
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
              <div className="w-full flex flex-col flex-wrap gap-2">
                <button
                  type="button"
                  onClick={distributeRemainingAmount}
                  className="flex-1 sm:flex-none py-2 px-4 rounded-lg text-sm font-medium transition-colors bg-blue-100 text-blue-800 hover:bg-blue-200 flex items-center justify-center gap-1"
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
            <div className="space-y-3 flex flex-col">
              {filteredFriends.map(friend => {
                const friendId = friend.id;
                return (
                  <div
                    key={friendId}
                    className={`transition-opacity ${participants.has(friendId) ? 'opacity-100' : 'opacity-50'}`}
                  >
                    <div className="flex flex-col items-start w-full gap-3">
                      <div className="flex items-center gap-2 w-full sm:w-40">
                        <button
                          type="button"
                          onClick={() => toggleLock(friendId)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            lockedInputs[friendId] === 'nonpayer'
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : lockedInputs[friendId] === 'payer'
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                          disabled={disabled || !participants.has(friendId)}
                          title={
                            lockedInputs[friendId] === 'nonpayer'
                              ? 'Non-payer lock: Amount set to 0 and excluded from calculations'
                              : lockedInputs[friendId] === 'payer'
                              ? 'Payer lock: Amount preserved and included in calculations'
                              : 'Click to cycle through lock states'
                          }
                        >
                          {(() => {
                            switch (lockedInputs[friendId]) {
                              case 'nonpayer':
                                return (
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                  </svg>
                                );
                              case 'payer':
                                return (
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    <circle cx="12" cy="16" r="1" fill="currentColor"></circle>
                                  </svg>
                                );
                              default:
                                return (
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                                  </svg>
                                );
                            }
                          })()}
                        </button>
                        <span className="text-sm font-medium">{friend.username}</span>
                      </div>
                      {splitType === 'custom' ? (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1">
                          <div className="relative flex-1">
                            <input
                              type="number"
                              value={percentages[friendId] || ''}
                              onChange={e => handlePercentageChange(friendId, e.target.value)}
                              className="w-full h-12 pr-8 pl-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                              placeholder="0"
                              step="0.01"
                              min="0"
                              max="100"
                              disabled={disabled || !participants.has(friendId) || Boolean(lockedInputs[friendId])}
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
                              value={payers[friendId] || ''}
                              readOnly
                              className="w-full h-12 pl-11 pr-4 border border-gray-300 rounded-lg bg-gray-50 text-base"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="relative flex-1 w-full">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="number"
                            value={payers[friendId] || ''}
                            onChange={e => onPayerAmountChange(friendId, e.target.value)}
                            className="w-full h-12 pl-11 pr-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            disabled={disabled || !participants.has(friendId) || lockedInputs[friendId] === 'nonpayer'}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
