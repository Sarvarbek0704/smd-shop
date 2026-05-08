import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllReadMutation,
} from '@/store/api/notificationsApi';
import {
  Bell,
  ChevronRight,
  Loader2,
  CheckCheck,
  Package,
  Star,
  Megaphone,
  AlertCircle,
  MessageCircle,
} from 'lucide-react';

const TYPE_CONFIG: Record<string, { icon: any; color: string }> = {
  order_status: { icon: Package, color: 'bg-blue-100 text-blue-600' },
  review: { icon: Star, color: 'bg-amber-100 text-amber-600' },
  promo: { icon: Megaphone, color: 'bg-emerald-100 text-emerald-600' },
  system: { icon: AlertCircle, color: 'bg-stone-100 text-stone-600' },
  chat: { icon: MessageCircle, color: 'bg-violet-100 text-violet-600' },
};

export function NotificationsPage() {
  const { data, isLoading } = useGetNotificationsQuery({ limit: 50 });
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllRead, { isLoading: markingAll }] = useMarkAllReadMutation();

  const notifications = data?.data ?? [];
  const hasUnread = notifications.some((n: any) => !n.isRead);

  const handleMarkRead = async (id: string) => {
    try {
      await markAsRead(id).unwrap();
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead().unwrap();
    } catch {}
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Hozirgina';
    if (mins < 60) return `${mins} daqiqa oldin`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} soat oldin`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} kun oldin`;
    return d.toLocaleDateString('uz-UZ');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 text-slate-400 animate-spin" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-slate-900">Bosh sahifa</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-medium">Bildirishnomalar</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Bildirishnomalar</h1>
        {hasUnread && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="text-sm text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1.5 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Hammasini o'qilgan qilish
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-stone-100 rounded-2xl flex items-center justify-center mb-5">
            <Bell className="w-10 h-10 text-stone-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Bildirishnomalar yo'q</h2>
          <p className="text-slate-500 text-sm">Yangi xabarlar bu yerda ko'rinadi</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {notifications.map((notif: any) => {
              const config = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system;
              const Icon = config.icon;

              return (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`relative bg-white border rounded-xl p-4 flex gap-3.5 transition-all cursor-pointer hover:shadow-sm ${
                    notif.isRead
                      ? 'border-stone-100'
                      : 'border-stone-200 bg-stone-50/50'
                  }`}
                  onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                >
                  {/* Unread dot */}
                  {!notif.isRead && (
                    <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-slate-900 rounded-full" />
                  )}

                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug mb-0.5 ${notif.isRead ? 'text-slate-600' : 'text-slate-900 font-semibold'}`}>
                      {notif.title}
                    </p>
                    <p className="text-sm text-slate-500 line-clamp-2">{notif.body}</p>
                    <p className="text-xs text-slate-400 mt-1.5">{formatTime(notif.createdAt)}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}