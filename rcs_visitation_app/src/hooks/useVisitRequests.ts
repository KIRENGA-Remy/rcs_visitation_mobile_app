import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { visitRequestsApi } from '@api/visitRequests';
import { QUERY_KEYS } from '@constants';
import type { CreateVisitRequestDto } from '@types';

export const useMyRequests = (params?: { status?: string; page?: number }) =>
  useQuery({
    queryKey: [...QUERY_KEYS.MY_REQUESTS, params],
    queryFn: () => visitRequestsApi.myRequests(params),
    staleTime: 30 * 1000,
  });

export const useVisitRequest = (id: string) =>
  useQuery({
    queryKey: QUERY_KEYS.VISIT_REQUEST(id),
    queryFn: () => visitRequestsApi.get(id),
    enabled: !!id,
  });

export const usePrisonRequests = (prisonId: string, params?: { status?: string; page?: number }) =>
  useQuery({
    queryKey: [...QUERY_KEYS.PRISON_REQUESTS(prisonId), params],
    queryFn: () => visitRequestsApi.byPrison(prisonId, params),
    enabled: !!prisonId,
    staleTime: 30 * 1000,
  });

export const useCreateVisitRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateVisitRequestDto) => visitRequestsApi.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.MY_REQUESTS }),
  });
};

export const useProcessRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, rejectionReason }: { id: string; action: 'APPROVE' | 'REJECT'; rejectionReason?: string }) =>
      visitRequestsApi.process(id, { action, rejectionReason }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.VISIT_REQUEST(vars.id) });
      qc.invalidateQueries({ queryKey: ['visit-requests', 'prison'] });
    },
  });
};

export const useCancelRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      visitRequestsApi.cancel(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.MY_REQUESTS });
    },
  });
};
