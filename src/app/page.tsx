"use client";
import { useState } from 'react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { Expense, Payers, Settlement } from '@/types';
import { FriendsList } from '@/components/FriendsList';
import { NewExpense } from '@/components/NewExpense';
import { ExpensesList } from '@/components/ExpensesList';
import { Settlements } from '@/components/Settlements';
import { Header } from '@/components/Header';
import { Expense as ExpenseType, Settlement as SettlementType } from '@/hooks/useSupabaseData';


const ExpenseSplitter = () => {
  const {
    friends,
    expenses,
    settlements,
    loading: { friends: loadingFriends, expenses: loadingExpenses, settlements: loadingSettlements },
    error,
    addFriend,
    deleteFriend,
    addExpense,
    deleteExpense,
    updateSettlement
  } = useSupabaseData();
  
  const [newFriend, setNewFriend] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [payers, setPayers] = useState<Payers>({});
  const [participants, setParticipants] = useState<Set<string>>(new Set());

  const handleAddFriend = () => {
    if (newFriend.trim() && !friends.includes(newFriend.trim())) {
      addFriend(newFriend.trim());
      setNewFriend('');
    }
  };

  const handleDeleteFriend = (friendToDelete: string) => {
    if (window.confirm(`Are you sure you want to delete ${friendToDelete}? This will affect all related expenses and settlements.`)) {
      deleteFriend(friendToDelete);
    }
  };

  const handleAddExpense = () => {
    if (description && totalAmount && Object.keys(payers).length > 0 && participants.size > 0) {
      const amount = parseFloat(totalAmount);
      const splitAmount = amount / participants.size;
      const newExpense: Expense = {
        description,
        amount,
        payers,
        participants: Array.from(participants),
        splitAmount,
        date: new Date().toISOString()
      };
      addExpense(newExpense as Omit<Expense, 'expense_payers' | 'expense_participants'>);
      
      // Reset form
      setDescription('');
      setTotalAmount('');
      setPayers({});
      setParticipants(new Set());
    }
  };

  const handleDeleteExpense = (expenseIndex: number) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteExpense(expenseIndex);
    }
  };

  const handlePayerAmountChange = (friend: string, amount: string) => {
    setPayers(currentPayers => {
      const newPayers = { ...currentPayers };
      if (amount) {
        newPayers[friend] = parseFloat(amount);
      } else {
        delete newPayers[friend];
      }
      return newPayers;
    });
  };

  const handleSettlementUpdate = async (settlement: Settlement) => {
    const updatedSettlement = {
      ...settlement,
      paid: true,
      date: new Date().toISOString()
    };
    await updateSettlement(updatedSettlement);
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 bg-gray-50 min-h-screen">
      <Header onExportData={() => console.log('Export data')} onImportData={() => console.log('Import data')} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <FriendsList
            friends={friends}
            newFriend={newFriend}
            onNewFriendChange={setNewFriend}
            onAddFriend={handleAddFriend}
            onDeleteFriend={handleDeleteFriend}
            loading={loadingFriends}
          />
          <ExpensesList
            expenses={expenses as ExpenseType[]}
            onDeleteExpense={handleDeleteExpense}
            loading={loadingExpenses}
          />
        </div>
        <div className="space-y-6">
          <NewExpense
            friends={friends}
            description={description}
            totalAmount={totalAmount}
            payers={payers}
            participants={participants}
            onDescriptionChange={setDescription}
            onTotalAmountChange={setTotalAmount}
            onPayerAmountChange={handlePayerAmountChange}
            onParticipantToggle={participant => {
              setParticipants(current => {
                const newSet = new Set(current);
                if (newSet.has(participant)) {
                  newSet.delete(participant);
                } else {
                  newSet.add(participant);
                }
                return newSet;
              });
            }}
            onSubmit={handleAddExpense}
            disabled={loadingExpenses || loadingFriends}
          />
          <Settlements
            settlements={settlements as SettlementType[]}
            onSettlementPaid={handleSettlementUpdate}
            loading={loadingSettlements}
          />
        </div>
      </div>
    </div>
  );
};

export default ExpenseSplitter;