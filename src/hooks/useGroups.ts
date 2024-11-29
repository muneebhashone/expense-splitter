import { useUser } from "@supabase/auth-helpers-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Group, User } from "@/types";

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
          group_members!inner (
            users!inner (
              id,
              email,
              username
            )
          )
        `)
        .eq("created_by", user!.id);

      if (groupsError) throw groupsError;

      return groupsData.map((group) => ({
        ...group,
        members: group.group_members.map((member) => ({
          id: member.users.id,
          email: member.users.email,
          username: member.users.username
        }))
      })) as Group[];
    },
    enabled: !!user,
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
    isCreatingGroup: createGroupMutation.isPending,
    isDeletingGroup: deleteGroupMutation.isPending,
    isAddingMember: addGroupMemberMutation.isPending,
    isRemovingMember: removeGroupMemberMutation.isPending,
  };
};
