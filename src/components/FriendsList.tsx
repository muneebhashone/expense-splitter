import { Users, UserPlus, Plus, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingCard } from './ui/loading-card';

interface FriendsListProps {
  friends: string[];
  newFriend: string;
  onNewFriendChange: (value: string) => void;
  onAddFriend: () => void;
  onDeleteFriend: (friend: string) => void;
  loading?: boolean;
}

export function FriendsList({ friends, newFriend, onNewFriendChange, onAddFriend, onDeleteFriend, loading }: FriendsListProps) {
  if (loading) {
    return (
      <LoadingCard
        icon={Users}
        title="Friends"
        description="Manage your group of friends"
        color="blue"
        items={3}
      />
    );
  }

  return (
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
                onChange={(e) => onNewFriendChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newFriend.trim()) {
                    onAddFriend();
                  }
                }}
                placeholder="Enter friend's name"
                className="w-full p-3 border rounded-lg pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <UserPlus className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>
            <button
              onClick={onAddFriend}
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
                  onClick={() => onDeleteFriend(friend)}
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
  );
}
