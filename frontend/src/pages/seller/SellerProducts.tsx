import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  useGetSellerProductsQuery,
  useDeleteProductMutation,
} from "@/store/api/sellerApi";
import toast from "react-hot-toast";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  PackageOpen,
  Star,
  MoreVertical,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Qoralama", color: "bg-stone-100 text-stone-700" },
  active: { label: "Aktiv", color: "bg-emerald-100 text-emerald-700" },
  banned: { label: "Bloklangan", color: "bg-red-100 text-red-700" },
  out_of_stock: { label: "Stok tugagan", color: "bg-amber-100 text-amber-700" },
};

export function SellerProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const status = searchParams.get("status") ?? "";

  const { data, isLoading } = useGetSellerProductsQuery({
    page,
    limit: 20,
    ...(status && { status }),
  });
  const [deleteProduct] = useDeleteProductMutation();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const products = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, totalPages: 1 };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" ni o'chirishni xohlaysizmi?`)) return;
    try {
      await deleteProduct(id).unwrap();
      toast.success("Mahsulot o'chirildi");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Xatolik");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900">Mahsulotlar</h1>
        <Link
          to="/seller/products/new"
          className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Yangi
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {[
          { key: "", label: "Barchasi" },
          { key: "active", label: "Aktiv" },
          { key: "draft", label: "Qoralama" },
          { key: "out_of_stock", label: "Stok tugagan" },
        ].map((tab) => (
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
          <h3 className="text-lg font-semibold text-slate-700 mb-1">
            Mahsulot yo'q
          </h3>
          <Link
            to="/seller/products/new"
            className="mt-3 text-sm text-slate-500 hover:text-slate-900"
          >
            Birinchi mahsulotni qo'shing
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {products.map((product: any) => {
            const st = STATUS_LABELS[product.status] ?? {
              label: product.status,
              color: "bg-stone-100 text-stone-700",
            };
            const primaryImage =
              product.images?.find((i: any) => i.isPrimary) ??
              product.images?.[0];

            return (
              <div
                key={product.id}
                className="bg-white border border-stone-100 rounded-xl p-4 flex items-center gap-4 hover:shadow-sm transition-all"
              >
                {/* Image */}
                <div className="w-16 h-16 bg-stone-100 rounded-lg overflow-hidden shrink-0">
                  {primaryImage ? (
                    <img
                      src={`/uploads${primaryImage.url}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PackageOpen className="w-6 h-6 text-stone-300" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">
                      {product.name}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${st.color}`}
                    >
                      {st.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>
                      {parseFloat(product.basePrice).toLocaleString("uz-UZ")}{" "}
                      so'm
                    </span>
                    {product.ratingCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {parseFloat(product.ratingAvg).toFixed(1)} (
                        {product.ratingCount})
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {product.viewCount}
                    </span>
                    <span>{product.variants?.length ?? 0} variant</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    to={`/products/${product.slug}`}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-stone-100 rounded-lg transition-colors"
                    title="Ko'rish"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <Link
                    to={`/seller/products/${product.id}/edit`}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-stone-100 rounded-lg transition-colors"
                    title="Tahrirlash"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id, product.name)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="O'chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
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
              className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                p === meta.page
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-stone-200 text-slate-600 hover:bg-stone-50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
