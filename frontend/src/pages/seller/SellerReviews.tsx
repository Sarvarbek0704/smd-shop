import { Link } from "react-router-dom";
import { useGetSellerProductsQuery } from "@/store/api/sellerApi";
import { Star, Loader2, MessageCircle, PackageOpen } from "lucide-react";

export function SellerReviews() {
  const { data, isLoading } = useGetSellerProductsQuery({ limit: 50 });

  const products = (data?.data ?? []).filter((p: any) => p.ratingCount > 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 mb-6">Sharhlar</h1>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <MessageCircle className="w-16 h-16 text-stone-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700">
            Hali sharhlar yo'q
          </h3>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product: any) => {
            const image = product.images?.[0];
            const avg = parseFloat(product.ratingAvg);
            const rounded = Math.round(avg);

            return (
              <div
                key={product.id}
                className="bg-white border border-stone-100 rounded-xl p-4 flex items-center gap-4"
              >
                <div className="w-14 h-14 bg-stone-100 rounded-lg overflow-hidden shrink-0">
                  {image ? (
                    <img
                      src={`/uploads${image.url}`}
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
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rounded
                              ? "fill-amber-400 text-amber-400"
                              : "text-stone-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-slate-700">
                      {avg.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-400">
                      ({product.ratingCount} sharh)
                    </span>
                  </div>
                </div>

                <Link
                  to={`/products/${product.slug}`}
                  className="px-3 py-1.5 bg-stone-100 text-slate-600 text-xs font-medium rounded-lg hover:bg-stone-200 transition-colors"
                >
                  Ko'rish
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
