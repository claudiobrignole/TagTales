import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { collection, query, where, orderBy, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useI18n } from '../contexts/I18nContext';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  id: string;
  senderId: string;
  isFromUser: boolean;
  message: string;
  createdAt: string;
  read: boolean;
}

interface DirectChatProps {
  userId: string;
  isAdmin: boolean;
  currentUserId: string;
  recipientName?: string;
}

export default function DirectChat({ userId, isAdmin, currentUserId, recipientName }: DirectChatProps) {
  const { t } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;

    // Use "notifications" collection to store messages
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('type', '==', 'Message'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      setMessages(data);
      setLoading(false);

      // Mark as read
      snapshot.docs.forEach(d => {
        const msg = d.data() as ChatMessage;
        if (!msg.read && ((isAdmin && msg.isFromUser) || (!isAdmin && !msg.isFromUser))) {
          updateDoc(doc(db, 'notifications', d.id), { read: true }).catch(console.error);
        }
      });
    }, (error) => {
      console.error("Error fetching chat messages:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, isAdmin]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentUserId) return;

    setSending(true);
    try {
      const now = new Date().toISOString();
      const messageText = input.trim();
      
      // The core chat document
      await addDoc(collection(db, 'notifications'), {
        userId: userId, // Always the writer's ID to keep the chat scoped
        senderId: currentUserId,
        isFromUser: !isAdmin,
        title: isAdmin ? 'Messaggio da Amministrazione' : 'Messaggio da ' + (recipientName || 'Writer'),
        message: messageText,
        type: 'Message',
        link: isAdmin ? '#' : '/app/dashboard', // Writer sees a link to dashboard for the chat
        read: false, // Who should read this? This should probably only trigger visual "unread" state in Writer's dropdown if admin sent it
        createdAt: now
      });

      // If a writer is sending this, create an alert for admins
      if (!isAdmin) {
        // Here we notify the main admin or any admin
        // For simplicity, we add it to a generic 'admin' userId
        // Or we notify claudio@brignole.ch
        import('firebase/firestore').then(async ({ getDocs, query, collection, where }) => {
          const adminsSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));
          const claudioSnapshot = await getDocs(query(collection(db, 'users'), where('email', '==', 'claudio@brignole.ch')));
          
          const adminIds = new Set<string>();
          adminsSnapshot.forEach(doc => adminIds.add(doc.id));
          claudioSnapshot.forEach(doc => adminIds.add(doc.id));

          adminIds.forEach(adminId => {
             addDoc(collection(db, 'notifications'), {
               userId: adminId, // Target this to the admin's dropdown
               title: 'Nuovo messaggio in chat da ' + (recipientName || 'Writer'),
               message: messageText,
               type: 'MessageAlert', // Different type so it doesn't show in the admin's own DirectChat window
               link: `/app/admin/users?chat=${userId}`, // Link to admin users panel highlighting specific writer
               read: false,
               createdAt: now
             });
          });
        });
      }

      setInput('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[400px] w-full bg-white rounded-3xl border border-[#EAE3D9] overflow-hidden shadow-sm">
      <div className="p-4 bg-[#121212] text-white shrink-0 flex items-center justify-between">
         <h3 className="font-bold font-['Shamgod'] uppercase text-[25px] leading-none">
           {isAdmin ? `Chat con ${recipientName || 'Writer'}` : 'Chat con l\'Amministrazione'}
         </h3>
      </div>
      
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8F6F3]">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-5 h-5 animate-spin text-[#FF4F00]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-[#A39E93] text-sm">
            Nessun messaggio. Scrivi qualcosa per iniziare.
          </div>
        ) : (
          messages.map((msg) => {
            // Se sono admin e isFromUser -> true: è dell'utente, mostro a sx. false: è mio, mostro a dx
            // Se non sono admin e isFromUser -> true: è mio, mostro a dx. false: è dell'admin, mostro a sx
            const isMine = isAdmin ? !msg.isFromUser : msg.isFromUser;

            return (
              <div
                key={msg.id}
                className={clsx(
                  "max-w-[85%] rounded-2xl p-4 font-['Karla'] text-[15px] leading-relaxed relative",
                  isMine 
                    ? "ml-auto bg-[#EAE3D9] text-[#121212] rounded-br-sm" 
                    : "mr-auto bg-white text-[#121212] border border-[#EAE3D9] rounded-bl-sm"
                )}
              >
                <div className="whitespace-pre-wrap">{msg.message}</div>
                <div className={clsx(
                  "text-[10px] mt-2 opacity-60 flex justify-end font-bold uppercase tracking-wider",
                  isMine ? "text-[#59554E]" : "text-[#A39E93]"
                )}>
                   {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 bg-white border-t border-[#EAE3D9] shrink-0">
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
            className="flex-1 bg-[#F8F6F3] border-none rounded-full px-6 py-4 font-['Karla'] text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none placeholder:text-[#121212]/50 text-base"
            placeholder="Scrivi un messaggio..."
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="p-4 bg-[#FF4F00] text-white rounded-full hover:bg-black transition-colors disabled:opacity-50 disabled:bg-[#121212]"
          >
            {sending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
          </button>
        </form>
      </div>
    </div>
  );
}
