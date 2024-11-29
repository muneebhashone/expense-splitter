import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useFriends = () => {
  const user = useUser();
  const queryClient = useQueryClient();

  const fetchFriends = async () => {
    const { data, error } = await supabase
      .from("friends")
      .select("name")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    return data.map((f) => f.name);
  };

  const { data: friends, isLoading: loading, error } = useQuery(
    ["friends", user?.id],
    fetchFriends,
    {
      enabled: !!user,
    }
  );

  const addFriendMutation = useMutation(
    async (name: string) => {
      const { error } = await supabase
        .from("friends")
        .insert({ user_id: user!.id, name });

      if (error) throw new Error(error.message);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["friends", user?.id]);
      },
    }
  );

  const deleteFriendMutation = useMutation(
    async (name: string) => {
      const { error } = await supabase
        .from("friends")
        .delete()
        .eq("user_id", user!.id)
        .eq("name", name);

      if (error) throw new Error(error.message);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["friends", user?.id]);
      },
    }
  );

  return {
    friends: friends || [],
    loading,
    error,
    addFriend: addFriendMutation.mutate,
    deleteFriend: deleteFriendMutation.mutate,
  };
};
