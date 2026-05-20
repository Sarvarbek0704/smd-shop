import { useState } from "react";
import { motion } from "framer-motion";
import { useGetAdminReviewsQuery, usePublishReviewMutation, useUnpublishReviewMutation } from "@/store/api/adminApi";
import toast from "react-hot-toast";
import {
  Loader2,
  Star,
  MessageSquare,
  Search,
  EyeOff,
  Eye,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export function AdminReviews() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | "">("");

  const { data, isLoading, isFetching } = useGetAdminReviewsQuery({
    page,
    limit: 20,
    search: search || undefined,
    rating: ratingFilter || undefined,
  });

  const [publishReview] = usePublishReviewMutation();
  const [unpublishReview] = useUnpublishReviewMutation();

  const reviews = data?.data ?? data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, totalPages: 1 };

  const handleTogglePublish = async (id: string, isPublished: boolean) => {
    try {
      if (isPublished) {
        await unpublishReview(id).unwrap();
        toast.success("Sharh yashirildi");
      } else {
        await publishReview(id).unwrap();
        toast.success("Sharh ko'rsatildi");
      }
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Xatolik");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-slate-700" />
        <h1 className="text-xl font-bold text-slate-900">Sharhlar moderatsiyasi</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Mahsulot yoki foydalanuvchi..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {[1, 2, 3, 4, 5].map((r) => (
            <button
              key={r}
              onClick={() => { setRatingFilter(ratingFilter === r ? "" : r); setPage(1); }}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium border transition-all whitespace-nowrap ${
                ratingFilter === r
                  ? "bg-slate-900 text-white border-slate-900"
                  : "border-stone-200 text-slate-600 hover:border-stone-400"
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${ratingFilter === r ? "fill-white" : "fill-amber-400 text-amber-400"}`} />
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-stone-100 rounded-xl">
          <MessageSquare className="w-12 h-12 text-stone-300 mb-3" />
          <p className="text-slate-500 font-medium">Sharhlar topilmadi</p>
        </div>
      ) : (
        <div className={`space-y-2 transition-opacity ${isFetching ? "opacity-60" : ""}`}>
          {reviews.map((review: any, i: number) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`bg-white border rounded-xl p-4 ${
                !review.isPublished ? "border-red-100 bg-red-50/30" : "border-stone-100"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {review.user?.firstName?.[0]?.toUpperCase() ?? "U"}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {review.user?.firstName} {review.user?.lastName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {review.product?.name ?? "Mahsulot"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Stars */}
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }, (_, idx) => (
                          <Star
                            key={idx}
                            className={`w-3.5 h-3.5 ${
                              idx < review.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-stone-200"
                            }`}
                          />
                        ))}
                      </div>
                      {/* Status badge */}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          review.isPublished
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {review.isPublished ? "Ko'rinmoqda" : "Yashirilgan"}
                      </span>
                    </div>
                  </div>

                  {review.title && (
                    <p className="text-sm font-medium text-slate-900 mt-2">{review.title}</p>
                  )}
                  {review.body && (
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">{review.body}</p>
                  )}

                  {review.sellerReply && (
                    <div className="mt-2 pl-3 border-l-2 border-slate-200">
                      <p className="text-[11px] text-slate-400 font-medium mb-0.5">Seller javobi:</p>
                      <p className="text-xs text-slate-600">{review.sellerReply}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <p className="text-[11px] text-slate-400">
                      {new Date(review.createdAt).toLocaleDateString("uz-UZ", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                      {review.isVerifiedPurchase && (
                        <span className="ml-2 text-emerald-600 font-medium">✓ Tasdiqlangan xarid</span>
                      )}
                    </p>
                    <button
                      onClick={() => handleTogglePublish(review.id, review.isPublished)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        review.isPublished
                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                          : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      }`}
                    >
                      {review.isPublished ? (
                        <><EyeOff className="w-3.5 h-3.5" /> Yashirish</>
                      ) : (
                        <><Eye className="w-3.5 h-3.5" /> Ko'rsatish</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-slate-500">
            Jami: {meta.total} ta sharh
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-stone-200 text-slate-600 hover:bg-stone-100 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-700 font-medium px-2">
              {page} / {meta.totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(meta.totalPages, page + 1))}
              disabled={page === meta.totalPages}
              className="p-2 rounded-lg border border-stone-200 text-slate-600 hover:bg-stone-100 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
