import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingBag,
  Ticket,
  Bell,
  Truck,
  BarChart3,
  FolderTree,
  MessageSquare,
  GalleryHorizontal,
  Store,
  CreditCard,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

const NAV = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/analytics", icon: BarChart3, label: "Analitika", end: false },
  { to: "/admin/users", icon: Users, label: "Foydalanuvchilar", end: false },
  { to: "/admin/sellers", icon: Store, label: "Sellerlar", end: false },
  { to: "/admin/categories", icon: FolderTree, label: "Kategoriyalar", end: false },
  { to: "/admin/products", icon: Package, label: "Mahsulotlar", end: false },
  { to: "/admin/orders", icon: ShoppingBag, label: "Buyurtmalar", end: false },
  { to: "/admin/payments", icon: CreditCard, label: "To'lovlar", end: false },
  { to: "/admin/coupons", icon: Ticket, label: "Kuponlar", end: false },
  { to: "/admin/delivery", icon: Truck, label: "Yetkazmalar", end: false },
  { to: "/admin/banners", icon: GalleryHorizontal, label: "Bannerlar", end: false },
  { to: "/admin/reviews", icon: MessageSquare, label: "Sharhlar", end: false },
  { to: "/admin/promo", icon: Bell, label: "Promo", end: false },
];

function NavItems({ onClose }: { onClose?: () => void }) {
  return (
    <nav className="space-y-0.5">
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-stone-100"
            }`
          }
        >
          <item.icon className="w-4 h-4 shrink-0" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  // Get current page label for mobile breadcrumb
  const currentNav = NAV.find((n) =>
    n.end
      ? location.pathname === n.to
      : location.pathname.startsWith(n.to)
  );

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ── Mobile top bar ── */}
      <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-stone-200 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-xl hover:bg-stone-100 transition-colors"
            aria-label="Menyuni ochish"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-medium text-slate-400">Admin</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-semibold text-slate-900">
              {currentNav?.label ?? "Panel"}
            </span>
          </div>
        </div>
        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
          <span className="text-white text-xs font-bold">A</span>
        </div>
      </div>

      {/* ── Mobile drawer overlay ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-50 lg:hidden shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
                <h2 className="text-base font-bold text-slate-900">Admin Panel</h2>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-xl hover:bg-stone-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <NavItems onClose={() => setDrawerOpen(false)} />
              </div>
              <div className="px-5 py-4 border-t border-stone-100">
                <p className="text-xs text-slate-400">Admin boshqaruv paneli</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main layout ── */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="w-56 shrink-0 hidden lg:block">
            <div className="sticky top-24">
              <h2 className="text-lg font-bold text-slate-900 mb-4 px-3">
                Admin Panel
              </h2>
              <NavItems />
            </div>
          </aside>

          {/* Page content */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
