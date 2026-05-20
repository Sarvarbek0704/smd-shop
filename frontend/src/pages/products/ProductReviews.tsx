import { useState } from "react";
import { useGetProductReviewsQuery, useCreateReviewMutation, useDeleteReviewMutation } from "@/store/api/reviewsApi";
import { useAppSelector } from "@/store/store";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Star, Loader2, MessageSquare, Trash2, ShieldCheck } from "lucide-react";

const reviewSchema = z.object({
  rating: z.number().min(1, "Bahoni tanlang").max(5),
  title: z.string().optional(),
  body: z.string().min(5, "Kamida 5 ta harf yozing").optional().or(z.literal("")),
});

type ReviewForm = z.infer<typeof reviewSchema>;

export function ProductReviews({ slug, productId }: { slug: string; productId: string }) {
  const { data, isLoading } = useGetProductReviewsQuery({ productId });
  const [createReview, { isLoading: isSubmitting }] = useCreateReviewMutation();
  const [deleteReview] = useDeleteReviewMutation();
  
  const user = useAppSelector(selectCurrentUser);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, title: "", body: "" },
  });

  const rating = watch("rating");
  const reviews = data?.data ?? data ?? [];

  const onSubmit = async (formData: ReviewForm) => {
    try {
      await createReview({
        productId,
        orderId: "", // Optional backend side if allowed without order
        ...formData,
      }).unwrap();
      toast.success("Sharhingiz qo'shildi!");
      setIsFormOpen(false);
      reset();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Xatolik yuz berdi");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("O'chirmoqchimisiz?")) return;
    try {
      await deleteReview(id).unwrap();
      toast.success("O'chirildi");
    } catch (err: any) {
      toast.error("O'chirishda xatolik");
    }
  };

  if (isLoading) {
    return (
      <div className="py-10 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  // Calculate averages
  const avg = reviews.length ? reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviews.length : 0;
  const counts = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter((r: any) => r.rating === stars).length,
    percent: reviews.length ? (reviews.filter((r: any) => r.rating === stars).length / reviews.length) * 100 : 0
  }));

  const userReview = user ? reviews.find((r: any) => r.userId === user.id) : null;

  return (
    <div className="mt-16 pt-10 border-t border-stone-200">
      <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
        <MessageSquare className="w-6 h-6" /> Mahsulot sharhlari
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        {/* Stats */}
        <div className="bg-stone-50 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
          <div className="text-5xl font-extrabold text-slate-900 mb-2">{avg.toFixed(1)}</div>
          <div className="flex gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(avg) ? "fill-amber-400 text-amber-400" : "text-stone-300"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-slate-500">{reviews.length} ta sharh</p>
        </div>

        {/* Bars */}
        <div className="md:col-span-2 space-y-2">
          {counts.map(({ stars, count, percent }) => (
            <div key={stars} className="flex items-center gap-3 text-sm">
              <span className="w-12 text-slate-600 font-medium flex items-center gap-1">
                {stars} <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              </span>
              <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="w-10 text-right text-slate-400 text-xs">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form Toggle */}
      {user && !userReview && (
        <div className="mb-8">
          {!isFormOpen ? (
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-6 py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors"
            >
              Sharh qoldirish
            </button>
          ) : (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-stone-50 rounded-2xl p-6 border border-stone-200"
              onSubmit={handleSubmit(onSubmit)}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900">Yangi sharh</h3>
                <button type="button" onClick={() => setIsFormOpen(false)} className="text-sm text-slate-500 hover:text-slate-900">
                  Bekor qilish
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Baho *</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setValue("rating", star, { shouldValidate: true })}
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          star <= (hoveredStar || rating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-stone-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {errors.rating && <p className="text-red-500 text-xs mt-1">{errors.rating.message}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Sarlavha (ixtiyoriy)</label>
                <input
                  {...register("title")}
                  className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="Qisqacha xulosa"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Sharh matni</label>
                <textarea
                  {...register("body")}
                  rows={4}
                  className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                  placeholder="Mahsulot haqida fikringiz..."
                />
                {errors.body && <p className="text-red-500 text-xs mt-1">{errors.body.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Yuborish
              </button>
            </motion.form>
          )}
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-slate-500 text-center py-8">Hali sharhlar yo'q. Birinchi bo'lib sharh qoldiring!</p>
        ) : (
          <AnimatePresence>
            {reviews.map((review: any) => (
              <motion.div
                key={review.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-stone-100 rounded-2xl p-6 hover:border-stone-200 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {review.user?.firstName?.[0]?.toUpperCase() ?? "U"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {review.user?.firstName} {review.user?.lastName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(review.createdAt).toLocaleDateString("uz-UZ", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {user?.id === review.userId && (
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= review.rating ? "fill-amber-400 text-amber-400" : "text-stone-200"
                      }`}
                    />
                  ))}
                </div>

                {review.title && <h4 className="font-semibold text-slate-900 mb-1">{review.title}</h4>}
                {review.body && <p className="text-sm text-slate-600 leading-relaxed mb-4">{review.body}</p>}

                {/* Seller Reply */}
                {review.sellerReply && (
                  <div className="mt-4 bg-stone-50 rounded-xl p-4 border border-stone-100 flex gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 mb-1">Sotuvchi javobi</p>
                      <p className="text-sm text-slate-600 italic">{review.sellerReply}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
