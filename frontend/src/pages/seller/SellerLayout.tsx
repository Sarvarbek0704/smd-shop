import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Star,
  BarChart3,
  MessageCircle,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/seller", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/seller/products", icon: Package, label: "Mahsulotlar", end: false },
  { to: "/seller/orders", icon: ShoppingBag, label: "Buyurtmalar", end: false },
  { to: "/seller/reviews", icon: Star, label: "Sharhlar", end: false },
  { to: "/seller/analytics", icon: BarChart3, label: "Analitika", end: false },
  { to: "/seller/chat", icon: MessageCircle, label: "Xabarlar", end: false },
];

export function SellerLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  // Current page label for breadcrumb
  const currentItem = NAV_ITEMS.find((item) =>
    item.end
      ? location.pathname === item.to
      : location.pathname.startsWith(item.to)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* ── Mobile top bar ── */}
      <div className="lg:hidden flex items-center gap-3 mb-5">
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 transition-colors"
          aria-label="Menyuni ochish"
        >
          <Menu className="w-5 h-5 text-slate-700" />
        </button>
        <div>
          <p className="text-xs text-slate-400 leading-none mb-0.5">Seller Panel</p>
          <h2 className="text-base font-bold text-slate-900 leading-none">
            {currentItem?.label ?? ""}
          </h2>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setDrawerOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl flex flex-col lg:hidden"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
                <div>
                  <p className="text-xs text-slate-400">Panel</p>
                  <h2 className="text-base font-bold text-slate-900">Seller</h2>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-xl hover:bg-stone-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Drawer nav */}
              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
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
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex gap-6">
        {/* ── Desktop sidebar ── */}
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

        {/* ── Content ── */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
