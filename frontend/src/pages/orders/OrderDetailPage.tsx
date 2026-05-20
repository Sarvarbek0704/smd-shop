import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGetOrderDetailQuery, useCancelOrderMutation } from '@/store/api/ordersApi';
import toast from 'react-hot-toast';
import {
  ChevronRight,
  Loader2,
  PackageOpen,
  MapPin,
  CreditCard,
  Clock,
  Check,
  XCircle,
  Truck,
  Package,
  AlertTriangle,
  Wallet,
} from 'lucide-react';

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Kutilmoqda',
  confirmed: 'Tasdiqlangan',
  processing: 'Tayyorlanmoqda',
  shipped: 'Jo\'natildi',
  delivered: 'Yetkazildi',
  cancelled: 'Bekor qilingan',
  refunded: 'Qaytarilgan',
};

export function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading, error } = useGetOrderDetailQuery(id ?? '');
  const [cancelOrder, { isLoading: cancelling }] = useCancelOrderMutation();
  const [cancelReason, setCancelReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);

  if (isLoading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 text-slate-400 animate-spin" /></div>;
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <PackageOpen className="w-16 h-16 text-stone-300 mb-4" />
        <h2 className="text-lg font-semibold text-slate-700">Buyurtma topilmadi</h2>
        <Link to="/orders" className="mt-4 text-sm text-slate-500 hover:text-slate-900">Buyurtmalarga qaytish</Link>
      </div>
    );
  }

  const isCancelled = order.status === 'cancelled' || order.status === 'refunded';
  const currentStepIndex = STATUS_STEPS.indexOf(order.status);
  const canCancel = ['pending', 'confirmed'].includes(order.status);
  const canPay = order.paymentMethod !== 'cod' && order.paymentStatus === 'pending' && !isCancelled;

  const handleCancel = async () => {
    if (cancelReason.length < 3) { toast.error('Sabab kiriting (kamida 3 belgi)'); return; }
    try {
      await cancelOrder({ id: order.id, reason: cancelReason }).unwrap();
      toast.success('Buyurtma bekor qilindi');
      setShowCancel(false);
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Xatolik');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-slate-900">Bosh sahifa</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/orders" className="hover:text-slate-900">Buyurtmalarim</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-medium">{order.orderNumber}</span>
      </div>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{order.orderNumber}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {new Date(order.createdAt).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canPay && (
            <Link
              to={`/payment/${order.id}`}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <Wallet className="w-4 h-4" />
              To'lash
            </Link>
          )}
          {canCancel && (
            <button
              onClick={() => setShowCancel(!showCancel)}
              className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
            >
              Bekor qilish
            </button>
          )}
        </div>
      </div>

      {/* Cancel form */}
      {showCancel && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
        >
          <p className="text-sm font-semibold text-red-800 mb-2">Bekor qilish sababini kiriting:</p>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white resize-none"
            placeholder="Boshqa mahsulot tanladim..."
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {cancelling ? 'Kuting...' : 'Tasdiqlash'}
            </button>
            <button
              onClick={() => setShowCancel(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
            >
              Bekor qilish
            </button>
          </div>
        </motion.div>
      )}

      {/* Status timeline */}
      {!isCancelled && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 mb-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-5">Buyurtma holati</h3>
          <div className="flex items-center justify-between">
            {STATUS_STEPS.map((step, i) => {
              const isDone = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              return (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      isDone ? 'bg-slate-900 text-white' : 'bg-stone-100 text-slate-400'
                    }`}>
                      {isDone ? <Check className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className={`text-[10px] mt-1.5 text-center ${isCurrent ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
                      {STATUS_LABELS[step]}
                    </span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-px mx-2 ${i < currentStepIndex ? 'bg-slate-900' : 'bg-stone-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancelled badge */}
      {isCancelled && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">{STATUS_LABELS[order.status]}</p>
            {order.cancelledReason && <p className="text-sm text-red-700 mt-1">{order.cancelledReason}</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Address */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Yetkazish manzili
          </h3>
          <p className="text-sm text-slate-600">
            {order.shippingAddress?.region}, {order.shippingAddress?.city}, {order.shippingAddress?.street}
          </p>
        </div>

        {/* Payment */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> To'lov
          </h3>
          <p className="text-sm text-slate-600 capitalize">{order.paymentMethod}</p>
          <span className={`inline-block text-xs font-semibold mt-1.5 px-2 py-0.5 rounded-full ${
            order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' :
            order.paymentStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
            'bg-amber-100 text-amber-700'
          }`}>
            {order.paymentStatus === 'paid' ? "To'langan" :
             order.paymentStatus === 'cancelled' ? 'Bekor qilingan' : "Kutilmoqda"}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Mahsulotlar</h3>
        <div className="space-y-3">
          {order.items?.map((item: any) => (
            <div key={item.id} className="flex items-center gap-4">
              <div className="w-14 h-14 bg-stone-100 rounded-lg overflow-hidden shrink-0">
                {item.productImage && <img src={`/uploads${item.productImage}`} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{item.productName}</p>
                <p className="text-xs text-slate-500">{item.quantity} x {parseFloat(item.unitPrice).toLocaleString('uz-UZ')} so'm</p>
              </div>
              <p className="text-sm font-semibold text-slate-900 shrink-0">
                {parseFloat(item.totalPrice).toLocaleString('uz-UZ')} so'm
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-stone-100 mt-4 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Mahsulotlar jami</span>
            <span className="text-slate-700">{parseFloat(order.totalAmount).toLocaleString('uz-UZ')} so'm</span>
          </div>
          {parseFloat(order.discountAmount) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Chegirma</span>
              <span className="text-emerald-600">-{parseFloat(order.discountAmount).toLocaleString('uz-UZ')} so'm</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold pt-1">
            <span className="text-slate-900">Jami</span>
            <span className="text-slate-900">{parseFloat(order.finalAmount).toLocaleString('uz-UZ')} so'm</span>
          </div>
        </div>
      </div>
    </div>
  );
}