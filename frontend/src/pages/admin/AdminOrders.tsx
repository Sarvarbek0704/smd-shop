import { Link, useSearchParams } from "react-router-dom";
import { useGetAdminOrdersQuery } from "@/store/api/adminApi";
import { Loader2, PackageOpen } from "lucide-react";

const TABS = [
  { key: "", label: "Barchasi" },
  { key: "pending", label: "Kutilmoqda" },
  { key: "confirmed", label: "Tasdiqlangan" },
  { key: "shipped", label: "Jo'natilgan" },
  { key: "delivered", label: "Yetkazilgan" },
  { key: "cancelled", label: "Bekor qilingan" },
];

const ST: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-violet-100 text-violet-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

export function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  const { data, isLoading } = useGetAdminOrdersQuery({
    ...(status && { status }),
    page,
    limit: 20,
  });
  const orders = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, totalPages: 1 };

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 mb-6">
        Barcha buyurtmalar
      </h1>

      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              const p = new URLSearchParams();
              if (tab.key) p.set("status", tab.key);
              setSearchParams(p);
            }}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${status === tab.key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-stone-100"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <PackageOpen className="w-16 h-16 text-stone-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700">
            Buyurtmalar yo'q
          </h3>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-stone-200">
                <th className="pb-3 pr-4 font-medium">Raqam</th>
                <th className="pb-3 pr-4 font-medium">Xaridor</th>
                <th className="pb-3 pr-4 font-medium">Sotuvchi</th>
                <th className="pb-3 pr-4 font-medium">Summa</th>
                <th className="pb-3 pr-4 font-medium">Holat</th>
                <th className="pb-3 font-medium">Sana</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o: any) => (
                <tr
                  key={o.id}
                  className="border-b border-stone-50 hover:bg-stone-50/50"
                >
                  <td className="py-3 pr-4 font-medium text-slate-900">
                    {o.orderNumber}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {o.buyer?.firstName} {o.buyer?.lastName}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {o.seller?.firstName} {o.seller?.lastName}
                  </td>
                  <td className="py-3 pr-4 font-semibold text-slate-900">
                    {parseFloat(o.finalAmount).toLocaleString("uz-UZ")}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${ST[o.status] ?? "bg-stone-100 text-stone-700"}`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3 text-slate-500 text-xs">
                    {new Date(o.createdAt).toLocaleDateString("uz-UZ", {
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set("page", String(p));
                setSearchParams(params);
              }}
              className={`w-10 h-10 rounded-xl text-sm font-medium ${p === meta.page ? "bg-slate-900 text-white" : "bg-white border border-stone-200 text-slate-600 hover:bg-stone-50"}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
