import { Outlet, Link, useLocation } from "react-router-dom";
import { Truck, ClipboardList, History } from "lucide-react";

const NAV = [
  { to: "/delivery", label: "Buyurtmalar", icon: ClipboardList, end: true },
  { to: "/delivery/history", label: "Tarix", icon: History },
];

export function DeliveryLayout() {
  const location = useLocation();

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
          <Truck className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Kuryer paneli
          </h1>
          <p className="text-xs text-slate-500">
            Buyurtmalarni boshqaring
          </p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 border-b border-stone-200 pb-px overflow-x-auto">
        {NAV.map((item) => {
          const isActive = item.end
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                isActive
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </div>

      <Outlet />
    </div>
  );
}
