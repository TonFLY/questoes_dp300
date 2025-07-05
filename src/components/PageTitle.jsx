import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export function PageTitle({ title }) {
  const { currentUser } = useAuth();
  
  useEffect(() => {
    if (currentUser && title) {
      document.title = title;
    } else {
      document.title = 'Sistema Interno';
    }
    
    // Cleanup: volta ao título genérico quando sair da página
    return () => {
      document.title = 'Sistema Interno';
    };
  }, [currentUser, title]);
  
  return null;
}
