import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { RootState } from '@/store';
import { loginSuccess, logout, updateUser } from '@/store/slices/authSlice';

interface User {
  id: string;
  walletAddress: string;
  did?: string;
  name?: string;
  email?: string;
  phone?: string;
  role: 'farmer' | 'lender' | 'admin' | 'coop';
  profileComplete: boolean;
}

export function useAuth() {
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);

  const login = useCallback((user: User, token: string) => {
    dispatch(loginSuccess({ user, token }));
  }, [dispatch]);

  const logoutUser = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  const updateUserProfile = useCallback((updates: Partial<User>) => {
    dispatch(updateUser(updates));
  }, [dispatch]);

  return {
    user: auth.user,
    token: auth.token,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    error: auth.error,
    login,
    logout: logoutUser,
    updateUser: updateUserProfile,
  };
}