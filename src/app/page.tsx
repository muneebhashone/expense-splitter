"use client";
import { useMemo, useState } from 'react';
import { useFriends } from '@/hooks/useFriends';
import { useExpenses } from '@/hooks/useExpenses';
import { useSettlements } from '@/hooks/useSettlements';
import { Settlement, User } from '@/types';
import { FriendsList } from '@/components/FriendsList';
import { NewExpense } from '@/components/NewExpense';
import { ExpensesList } from '@/components/ExpensesList';
import { Settlements } from '@/components/Settlements';
import { Header } from '@/components/Header';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, PlusCircle, Receipt, Wallet, Users2 } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';
import { GroupsList } from '@/components/GroupsList';

const ExpenseSplitter = () => {
  const {
    friends,
    searchUsers,
    isSearching,
    searchResults,
    isLoading: loadingFriends,
    error: friendsError
  } = useFriends();

  const {
    expenses,
    addExpense,
    deleteExpense,
    isLoading: loadingExpenses,
    error: expensesError
  } = useExpenses();

  const {
    settlements,
    updateSettlement,
    clearSettlements,
    isLoading: loadingSettlements,
    error: settlementsError
  } = useSettlements();

  const {
    error: groupsError,
  } = useGroups(); 

  const [description, setDescription] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [payers, setPayers] = useState<Record<string, number>>({});
  const [participants, setParticipants] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('friends');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [expensesToDelete, setExpensesToDelete] = useState<string[]>([]);
  const [settlementsToClear, setSettlementsToClear] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | 'all'>('all');
  const [selectedFromFriend, setSelectedFromFriend] = useState<string>('');
  const [selectedToFriend, setSelectedToFriend] = useState<string>('');

  const handleAddExpense = () => {
    if (description && totalAmount && Object.keys(payers).length > 0 && participants.size > 0) {
      const amount = parseFloat(totalAmount);
      const splitAmount = amount / participants.size;

      const expense_payers = Object.entries(payers).map(([userId, amount]) => ({
        id: '',
        expense_id: '',
        payer: userId,
        amount: parseFloat(amount.toString()),
        created_at: new Date().toISOString()
      }));

      const expense_participants = Array.from(participants).map(userId => ({
        id: '',
        expense_id: '',
        participant: userId,
        created_at: new Date().toISOString()
      }));

      const newExpense = {
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

  const handlePayerAmountChange = (userId: string, amount: string) => {
    setPayers(currentPayers => {
      const newPayers = { ...currentPayers };
      if (amount) {
        newPayers[userId] = parseFloat(amount);
      } else {
        delete newPayers[userId];
      }
      return newPayers;
    });
  };

  const handleSettlementUpdate = async (settlement: Settlement & { remaining: number }) => {
    const updatedSettlement = {
      ...settlement,
      paid: true,
      date: new Date().toISOString()
    };
    await updateSettlement(updatedSettlement);
  };

  const handleSelectFriend = (friend: User) => {
    // Add friend to participants by default when selected
    setParticipants(current => new Set(current).add(friend.id));
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
          onSearchUsers={searchUsers}
          searchResults={searchResults}
          isSearching={isSearching}
          loading={loadingFriends}
          onSelectFriend={handleSelectFriend}
        />
      )
    },
    {
      id: 'groups',
      label: 'Groups',
      icon: <Users2 className="w-6 h-6" />,
      content: <GroupsList />
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
              onValueChange={(value) => setSelectedFromFriend(value)}
            >
              <SelectTrigger> 
                <SelectValue placeholder="From friend" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Friends</SelectItem>
                {friends.map((friend) => (
                  <SelectItem key={friend.id} value={friend.id}>
                    {friend.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={selectedToFriend}
              onValueChange={(value) => setSelectedToFriend(value)}
            >
              <SelectTrigger> 
                <SelectValue placeholder="To friend" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Friends</SelectItem>
                {friends.map((friend) => (
                  <SelectItem key={friend.id} value={friend.id}>
                    {friend.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Settlements
            expenses={expenses}
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

  const error = friendsError || expensesError || settlementsError || groupsError;

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
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              {expensesToDelete.length > 0
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
                if (expensesToDelete.length > 0) {
                  confirmDeleteExpense();
                } else if (settlementsToClear) {
                  clearSettlements();
                  setSettlementsToClear(false);
                  setDialogOpen(false);
                }
              }}
            >
              Confirm
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

      <div className="max-w-4xl mx-auto">
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
