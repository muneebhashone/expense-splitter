"use client";
import { useState } from 'react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { Expense, Payers, Settlement } from '@/types';
import { FriendsList } from '@/components/FriendsList';
import { NewExpense } from '@/components/NewExpense';
import { ExpensesList } from '@/components/ExpensesList';
import { Settlements } from '@/components/Settlements';
import { Header } from '@/components/Header';
import { TabNavigation } from '@/components/TabNavigation';
import { Expense as ExpenseType, Settlement as SettlementType } from '@/hooks/useSupabaseData';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const [activeTab, setActiveTab] = useState('friends');

  const handleAddFriend = () => {
    if (newFriend.trim() && !friends.includes(newFriend.trim())) {
      addFriend(newFriend.trim());
      setNewFriend('');
    }
  };

  const [dialogOpen, setDialogOpen] = useState(false);
  const [friendToDelete, setFriendToDelete] = useState<string | null>(null);

  const handleDeleteFriend = (friend: string) => {
    setFriendToDelete(friend);
    setDialogOpen(true);
  };

  const confirmDeleteFriend = () => {
    if (friendToDelete) {
      deleteFriend(friendToDelete);
      setFriendToDelete(null);
      setDialogOpen(false);
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

  const [expenseToDelete, setExpenseToDelete] = useState<number | null>(null);

  const handleDeleteExpense = (expenseIndex: number) => {
    setExpenseToDelete(expenseIndex);
    setDialogOpen(true);
  };

  const confirmDeleteExpense = () => {
    if (expenseToDelete !== null) {
      deleteExpense(expenseToDelete);
      setExpenseToDelete(null);
      setDialogOpen(false);
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

  const tabs = [
    {
      id: 'friends',
      label: 'Friends',
      content: (
        <FriendsList
          friends={friends}
          newFriend={newFriend}
          onNewFriendChange={setNewFriend}
          onAddFriend={handleAddFriend}
          onDeleteFriend={handleDeleteFriend}
          loading={loadingFriends}
        />
      )
    },
    {
      id: 'new-expense',
      label: 'Add Expense',
      content: (
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
      )
    },
    {
      id: 'expenses',
      label: 'Expenses',
      content: (
        <ExpensesList
          expenses={expenses as ExpenseType[]}
          onDeleteExpense={handleDeleteExpense}
          loading={loadingExpenses}
        />
      )
    },
    {
      id: 'settlements',
      label: 'Settlements',
      content: (
        <Settlements
          settlements={settlements as SettlementType[]}
          onSettlementPaid={handleSettlementUpdate}
          loading={loadingSettlements}
        />
      )
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              {friendToDelete 
                ? `Are you sure you want to delete ${friendToDelete}? This will affect all related expenses and settlements.`
                : expenseToDelete !== null
                ? 'Are you sure you want to delete this expense?'
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start">
            <button
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              onClick={friendToDelete ? confirmDeleteFriend : confirmDeleteExpense}
            >
              Delete
            </button>
            <button
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 ml-2"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Header 
        onExportData={() => console.log('Export data')} 
        onImportData={() => console.log('Import data')} 
        activeTab={activeTab}
      />
      
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
};

export default ExpenseSplitter;
