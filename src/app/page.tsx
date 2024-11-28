"use client";
import { useMemo, useState } from 'react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { Expense, Payers, Settlement } from '@/types';
import { FriendsList } from '@/components/FriendsList';
import { NewExpense } from '@/components/NewExpense';
import { ExpensesList } from '@/components/ExpensesList';
import { Settlements } from '@/components/Settlements';
import { Header } from '@/components/Header';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Expense as ExpenseType } from '@/hooks/useSupabaseData';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, PlusCircle, Receipt, Wallet } from 'lucide-react';

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
    updateSettlement,
    clearSettlements
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

      const expense_payers = Object.entries(payers).map(([payer, amount]) => ({
        payer,
        amount: parseFloat(amount.toString())
      })) as ExpenseType['expense_payers'];

      const expense_participants = Array.from(participants).map(participant => ({
        participant
      })) as ExpenseType['expense_participants'];

      const newExpense: ExpenseType = {
        description,
        amount,
        split_amount: splitAmount,
        date: new Date().toISOString(),
        expense_payers,
        expense_participants
      };

      addExpense(newExpense);
      
      setDescription('');
      setTotalAmount('');
      setPayers({});
      setParticipants(new Set());
    }
  };

  const [expensesToDelete, setExpensesToDelete] = useState<string[]>([]);
  const [settlementsToClear, setSettlementsToClear] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | 'all'>('all');
  const [selectedFromFriend, setSelectedFromFriend] = useState<string>('');
  const [selectedToFriend, setSelectedToFriend] = useState<string>('');

  const handleDeleteExpense = (indices: number[]) => {
    const ids = indices.map(index => expenses[index]?.id).filter((id): id is string => !!id);
    setExpensesToDelete(ids);
    setDialogOpen(true);
  };

  const confirmDeleteExpense = () => {
    if (expensesToDelete.length > 0) {
      expensesToDelete.forEach(id => {
        deleteExpense(id);
      });
      setExpensesToDelete([]);
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

  const handleSettlementUpdate = async (settlement: Settlement & { remaining: number }) => {
    const updatedSettlement = {
      ...settlement,
      from_friend: settlement.from,
      to_friend: settlement.to,
      paid: true,
      date: new Date().toISOString()
    };
    await updateSettlement(updatedSettlement);
  };

  const filteredSettlements = useMemo(() => {
    let updatedSettlements = settlements;
    
    if (selectedExpenseId !== 'all') {
      updatedSettlements = settlements.filter(s => s.expense_id === Number(selectedExpenseId));
    } 

    if (selectedFromFriend !== '' && selectedFromFriend !== 'all') {
      updatedSettlements = updatedSettlements.filter(s => s.from_friend === selectedFromFriend);
    }
    
    if (selectedToFriend !== '' && selectedToFriend !== 'all') {
      updatedSettlements = updatedSettlements.filter(s => s.to_friend === selectedToFriend);
    }

    return updatedSettlements;
  }, [settlements, selectedExpenseId, selectedFromFriend, selectedToFriend]);

  const tabs = [
    {
      id: 'friends',
      label: 'Friends',
      icon: <Users className="w-6 h-6" />,
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
      label: 'Add',
      icon: <PlusCircle className="w-6 h-6" />,
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
      icon: <Receipt className="w-6 h-6" />,
      content: (
        <ExpensesList
          expenses={expenses}
          onDeleteExpense={handleDeleteExpense}
          loading={loadingExpenses}
        />
      )
    },
    {
      id: 'settlements',
      label: 'Settle',
      icon: <Wallet className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <Select 
              value={selectedExpenseId}
              onValueChange={(value) => setSelectedExpenseId(value as string)}
            >
              <SelectTrigger> 
                <SelectValue placeholder="Select an expense" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Expenses</SelectItem>
                {expenses.map((expense) => (
                <SelectItem key={expense.id} value={expense.id!}>
                  {expense.description} (${expense.amount})
                </SelectItem>
              ))}
              </SelectContent>
            </Select>

            <Select 
              value={selectedFromFriend}
              onValueChange={(value) => setSelectedFromFriend(value as string)}
            >
              <SelectTrigger> 
                <SelectValue placeholder="From friend" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Friends</SelectItem>
                {friends.map((friend) => (
                <SelectItem key={friend} value={friend}>
                  {friend}
                </SelectItem>
              ))}
              </SelectContent>
            </Select>

            <Select 
              value={selectedToFriend}
              onValueChange={(value) => setSelectedToFriend(value as string)}
            >
              <SelectTrigger> 
                <SelectValue placeholder="To friend" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Friends</SelectItem>
                {friends.map((friend) => (
                <SelectItem key={friend} value={friend}>
                  {friend}
                </SelectItem>
              ))}
              </SelectContent>
            </Select>
          </div>
          
          <Settlements
            expenses={expenses as unknown as Expense[]}
            settlements={filteredSettlements}
            onSettlementPaid={handleSettlementUpdate}
            onClearSettlements={() => {
              setDialogOpen(true);
              setSettlementsToClear(true);
            }}
            loading={loadingSettlements}
          />
        </div>
      )
    }
  ];

  if (error) {
    return (
      <div className="max-w-md mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              {friendToDelete 
                ? `Are you sure you want to delete ${friendToDelete}? This will affect all related expenses and settlements.`
                : expensesToDelete.length > 0
                ? `Are you sure you want to delete ${expensesToDelete.length} expense${expensesToDelete.length > 1 ? 's' : ''}?`
                : settlementsToClear
                ? 'Are you sure you want to clear all completed settlements? This action cannot be undone.'
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start">
            <button
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              onClick={() => {
                if (friendToDelete) {
                  confirmDeleteFriend();
                } else if (expensesToDelete.length > 0) {
                  confirmDeleteExpense();
                } else if (settlementsToClear) {
                  clearSettlements();
                  setSettlementsToClear(false);
                  setDialogOpen(false);
                }
              }}
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

      <div className="max-w-md mx-auto">
        <Header activeTab={activeTab} onExportData={() => {}} onImportData={() => {}} />
        <div className="px-4">
          <BottomNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </div>
    </div>
  );
};

export default ExpenseSplitter;
