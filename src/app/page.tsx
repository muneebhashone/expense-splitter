"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStateLocalStorage } from '@/hooks/useStateWithLocalStorage';
import {
  ArrowRight,
  CheckCircle,
  DollarSign,
  HandCoins,
  Plus,
  Receipt,
  Trash2,
  UserPlus,
  Users,
  XCircle,
  Save,
  Upload
} from 'lucide-react';
import { useState } from 'react';

interface Payers {
  [key: string]: number;
}

interface Expense {
  payers: Payers;
  amount: number;
  description: string;
  participants: string[];
  splitAmount: number;
  date: string;
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
  paid: boolean;
  date: string | null;
}


const ExpenseSplitter = () => {
  const [friends, setFriends] = useStateLocalStorage<string[]>("friends", []);
  const [expenses, setExpenses] = useStateLocalStorage<Expense[]>("expenses", []);
  const [settlements, setSettlements] = useStateLocalStorage<Settlement[]>("settlements", []);
  const [newFriend, setNewFriend] = useStateLocalStorage<string>("newFriend", '');
  const [description, setDescription] = useStateLocalStorage<string>("description", '');
  const [totalAmount, setTotalAmount] = useStateLocalStorage<string>("totalAmount", '');
  
  
  // State for multiple payers
  const [payers, setPayers] = useState<Payers>({});
  const [participants, setParticipants] = useState<Set<string>>(new Set());

  // Add new friend
  const handleAddFriend = () => {
    if (newFriend.trim() && !friends.includes(newFriend.trim())) {
      setFriends([...friends, newFriend.trim()]);
      setNewFriend('');
    }
  };

  // Delete friend
  const handleDeleteFriend = (friendToDelete: string) => {
    if (window.confirm(`Are you sure you want to delete ${friendToDelete}? This will affect all related expenses and settlements.`)) {
      // Remove friend from friends list
      setFriends(friends.filter(friend => friend !== friendToDelete));
      
      // Remove expenses where this friend is the only payer or participant
      setExpenses(expenses.filter(expense => {
        const payerExists = Object.keys(expense.payers).some(payer => payer !== friendToDelete);
        const participantExists = expense.participants.some(p => p !== friendToDelete);
        return payerExists && participantExists;
      }));
      
      // Remove settlements involving this friend
      setSettlements(settlements.filter(
        settlement => settlement.from !== friendToDelete && settlement.to !== friendToDelete
      ));
    }
  };

  // Delete expense
  const handleDeleteExpense = (expenseIndex: number) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      setExpenses(expenses.filter((_, index) => index !== expenseIndex));
    }
  };

  // Handle payer amount change
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

  // Add new expense
  const handleAddExpense = () => {
    if (Object.keys(payers).length > 0 && totalAmount && participants.size > 0) {
      const payersTotal = Object.values(payers).reduce((sum, amount) => sum + amount, 0);
      if (Math.abs(payersTotal - parseFloat(totalAmount)) > 0.01) {
        alert('The sum of payer amounts must equal the total expense amount!');
        return;
      }

      const splitAmount = parseFloat(totalAmount) / participants.size;
      const newExpense = {
        payers: { ...payers },
        amount: parseFloat(totalAmount),
        description: description || 'Unlisted expense',
        participants: Array.from(participants),
        splitAmount: splitAmount,
        date: new Date().toLocaleDateString()
      };
      setExpenses([...expenses, newExpense]);
      
      // Reset form
      setPayers({});
      setTotalAmount('');
      setDescription('');
      setParticipants(new Set());
    }
  };

  // Calculate balances
  const calculateBalances = (): { [key: string]: number } => {
    const balances: { [key: string]: number } = {};
    friends.forEach(friend => {
      balances[friend] = 0;
    });

    // Process expenses
    expenses.forEach(expense => {
      // Add paid amounts to payers' balances
      Object.entries(expense.payers).forEach(([payer, amount]) => {
        balances[payer] += amount;
      });
      
      // Subtract split amount from each participant's balance
      expense.participants.forEach(participant => {
        balances[participant] -= expense.splitAmount;
      });
    });

    // Process completed settlements
    settlements.forEach(settlement => {
      if (settlement.paid) {
        balances[settlement.from] += settlement.amount;
        balances[settlement.to] -= settlement.amount;
      }
    });

    return balances;
  };

  // Calculate optimal settlements
  const calculateSettlements = (): Settlement[] => {
    const balances = calculateBalances();
    const newSettlements: Settlement[] = [];
    
    const debtors = friends.filter(f => balances[f] < -0.01)
      .sort((a, b) => balances[a] - balances[b]);
    const creditors = friends.filter(f => balances[f] > 0.01)
      .sort((a, b) => balances[b] - balances[a]);
    
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      
      const debtAmount = -balances[debtor];
      const creditAmount = balances[creditor];
      const settleAmount = Math.min(debtAmount, creditAmount);
      
      if (settleAmount > 0.01) {
        newSettlements.push({
          from: debtor,
          to: creditor,
          amount: Math.round(settleAmount * 100) / 100,
          paid: false,
          date: null
        });
      }
      
      balances[debtor] += settleAmount;
      balances[creditor] -= settleAmount;
      
      if (Math.abs(balances[debtor]) < 0.01) i++;
      if (Math.abs(balances[creditor]) < 0.01) j++;
    }
    
    return newSettlements;
  };

  // Mark settlement as paid
  const handleSettlementPaid = (settlement: Settlement) => {
    const newSettlement = {
      ...settlement,
      paid: true,
      date: new Date().toLocaleDateString()
    };
    setSettlements([...settlements, newSettlement]);
  };

  const handleExportData = () => {
    const data = {
      friends,
      expenses,
      settlements,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expense-splitter-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // Validate the imported data structure
        if (!Array.isArray(data.friends) || !Array.isArray(data.expenses) || !Array.isArray(data.settlements)) {
          throw new Error('Invalid file format');
        }

        // Update all states
        setFriends(data.friends);
        setExpenses(data.expenses);
        setSettlements(data.settlements);

        // Reset the file input
        event.target.value = '';
        
        alert('Data imported successfully!');
      } catch (error) {
        alert('Error importing data. Please make sure the file is valid.');
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-3">
          <HandCoins className="h-8 w-8 text-blue-500" />
          Expense Splitter
        </h1>
        <p className="text-gray-600 mt-2">Split expenses easily with friends</p>
        
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={handleExportData}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Save className="h-4 w-4" />
            Export Data
          </button>
          
          <label className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer">
            <Upload className="h-4 w-4" />
            Import Data
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2  gap-6">
        {/* Friend Management Section */}
        <Card className="border-t-4 border-t-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Friends
                </CardTitle>
                <CardDescription>Manage your group of friends</CardDescription>
              </div>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {friends.length} friends
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={newFriend}
                    onChange={(e) => setNewFriend(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newFriend.trim()) {
                        handleAddFriend();
                      }
                    }}
                    placeholder="Enter friend's name"
                    className="w-full p-3 border rounded-lg pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <UserPlus className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                </div>
                <button
                  onClick={handleAddFriend}
                  disabled={!newFriend.trim()}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Plus className="h-5 w-5" />
                  Add
                </button>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {friends.map((friend) => (
                  <span 
                    key={friend} 
                    className="bg-white shadow-sm px-4 py-2 rounded-lg flex items-center gap-2 border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <Users className="h-4 w-4 text-gray-500" />
                    {friend}
                    <button
                      onClick={() => handleDeleteFriend(friend)}
                      disabled={true}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Expense Section */}
        {friends.length > 0 && (
          <Card className="border-t-4 border-t-green-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-green-500" />
                    New Expense
                  </CardTitle>
                  <CardDescription>Add a new shared expense</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Basic Expense Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="number"
                        value={totalAmount}
                        onChange={(e) => setTotalAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What was this expense for?"
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Payers Section */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Who Paid?</label>
                  <div className="grid gap-3">
                    {friends.map((friend) => (
                      <div key={friend} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                        <input
                          type="number"
                          placeholder="0.00"
                          value={payers[friend] || ''}
                          onChange={(e) => handlePayerAmountChange(friend, e.target.value)}
                          className="w-32 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <span className="text-gray-700">{friend}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Participants Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">Split Between</label>
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          const newParticipants = new Set(friends);
                          if (!e.target.checked) {
                            newParticipants.clear();
                          }
                          setParticipants(newParticipants);
                        }}
                        checked={participants.size === friends.length}
                        className="rounded text-green-500 focus:ring-green-500"
                      />
                      Split equally
                    </label>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {friends.map((friend) => (
                      <label key={friend} className="flex items-center gap-2 bg-white p-3 rounded-lg border hover:border-green-500 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={participants.has(friend)}
                          onChange={(e) => {
                            const newParticipants = new Set(participants);
                            if (e.target.checked) {
                              newParticipants.add(friend);
                            } else {
                              newParticipants.delete(friend);
                            }
                            setParticipants(newParticipants);
                          }}
                          className="rounded text-green-500 focus:ring-green-500"
                        />
                        <span className="text-gray-700">{friend}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleAddExpense}
                  disabled={!Object.keys(payers).length || !totalAmount || participants.size === 0}
                  className="w-full bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Plus className="h-5 w-5" />
                  Add Expense
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expenses List */}
        {expenses.length > 0 && (
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
              <div className="space-y-4">
                {expenses.map((expense, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-purple-200 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{expense.description}</h3>
                          <span className="text-gray-500 text-sm">({expense.date})</span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          <p className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Total: ${expense.amount}
                          </p>
                          <p className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Paid by: {Object.entries(expense.payers).map(([name, amount]) => 
                              `${name} ($${amount})`).join(', ')}
                          </p>
                          <p>Split between: {expense.participants.join(', ')}</p>
                          <p className="font-medium text-purple-600">${expense.splitAmount.toFixed(2)} each</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteExpense(index)}
                        className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Settlements */}
        {expenses.length > 0 && (
          <Card className="border-t-4 border-t-orange-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <HandCoins className="h-5 w-5 text-orange-500" />
                    Settlements
                  </CardTitle>
                  <CardDescription>Track payments and settlements</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Pending Settlements */}
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-700">Pending Settlements</h3>
                  {calculateSettlements().map((settlement, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-gray-700">
                          <span>{settlement.from}</span>
                          <ArrowRight className="h-4 w-4 text-orange-500" />
                          <span>{settlement.to}</span>
                        </div>
                        <span className="font-medium text-orange-600">${settlement.amount.toFixed(2)}</span>
                      </div>
                      <button
                        onClick={() => handleSettlementPaid(settlement)}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors w-full sm:w-auto"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Mark as Paid
                      </button>
                    </div>
                  ))}
                </div>

                {/* Completed Settlements */}
                {settlements.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-700">Completed Settlements</h3>
                    {settlements.map((settlement, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-gray-600">
                            {settlement.from} paid ${settlement.amount.toFixed(2)} to {settlement.to}
                          </span>
                          <span className="text-sm text-gray-500">({settlement.date})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ExpenseSplitter;