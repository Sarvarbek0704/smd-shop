import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Star,
  BarChart3,
  MessageCircle,
  Plus,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/seller", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/seller/products", icon: Package, label: "Mahsulotlar", end: false },
  { to: "/seller/orders", icon: ShoppingBag, label: "Buyurtmalar", end: false },
  { to: "/seller/reviews", icon: Star, label: "Sharhlar", end: false },
  { to: "/seller/chat", icon: MessageCircle, label: "Xabarlar", end: false },
];

export function SellerLayout() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        {/* Sidebar — desktop */}
        <aside className="w-56 shrink-0 hidden lg:block">
          <div className="sticky top-24">
            <h2 className="text-lg font-bold text-slate-900 mb-4 px-3">
              Seller Panel
            </h2>
            <nav className="space-y-0.5">
              {NAV_ITEMS.map((item) => (
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

        {/* Mobile nav */}
        <div className="lg:hidden w-full mb-4 overflow-x-auto">
          <div className="flex gap-1 pb-2">
            {NAV_ITEMS.map((item) => (
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

        {/* Content */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
