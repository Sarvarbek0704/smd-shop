import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useGetSellerAnalyticsQuery } from "@/store/api/sellerApi";
import { useGetSellerOrdersQuery } from "@/store/api/sellerApi";
import {
  Loader2,
  TrendingUp,
  DollarSign,
  Package,
  ShoppingBag,
  Star,
  Eye,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageCircle,
} from "lucide-react";

const ORDER_STATUS: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Kutilmoqda", color: "bg-amber-100 text-amber-700", icon: Clock },
  confirmed: { label: "Tasdiqlangan", color: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
  processing: { label: "Jarayonda", color: "bg-indigo-100 text-indigo-700", icon: AlertCircle },
  shipped: { label: "Jo'natildi", color: "bg-violet-100 text-violet-700", icon: TrendingUp },
  delivered: { label: "Yetkazildi", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  cancelled: { label: "Bekor", color: "bg-red-100 text-red-700", icon: XCircle },
  refunded: { label: "Qaytarildi", color: "bg-stone-100 text-stone-700", icon: XCircle },
};

export function SellerDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetSellerAnalyticsQuery();
  const { data: ordersData, isLoading: ordersLoading } = useGetSellerOrdersQuery({
    limit: 5,
    page: 1,
  });

  const orders = ordersData?.data ?? ordersData ?? [];
  const recentOrders = Array.isArray(orders) ? orders.slice(0, 5) : [];

  const cards = [
    {
      label: "Jami daromad",
      value: `${Number(stats?.totalRevenue ?? 0).toLocaleString("uz-UZ")} so'm`,
      sub: "barcha vaqt",
      icon: DollarSign,
      color: "from-emerald-500 to-teal-500",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
    },
    {
      label: "Bu oy daromad",
      value: `${Number(stats?.monthRevenue ?? 0).toLocaleString("uz-UZ")} so'm`,
      sub: "joriy oy",
      icon: TrendingUp,
      color: "from-blue-500 to-cyan-500",
      bg: "bg-blue-50",
      text: "text-blue-700",
    },
    {
      label: "Buyurtmalar",
      value: stats?.totalOrders ?? 0,
      sub: `${stats?.pendingOrders ?? 0} kutilmoqda`,
      icon: ShoppingBag,
      color: "from-violet-500 to-purple-500",
      bg: "bg-violet-50",
      text: "text-violet-700",
    },
    {
      label: "Mahsulotlar",
      value: stats?.totalProducts ?? 0,
      sub: `${stats?.activeProducts ?? 0} aktiv`,
      icon: Package,
      color: "from-amber-500 to-orange-500",
      bg: "bg-amber-50",
      text: "text-amber-700",
    },
    {
      label: "O'rtacha reyting",
      value: Number(stats?.avgRating ?? 0).toFixed(1),
      sub: `${stats?.totalReviews ?? 0} sharh`,
      icon: Star,
      color: "from-yellow-500 to-amber-500",
      bg: "bg-yellow-50",
      text: "text-yellow-700",
    },
    {
      label: "Ko'rishlar",
      value: Number(stats?.totalViews ?? 0).toLocaleString("uz-UZ"),
      sub: "mahsulot ko'rishlari",
      icon: Eye,
      color: "from-teal-500 to-green-500",
      bg: "bg-teal-50",
      text: "text-teal-700",
    },
  ];

  const quickActions = [
    { to: "/seller/products/new", label: "Yangi mahsulot", icon: Plus, primary: true },
    { to: "/seller/orders", label: "Buyurtmalar", icon: ShoppingBag, primary: false },
    { to: "/seller/reviews", label: "Sharhlar", icon: Star, primary: false },
    { to: "/seller/chat", label: "Xabarlar", icon: MessageCircle, primary: false },
  ];

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Seller panelingizga xush kelibsiz</p>
        </div>
        <Link
          to="/seller/products/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yangi mahsulot
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white border border-stone-100 rounded-xl p-4 hover:shadow-md transition-shadow"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.bg}`}>
              <card.icon className={`w-5 h-5 ${card.text}`} />
            </div>
            <p className="text-xl font-bold text-slate-900">{card.value}</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <p className="text-xs text-slate-500">{card.label}</p>
              <span className="text-[10px] text-slate-400">{card.sub}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {quickActions.map((action, i) => (
          <motion.div
            key={action.to}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
          >
            <Link
              to={action.to}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                action.primary
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "bg-stone-100 text-slate-700 hover:bg-stone-200"
              }`}
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Recent orders */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white border border-stone-100 rounded-xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h2 className="text-sm font-semibold text-slate-900">So'nggi buyurtmalar</h2>
          <Link
            to="/seller/orders"
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 transition-colors"
          >
            Barchasi <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {ordersLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingBag className="w-10 h-10 text-stone-300 mb-3" />
            <p className="text-sm text-slate-500">Hali buyurtmalar yo'q</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-50">
            {recentOrders.map((order: any) => {
              const st = ORDER_STATUS[order.status] ?? {
                label: order.status,
                color: "bg-stone-100 text-stone-700",
                icon: Clock,
              };
              const Icon = st.icon;
              const firstItem = order.items?.[0];
              const itemCount = order.items?.length ?? 0;

              return (
                <div
                  key={order.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-stone-50 transition-colors"
                >
                  {/* Order icon */}
                  <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-slate-500" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        #{order.orderNumber ?? order.id?.slice(0, 8)}
                      </p>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${st.color}`}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {firstItem?.productName ?? "Mahsulot"}{" "}
                      {itemCount > 1 && `+ ${itemCount - 1} ta boshqa`}
                    </p>
                  </div>

                  {/* Amount + date */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-900">
                      {Number(order.finalAmount).toLocaleString("uz-UZ")} so'm
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString("uz-UZ", {
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Top products */}
      {stats?.topProducts && stats.topProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white border border-stone-100 rounded-xl"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
            <h2 className="text-sm font-semibold text-slate-900">Eng ko'p sotilgan mahsulotlar</h2>
            <Link
              to="/seller/products"
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 transition-colors"
            >
              Barchasi <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-stone-50">
            {stats.topProducts.slice(0, 5).map((p: any, i: number) => (
              <div key={p.id ?? i} className="flex items-center gap-4 px-5 py-3.5">
                <span className="w-6 h-6 bg-stone-100 rounded flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.soldCount ?? p.sold_count ?? 0} ta sotilgan</p>
                </div>
                <p className="text-sm font-bold text-slate-900 shrink-0">
                  {Number(p.revenue ?? 0).toLocaleString("uz-UZ")} so'm
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
