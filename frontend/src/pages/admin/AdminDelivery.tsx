import {
  useGetAllDeliveriesQuery,
  useGetDeliveryStatsQuery,
} from "@/store/api/adminApi";
import { Loader2, Truck, MapPin } from "lucide-react";

const ST: Record<string, string> = {
  waiting: "bg-amber-100 text-amber-800",
  assigned: "bg-blue-100 text-blue-800",
  picked_up: "bg-indigo-100 text-indigo-800",
  on_the_way: "bg-violet-100 text-violet-800",
  delivered: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
};

export function AdminDelivery() {
  const { data: stats, isLoading: statsLoading } = useGetDeliveryStatsQuery();
  const { data, isLoading } = useGetAllDeliveriesQuery({ limit: 30 });

  const deliveries = data?.data ?? [];

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 mb-6">Yetkazmalar</h1>

      {/* Stats */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {Object.entries(ST).map(([key, color]) => (
            <div
              key={key}
              className="bg-white border border-stone-100 rounded-xl p-3 text-center"
            >
              <p className="text-lg font-bold text-slate-900">
                {(stats as any)[key] ?? 0}
              </p>
              <span
                className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold mt-1 ${color}`}
              >
                {key}
              </span>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      ) : deliveries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Truck className="w-16 h-16 text-stone-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700">
            Yetkazmalar yo'q
          </h3>
        </div>
      ) : (
        <div className="space-y-2.5">
          {deliveries.map((d: any) => (
            <div
              key={d.id}
              className="bg-white border border-stone-100 rounded-xl p-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {d.order?.orderNumber ?? "Noma'lum"}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  {d.courier && (
                    <span>
                      Kuryer: {d.courier.firstName} {d.courier.lastName}
                    </span>
                  )}
                  {!d.courier && (
                    <span className="text-amber-600">Kuryer tayinlanmagan</span>
                  )}
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 ${ST[d.status] ?? "bg-stone-100 text-stone-700"}`}
              >
                {d.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
