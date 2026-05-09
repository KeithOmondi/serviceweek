import { type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';

// dispatch from Redux's configureStore is a stable reference — no ref needed.
export const useAppDispatch = (): AppDispatch => useDispatch<AppDispatch>();

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Custom Auth Hook for easy access
export const useAuth = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  return { user, isAuthenticated, isDr: user?.role === 'dr', isAdmin: user?.role === 'admin' };
};