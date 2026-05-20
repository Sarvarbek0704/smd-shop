import { motion } from "framer-motion";
import { useGetSellerAnalyticsQuery } from "@/store/api/sellerApi";
import {
  Loader2,
  TrendingUp,
  DollarSign,
  Package,
  ShoppingBag,
  Star,
  Eye,
  BarChart3,
} from "lucide-react";

export function SellerAnalytics() {
  const { data, isLoading } = useGetSellerAnalyticsQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  const stats = data ?? {};
  const topProducts = stats.topProducts ?? [];

  const cards = [
    {
      label: "Jami daromad",
      value: `${Number(stats.totalRevenue ?? 0).toLocaleString("uz-UZ")}`,
      sub: "so'm",
      icon: DollarSign,
      color: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Shu oy daromad",
      value: `${Number(stats.monthRevenue ?? 0).toLocaleString("uz-UZ")}`,
      sub: "so'm",
      icon: TrendingUp,
      color: "bg-blue-100 text-blue-700",
    },
    {
      label: "Jami buyurtmalar",
      value: stats.totalOrders ?? 0,
      sub: `${stats.pendingOrders ?? 0} kutilmoqda`,
      icon: ShoppingBag,
      color: "bg-violet-100 text-violet-700",
    },
    {
      label: "Mahsulotlar",
      value: stats.totalProducts ?? 0,
      sub: `${stats.activeProducts ?? 0} aktiv`,
      icon: Package,
      color: "bg-amber-100 text-amber-700",
    },
    {
      label: "O'rtacha reyting",
      value: Number(stats.avgRating ?? 0).toFixed(1),
      sub: `${stats.totalReviews ?? 0} sharh`,
      icon: Star,
      color: "bg-yellow-100 text-yellow-700",
    },
    {
      label: "Jami ko'rishlar",
      value: Number(stats.totalViews ?? 0).toLocaleString("uz-UZ"),
      sub: "",
      icon: Eye,
      color: "bg-teal-100 text-teal-700",
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <BarChart3 className="w-5 h-5" /> Statistika
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white border border-stone-100 rounded-xl p-4"
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${card.color}`}
            >
              <card.icon className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-slate-900">{card.value}</p>
            <div className="flex items-baseline gap-1">
              <p className="text-xs text-slate-500">{card.label}</p>
              {card.sub && (
                <span className="text-[10px] text-slate-400">{card.sub}</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Top Products */}
      {topProducts.length > 0 && (
        <div className="bg-white border border-stone-100 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Eng ko'p sotilgan mahsulotlar
          </h3>
          <div className="space-y-3">
            {topProducts.map((p: any, i: number) => (
              <div
                key={p.id ?? i}
                className="flex items-center gap-3 py-2 border-b border-stone-50 last:border-0"
              >
                <span className="w-6 h-6 bg-stone-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-500">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {p.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {p.soldCount ?? p.sold_count ?? 0} ta sotilgan
                  </p>
                </div>
                <p className="text-sm font-bold text-slate-900 shrink-0">
                  {Number(p.revenue ?? 0).toLocaleString("uz-UZ")} so'm
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
