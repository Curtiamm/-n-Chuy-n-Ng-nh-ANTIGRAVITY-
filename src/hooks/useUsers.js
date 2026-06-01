import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/api/users';

export function useUsers(enabled = false) {
  return useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
    enabled,
  });
}

export function useUserMutations() {
  const qc = useQueryClient();

  const updateRole = useMutation({
    mutationFn: ({ id, role }) => usersApi.updateRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  return { updateRole };
}
