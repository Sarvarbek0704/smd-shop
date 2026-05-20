import { useSearchParams, Link } from "react-router-dom";
import {
  useGetAdminProductsQuery,
  useSetProductStatusMutation,
} from "@/store/api/adminApi";
import toast from "react-hot-toast";
import {
  Loader2,
  PackageOpen,
  Eye,
  Star,
  Ban,
  Check,
  RotateCcw,
} from "lucide-react";

const TABS = [
  { key: "", label: "Barchasi" },
  { key: "active", label: "Aktiv" },
  { key: "draft", label: "Qoralama" },
  { key: "banned", label: "Bloklangan" },
];

export function AdminProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  const { data, isLoading } = useGetAdminProductsQuery({
    page,
    limit: 20,
    ...(status && { status }),
  });
  const [setStatus] = useSetProductStatusMutation();

  const products = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, totalPages: 1 };

  const handleStatus = async (id: string, newStatus: string) => {
    try {
      await setStatus({ id, status: newStatus }).unwrap();
      toast.success("Holat yangilandi");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Xatolik");
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 mb-6">
        Mahsulotlar moderatsiyasi
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
            className={`px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              status === tab.key
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-stone-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <PackageOpen className="w-16 h-16 text-stone-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700">
            Mahsulot yo'q
          </h3>
        </div>
      ) : (
        <div className="space-y-2.5">
          {products.map((product: any) => {
            const img =
              product.images?.find((i: any) => i.isPrimary) ??
              product.images?.[0];
            const isBanned = product.status === "banned";
            const isActive = product.status === "active";

            return (
              <div
                key={product.id}
                className="bg-white border border-stone-100 rounded-xl p-4 flex items-center gap-3 sm:gap-4"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-stone-100 rounded-lg overflow-hidden shrink-0">
                  {img ? (
                    <img
                      src={`/uploads${img.url}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PackageOpen className="w-6 h-6 text-stone-300" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 truncate">
                    {product.name}
                  </h3>
                  <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 mt-0.5">
                    <span>
                      {parseFloat(product.basePrice).toLocaleString("uz-UZ")}{" "}
                      so'm
                    </span>
                    {product.ratingCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {parseFloat(product.ratingAvg).toFixed(1)}
                      </span>
                    )}
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        isBanned
                          ? "bg-red-100 text-red-700"
                          : isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-stone-100 text-stone-700"
                      }`}
                    >
                      {product.status}
                    </span>
                    <span className="hidden sm:inline">Seller: {product.seller?.firstName ?? "?"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Link
                    to={`/products/${product.slug}`}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  {isBanned ? (
                    <button
                      onClick={() => handleStatus(product.id, "active")}
                      className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Faollashtirish"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  ) : isActive ? (
                    <button
                      onClick={() => handleStatus(product.id, "banned")}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Bloklash"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatus(product.id, "active")}
                      className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Aktiv qilish"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
