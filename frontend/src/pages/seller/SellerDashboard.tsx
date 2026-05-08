import { Link } from "react-router-dom";
import { useGetSellerAnalyticsQuery } from "@/store/api/sellerApi";
import {
  Package,
  ShoppingBag,
  TrendingUp,
  Star,
  Eye,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

export function SellerDashboard() {
  const { data, isLoading } = useGetSellerAnalyticsQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  const orders = data?.orders ?? {};
  const products = data?.products ?? {};
  const reviews = data?.reviews ?? {};

  const stats = [
    {
      label: "Jami daromad",
      value: `${Number(orders.total_revenue ?? 0).toLocaleString("uz-UZ")} so'm`,
      icon: TrendingUp,
      color: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Shu oy",
      value: `${Number(orders.revenue_this_month ?? 0).toLocaleString("uz-UZ")} so'm`,
      icon: TrendingUp,
      color: "bg-blue-100 text-blue-700",
    },
    {
      label: "Buyurtmalar",
      value: orders.total_orders ?? 0,
      icon: ShoppingBag,
      color: "bg-amber-100 text-amber-700",
    },
    {
      label: "Aktiv mahsulotlar",
      value: products.active ?? 0,
      icon: Package,
      color: "bg-violet-100 text-violet-700",
    },
    {
      label: "Jami ko'rishlar",
      value: Number(products.total_views ?? 0).toLocaleString("uz-UZ"),
      icon: Eye,
      color: "bg-rose-100 text-rose-700",
    },
    {
      label: "O'rtacha reyting",
      value: Number(reviews.avg_rating ?? 0).toFixed(1),
      icon: Star,
      color: "bg-amber-100 text-amber-700",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
        <Link
          to="/seller/products/new"
          className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <Package className="w-4 h-4" /> Yangi mahsulot
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white border border-stone-100 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}
              >
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Top products */}
      {data?.topProducts?.length > 0 && (
        <div className="bg-white border border-stone-100 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Top mahsulotlar
          </h3>
          <div className="space-y-3">
            {data.topProducts.slice(0, 5).map((p: any, i: number) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="w-6 text-center text-xs font-bold text-slate-400">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {p.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {Number(p.total_sold)} sotilgan
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-900 shrink-0">
                  {Number(p.total_revenue).toLocaleString("uz-UZ")} so'm
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        <Link
          to="/seller/orders?status=pending"
          className="bg-amber-50 border border-amber-200 rounded-xl p-4 hover:bg-amber-100 transition-colors group"
        >
          <p className="text-2xl font-bold text-amber-800">
            {orders.pending ?? 0}
          </p>
          <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
            Kutilayotgan buyurtmalar{" "}
            <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </p>
        </Link>
        <Link
          to="/seller/products?status=draft"
          className="bg-stone-50 border border-stone-200 rounded-xl p-4 hover:bg-stone-100 transition-colors group"
        >
          <p className="text-2xl font-bold text-slate-800">
            {products.total ?? 0}
          </p>
          <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
            Jami mahsulotlar{" "}
            <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </p>
        </Link>
      </div>
    </div>
  );
}
