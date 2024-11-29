import { Users, UserPlus, XCircle, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { LoadingCard } from './ui/loading-card';
import { User } from '@/types';
import { useState } from 'react';
import { useGroups } from '@/hooks/useGroups';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface FriendsListProps {
  friends: User[];
  onSearchUsers: (searchTerm: string) => void;
  searchResults: User[];
  isSearching: boolean;
  loading?: boolean;
  onSelectFriend: (friend: User) => void;
}

export function FriendsList({ 
  friends, 
  onSearchUsers, 
  searchResults, 
  isSearching,
  loading,
  onSelectFriend,
}: FriendsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [groupName, setGroupName] = useState('');
  const { createGroup, isCreatingGroup } = useGroups();

  if (loading) {
    return (
      <LoadingCard
        icon={Users}
        title="Friends"
        description="Find and connect with friends"
        color="blue"
        items={3}
      />
    );
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.trim().length >= 3) {
      onSearchUsers(value);
    }
  };

  const handleAddFriend = (user: User) => {
    setSelectedUser(user);
    setIsCreateGroupOpen(true);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !selectedUser) return;
    
    await createGroup({
      name: groupName,
      members: [selectedUser.id]
    });

    onSelectFriend(selectedUser);
    setIsCreateGroupOpen(false);
    setGroupName('');
    setSelectedUser(null);
  };

  return (
    <Card className="border-t-4 border-t-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Users className="h-5 w-5 text-blue-500" />
              Friends
            </CardTitle>
            <CardDescription>Find and connect with friends</CardDescription>
          </div>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {friends.length}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex flex-col gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search users by email"
                className="w-full h-12 px-4 border rounded-lg pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
              {isSearching ? (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
                </div>
              ) : (
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              )}
            </div>
            
            {searchTerm.length >= 3 && searchResults.length > 0 && (
              <div className="border rounded-lg divide-y">
                {searchResults.map((user) => (
                  <div 
                    key={user.id}
                    className="p-3 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{user.username}</span>
                      <span className="text-sm text-gray-500">{user.email}</span>
                    </div>
                    <button
                      onClick={() => handleAddFriend(user)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
                    >
                      <UserPlus className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {friends.map((friend) => (
              <div 
                key={friend.id} 
                className="bg-white shadow-sm px-4 py-3 rounded-lg flex items-center justify-between border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{friend.username}</span>
                  <span className="text-sm text-gray-500">{friend.email}</span>
                </div>
                <button
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50 active:bg-red-100"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Group with Friend</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
              />
            </div>
            {selectedUser && (
              <div className="p-3 border rounded-lg">
                <div className="font-medium">{selectedUser.username}</div>
                <div className="text-sm text-gray-500">{selectedUser.email}</div>
              </div>
            )}
            <Button
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || isCreatingGroup}
              className="w-full"
            >
              {isCreatingGroup ? "Creating..." : "Create Group & Add Friend"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
