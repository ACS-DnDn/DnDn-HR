import { useState, useEffect } from 'react';

export interface Session {
  username: string;
  email: string;
  accessToken: string;
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const username = localStorage.getItem('username');
    const email = localStorage.getItem('email');
    if (token && username) {
      setSession({ accessToken: token, username, email: email ?? '' });
    }
  }, []);

  const clear = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    setSession(null);
  };

  return { session, setSession, clear };
}
