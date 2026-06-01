import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsApi } from '@/api/posts';

export function usePosts(params = {}) {
  return useQuery({
    queryKey: ['posts', params],
    queryFn: () => postsApi.list(params),
  });
}

export function usePublishedPosts() {
  return useQuery({
    queryKey: ['posts', { status: 'published' }],
    queryFn: () => postsApi.list({ status: 'published' }),
  });
}

export function usePostMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['posts'] });

  const create = useMutation({ mutationFn: postsApi.create, onSuccess: invalidate });
  const update = useMutation({ mutationFn: ({ id, data }) => postsApi.update(id, data), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: postsApi.delete, onSuccess: invalidate });

  return { create, update, remove };
}
