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
        .eq("user_id", user!.id);

      if (groupError) throw groupError;

      // Extract unique users from all groups, excluding the current user
      const uniqueUsers = new Map<string, User>();
      
      const members = groupMembers.forEach((member) => {
        const user = (member.groups as unknown as {group_members: {users: User}[]})!.group_members[0]!.users;
        uniqueUsers.set(user.id, user);
      });

      console.log({members: JSON.stringify(members, null, 2)});
        
    

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
