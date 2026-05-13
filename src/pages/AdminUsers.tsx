import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, getDoc, deleteDoc, addDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { User, Shield, ShieldAlert, Check, X, Link as LinkIcon, Bell, Search, ArrowLeft, Save, ShoppingBag, Send, MessagesSquare, Trash2, Ban } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import EcwidConnectionModal from '../components/EcwidConnectionModal';
import { useI18n } from '../contexts/I18nContext';
import DirectChat from '../components/DirectChat';

export default function AdminUsers() {
  const { t } = useI18n();

  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [managingConnectionFor, setManagingConnectionFor] = useState<any | null>(null);

  // Layout State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(searchParams.get('chat'));
  const [showMobileList, setShowMobileList] = useState(!searchParams.get('chat'));

  // Notes state
  const [adminNotes, setAdminNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

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
        // Filter out deleted users and sort alphabetically
        setUsers(data.filter((u: any) => !u.isDeleted).sort((a:any, b:any) => (a.fullName || '').localeCompare(b.fullName || '')));
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user, navigate]);

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

  const toggleSuspendUser = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      setMessage({ type: 'success', text: `User ${newStatus === 'suspended' ? 'suspended' : 'activated'} successfully` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error("Error toggling suspend:", error);
      setMessage({ type: 'error', text: error.message || t('common.error') });
    }
  };

  const deleteUserRecord = async (userId: string) => {
    if (!window.confirm(t('adminUsers.crm.deleteConfirm') || "Sei sicuro di voler eliminare questo utente?")) return;
    try {
      // 1. Delete from users collection
      await deleteDoc(doc(db, 'users', userId));
      
      // 2. See if there is a 'scrittori' doc
      const qScrittori = query(collection(db, 'scrittori'), where('uid', '==', userId));
      const snScrittori = await getDocs(qScrittori);
      snScrittori.forEach(async (d) => {
         await deleteDoc(doc(db, 'scrittori', d.id));
      });

      setUsers(prev => prev.filter(u => u.id !== userId));
      if (selectedUserId === userId) setSelectedUserId(null);
      setMessage({ type: 'success', text: 'Utente eliminato con successo' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error("Error deleting user:", error);
      setMessage({ type: 'error', text: error.message || t('common.error') });
    }
  };

  const handleSelectUser = (id: string) => {
    setSelectedUserId(id);
    setShowMobileList(false);
    const u = users.find(x => x.id === id);
    if (u) {
      setAdminNotes(u.adminNotes || "");
    }
  };

  const saveAdminNotes = async () => {
    if (!selectedUserId) return;
    setSavingNotes(true);
    try {
      await updateDoc(doc(db, 'users', selectedUserId), { adminNotes });
      setUsers(prev => prev.map(u => u.id === selectedUserId ? { ...u, adminNotes } : u));
      setMessage({ type: 'success', text: t('adminUsers.crm.notesSaved') });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error("Error saving notes:", error);
      setMessage({ type: 'error', text: error.message || t('common.error') });
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">{t('common.loading')}</div>;
  }

  const selectedUser = users.find(u => u.id === selectedUserId);
  const filteredUsers = users.filter(u => 
    (u.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full space-y-8 font-['Karla']">
      <header className="mb-8">
        <h1 className="text-4xl md:text-6xl font-['Shamgod'] leading-[0.8] tracking-tight text-[#121212] mb-4 uppercase">{t('adminUsers.title')}</h1>
        <p className="text-[#59554E] text-lg">{t('adminUsers.crm.selectUserDesc')}</p>
      </header>

      {message && (
        <div className={clsx(
          "p-4 rounded-2xl text-sm font-medium mb-4 flex items-center gap-2",
          message.type === 'success' ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"
        )}>
          {message.text}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Left panel - List */}
        <div
          className={clsx(
            "w-full md:w-[320px] shrink-0 bg-white border border-[#EAE3D9] rounded-2xl flex flex-col overflow-hidden h-[700px]",
            !showMobileList && "hidden md:flex"
          )}
        >
          <div className="p-4 border-b border-[#EAE3D9]">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('adminUsers.crm.search')}
                className="w-full pl-10 pr-3 py-3 bg-[#F2EEE8] rounded-xl text-sm focus:outline-none"
              />
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#59554E]"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[#EAE3D9]">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-[#59554E]">{t('adminUsers.noUsersFound')}</div>
            ) : (
              filteredUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleSelectUser(u.id)}
                  className={clsx(
                    "w-full text-left p-4 hover:bg-[#F2EEE8] transition-colors flex items-center gap-3",
                    selectedUserId === u.id && "bg-[#F2EEE8]"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-[#EAE3D9] overflow-hidden flex-shrink-0">
                    {u.profilePictureUrl ? (
                      <img src={u.profilePictureUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-full h-full p-2 text-[#59554E]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                       <p className="font-bold text-[#121212] text-sm truncate">{u.fullName || `No ${t('adminUsers.name')}`}</p>
                       <div className="flex gap-1 shrink-0">
                         {u.role === 'admin' && <Shield size={12} className="text-purple-600" />}
                         {u.status === 'suspended' && <ShieldAlert size={12} className="text-red-600" />}
                       </div>
                    </div>
                    <p className="text-xs text-[#59554E] truncate">{u.email}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - CRM Info */}
        <div
          className={clsx(
            "flex-1 min-w-0 w-full transition-all duration-300",
            showMobileList && "hidden md:block" 
          )}
        >
          {selectedUser ? (
            <div className="bg-white p-6 rounded-2xl border border-[#EAE3D9] shadow-sm flex flex-col gap-8">
              <button
                type="button"
                onClick={() => setShowMobileList(true)}
                className="md:hidden flex items-center gap-2 mb-2 px-4 py-2 bg-[#F2EEE8] text-[#59554E] font-bold text-sm tracking-wider uppercase rounded-full w-fit hover:bg-[#EAE3D9] transition-colors"
              >
                <ArrowLeft size={16} /> {t('adminUsers.crm.backToList')}
              </button>

              {/* Master Header */}
              <div className="flex flex-col lg:flex-row gap-6 justify-between items-start">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-full bg-[#EAE3D9] overflow-hidden flex-shrink-0">
                    {selectedUser.profilePictureUrl ? (
                      <img src={selectedUser.profilePictureUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-full h-full p-4 text-[#59554E]" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold font-['Shamgod'] uppercase text-[#121212] leading-[0.8]">
                      {selectedUser.fullName || selectedUser.artistName || `No Name`}
                    </h2>
                    <p className="text-[#59554E] font-medium mt-1">{selectedUser.email}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                       <span className={clsx(
                        "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                        (selectedUser.role === 'admin' || selectedUser.email?.toLowerCase() === 'claudio@brignole.ch') ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {(selectedUser.role === 'admin' || selectedUser.email?.toLowerCase() === 'claudio@brignole.ch') ? t('adminUsers.admin') : (selectedUser.role || t('adminUsers.artist'))}
                      </span>
                      {selectedUser.status === 'suspended' && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-700">
                          {t('common.suspended', 'Sospeso')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => setManagingConnectionFor(selectedUser)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-[#F2EEE8] text-[#121212] hover:bg-[#EAE3D9] transition-all uppercase tracking-wider"
                  >
                    <ShoppingBag size={14} /> 
                  </button>
                  {selectedUser.email?.toLowerCase() !== 'claudio@brignole.ch' && (
                    <>
                      <button
                        onClick={() => toggleSuspendUser(selectedUser.id, selectedUser.status)}
                        className={clsx(
                          "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider",
                          selectedUser.status === 'suspended' ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-orange-50 text-orange-600 hover:bg-orange-100"
                        )}
                      >
                        {selectedUser.status === 'suspended' ? <Check size={14} /> : <Ban size={14} />} 
                      </button>
                      <button
                        onClick={() => toggleAdminRole(selectedUser.id, selectedUser.role)}
                        className={clsx(
                          "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider",
                          selectedUser.role === 'admin' 
                            ? "bg-[#EAE3D9] text-[#121212] hover:bg-[#D4C9B8]" 
                            : "bg-[#121212] text-white hover:bg-black"
                        )}
                      >
                        {selectedUser.role === 'admin' ? (
                          <ShieldAlert size={14} />
                        ) : (
                          <Shield size={14} />
                        )}
                      </button>
                      <button
                        onClick={() => deleteUserRecord(selectedUser.id)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-all uppercase tracking-wider"
                      >
                        <X size={14} /> 
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* CRM Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Dati Profilo */}
                <div>
                  <h3 className="text-lg font-bold font-['Shamgod'] uppercase border-b border-[#EAE3D9] pb-2 mb-4">
                    {t('adminUsers.contactInfo')}
                  </h3>
                  <div className="space-y-4 text-sm bg-[#F2EEE8]/30 p-4 rounded-xl border border-[#EAE3D9]">
                    <p className="flex flex-col"><span className="text-[#59554E] font-bold text-xs uppercase tracking-wider mb-1">Artist Name:</span> <span className="font-medium text-[#121212]">{selectedUser.artistName || '-'}</span></p>
                    <p className="flex flex-col"><span className="text-[#59554E] font-bold text-xs uppercase tracking-wider mb-1">Phone:</span> <span className="font-medium text-[#121212]">{selectedUser.phone || '-'}</span></p>
                    <p className="flex flex-col"><span className="text-[#59554E] font-bold text-xs uppercase tracking-wider mb-1">Address:</span> <span className="font-medium text-[#121212]">{selectedUser.address || '-'}</span></p>
                    <p className="flex flex-col"><span className="text-[#59554E] font-bold text-xs uppercase tracking-wider mb-1">City / Country:</span> <span className="font-medium text-[#121212]">{selectedUser.city || '-'}, {selectedUser.country || '-'}</span></p>
                    <p className="flex flex-col"><span className="text-[#59554E] font-bold text-xs uppercase tracking-wider mb-1">Instagram:</span> <span className="font-medium text-[#121212]">{selectedUser.instagram || '-'}</span></p>
                    <p className="flex flex-col"><span className="text-[#59554E] font-bold text-xs uppercase tracking-wider mb-1">Website:</span> <span className="font-medium text-[#121212]">{selectedUser.website || '-'}</span></p>
                    <div className="mt-4 pt-4 border-t border-[#EAE3D9]">
                      <span className="text-[#59554E] font-bold text-xs uppercase tracking-wider block mb-2">Bio:</span>
                      <p className="text-[#121212] leading-relaxed max-h-32 overflow-y-auto">{selectedUser.bio || t('adminUsers.notProvided')}</p>
                    </div>
                  </div>
                </div>

                {/* Dati Finanziari & Prodotti */}
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-bold font-['Shamgod'] uppercase border-b border-[#EAE3D9] pb-2 mb-4">
                      {t('adminUsers.crm.financials')}
                    </h3>
                    <div className="space-y-4 text-sm bg-[#F2EEE8]/30 p-4 rounded-xl border border-[#EAE3D9]">
                      <p className="flex flex-col"><span className="text-[#59554E] font-bold text-xs uppercase tracking-wider mb-1">IBAN:</span> <span className="font-mono text-[#121212]">{selectedUser.iban || '-'}</span></p>
                      <p className="flex flex-col"><span className="text-[#59554E] font-bold text-xs uppercase tracking-wider mb-1">BIC/SWIFT:</span> <span className="font-mono text-[#121212]">{selectedUser.bic || '-'}</span></p>
                      <p className="flex flex-col"><span className="text-[#59554E] font-bold text-xs uppercase tracking-wider mb-1">Bank Name:</span> <span className="font-medium text-[#121212]">{selectedUser.bankName || '-'}</span></p>
                      <p className="flex flex-col"><span className="text-[#59554E] font-bold text-xs uppercase tracking-wider mb-1">Account Holder:</span> <span className="font-medium text-[#121212]">{selectedUser.accountHolder || '-'}</span></p>
                      <p className="flex flex-col"><span className="text-[#59554E] font-bold text-xs uppercase tracking-wider mb-1">VAT Number:</span> <span className="font-medium text-[#121212]">{selectedUser.vatNumber || '-'}</span></p>
                    </div>
                  </div>

                  <div>
                     <h3 className="text-lg font-bold font-['Shamgod'] uppercase border-b border-[#EAE3D9] pb-2 mb-4">
                      {t('adminUsers.crm.salesAndProducts')}
                    </h3>
                    <div className="space-y-4 text-sm bg-[#F2EEE8]/30 p-4 rounded-xl border border-[#EAE3D9]">
                      <p className="flex items-center justify-between"><span className="text-[#59554E] font-bold uppercase tracking-wider">{t('adminUsers.crm.assignedProducts')}:</span> <span className="font-bold text-[#121212] text-base">{selectedUser.ecwidProductIds?.length || 0}</span></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="pt-4 border-t border-[#EAE3D9]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold font-['Shamgod'] uppercase">
                    {t('adminUsers.crm.adminNotes')}
                  </h3>
                  <button
                    onClick={saveAdminNotes}
                    disabled={savingNotes || adminNotes === selectedUser.adminNotes}
                    className="flex items-center gap-2 bg-[#FF4F00] text-white px-4 py-2 rounded-full font-bold uppercase tracking-wider text-xs hover:bg-[#e04600] disabled:opacity-50 disabled:bg-[#F2EEE8] disabled:text-[#59554E] transition-colors shadow-sm"
                  >
                    <Save size={14} />
                    {savingNotes ? t('common.loading') : t('common.save')}
                  </button>
                </div>
                <p className="text-sm text-[#59554E] mb-4">{t('adminUsers.crm.adminNotesDesc')}</p>
                <div className="relative">
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    onBlur={() => {
                      if (adminNotes !== selectedUser.adminNotes) {
                        saveAdminNotes();
                      }
                    }}
                    rows={6}
                    className="w-full p-4 border border-[#EAE3D9] rounded-xl bg-yellow-50 focus:outline-none flex-1 focus:border-yellow-400 focus:bg-yellow-100 transition-colors resize-y text-sm font-['Karla'] font-medium text-amber-900"
                    placeholder={t('adminUsers.crm.adminNotesPlaceholder')}
                  />
                  <div className="absolute top-4 right-4 opacity-10 pointer-events-none">
                     <Save size={40} className="text-amber-900"/>
                  </div>
                </div>
              </div>

              {/* Communications / Notifications */}
              <div className="pt-8 mt-8 border-t border-[#EAE3D9]">
                <h3 className="text-xl md:text-2xl font-bold font-['Shamgod'] uppercase mb-6 flex items-center gap-3 text-[#121212]">
                   <MessagesSquare size={24} className="text-[#FF4F00]" /> {t('adminUsers.crm.communications')}
                </h3>
                
                {user && (
                    <DirectChat 
                       userId={selectedUser.id} 
                       isAdmin={true} 
                       currentUserId={user.uid} 
                       recipientName={selectedUser.fullName || selectedUser.artistName || 'Utente'} 
                    />
                )}
              </div>

            </div>
          ) : (
            <div className="h-[700px] flex flex-col items-center justify-center bg-white border border-[#EAE3D9] rounded-2xl p-6 text-center text-[#59554E] shadow-sm">
              <User size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-bold font-['Shamgod'] uppercase text-[#121212]">
                {t('adminUsers.crm.selectUser')}
              </p>
              <p className="text-sm mt-2 max-w-sm">
                {t('adminUsers.crm.selectUserDesc')}
              </p>
            </div>
          )}
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


