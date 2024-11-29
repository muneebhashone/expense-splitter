import { supabase } from "@/lib/supabase";
import { User } from "@/types";
import { useUser } from "@supabase/auth-helpers-react";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useFriends = () => {
  const user = useUser();

  const {
    data: friends = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["friends", user?.id],
    queryFn: async () => {
      // Get all groups the user is a member of

      const groupIds = await supabase
        .from("groups")
        .select("id")
        .eq("created_by", user!.id);

      const { data: groupMembers, error: groupError } = await supabase
        .from("group_members")
        .select(
          `
          group_id,
          groups!inner (
            group_members!inner (
              users!inner (
                id,
                email,
                username
              )
            )
          )
        `
        )
        .in("group_id", groupIds.data!.map((group) => group.id));

      if (groupError) throw groupError;

      // Extract unique users from all groups, excluding the current user
      const uniqueUsers = new Map<string, User>();

      console.log({groupMembers})
      
      groupMembers.forEach((member) => {
        (member.groups as unknown as {group_members: {users: User}[]})!.group_members.forEach((groupMember) => {
            if(groupMember.users.id !== user!.id) {
              uniqueUsers.set(groupMember.users.id, groupMember.users);
            }
        });
      });

      return Array.from(uniqueUsers.values());
    },
    enabled: !!user,
  });

  const searchUsersMutation = useMutation({
    mutationFn: async (searchTerm: string) => {
      const { data, error: searchError } = await supabase
        .from("users")
        .select("id, email, username")
        .or(`email.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`)
        .neq("id", user!.id)
        .limit(5);

      if (searchError) throw searchError;
      return data as User[];
    },
  });

  return {
    friends,
    isLoading,
    error: error?.message || null,
    searchUsers: searchUsersMutation.mutate,
    isSearching: searchUsersMutation.isPending,
    searchResults: searchUsersMutation.data || [],
  };
};
