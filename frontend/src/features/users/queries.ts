/**
 * Users React Query Hooks
 *
 * Connects the users admin UI to `users-api.ts`.
 *
 * Data flow:
 * - useUsers: GET /api/v1/users → renders user list
 * - useCreateUser: POST /api/v1/users → optimistically updates cache, then revalidates
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { AdminUpdateUserRequest, AuthUser } from "@/lib/types";

import { createUser, deactivateUser, fetchUsers, updateUser } from "./users-api";

/**
 * Load the full user list for the admin users page.
 *
 * @returns React Query result with `data: AuthUser[]`
 */
export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });
}

/**
 * Mutation hook for creating a new user.
 *
 * On success:
 * 1. Prepends the new user to the cached list (instant UI feedback)
 * 2. Invalidates `["users"]` so the list refetches from the server
 */
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

/**
 * Mutation hook for updating an existing user.
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: number; payload: AdminUpdateUserRequest }) =>
      updateUser(userId, payload),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData<AuthUser[]>(["users"], (prev) =>
        (prev ?? []).map((u) => (u.id === updatedUser.id ? updatedUser : u))
      );
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

/**
 * Mutation hook for deactivating a user account.
 */
export function useDeactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deactivateUser,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData<AuthUser[]>(["users"], (prev) =>
        (prev ?? []).map((u) => (u.id === updatedUser.id ? updatedUser : u))
      );
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
