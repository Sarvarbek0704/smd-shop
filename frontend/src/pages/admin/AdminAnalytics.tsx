import { motion } from "framer-motion";
import { useGetAdminDashboardQuery } from "@/store/api/adminApi";
import {
  Loader2,
  TrendingUp,
  DollarSign,
  Package,
  ShoppingBag,
  Users,
  Store,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
} from "recharts";

const PIE_COLORS = ["#0f172a", "#475569", "#94a3b8", "#cbd5e1"];

export function AdminAnalytics() {
  const { data, isLoading } = useGetAdminDashboardQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  const overview = data?.overview ?? data ?? {};
  const salesChart = data?.salesChart ?? data?.sales ?? [];
  const topProducts = data?.topProducts ?? [];
  const topSellers = data?.topSellers ?? [];
  const paymentBreakdown = data?.paymentBreakdown ?? [];

  const statCards = [
    {
      label: "Jami daromad",
      value: `${Number(overview.totalRevenue ?? 0).toLocaleString("uz-UZ")} so'm`,
      icon: DollarSign,
      change: overview.revenueChange,
      bg: "bg-emerald-50",
      text: "text-emerald-700",
    },
    {
      label: "Jami buyurtmalar",
      value: Number(overview.totalOrders ?? 0).toLocaleString("uz-UZ"),
      icon: ShoppingBag,
      change: overview.ordersChange,
      bg: "bg-blue-50",
      text: "text-blue-700",
    },
    {
      label: "Foydalanuvchilar",
      value: Number(overview.totalUsers ?? 0).toLocaleString("uz-UZ"),
      icon: Users,
      change: overview.usersChange,
      bg: "bg-violet-50",
      text: "text-violet-700",
    },
    {
      label: "Mahsulotlar",
      value: Number(overview.totalProducts ?? 0).toLocaleString("uz-UZ"),
      icon: Package,
      change: null,
      bg: "bg-amber-50",
      text: "text-amber-700",
    },
    {
      label: "Sellerlar",
      value: Number(overview.totalSellers ?? 0).toLocaleString("uz-UZ"),
      icon: Store,
      change: null,
      bg: "bg-teal-50",
      text: "text-teal-700",
    },
    {
      label: "Bu oy daromad",
      value: `${Number(overview.monthRevenue ?? 0).toLocaleString("uz-UZ")} so'm`,
      icon: TrendingUp,
      change: null,
      bg: "bg-rose-50",
      text: "text-rose-700",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-slate-700" />
        <h1 className="text-xl font-bold text-slate-900">Analitika</h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white border border-stone-100 rounded-xl p-4"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${card.bg}`}>
              <card.icon className={`w-4 h-4 ${card.text}`} />
            </div>
            <p className="text-lg font-bold text-slate-900">{card.value}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-slate-500">{card.label}</p>
              {card.change != null && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    card.change >= 0
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {card.change >= 0 ? "+" : ""}
                  {card.change}%
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Sales chart */}
      {salesChart.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white border border-stone-100 rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900">Savdo dinamikasi</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={salesChart}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f172a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                formatter={(v: any) => [`${Number(v).toLocaleString("uz-UZ")} so'm`, "Daromad"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#0f172a"
                strokeWidth={2}
                fill="url(#salesGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top products */}
        {topProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-white border border-stone-100 rounded-xl"
          >
            <div className="px-5 py-4 border-b border-stone-100">
              <h2 className="text-sm font-semibold text-slate-900">Top 10 mahsulotlar</h2>
            </div>
            <div className="divide-y divide-stone-50">
              {topProducts.slice(0, 10).map((p: any, i: number) => (
                <div key={p.id ?? i} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-6 h-6 bg-stone-100 rounded flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.soldCount ?? 0} ta</p>
                  </div>
                  <p className="text-sm font-bold text-slate-900 shrink-0">
                    {Number(p.revenue ?? 0).toLocaleString("uz-UZ")}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Top sellers */}
        {topSellers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white border border-stone-100 rounded-xl"
          >
            <div className="px-5 py-4 border-b border-stone-100">
              <h2 className="text-sm font-semibold text-slate-900">Top 10 sellerlar</h2>
            </div>
            <div className="divide-y divide-stone-50">
              {topSellers.slice(0, 10).map((s: any, i: number) => (
                <div key={s.id ?? i} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-6 h-6 bg-stone-100 rounded flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                    {i + 1}
                  </span>
                  <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {s.firstName?.[0]?.toUpperCase() ?? "S"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {s.firstName} {s.lastName}
                    </p>
                    <p className="text-xs text-slate-400">{s.ordersCount ?? 0} buyurtma</p>
                  </div>
                  <p className="text-sm font-bold text-slate-900 shrink-0">
                    {Number(s.revenue ?? 0).toLocaleString("uz-UZ")}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Payment breakdown pie */}
      {paymentBreakdown.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="bg-white border border-stone-100 rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900">To'lov usullari taqsimoti</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <RechartsPie>
              <Pie
                data={paymentBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey="count"
                nameKey="method"
                label={({ method, percent }) =>
                  `${method} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {paymentBreakdown.map((_: any, index: number) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </RechartsPie>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}
