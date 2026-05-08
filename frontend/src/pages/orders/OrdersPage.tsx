import { Link, useSearchParams } from 'react-router-dom';
import { useGetMyOrdersQuery } from '@/store/api/ordersApi';
import { ChevronRight, Package, Loader2, PackageOpen } from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Kutilmoqda', color: 'bg-amber-100 text-amber-800' },
  confirmed: { label: 'Tasdiqlangan', color: 'bg-blue-100 text-blue-800' },
  processing: { label: 'Tayyorlanmoqda', color: 'bg-indigo-100 text-indigo-800' },
  shipped: { label: 'Jo\'natildi', color: 'bg-violet-100 text-violet-800' },
  delivered: { label: 'Yetkazildi', color: 'bg-emerald-100 text-emerald-800' },
  cancelled: { label: 'Bekor qilingan', color: 'bg-red-100 text-red-800' },
  refunded: { label: 'Qaytarilgan', color: 'bg-stone-100 text-stone-800' },
};

const TABS = [
  { key: '', label: 'Barchasi' },
  { key: 'pending', label: 'Kutilmoqda' },
  { key: 'confirmed', label: 'Faol' },
  { key: 'delivered', label: 'Yakunlangan' },
  { key: 'cancelled', label: 'Bekor qilingan' },
];

export function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1', 10);

  const { data, isLoading } = useGetMyOrdersQuery({
    ...(status && { status }),
    page,
    limit: 10,
  });

  const orders = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, totalPages: 1 };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-slate-900">Bosh sahifa</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-medium">Buyurtmalarim</span>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-6">Buyurtmalarim</h1>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto mb-6 pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              const p = new URLSearchParams();
              if (tab.key) p.set('status', tab.key);
              setSearchParams(p);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              status === tab.key
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-stone-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <PackageOpen className="w-16 h-16 text-stone-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-1">Buyurtmalar yo'q</h3>
          <Link to="/catalog" className="mt-3 text-sm text-slate-500 hover:text-slate-900">Xarid qilish</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => {
            const st = STATUS_LABELS[order.status] ?? { label: order.status, color: 'bg-stone-100 text-stone-700' };
            return (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="block bg-white border border-stone-100 rounded-xl p-5 hover:shadow-md hover:border-stone-200 transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{order.orderNumber}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('uz-UZ', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${st.color}`}>
                    {st.label}
                  </span>
                </div>

                {/* Items preview */}
                <div className="flex items-center gap-2 mb-3">
                  {order.items?.slice(0, 4).map((item: any, i: number) => (
                    <div key={i} className="w-10 h-10 bg-stone-100 rounded-lg overflow-hidden shrink-0">
                      {item.productImage && (
                        <img src={`/uploads${item.productImage}`} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                  ))}
                  {order.items?.length > 4 && (
                    <span className="text-xs text-slate-500">+{order.items.length - 4}</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">{order.items?.length} ta mahsulot</p>
                  <p className="text-sm font-bold text-slate-900">
                    {parseFloat(order.finalAmount).toLocaleString('uz-UZ')} so'm
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set('page', String(p));
                setSearchParams(params);
              }}
              className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                p === meta.page ? 'bg-slate-900 text-white' : 'bg-white border border-stone-200 text-slate-600 hover:bg-stone-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}