import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { User, Shield, ShieldAlert, Check, X, Link as LinkIcon, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import EcwidConnectionModal from '../components/EcwidConnectionModal';
import { useI18n } from '../contexts/I18nContext';


export default function AdminUsers() {
  const { t } = useI18n();

  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [managingConnectionFor, setManagingConnectionFor] = useState<any | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.data()?.role !== 'admin' && user.email?.toLowerCase() !== 'claudio@brignole.ch') {
          navigate('/');
          return;
        }

        const snapshot = await getDocs(collection(db, 'users'));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

  const toggleAdminRole = async (userId: string, currentRole: string) => {
    try {
      const newRole = currentRole === 'admin' ? 'artist' : 'admin';
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setMessage({ type: 'success', text: t('adminUsers.roleUpdated', { role: newRole }) });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error("Error updating role:", error);
      setMessage({ type: 'error', text: error.message || t('adminUsers.roleUpdateFailed') });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">{t('common.loading')}</div>;
  }

  return (
    <div className="w-full space-y-8 font-['Karla']">
      <header className="mb-10">
        <h1 className="text-4xl md:text-6xl font-['Shamgod'] leading-[0.8] tracking-tight text-[#121212] mb-4 uppercase">{t('adminUsers.title')}</h1>
        <p className="text-[#59554E] text-lg">{t('adminUsers.subtitle')}</p>
      </header>

      {message && (
        <div className={clsx(
          "p-4 rounded-2xl text-sm font-medium mb-4",
          message.type === 'success' ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"
        )}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-[#EAE3D9] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAE3D9] bg-[#F2EEE8]/50">
                <th className="p-4 text-xs font-bold text-[#59554E] uppercase tracking-wider">{t('adminUsers.user')}</th>
                <th className="p-4 text-xs font-bold text-[#59554E] uppercase tracking-wider">{t('adminUsers.contactInfo')}</th>
                <th className="p-4 text-xs font-bold text-[#59554E] uppercase tracking-wider">{t('adminUsers.bankDetails')}</th>
                <th className="p-4 text-xs font-bold text-[#59554E] uppercase tracking-wider">{t('adminUsers.role')}</th>
                <th className="p-4 text-xs font-bold text-[#59554E] uppercase tracking-wider text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE3D9]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#F2EEE8]/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                        {u.profilePictureUrl ? (
                          <img src={u.profilePictureUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-full h-full p-2 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-[#121212]">{u.fullName || `No ${t('adminUsers.name')}`}</p>
                        <p className="text-sm text-[#59554E]">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-[#121212]">{u.phone || t('adminUsers.noPhone')}</p>
                    <p className="text-xs text-[#59554E] truncate max-w-[200px]">{u.address || t('adminUsers.noAddress')}</p>
                  </td>
                  <td className="p-4">
                    {(u.role === 'admin' || u.email?.toLowerCase() === 'claudio@brignole.ch') ? (
                      <span className="text-sm text-gray-400 italic">{t('adminUsers.naAdmin')}</span>
                    ) : u.iban ? (
                      <div>
                        <p className="text-sm font-mono text-[#121212]">{u.iban}</p>
                        <p className="text-xs text-[#59554E]">{u.bic}</p>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic">{t('adminUsers.notProvided')}</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={clsx(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                      (u.role === 'admin' || u.email?.toLowerCase() === 'claudio@brignole.ch') ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {(u.role === 'admin' || u.email?.toLowerCase() === 'claudio@brignole.ch') ? t('adminUsers.admin') : (u.role || t('adminUsers.artist'))}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/admin/notify?userId=${u.id}`)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-[#EAE3D9] text-[#121212] hover:bg-[#D4C9B8] transition-all"
                      >
                        <Bell size={14} />
                        {t('adminUsers.notify')}
                      </button>
                      <button
                        onClick={() => setManagingConnectionFor(u)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-[#EAE3D9] text-[#121212] hover:bg-[#D4C9B8] transition-all"
                      >
                        <LinkIcon size={14} />
                        {t('adminUsers.ecwidConnection')}
                      </button>
                      {u.email?.toLowerCase() !== 'claudio@brignole.ch' && (
                        <button
                          onClick={() => toggleAdminRole(u.id, u.role)}
                          className={clsx(
                            "inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all",
                            u.role === 'admin' 
                              ? "bg-red-50 text-red-600 hover:bg-red-100" 
                              : "bg-[#121212] text-white hover:bg-black"
                          )}
                        >
                          {u.role === 'admin' ? (
                            <>
                              <ShieldAlert size={14} />
                              {t('adminUsers.removeAdmin')}
                            </>
                          ) : (
                            <>
                              <Shield size={14} />
                              {t('adminUsers.makeAdmin')}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#59554E]">
                    {t('adminUsers.noUsersFound')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {managingConnectionFor && (
        <EcwidConnectionModal
          user={managingConnectionFor}
          onClose={() => setManagingConnectionFor(null)}
          onSave={(userId, productIds) => {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, ecwidProductIds: productIds } : u));
            setManagingConnectionFor(null);
            setMessage({ type: 'success', text: t('adminUsers.ecwidSaved') });
            setTimeout(() => setMessage(null), 3000);
          }}
        />
      )}
    </div>
  );
}
