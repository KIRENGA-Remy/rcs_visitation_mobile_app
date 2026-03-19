import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@stores/authStore';
import { authApi } from '@api/auth';
import { QUERY_KEYS } from '@constants';
import type { LoginDto, RegisterDto } from '@types';

export const useLogin = () => {
  const { setAuth } = useAuthStore();
  return useMutation({
    mutationFn: (dto: LoginDto) => authApi.login(dto),
    onSuccess: (data) => setAuth(data.user, data.accessToken, data.refreshToken),
  });
};

export const useRegister = () => {
  const { setAuth } = useAuthStore();
  return useMutation({
    mutationFn: (dto: RegisterDto) => authApi.register(dto),
    onSuccess: (data) => setAuth(data.user, data.accessToken, data.refreshToken),
  });
};

export const useMe = () => {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: QUERY_KEYS.ME,
    queryFn: authApi.getMe,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
};

export const useLogout = () => {
  const { clearAuth } = useAuthStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      clearAuth();
      qc.clear();
    },
  });
};
