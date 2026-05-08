import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import clsx from 'clsx';
import { useI18n } from '../contexts/I18nContext';


interface ConnectionBannerProps {
  showWhenActive?: boolean;
}

export default function ConnectionBanner({ showWhenActive = false }: ConnectionBannerProps) {
  const { t } = useI18n();

  const { user } = useAuth();
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const data = userDoc.data();
        if (data) {
          setIsAdmin(data.role === 'admin' || user.email?.toLowerCase() === 'claudio@brignole.ch');
          setIsActive(data.ecwidProductIds && data.ecwidProductIds.length > 0);
        }
      } catch (error) {
        console.error("Error checking connection status:", error);
      }
    };
    checkConnection();
  }, [user]);

  if (isActive === null || isAdmin) return null;

  if (!isActive) {
    return (
      <div className="bg-amber-100 text-amber-900 px-6 py-4 rounded-2xl flex items-start gap-4 mb-8 border border-amber-200 shadow-sm">
        <AlertTriangle className="flex-shrink-0 mt-0.5 text-amber-600" size={24} />
        <div>
          <h3 className="font-bold text-lg mb-1">{t('connectionBanner.notActiveTitle')}</h3>
          <p className="text-amber-800">
            {t('connectionBanner.notActiveText')}
          </p>
        </div>
      </div>
    );
  }

  if (isActive && showWhenActive) {
    return (
      <div className="bg-emerald-50 text-emerald-900 px-6 py-4 rounded-2xl flex items-start gap-4 mb-8 border border-emerald-200 shadow-sm">
        <CheckCircle className="flex-shrink-0 mt-0.5 text-emerald-600" size={24} />
        <div>
          <h3 className="font-bold text-lg mb-1">{t('connectionBanner.activeTitle')}</h3>
          <p className="text-emerald-800">
            {t('connectionBanner.activeText')}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
