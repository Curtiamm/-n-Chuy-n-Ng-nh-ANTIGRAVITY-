import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { faqsApi } from '@/api/faqs';

export function useFAQs(params = {}) {
  return useQuery({
    queryKey: ['faqs', params],
    queryFn: () => faqsApi.list(params),
  });
}

export function useFAQMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['faqs'] });

  const create = useMutation({ mutationFn: faqsApi.create, onSuccess: invalidate });
  const update = useMutation({ mutationFn: ({ id, data }) => faqsApi.update(id, data), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: faqsApi.delete, onSuccess: invalidate });

  return { create, update, remove };
}
