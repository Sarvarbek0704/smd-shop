import { useState } from "react";
import { useGetSellerReviewsQuery, useSellerReplyMutation } from "@/store/api/reviewsApi";
import { Star, Loader2, MessageCircle, User, Calendar, Send, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

export function SellerReviews() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetSellerReviewsQuery({ page, limit: 10 });
  const [sendReply, { isLoading: isReplying }] = useSellerReplyMutation();
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

  const reviews = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, totalPages: 1 };

  const handleReply = async (reviewId: string) => {
    const text = replyText[reviewId];
    if (!text?.trim()) return;

    try {
      await sendReply({ id: reviewId, reply: text }).unwrap();
      toast.success("Javob yuborildi");
      setReplyText((prev) => ({ ...prev, [reviewId]: "" }));
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Xatolik yuz berdi");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Sharhlar</h1>
        <div className="bg-slate-100 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600">
          Jami: {meta.total} ta
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-stone-100 rounded-2xl">
          <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mb-4">
            <MessageCircle className="w-8 h-8 text-stone-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">Hali sharhlar yo'q</h3>
          <p className="text-slate-400 text-sm mt-1">Sotuvlaringiz oshgan sari sharhlar paydo bo'ladi</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: any, i: number) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Product Info */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-stone-50">
                <div className="w-10 h-10 bg-stone-100 rounded-lg overflow-hidden shrink-0">
                  {review.product?.images?.[0] && (
                    <img
                      src={`/uploads${review.product.images[0].url}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {review.product?.name ?? "Mahsulot"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${
                            star <= review.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-stone-200"
                          }`}
                        />
                      ))}
                    </div>
                    {review.isVerifiedPurchase && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Tasdiqlangan xarid
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Review Content */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase">
                      {review.user?.firstName?.[0] ?? "U"}
                    </div>
                    <span className="text-sm font-semibold text-slate-700">
                      {review.user?.firstName} {review.user?.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(review.createdAt), "d-MMM, yyyy", { locale: uz })}
                  </div>
                </div>
                {review.title && <h4 className="text-sm font-bold text-slate-800 mb-1">{review.title}</h4>}
                <p className="text-sm text-slate-600 leading-relaxed italic">"{review.body}"</p>
              </div>

              {/* Images if any */}
              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                  {review.images.map((img: string, idx: number) => (
                    <img
                      key={idx}
                      src={`/uploads${img}`}
                      className="w-16 h-16 rounded-xl object-cover border border-stone-100"
                      alt=""
                    />
                  ))}
                </div>
              )}

              {/* Reply Section */}
              <div className="mt-4 pt-4 border-t border-stone-50">
                {review.sellerReply ? (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 relative">
                    <div className="absolute -top-2 left-4 px-2 bg-slate-100 text-[10px] font-bold text-slate-500 rounded uppercase tracking-wider">
                      Sizning javobingiz
                    </div>
                    <p className="text-sm text-slate-700">{review.sellerReply}</p>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Mijozga javob yozing..."
                      value={replyText[review.id] ?? ""}
                      onChange={(e) =>
                        setReplyText((prev) => ({ ...prev, [review.id]: e.target.value }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && handleReply(review.id)}
                      className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-all"
                    />
                    <button
                      onClick={() => handleReply(review.id)}
                      disabled={isReplying || !replyText[review.id]?.trim()}
                      className="bg-slate-900 text-white p-2.5 rounded-xl hover:bg-slate-800 disabled:opacity-40 transition-all shadow-sm active:scale-95"
                    >
                      {isReplying ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                p === page
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                  : "bg-white border border-stone-200 text-slate-500 hover:border-slate-400"
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
