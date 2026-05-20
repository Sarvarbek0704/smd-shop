import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useGetAllPaymentsQuery, useRefundPaymentMutation } from '@/store/api/paymentsApi';
import {
  CreditCard, Loader2, CheckCircle, XCircle, Clock,
  RotateCcw, ChevronLeft, ChevronRight, AlertTriangle,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.FC<any> }> = {
  success:    { label: 'Muvaffaqiyatli', className: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  failed:     { label: 'Xatolik',        className: 'bg-red-100 text-red-700',         icon: XCircle },
  cancelled:  { label: 'Bekor',          className: 'bg-stone-100 text-slate-600',      icon: XCircle },
  pending:    { label: 'Kutilmoqda',     className: 'bg-amber-100 text-amber-700',      icon: Clock },
  processing: { label: 'Jarayonda',      className: 'bg-blue-100 text-blue-700',        icon: Loader2 },
  refunded:   { label: 'Qaytarilgan',    className: 'bg-purple-100 text-purple-700',    icon: RotateCcw },
};

const PROVIDER_LABELS: Record<string, string> = {
  payme: 'Payme', click: 'Click', uzum: 'Uzum Bank', cod: 'Naqd',
};

export function AdminPayments() {
  const [page, setPage] = useState(1);
  const [refundOrderId, setRefundOrderId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState('');

  const { data, isLoading, isFetching } = useGetAllPaymentsQuery({ page, limit: 20 });
  const [refundPayment, { isLoading: refunding }] = useRefundPaymentMutation();

  const payments = data?.data ?? [];
  const meta = data?.meta;

  const handleRefund = async () => {
    if (!refundOrderId) return;
    if (!refundReason.trim()) { toast.error('Sabab kiriting'); return; }
    try {
      await refundPayment({ orderId: refundOrderId, reason: refundReason }).unwrap();
      toast.success("To'lov qaytarildi");
      setRefundOrderId(null);
      setRefundReason('');
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Xatolik');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">To'lovlar</h1>
          <p className="text-sm text-slate-500 mt-0.5">Barcha tranzaksiyalar ro'yxati</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <CreditCard className="w-4 h-4" />
          {meta?.total != null && <span>{meta.total} ta jami</span>}
        </div>
      </div>

      {/* Refund modal */}
      {refundOrderId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4"
          onClick={(e) => e.target === e.currentTarget && setRefundOrderId(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-900">To'lovni qaytarish</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">Bu amalni ortga qaytarib bo'lmaydi. Sababni kiriting:</p>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none mb-4"
              placeholder="Mijoz talabi bo'yicha qaytarildi..."
            />
            <div className="flex gap-2">
              <button
                onClick={handleRefund}
                disabled={refunding}
                className="flex-1 py-2.5 bg-red-600 text-white font-semibold text-sm rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {refunding ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                Qaytarish
              </button>
              <button
                onClick={() => setRefundOrderId(null)}
                className="px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900 border border-stone-200 rounded-xl transition-colors"
              >
                Bekor
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-20">
          <CreditCard className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <p className="text-slate-500">Tranzaksiyalar mavjud emas</p>
        </div>
      ) : (
        <>
          {/* ── Mobile cards (< md) ── */}
          <div className={`space-y-2 md:hidden ${isFetching ? "opacity-60" : ""}`}>
            {payments.map((p: any) => {
              const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              return (
                <div key={p.id} className="bg-white border border-stone-100 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="font-mono text-xs font-semibold text-slate-900">
                        {p.externalTxId ?? p.id.slice(0, 10)}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Buyurtma: {p.orderId?.slice(0, 8)}…
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${cfg.className}`}>
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-bold text-slate-900">
                        {parseFloat(p.amount).toLocaleString('uz-UZ')} so'm
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {PROVIDER_LABELS[p.provider] ?? p.provider}
                        {p.performedAt && (
                          <span className="ml-2">
                            {new Date(p.performedAt).toLocaleDateString('uz-UZ', {
                              day: '2-digit', month: '2-digit', year: '2-digit',
                            })}
                          </span>
                        )}
                      </p>
                    </div>
                    {p.status === 'success' && (
                      <button
                        onClick={() => { setRefundOrderId(p.orderId); setRefundReason(''); }}
                        className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Qaytarish
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Desktop table (md+) ── */}
          <div className={`hidden md:block bg-white border border-stone-200 rounded-2xl overflow-hidden ${isFetching ? "opacity-60" : ""}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tranzaksiya</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Buyurtma</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tizim</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Miqdor</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Sana</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {payments.map((p: any) => {
                    const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.pending;
                    const Icon = cfg.icon;
                    return (
                      <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-mono text-xs text-slate-700">{p.externalTxId ?? p.id.slice(0, 8)}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{p.orderId?.slice(0, 8)}…</td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-900 capitalize">
                            {PROVIDER_LABELS[p.provider] ?? p.provider}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {parseFloat(p.amount).toLocaleString('uz-UZ')} so'm
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.className}`}>
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                          {p.performedAt
                            ? new Date(p.performedAt).toLocaleDateString('uz-UZ', {
                                day: '2-digit', month: '2-digit', year: '2-digit',
                                hour: '2-digit', minute: '2-digit',
                              })
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {p.status === 'success' && (
                            <button
                              onClick={() => { setRefundOrderId(p.orderId); setRefundReason(''); }}
                              className="text-xs text-red-600 hover:text-red-800 font-medium transition-colors flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Qaytarish
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isFetching}
                className="p-2 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-600">
                {page} / {meta.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages || isFetching}
                className="p-2 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
