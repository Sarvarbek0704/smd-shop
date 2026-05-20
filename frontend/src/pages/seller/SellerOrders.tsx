import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGetSellerOrdersQuery, useUpdateOrderStatusMutation } from '@/store/api/sellerApi';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  PackageOpen,
  ChevronDown,
  Check,
  MapPin,
  User,
  Phone,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; next?: { value: string; label: string } }> = {
  pending: { label: 'Kutilmoqda', color: 'bg-amber-100 text-amber-800', next: { value: 'confirmed', label: 'Tasdiqlash' } },
  confirmed: { label: 'Tasdiqlangan', color: 'bg-blue-100 text-blue-800', next: { value: 'processing', label: 'Tayyorlash' } },
  processing: { label: 'Tayyorlanmoqda', color: 'bg-indigo-100 text-indigo-800', next: { value: 'shipped', label: 'Jo\'natish' } },
  shipped: { label: 'Jo\'natildi', color: 'bg-violet-100 text-violet-800' },
  delivered: { label: 'Yetkazildi', color: 'bg-emerald-100 text-emerald-800' },
  cancelled: { label: 'Bekor qilingan', color: 'bg-red-100 text-red-800' },
};

const TABS = [
  { key: '', label: 'Barchasi' },
  { key: 'pending', label: 'Yangi' },
  { key: 'confirmed', label: 'Tasdiqlangan' },
  { key: 'processing', label: 'Jarayonda' },
  { key: 'shipped', label: 'Jo\'natilgan' },
  { key: 'delivered', label: 'Yakunlangan' },
];

export function SellerOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1', 10);

  const { data, isLoading } = useGetSellerOrdersQuery({ ...(status && { status }), page, limit: 15 });
  const [updateStatus, { isLoading: updating }] = useUpdateOrderStatusMutation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const orders = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, totalPages: 1 };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateStatus({ id: orderId, status: newStatus }).unwrap();
      toast.success('Buyurtma holati yangilandi');
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Xatolik');
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 mb-6">Buyurtmalar</h1>

      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              const p = new URLSearchParams();
              if (tab.key) p.set('status', tab.key);
              setSearchParams(p);
            }}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              status === tab.key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-stone-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-slate-400 animate-spin" /></div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <PackageOpen className="w-16 h-16 text-stone-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700">Buyurtmalar yo'q</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => {
            const st = STATUS_CONFIG[order.status] ?? { label: order.status, color: 'bg-stone-100 text-stone-700' };
            const isExpanded = expandedId === order.id;

            return (
              <div key={order.id} className="bg-white border border-stone-100 rounded-xl overflow-hidden">
                {/* Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-stone-50/50 transition-colors text-left"
                >
                  {/* Left: order info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{order.orderNumber}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {/* Right: amount + status + chevron */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-sm font-bold text-slate-900 whitespace-nowrap">
                      {parseFloat(order.finalAmount).toLocaleString('uz-UZ')} so'm
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${st.color}`}>{st.label}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {/* Expanded */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-stone-100 pt-4">
                        {/* Buyer info */}
                        {order.buyer && (
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4 p-3 bg-stone-50 rounded-xl text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                              <User className="w-4 h-4 text-slate-400 shrink-0" />
                              {order.buyer.firstName} {order.buyer.lastName}
                            </div>
                            {order.buyer.phone && (
                              <div className="flex items-center gap-2 text-slate-600">
                                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                                {order.buyer.phone}
                              </div>
                            )}
                            {order.buyer.email && (
                              <div className="text-slate-500 text-xs break-all">{order.buyer.email}</div>
                            )}
                          </div>
                        )}

                        {/* Address */}
                        {order.shippingAddress && (
                          <div className="flex items-start gap-2 mb-4 text-sm text-slate-600">
                            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            {order.shippingAddress.region}, {order.shippingAddress.city}, {order.shippingAddress.street}
                          </div>
                        )}

                        {/* Items */}
                        <div className="space-y-2 mb-4">
                          {order.items?.map((item: any) => (
                            <div key={item.id} className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-stone-100 rounded-lg overflow-hidden shrink-0">
                                {item.productImage && <img src={`/uploads${item.productImage}`} alt="" className="w-full h-full object-cover" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-900 truncate">{item.productName}</p>
                                <p className="text-xs text-slate-500">{item.quantity} x {parseFloat(item.unitPrice).toLocaleString('uz-UZ')}</p>
                              </div>
                              <p className="text-sm font-semibold text-slate-900 shrink-0">
                                {parseFloat(item.totalPrice).toLocaleString('uz-UZ')} so'm
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Notes */}
                        {order.notes && (
                          <p className="text-sm text-slate-500 italic mb-4">"{order.notes}"</p>
                        )}

                        {/* Action */}
                        {st.next && (
                          <motion.button
                            onClick={() => handleStatusUpdate(order.id, st.next!.value)}
                            disabled={updating}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                          >
                            {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            {st.next.label}
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => { const params = new URLSearchParams(searchParams); params.set('page', String(p)); setSearchParams(params); }}
              className={`w-10 h-10 rounded-xl text-sm font-medium ${p === meta.page ? 'bg-slate-900 text-white' : 'bg-white border border-stone-200 text-slate-600 hover:bg-stone-50'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}