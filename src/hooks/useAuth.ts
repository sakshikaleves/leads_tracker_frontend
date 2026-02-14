import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { useAuthStore } from '../store/authStore';

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (response) => {
      const { userId, name, email, phoneNumber, token } = response.data;
      setAuth({ userId, name: name || '', email, phoneNumber, createdAt: '' }, token);
      navigate('/');
    },
  });
}

export function useRegister() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({
      name,
      email,
      password,
      phoneNumber,
    }: {
      name: string;
      email: string;
      password: string;
      phoneNumber?: string;
    }) => authApi.register(name, email, password, phoneNumber),
    onSuccess: (response) => {
      const { userId, name, email, phoneNumber, token } = response.data;
      setAuth({ userId, name, email, phoneNumber, createdAt: '' }, token);
      navigate('/');
    },
  });
}

export function useCurrentUser() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authApi.getMe(),
    enabled: isAuthenticated,
  });
}

export function useLogout() {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  return () => {
    logout();
    navigate('/login');
  };
}
