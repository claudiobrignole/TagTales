import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { isSuperAdminEmail } from '../constants/admin';

export function useIsAdmin(): { isAdmin: boolean; loading: boolean } {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      if (!user) {
        if (!cancelled) {
          setIsAdmin(false);
          setRoleLoading(false);
        }
        return;
      }

      if (isSuperAdminEmail(user.email)) {
        if (!cancelled) {
          setIsAdmin(true);
          setRoleLoading(false);
        }
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const role = userDoc.data()?.role;
        if (!cancelled) {
          setIsAdmin(role === 'admin');
          setRoleLoading(false);
        }
      } catch {
        if (!cancelled) {
          setIsAdmin(false);
          setRoleLoading(false);
        }
      }
    };

    if (!authLoading) {
      setRoleLoading(true);
      resolve();
    }

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return { isAdmin, loading: authLoading || roleLoading };
}
