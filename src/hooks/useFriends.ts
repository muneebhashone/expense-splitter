import { useUser } from "@supabase/auth-helpers-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { User } from "@/types";

export const useFriends = () => {
  const user = useUser();

  const { data: friends = [], isLoading, error } = useQuery({
    queryKey: ["friends", user?.id],
    queryFn: async () => {
      // Get all groups the user is a member of
      const { data: groupMembers, error: groupError } = await supabase
        .from("group_members")
        .select(`
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
        `)
        .eq("user_id", user!.id);

      if (groupError) throw groupError;

      // Extract unique users from all groups, excluding the current user
      const uniqueUsers = new Map<string, User>();
      for (const groupMember of groupMembers) {
        for (const group of groupMember.groups) {
          for (const member of group.group_members) {
            if (member.users && member.users.id !== user!.id) {
              const memberUser: User = {
                id: member.users.id,
                email: member.users.email,
                username: member.users.username
              };
              uniqueUsers.set(memberUser.id, memberUser);
            }
          }
        }
      }

      return Array.from(uniqueUsers.values());
    },
    enabled: !!user,
  });

  const searchUsersMutation = useMutation({
    mutationFn: async (searchTerm: string) => {
      const { data, error: searchError } = await supabase
        .from("users")
        .select("*")
        .ilike("email", `%${searchTerm}%`)
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
