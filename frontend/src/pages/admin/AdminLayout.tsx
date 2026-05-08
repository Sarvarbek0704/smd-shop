import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingBag,
  Ticket,
  Bell,
  Truck,
} from "lucide-react";

const NAV = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/users", icon: Users, label: "Foydalanuvchilar", end: false },
  { to: "/admin/products", icon: Package, label: "Mahsulotlar", end: false },
  { to: "/admin/orders", icon: ShoppingBag, label: "Buyurtmalar", end: false },
  { to: "/admin/coupons", icon: Ticket, label: "Kuponlar", end: false },
  { to: "/admin/delivery", icon: Truck, label: "Yetkazmalar", end: false },
  { to: "/admin/promo", icon: Bell, label: "Promo", end: false },
];

export function AdminLayout() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        <aside className="w-56 shrink-0 hidden lg:block">
          <div className="sticky top-24">
            <h2 className="text-lg font-bold text-slate-900 mb-4 px-3">
              Admin Panel
            </h2>
            <nav className="space-y-0.5">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-stone-100"
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        <div className="lg:hidden w-full mb-4 overflow-x-auto">
          <div className="flex gap-1 pb-2">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 bg-stone-100"
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
