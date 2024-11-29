import { Group } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { useGroups } from "@/hooks/useGroups";
import { Trash2, UserMinus, UserPlus, Search } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} 
from "./ui/dialog";
import { useFriends } from "@/hooks/useFriends";
import { useUser } from "@supabase/auth-helpers-react";
import { useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface GroupCardProps {
  group: Group;
}

export function GroupCard({ group }: GroupCardProps) {
  const { deleteGroup, addGroupMember, removeGroupMember, searchUsers, searchResults, isSearchingUsers } = useGroups();
  const { friends } = useFriends();
  const user = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.trim().length >= 3) {
      searchUsers(value);
    }
  };

  // Combine friends and search results, removing duplicates and filtering out existing members
  const availableUsers = [...friends];


  if (searchTerm.length >= 3 && searchResults.length > 0) {
    searchResults.forEach(user => {
      if (!availableUsers.some(f => f.id === user.id)) {
        availableUsers.push(user);
      }
    });
  }

  console.log({members: JSON.stringify(group, null, 2)});


  const nonMembers = availableUsers.filter(
    (user) => !group.group_members.some((member) => member.id === user.id)
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{group.name}</CardTitle>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Group</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this group? This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteGroup(group.id)}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Members</h4>
              <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Member</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Search Users</Label>
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
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {nonMembers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-2 rounded-lg border hover:bg-gray-50"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{user.username}</span>
                            <span className="text-sm text-gray-500">{user.email}</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              addGroupMember({ groupId: group.id, userId: user.id });
                              setIsAddMemberOpen(false);
                              setSearchTerm("");
                            }}
                          >
                            Add
                          </Button>
                        </div>
                      ))}
                      {searchTerm.length >= 3 && nonMembers.length === 0 && (
                        <div className="text-center text-gray-500 py-2">
                          No users found
                        </div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-2">
              {group.group_members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 rounded-lg border"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{member.username}</span>
                    <span className="text-sm text-gray-500">{member.email}</span>
                  </div>
                  {member.id !== user?.id && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        removeGroupMember({
                          groupId: group.id,
                          userId: member.id,
                        })
                      }
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
