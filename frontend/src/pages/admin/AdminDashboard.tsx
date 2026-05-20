import { useGetAdminDashboardQuery } from "@/store/api/adminApi";
import { motion } from "framer-motion";
import {
  Users,
  Package,
  ShoppingBag,
  TrendingUp,
  Loader2,
  DollarSign,
  UserCheck,
  Clock,
} from "lucide-react";

export function AdminDashboard() {
  const { data, isLoading } = useGetAdminDashboardQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  const users = data?.users ?? {};
  const products = data?.products ?? {};
  const orders = data?.orders ?? {};
  const revenue = data?.revenue ?? {};
  const recent = data?.recentOrders ?? [];

  const cards = [
    {
      label: "Jami daromad",
      value: `${Number(revenue.total_revenue ?? 0).toLocaleString("uz-UZ")}`,
      sub: "so'm",
      icon: DollarSign,
      color: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Shu oy daromad",
      value: `${Number(revenue.revenue_this_month ?? 0).toLocaleString("uz-UZ")}`,
      sub: "so'm",
      icon: TrendingUp,
      color: "bg-blue-100 text-blue-700",
    },
    {
      label: "Foydalanuvchilar",
      value: users.total ?? 0,
      sub: `${users.new_this_month ?? 0} yangi`,
      icon: Users,
      color: "bg-violet-100 text-violet-700",
    },
    {
      label: "Aktiv foydalanuvchilar",
      value: users.active ?? 0,
      sub: `${users.verified ?? 0} tasdiqlangan`,
      icon: UserCheck,
      color: "bg-teal-100 text-teal-700",
    },
    {
      label: "Mahsulotlar",
      value: products.total ?? 0,
      sub: `${products.active ?? 0} aktiv`,
      icon: Package,
      color: "bg-amber-100 text-amber-700",
    },
    {
      label: "Buyurtmalar",
      value: orders.total ?? 0,
      sub: `${orders.pending ?? 0} kutilmoqda`,
      icon: ShoppingBag,
      color: "bg-rose-100 text-rose-700",
    },
    {
      label: "Bugungi buyurtmalar",
      value: orders.today ?? 0,
      sub: "",
      icon: Clock,
      color: "bg-indigo-100 text-indigo-700",
    },
    {
      label: "O'rtacha buyurtma",
      value: `${Number(revenue.avg_order_value ?? 0).toLocaleString("uz-UZ")}`,
      sub: "so'm",
      icon: DollarSign,
      color: "bg-stone-100 text-stone-700",
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
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

      {/* Rollar */}
      {users.byRole && (
        <div className="bg-white border border-stone-100 rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Rollar bo'yicha
          </h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(users.byRole as Record<string, number>).map(
              ([role, count]) => (
                <div key={role} className="text-center min-w-[60px]">
                  <p className="text-lg font-bold text-slate-900">{count}</p>
                  <p className="text-xs text-slate-500 uppercase">{role}</p>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {/* Oxirgi buyurtmalar */}
      {recent.length > 0 && (
        <div className="bg-white border border-stone-100 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Oxirgi buyurtmalar
          </h3>

          {/* Mobile cards */}
          <div className="space-y-2 md:hidden">
            {recent.slice(0, 8).map((order: any) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{order.order_number}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {order.buyer?.firstName} {order.buyer?.lastName}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-bold text-slate-900">
                    {Number(order.final_amount).toLocaleString("uz-UZ")}
                  </p>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-700">
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-stone-100">
                  <th className="pb-2 pr-4 font-medium">Raqam</th>
                  <th className="pb-2 pr-4 font-medium">Xaridor</th>
                  <th className="pb-2 pr-4 font-medium">Summa</th>
                  <th className="pb-2 pr-4 font-medium">Holat</th>
                  <th className="pb-2 font-medium">Sana</th>
                </tr>
              </thead>
              <tbody>
                {recent.slice(0, 8).map((order: any) => (
                  <tr key={order.id} className="border-b border-stone-50 last:border-0">
                    <td className="py-2.5 pr-4 font-medium text-slate-900">{order.order_number}</td>
                    <td className="py-2.5 pr-4 text-slate-600">
                      {order.buyer?.firstName} {order.buyer?.lastName}
                    </td>
                    <td className="py-2.5 pr-4 font-semibold text-slate-900">
                      {Number(order.final_amount).toLocaleString("uz-UZ")}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-700">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-500 text-xs">
                      {new Date(order.created_at).toLocaleDateString("uz-UZ", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
