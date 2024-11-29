import { useUser } from "@supabase/auth-helpers-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export const useFriends = () => {
  const user = useUser();
  const queryClient = useQueryClient();

  const { data: friends = [], isLoading, error } = useQuery({
    queryKey: ["friends", user?.id],
    queryFn: async () => {
      const { data, error: friendsError } = await supabase
        .from("friends")
        .select("name")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true });

      if (friendsError) throw friendsError;
      return data.map((f) => f.name);
    },
    enabled: !!user,
  });

  const addFriendMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase
        .from("friends")
        .insert({ user_id: user!.id, name });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends", user?.id] });
    },
  });

  const deleteFriendMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase
        .from("friends")
        .delete()
        .eq("user_id", user!.id)
        .eq("name", name);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends", user?.id] });
    },
  });

  return {
    friends,
    isLoading,
    error: error?.message || null,
    addFriend: addFriendMutation.mutate,
    deleteFriend: deleteFriendMutation.mutate,
    isAddingFriend: addFriendMutation.isPending,
    isDeletingFriend: deleteFriendMutation.isPending,
  };
};
