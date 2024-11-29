import { useGroups } from "@/hooks/useGroups";
import { GroupCard } from "./GroupCard";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Plus, Users, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { useState } from "react";
import { Input } from "./ui/input";
import { useFriends } from "@/hooks/useFriends";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { User } from "@/types";
import { useUser } from "@supabase/auth-helpers-react";

export function GroupsList() {
  const {
    groups,
    isLoading,
    createGroup,
    isCreatingGroup,
    searchUsers,
    searchResults,
    isSearchingUsers,
  } = useGroups();
  const { friends } = useFriends();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const user = useUser();

  const handleCreateGroup = async () => {
    if (!name.trim()) return;
    await createGroup({ name, members: [...selectedFriends, user!.id] });
    setIsOpen(false);
    setName("");
    setSelectedFriends([]);
    setSearchTerm("");
  };

  const toggleFriend = (user: User) => {
    setSelectedFriends((prev) =>
      prev.includes(user.id)
        ? prev.filter((id) => id !== user.id)
        : [...prev, user.id]
    );
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.trim().length >= 3) {
      searchUsers(value);
    }
  };

  // Combine friends and search results, removing duplicates
  const availableUsers = [...friends].filter((availableUser) => availableUser.id !== user!.id);


  if (searchTerm.length >= 3 && searchResults.length > 0) {
    searchResults.forEach((searchedUser) => {
      if (!availableUsers.some((f) => f.id === searchedUser.id)) {
        if(searchedUser.id !== user!.id) {
          availableUsers.push(searchedUser);
        }
      }
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="w-full h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Groups</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter group name"
                />
              </div>
              <div className="space-y-2">
                <Label>Add Members</Label>
                <div className="relative">
                  <Input
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search users by email"
                    className="pr-10"
                  />
                  {isSearchingUsers ? (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                    </div>
                  ) : (
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  )}
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                  {availableUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-2 p-2 rounded-lg border hover:bg-gray-50"
                    >
                      <Checkbox
                        id={user.id}
                        checked={selectedFriends.includes(user.id)}
                        onCheckedChange={() => toggleFriend(user)}
                      />
                      <div className="flex flex-col">
                        <Label htmlFor={user.id} className="font-medium">
                          {user.username}
                        </Label>
                        <span className="text-sm text-gray-500">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  ))}
                  {searchTerm.length >= 3 && availableUsers.length === 0 && (
                    <div className="text-center text-gray-500 py-2">
                      No users found
                    </div>
                  )}
                </div>
              </div>
              <Button
                onClick={handleCreateGroup}
                disabled={
                  !name.trim() ||
                  selectedFriends.length === 0 ||
                  isCreatingGroup
                }
                className="w-full"
              >
                {isCreatingGroup ? "Creating..." : "Create Group"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {groups.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No groups yet. Create one to start managing expenses together!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={{
                ...group,
                group_members: group.group_members.flatMap(
                  (member) => member.users
                ),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
