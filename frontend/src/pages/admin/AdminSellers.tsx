import { useState } from "react";
import { motion } from "framer-motion";
import {
  useGetAdminSellersQuery,
  useApproveSellersMutation,
  useRejectSellerMutation,
} from "@/store/api/adminApi";
import toast from "react-hot-toast";
import {
  Loader2,
  Store,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  Star,
  Package,
  ShoppingBag,
} from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Kutilmoqda", color: "bg-amber-100 text-amber-700", icon: Clock },
  approved: { label: "Tasdiqlangan", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  rejected: { label: "Rad etilgan", color: "bg-red-100 text-red-700", icon: XCircle },
};

export function AdminSellers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading, isFetching } = useGetAdminSellersQuery({
    page,
    limit: 15,
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const [approveSeller, { isLoading: approving }] = useApproveSellersMutation();
  const [rejectSeller, { isLoading: rejecting }] = useRejectSellerMutation();

  const sellers = data?.data ?? data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, totalPages: 1 };

  const handleApprove = async (userId: string, name: string) => {
    try {
      await approveSeller(userId).unwrap();
      toast.success(`${name} tasdiqlandi`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Xatolik");
    }
  };

  const handleReject = async (userId: string, name: string) => {
    const reason = prompt("Rad etish sababi:");
    if (!reason) return;
    try {
      await rejectSeller({ userId, reason }).unwrap();
      toast.success(`${name} rad etildi`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Xatolik");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Store className="w-5 h-5 text-slate-700" />
        <h1 className="text-xl font-bold text-slate-900">Sellerlar</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Ism yoki email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {["all", "pending", "approved", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap ${
                statusFilter === s
                  ? "bg-slate-900 text-white border-slate-900"
                  : "border-stone-200 text-slate-600 hover:border-stone-400"
              }`}
            >
              {s === "all" ? "Barchasi" : STATUS_MAP[s]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      ) : sellers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-stone-100 rounded-xl text-center">
          <Store className="w-12 h-12 text-stone-300 mb-3" />
          <p className="text-slate-500 font-medium">Sellerlar topilmadi</p>
        </div>
      ) : (
        <div className={`space-y-2 transition-opacity ${isFetching ? "opacity-60" : ""}`}>
          {sellers.map((seller: any, i: number) => {
            const st = STATUS_MAP[seller.sellerStatus ?? "pending"] ?? STATUS_MAP.pending;
            const Icon = st.icon;
            const name = `${seller.firstName ?? ""} ${seller.lastName ?? ""}`.trim() || seller.email;

            return (
              <motion.div
                key={seller.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white border border-stone-100 rounded-xl p-4"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-11 h-11 bg-slate-800 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {name[0]?.toUpperCase() ?? "S"}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{name}</p>
                        <p className="text-xs text-slate-400">{seller.email ?? seller.phone}</p>
                      </div>
                      <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${st.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {st.label}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-2">
                      {seller.productsCount != null && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Package className="w-3.5 h-3.5" />
                          {seller.productsCount} mahsulot
                        </div>
                      )}
                      {seller.ordersCount != null && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <ShoppingBag className="w-3.5 h-3.5" />
                          {seller.ordersCount} buyurtma
                        </div>
                      )}
                      {seller.avgRating != null && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {Number(seller.avgRating).toFixed(1)}
                        </div>
                      )}
                      {seller.revenue != null && (
                        <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                          {Number(seller.revenue).toLocaleString("uz-UZ")} so'm
                        </div>
                      )}
                    </div>

                    {/* Seller description / store name */}
                    {seller.storeName && (
                      <p className="text-xs text-slate-500 mt-1 truncate">🏪 {seller.storeName}</p>
                    )}

                    {/* Joined date */}
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Qo'shilgan:{" "}
                      {seller.createdAt
                        ? new Date(seller.createdAt).toLocaleDateString("uz-UZ", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </p>
                  </div>
                </div>

                {/* Pending actions */}
                {(seller.sellerStatus === "pending" || !seller.sellerStatus) && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100">
                    <button
                      onClick={() => handleApprove(seller.id, name)}
                      disabled={approving || rejecting}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      {approving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <><CheckCircle2 className="w-4 h-4" /> Tasdiqlash</>
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(seller.id, name)}
                      disabled={approving || rejecting}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      {rejecting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <><XCircle className="w-4 h-4" /> Rad etish</>
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-slate-500">Jami: {meta.total} ta seller</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-stone-200 text-slate-600 hover:bg-stone-100 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-700 font-medium px-2">
              {page} / {meta.totalPages}
            </span>
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
