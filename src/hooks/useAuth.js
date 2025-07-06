import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContextType.js';

export const useAuth = () => {
  return useContext(AuthContext);
};
