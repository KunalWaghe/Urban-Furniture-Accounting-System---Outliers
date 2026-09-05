import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { AuthUser } from "@/lib/types";

import { createUser, fetchUsers } from "./users-api";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: (createdUser) => {
      // Prepend instantly, then revalidate from the server.
      queryClient.setQueryData<AuthUser[]>(["users"], (prev) => [
        createdUser,
        ...(prev ?? []),
      ]);
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
