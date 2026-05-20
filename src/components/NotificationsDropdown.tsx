import React, { useState, useEffect, useRef } from 'react';
import { Mail, Trash2, X, Send } from 'lucide-react';
import { collection, query, where, orderBy, limit, onSnapshot, updateDoc, doc, deleteDoc, writeBatch, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link: string;
  read: boolean;
  createdAt: string;
}

import { useI18n } from '../contexts/I18nContext';
import { it, enUS } from 'date-fns/locale';

export default function NotificationsDropdown() {
  const { t, language } = useI18n();
  const locale = language === 'IT' ? it : enUS;
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [newMessageText, setNewMessageText] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(notifs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'notifications');
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await updateDoc(doc(db, 'notifications', notification.id), { read: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `notifications/${notification.id}`);
      }
    }
    setSelectedNotification(notification);
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
      setNotificationToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `notifications/${id}`);
    }
  };

  const handleClearAll = async () => {
    if (notifications.length === 0) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach((n) => {
        batch.delete(doc(db, 'notifications', n.id));
      });
      await batch.commit();
      setShowClearAllConfirm(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'notifications');
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-[#59554E] hover:bg-[#EAE3D9] rounded-full transition-all"
        >
          <Mail size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-[#FF4F00] rounded-full ring-2 ring-[#F2EEE8]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="fixed sm:absolute top-20 sm:top-auto right-[25px] left-[25px] sm:left-auto sm:right-0 mt-2 sm:w-80 bg-white rounded-2xl shadow-xl border border-[#121212]/5 overflow-hidden z-50">
            <div className="p-4 border-b border-[#121212]/5 flex justify-between items-center bg-[#F2EEE8]/30">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[#121212]">{t('notifications.title')}</h3>
                {unreadCount > 0 && (
                  <span className="text-xs text-[#FF4F00] font-medium">{t('notifications.unread', { count: unreadCount })}</span>
                )}
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={() => setShowClearAllConfirm(true)}
                  className="text-xs font-bold text-[#59554E] hover:text-[#FF4F00] transition-colors"
                >
                  {t('notifications.clearAll')}
                </button>
              )}
            </div>
            
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-[#59554E] text-sm">
                  {t('notifications.noNotifications')}
                </div>
              ) : (
                <div className="divide-y divide-[#121212]/5">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`w-full text-left p-4 hover:bg-[#F2EEE8]/50 transition-colors relative group ${!notification.read ? 'bg-[#FF4F00]/5' : ''}`}
                    >
                      <button
                        onClick={() => handleNotificationClick(notification)}
                        className="w-full text-left pr-6"
                      >
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h4 className={`text-sm font-semibold ${!notification.read ? 'text-[#121212]' : 'text-[#59554E]'}`}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-[#FF4F00] flex-shrink-0 mt-1.5"></span>
                          )}
                        </div>
                        <p className="text-xs text-[#59554E] line-clamp-2 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-[#59554E] uppercase tracking-wider font-medium">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale })}
                          </span>
                          <span className="text-[10px] font-bold text-[#FF4F00] opacity-0 group-hover:opacity-100 transition-opacity">
                            {t('notifications.readMore')}
                          </span>
                        </div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setNotificationToDelete(notification.id);
                        }}
                        className="absolute top-4 right-4 text-[#59554E] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title={t('notifications.delete')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notification Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-[#EAE3D9] flex justify-between items-start bg-[#F2EEE8]/30">
              <div>
                <span className="inline-block px-2 py-1 bg-[#121212] text-white text-[10px] font-bold uppercase tracking-wider rounded-full mb-2">
                  {selectedNotification.type || t('notifications.modalTitle')}
                </span>
                <h2 className="text-xl font-bold text-[#121212]">{selectedNotification.title}</h2>
              </div>
              <button
                onClick={() => setSelectedNotification(null)}
                className="p-2 text-[#59554E] hover:bg-[#EAE3D9] rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-[#59554E] whitespace-pre-wrap mb-6">
                {selectedNotification.message}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#59554E] font-medium">
                  {format(new Date(selectedNotification.createdAt), 'PPpp', { locale })}
                </span>
              </div>
            </div>
            <div className="p-4 border-t border-[#EAE3D9] bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedNotification(null)}
                className="px-6 py-2 bg-[#121212] text-white text-sm font-bold rounded-full hover:bg-black transition-colors"
              >
                {t('notifications.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Notification Confirm Modal */}
      {notificationToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <h3 className="text-lg font-bold text-[#121212] mb-6">{t('notifications.deleteConfirm')}</h3>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => handleDeleteNotification(notificationToDelete)}
                  className="px-6 py-2 bg-red-500 text-white text-sm font-bold rounded-full hover:bg-red-600 transition-colors"
                >
                  {t('notifications.yes')}
                </button>
                <button
                  onClick={() => setNotificationToDelete(null)}
                  className="px-6 py-2 bg-[#EAE3D9] text-[#121212] text-sm font-bold rounded-full hover:bg-[#D8D0C5] transition-colors"
                >
                  {t('notifications.no')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Notifications Confirm Modal */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <h3 className="text-lg font-bold text-[#121212] mb-6">{t('notifications.clearAllConfirm')}</h3>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleClearAll}
                  className="px-6 py-2 bg-red-500 text-white text-sm font-bold rounded-full hover:bg-red-600 transition-colors"
                >
                  {t('notifications.yes')}
                </button>
                <button
                  onClick={() => setShowClearAllConfirm(false)}
                  className="px-6 py-2 bg-[#EAE3D9] text-[#121212] text-sm font-bold rounded-full hover:bg-[#D8D0C5] transition-colors"
                >
                  {t('notifications.no')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
