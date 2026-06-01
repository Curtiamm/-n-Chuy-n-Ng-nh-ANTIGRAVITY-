import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { majorsApi } from '@/api/majors';

export function useMajors(params = {}) {
  return useQuery({
    queryKey: ['majors', params],
    queryFn: () => majorsApi.list(params),
  });
}

export function useMajorMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['majors'] });

  const create = useMutation({ mutationFn: majorsApi.create, onSuccess: invalidate });
  const update = useMutation({ mutationFn: ({ id, data }) => majorsApi.update(id, data), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: majorsApi.delete, onSuccess: invalidate });

  return { create, update, remove };
}
