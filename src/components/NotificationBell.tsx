import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { collection, query, where, onSnapshot, getDocs, doc, setDoc, deleteDoc } from '../lib/db';
import { db } from '../lib/db';

export default function NotificationBell({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;

    const q = query(collection(db, 'notifications'), where('userId', 'in', [userId, 'all']));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      notifs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    }, (err) => {
      console.error("Failed to fetch notifications", err);
    });

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await setDoc(doc(db, 'notifications', id), { read: true }, { merge: true });
    } catch (e) {
      console.error("Failed to mark as read", e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await Promise.all(
        notifications
          .filter(n => !n.read)
          .map(n => setDoc(doc(db, 'notifications', n.id), { read: true }, { merge: true }))
      );
    } catch (e) {
      console.error("Failed to mark all as read", e);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (e) {
      console.error("Failed to delete notification", e);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-full bg-[var(--bg-app)] border border-[var(--border-subtle)] text-muted hover:text-[var(--text-main)] hover:border-[var(--border-strong)] transition-all shadow-sm relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-[var(--bg-card)] translate-x-1/4 -translate-y-1/4">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[var(--bg-card)] rounded-xl shadow-lg border border-[var(--border-subtle)] overflow-hidden z-50">
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-app)]">
            <h3 className="font-bold text-[var(--text-main)]">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-muted text-sm">
                No notifications yet.
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    className={`p-4 transition-colors hover:bg-[var(--bg-app)] flex gap-3 ${!notif.read ? 'bg-blue-50/50 dark:bg-blue-500/5' : ''}`}
                  >
                    <div className="flex-1">
                      <p className={`text-sm ${!notif.read ? 'font-bold text-[var(--text-main)]' : 'font-medium text-[var(--text-main)]'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-muted mt-1">{notif.message}</p>
                      <p className="text-[10px] text-muted mt-2 font-medium">
                        {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : 'Just now'}
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      {!notif.read && (
                        <button 
                          onClick={() => markAsRead(notif.id)}
                          className="text-blue-500 hover:text-blue-600 p-1"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => deleteNotification(notif.id)}
                        className="text-muted hover:text-red-500 p-1 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}