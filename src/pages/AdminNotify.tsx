import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, getDocs, addDoc, where, writeBatch, doc, deleteDoc } from 'firebase/firestore';
import { Bell, Send, AlertCircle, Check, Search, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';

export default function AdminNotify() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const initialUserId = searchParams.get('userId');

  const [writers, setWriters] = useState<{ id: string; name: string; email: string; language: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [recipient, setRecipient] = useState(initialUserId || 'all');
  const [type, setType] = useState('General message');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sendEmail, setSendEmail] = useState(false);

  const [history, setHistory] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [historyLoading, setHistoryLoading] = useState(true);

  const notificationTypes = [
    t('adminNotify.contractSent'),
    t('adminNotify.productsConnected'),
    t('adminNotify.paymentProcessed'),
    t('adminNotify.actionRequired'),
    t('adminNotify.generalMessage')
  ];

  const fetchHistory = async () => {
    try {
      const q = query(collection(db, 'notifications'));
      const snapshot = await getDocs(q);
      const fetchedHistory = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setHistory(fetchedHistory);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'notifications');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    const fetchWriters = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', 'in', ['writer', 'artist', '']));
        const snapshot = await getDocs(q);
        const fetchedWriters = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().fullName || doc.data().email || 'Unknown',
          email: doc.data().email || '',
          language: doc.data().language || 'en'
        }));
        setWriters(fetchedWriters);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'users');
      } finally {
        setLoading(false);
      }
    };

    fetchWriters();
    fetchHistory();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError('Title and message are required.');
      return;
    }

    if (title.length > 60) {
      setError('Title must be 60 characters or less.');
      return;
    }

    if (message.length > 300) {
      setError('Message must be 300 characters or less.');
      return;
    }

    setSending(true);
    setError('');
    setSuccess('');

    try {
      const targetWriters = recipient === 'all' 
        ? writers 
        : writers.filter(a => a.id === recipient);

      if (targetWriters.length === 0) {
        throw new Error('No recipients found.');
      }

      const promises = targetWriters.map(async (writer) => {
        // Create Firestore notification
        try {
          await addDoc(collection(db, 'notifications'), {
            userId: writer.id,
            title: title.trim(),
            message: message.trim(),
            type,
            link: '#',
            read: false,
            createdAt: new Date().toISOString()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, 'notifications');
        }

        // Send email if requested
        if (sendEmail && writer.email) {
          try {
            await addDoc(collection(db, 'mail'), {
              to: writer.email,
              message: {
                subject: title.trim(),
                html: `<p>${message.trim()}</p>`
              },
              createdAt: new Date().toISOString()
            });
          } catch (emailErr) {
            console.error(`Failed to send email to ${writer.email}:`, emailErr);
            // We don't fail the whole process if just the email fails
          }
        }
      });

      await Promise.all(promises);

      const recipientName = recipient === 'all' 
        ? t('adminNotify.allWriters', 'Tutti i Writers') 
        : targetWriters[0]?.name || t('adminNotify.unknownWriter', 'Writer Sconosciuto');

      setSuccess(t('adminNotify.notificationSent', { name: recipientName }));
      setTitle('');
      setMessage('');
      
      // Refresh history
      fetchHistory();
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);

    } catch (err: any) {
      console.error("Error sending notification:", err);
      try {
        const errInfo = JSON.parse(err.message);
        setError(errInfo.error || 'Failed to send notification.');
      } catch (e) {
        setError(err.message || 'Failed to send notification.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (idsToDelete: string[]) => {
    if (!window.confirm(`Are you sure you want to delete ${idsToDelete.length} notification(s)?`)) return;
    
    try {
      const batch = writeBatch(db);
      idsToDelete.forEach(id => {
        batch.delete(doc(db, 'notifications', id));
      });
      await batch.commit();
      
      setHistory(prev => prev.filter(n => !idsToDelete.includes(n.id)));
      setSelectedIds([]);
      setSuccess(`Deleted ${idsToDelete.length} notification(s).`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'notifications');
    }
  };

  const filteredHistory = history.filter(notification => 
    notification.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notification.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notification.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 font-['Karla']">
      <header className="mb-8">
        <h1 className="text-4xl md:text-6xl font-['Shamgod'] leading-[0.8] tracking-tight text-[#121212] mb-4 uppercase">{t('adminNotify.title')}</h1>
        <p className="text-[#59554E] text-lg">{t('adminNotify.subtitle')}</p>
      </header>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-200">
          <AlertCircle size={20} />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-2xl flex items-center gap-3 border border-green-200">
          <Check size={20} />
          <p className="font-medium">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-sm border border-[#EAE3D9] space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#121212] uppercase tracking-wider">
              {t('adminNotify.recipient')}
            </label>
            <select
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl focus:ring-2 focus:ring-[#FF4F00] outline-none transition-shadow"
            >
              <option value="all">{t('adminNotify.allWriters', 'Tutti i Writers')}</option>
              {writers.map(writer => (
                <option key={writer.id} value={writer.id}>
                  {writer.name} ({writer.email}) - {writer.language.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#121212] uppercase tracking-wider">
              {t('adminNotify.type')}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl focus:ring-2 focus:ring-[#FF4F00] outline-none transition-shadow"
            >
              {notificationTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-bold text-[#121212] uppercase tracking-wider">
              {t('adminNotify.titleLabel')}
            </label>
            <span className={`text-xs ${title.length > 60 ? 'text-red-500 font-bold' : 'text-[#59554E]'}`}>
              {title.length}/60
            </span>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={60}
            placeholder={t('adminNotify.titlePlaceholder')}
            className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl focus:ring-2 focus:ring-[#FF4F00] outline-none transition-shadow"
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-bold text-[#121212] uppercase tracking-wider">
              {t('adminNotify.messageLabel')}
            </label>
            <span className={`text-xs ${message.length > 300 ? 'text-red-500 font-bold' : 'text-[#59554E]'}`}>
              {message.length}/300
            </span>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={300}
            rows={4}
            placeholder={t('adminNotify.messagePlaceholder')}
            className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl focus:ring-2 focus:ring-[#FF4F00] outline-none transition-shadow resize-none"
            required
          />
        </div>

        <div className="flex items-center gap-3 p-4 bg-[#F2EEE8]/50 rounded-2xl border border-[#EAE3D9]">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              id="sendEmail"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="sr-only"
            />
            <div 
              className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${sendEmail ? 'bg-[#FF4F00]' : 'bg-gray-300'}`}
              onClick={() => setSendEmail(!sendEmail)}
            >
              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${sendEmail ? 'transform translate-x-5' : ''}`} />
            </div>
          </div>
          <label htmlFor="sendEmail" className="text-sm font-bold text-[#121212] cursor-pointer select-none">
            {t('adminNotify.sendAlsoByEmail')}
          </label>
        </div>

        <div className="pt-4 border-t border-[#EAE3D9]">
          <button
            type="submit"
            disabled={sending || title.length > 60 || message.length > 300}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#121212] text-white font-bold py-4 px-8 rounded-full hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={20} />
            )}
            <span>{sending ? t('adminNotify.sending') : t('adminNotify.sendNotification')}</span>
          </button>
        </div>
      </form>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#EAE3D9] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-[#121212]">{t('adminNotify.historyTitle')}</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A39E93]" size={20} />
              <input
                type="text"
                placeholder={t('adminNotify.searchHistory')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-[#F2EEE8] border-none rounded-xl focus:ring-2 focus:ring-[#FF4F00] outline-none transition-shadow w-full sm:w-64"
              />
            </div>
            {selectedIds.length > 0 && (
              <button
                onClick={() => handleDelete(selectedIds)}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium"
              >
                <Trash2 size={18} />
                {t('adminNotify.delete')} ({selectedIds.length})
              </button>
            )}
            {history.length > 0 && selectedIds.length === 0 && (
              <button
                onClick={() => handleDelete(history.map(h => h.id))}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium"
              >
                <Trash2 size={18} />
                {t('adminNotify.deleteAll')}
              </button>
            )}
          </div>
        </div>

        {historyLoading ? (
          <div className="py-8 text-center text-[#59554E]">{t('common.loading')}</div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-8 text-center text-[#59554E]">
            {searchQuery ? t('adminNotify.noHistoryMatch') : t('adminNotify.noHistoryYet')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EAE3D9]">
                  <th className="p-4 w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredHistory.length && filteredHistory.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(filteredHistory.map(h => h.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                      className="w-4 h-4 rounded border-[#D8D0C5] text-[#FF4F00] focus:ring-[#FF4F00]"
                    />
                  </th>
                  <th className="p-4 text-xs font-bold text-[#A39E93] uppercase tracking-wider">{t('common.date')}</th>
                  <th className="p-4 text-xs font-bold text-[#A39E93] uppercase tracking-wider">{t('adminNotify.recipient')}</th>
                  <th className="p-4 text-xs font-bold text-[#A39E93] uppercase tracking-wider">{t('adminNotify.type')}</th>
                  <th className="p-4 text-xs font-bold text-[#A39E93] uppercase tracking-wider">{t('adminNotify.titleLabel')}</th>
                  <th className="p-4 text-xs font-bold text-[#A39E93] uppercase tracking-wider">{t('common.status')}</th>
                  <th className="p-4 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((notification) => {
                  const writer = writers.find(a => a.id === notification.userId);
                  const recipientName = writer ? writer.name : 'Unknown Writer';
                  
                  return (
                    <tr key={notification.id} className="border-b border-[#EAE3D9] hover:bg-[#F2EEE8]/50 transition-colors">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(notification.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(prev => [...prev, notification.id]);
                            } else {
                              setSelectedIds(prev => prev.filter(id => id !== notification.id));
                            }
                          }}
                          className="w-4 h-4 rounded border-[#D8D0C5] text-[#FF4F00] focus:ring-[#FF4F00]"
                        />
                      </td>
                      <td className="p-4 text-sm text-[#59554E] whitespace-nowrap">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-sm font-medium text-[#121212]">
                        {recipientName}
                      </td>
                      <td className="p-4 text-sm text-[#59554E]">
                        {notification.type}
                      </td>
                      <td className="p-4 text-sm text-[#121212]">
                        {notification.title}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          notification.read ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {notification.read ? t('adminNotify.read') : t('adminNotify.unread')}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleDelete([notification.id])}
                          className="text-[#A39E93] hover:text-red-600 transition-colors"
                          title={t('adminNotify.delete')}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
