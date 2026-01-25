import { useAuthContext } from './useAuthContext';

export const useAuth = () => {
  const context = useAuthContext();
  return context;
};
