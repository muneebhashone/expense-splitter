import { useUser } from "@supabase/auth-helpers-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { User } from "@/types";

export const useGroups = () => {
  const user = useUser();
  const queryClient = useQueryClient();

  const { data: groups = [], isLoading, error } = useQuery({
    queryKey: ["groups", user?.id],
    queryFn: async () => {
      const { data: groupsData, error: groupsError } = await supabase
        .from("groups")
        .select(`
          *,
          group_members (
            users (
              id,
              email,
              username
            )
          )
        `)
        .eq("created_by", user!.id);

      if (groupsError) throw groupsError;

      console.log({groupsData});

      return groupsData;
    },
    enabled: !!user,
  });

  const searchUsersMutation = useMutation({
    mutationFn: async (searchTerm: string) => {
      const { data, error: searchError } = await supabase
        .from("users")
        .select("id, email, username")
        .ilike("email", `%${searchTerm}%`)
        .limit(5);

      if (searchError) throw searchError;
      return data as User[];
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async ({ name, members }: { name: string; members: string[] }) => {
      // First create the group
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .insert({ name, created_by: user!.id })
        .select()
        .single();

      if (groupError) throw groupError;

      // Then add members
      const memberInserts = members.map((userId) => ({
        group_id: group.id,
        user_id: userId,
      }));

      const { error: membersError } = await supabase
        .from("group_members")
        .insert(memberInserts);

      if (membersError) throw membersError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", user?.id] });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase
        .from("groups")
        .delete()
        .eq("id", groupId)
        .eq("created_by", user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", user?.id] });
    },
  });

  const addGroupMemberMutation = useMutation({
    mutationFn: async ({
      groupId,
      userId,
    }: {
      groupId: string;
      userId: string;
    }) => {
      const { error } = await supabase.from("group_members").insert({
        group_id: groupId,
        user_id: userId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", user?.id] });
    },
  });

  const removeGroupMemberMutation = useMutation({
    mutationFn: async ({
      groupId,
      userId,
    }: {
      groupId: string;
      userId: string;
    }) => {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", user?.id] });
    },
  });

  return {
    groups,
    isLoading,
    error: error?.message || null,
    createGroup: createGroupMutation.mutate,
    deleteGroup: deleteGroupMutation.mutate,
    addGroupMember: addGroupMemberMutation.mutate,
    removeGroupMember: removeGroupMemberMutation.mutate,
    searchUsers: searchUsersMutation.mutate,
    isCreatingGroup: createGroupMutation.isPending,
    isDeletingGroup: deleteGroupMutation.isPending,
    isAddingMember: addGroupMemberMutation.isPending,
    isRemovingMember: removeGroupMemberMutation.isPending,
    isSearchingUsers: searchUsersMutation.isPending,
    searchResults: searchUsersMutation.data || [],
  };
};
