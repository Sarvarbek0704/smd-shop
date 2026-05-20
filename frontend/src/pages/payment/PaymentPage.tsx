import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useInitiatePaymentMutation } from '@/store/api/paymentsApi';
import { useGetOrderDetailQuery } from '@/store/api/ordersApi';
import { Loader2, CreditCard, ChevronRight, ShieldCheck, Lock } from 'lucide-react';

const PROVIDER_META: Record<string, { name: string; color: string; bg: string; desc: string }> = {
  payme:  { name: 'Payme',      color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',   desc: 'O\'zbekistonning #1 to\'lov tizimi. Barcha banklar kartasi qabul qilinadi.' },
  click:  { name: 'Click',      color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', desc: '2 million foydalanuvchi. Tez va qulay mobil to\'lov.' },
  uzum:   { name: 'Uzum Bank',  color: 'text-purple-700',  bg: 'bg-purple-50 border-purple-200',   desc: 'Uzum Bank karta egalari uchun. To\'liq xavfsiz.' },
  cod:    { name: 'Naqd pul',   color: 'text-slate-700',   bg: 'bg-stone-50 border-stone-200',     desc: 'Yetkazib berilganda to\'laysiz.' },
};

export function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading: orderLoading } = useGetOrderDetailQuery(orderId ?? '');
  const [initiatePayment, { isLoading: initiating }] = useInitiatePaymentMutation();

  useEffect(() => {
    if (order?.paymentStatus === 'paid') {
      navigate(`/orders/${orderId}`, { replace: true });
    }
  }, [order?.paymentStatus, orderId, navigate]);

  const handlePay = async () => {
    if (!orderId) return;
    try {
      const result = await initiatePayment(orderId).unwrap();
      navigate(`/payment/simulate/${result.token}?orderId=${orderId}`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'To\'lov boshlanmadi');
    }
  };

  if (orderLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-slate-500">Buyurtma topilmadi</p>
        <Link to="/orders" className="mt-4 inline-block text-sm text-slate-700 underline">Buyurtmalarga qaytish</Link>
      </div>
    );
  }

  const provider = PROVIDER_META[order.paymentMethod] ?? PROVIDER_META.cod;
  const alreadyPaid = order.paymentStatus === 'paid';
  const isCod = order.paymentMethod === 'cod';

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-slate-900">Bosh sahifa</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/orders" className="hover:text-slate-900">Buyurtmalar</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to={`/orders/${orderId}`} className="hover:text-slate-900">{order.orderNumber}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-medium">To'lov</span>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        {/* Order amount card */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-lg font-bold text-slate-900">To'lov</h1>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              alreadyPaid ? 'bg-emerald-100 text-emerald-700' :
              order.paymentStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
              'bg-amber-100 text-amber-700'
            }`}>
              {alreadyPaid ? 'To\'langan' : order.paymentStatus === 'cancelled' ? 'Bekor' : 'Kutilmoqda'}
            </span>
          </div>

          <div className="text-center py-4">
            <p className="text-sm text-slate-500 mb-1">To'lov miqdori</p>
            <p className="text-4xl font-extrabold text-slate-900">
              {parseFloat(order.finalAmount).toLocaleString('uz-UZ')}
            </p>
            <p className="text-base text-slate-500 mt-1">so'm</p>
          </div>

          <div className="border-t border-stone-100 pt-4 text-sm text-slate-600 flex justify-between">
            <span>Buyurtma:</span>
            <span className="font-semibold text-slate-900">{order.orderNumber}</span>
          </div>
        </div>

        {/* Provider card */}
        <div className={`border rounded-2xl p-5 mb-4 ${provider.bg}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <CreditCard className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className={`font-bold ${provider.color}`}>{provider.name}</p>
              <p className="text-xs text-slate-500">{provider.desc}</p>
            </div>
          </div>
        </div>

        {/* Security note */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
          <Lock className="w-3.5 h-3.5" />
          <span>256-bit SSL shifrlash bilan himoyalangan</span>
          <ShieldCheck className="w-3.5 h-3.5 ml-1 text-emerald-500" />
        </div>

        {/* Action */}
        {alreadyPaid ? (
          <div className="text-center">
            <p className="text-sm text-emerald-600 font-semibold mb-4">Bu buyurtma allaqachon to'langan ✓</p>
            <Link to={`/orders/${orderId}`} className="px-6 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors inline-block">
              Buyurtmaga qaytish
            </Link>
          </div>
        ) : isCod ? (
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-4">Naqd to'lov — yetkazib berilganda to'laysiz</p>
            <Link to={`/orders/${orderId}`} className="px-6 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors inline-block">
              Buyurtmani ko'rish
            </Link>
          </div>
        ) : (
          <motion.button
            onClick={handlePay}
            disabled={initiating}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-slate-900 text-white text-base font-bold rounded-2xl hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
          >
            {initiating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Lock className="w-5 h-5" />
                {provider.name} orqali to'lash
              </>
            )}
          </motion.button>
        )}

        <p className="text-center text-xs text-slate-400 mt-4">
          To'lov sahifasi demo rejimida ishlaydi — haqiqiy pul yechilmaydi
        </p>
      </motion.div>
    </div>
  );
}
