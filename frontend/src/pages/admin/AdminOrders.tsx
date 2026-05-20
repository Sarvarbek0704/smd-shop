import { Link, useSearchParams } from "react-router-dom";
import { useGetAdminOrdersQuery } from "@/store/api/adminApi";
import { Loader2, PackageOpen, ChevronLeft, ChevronRight } from "lucide-react";

const TABS = [
  { key: "", label: "Barchasi" },
  { key: "pending", label: "Kutilmoqda" },
  { key: "confirmed", label: "Tasdiqlangan" },
  { key: "shipped", label: "Jo'natilgan" },
  { key: "delivered", label: "Yetkazilgan" },
  { key: "cancelled", label: "Bekor" },
];

const ST: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-violet-100 text-violet-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-purple-100 text-purple-800",
};

export function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  const { data, isLoading } = useGetAdminOrdersQuery({
    ...(status && { status }),
    page,
    limit: 20,
  });
  const orders = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, totalPages: 1 };

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(p));
    setSearchParams(params);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-900">Barcha buyurtmalar</h1>
        {meta.total > 0 && (
          <span className="text-sm text-slate-500">
            Jami: <span className="font-semibold text-slate-900">{meta.total}</span>
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              const p = new URLSearchParams();
              if (tab.key) p.set("status", tab.key);
              setSearchParams(p);
            }}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
              status === tab.key
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-stone-100"
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
          <h3 className="text-lg font-semibold text-slate-700">Buyurtmalar yo'q</h3>
        </div>
      ) : (
        <>
          {/* ── Mobile cards (< md) ── */}
          <div className="space-y-2 md:hidden">
            {orders.map((o: any) => (
              <Link
                key={o.id}
                to={`/admin/orders/${o.id}`}
                className="block bg-white border border-stone-100 rounded-xl p-4 hover:border-stone-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold text-slate-900 text-sm">{o.orderNumber}</p>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                      ST[o.status] ?? "bg-stone-100 text-stone-700"
                    }`}
                  >
                    {o.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-1">
                  {o.buyer?.firstName} {o.buyer?.lastName}
                </p>
                {(o.seller?.firstName || o.seller?.lastName) && (
                  <p className="text-xs text-slate-400 mb-2">
                    Seller: {o.seller?.firstName} {o.seller?.lastName}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-900">
                    {parseFloat(o.finalAmount).toLocaleString("uz-UZ")} so'm
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(o.createdAt).toLocaleDateString("uz-UZ", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* ── Desktop table (md+) ── */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-stone-200">
                  <th className="pb-3 pr-4 font-medium">Raqam</th>
                  <th className="pb-3 pr-4 font-medium">Xaridor</th>
                  <th className="pb-3 pr-4 font-medium">Sotuvchi</th>
                  <th className="pb-3 pr-4 font-medium">Summa</th>
                  <th className="pb-3 pr-4 font-medium">Holat</th>
                  <th className="pb-3 font-medium">Sana</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any) => (
                  <tr
                    key={o.id}
                    className="border-b border-stone-50 hover:bg-stone-50/50"
                  >
                    <td className="py-3 pr-4 font-medium text-slate-900">
                      {o.orderNumber}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {o.buyer?.firstName} {o.buyer?.lastName}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {o.seller?.firstName} {o.seller?.lastName}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-slate-900">
                      {parseFloat(o.finalAmount).toLocaleString("uz-UZ")}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          ST[o.status] ?? "bg-stone-100 text-stone-700"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500 text-xs">
                      {new Date(o.createdAt).toLocaleDateString("uz-UZ", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-slate-500 hidden sm:block">
            {page} / {meta.totalPages} sahifa
          </p>
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-stone-200 text-slate-600 hover:bg-stone-100 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, meta.totalPages - 4));
                const p = start + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      p === page
                        ? "bg-slate-900 text-white"
                        : "border border-stone-200 text-slate-600 hover:bg-stone-50"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage(Math.min(meta.totalPages, page + 1))}
              disabled={page === meta.totalPages}
              className="p-2 rounded-lg border border-stone-200 text-slate-600 hover:bg-stone-100 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
