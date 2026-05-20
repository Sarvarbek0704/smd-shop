import { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useUploadMultipleImagesMutation,
} from "@/store/api/sellerApi";
import { useGetCategoryTreeQuery } from "@/store/api/categoriesApi";
import { useGetProductByIdQuery } from "@/store/api/productsApi";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  ImagePlus,
  X,
  Plus,
  Trash2,
  GripVertical,
  Package,
  DollarSign,
  Image as ImageIcon,
  Eye,
} from "lucide-react";

const productSchema = z.object({
  name: z.string().min(3, "Kamida 3 ta belgi"),
  categoryId: z.string().min(1, "Kategoriya tanlang"),
  description: z.string().min(10, "Kamida 10 ta belgi"),
  shortDescription: z.string().optional(),
  basePrice: z.coerce.number().min(100, "Kamida 100 so'm"),
  discountPrice: z.coerce.number().optional(),
  discountEndsAt: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

interface VariantRow {
  id: string;
  name: string;
  priceModifier: number;
  stockQuantity: number;
  sku: string;
}

const STEPS = [
  { num: 1, label: "Asosiy", icon: Package },
  { num: 2, label: "Narx va stok", icon: DollarSign },
  { num: 3, label: "Rasmlar", icon: ImageIcon },
  { num: 4, label: "Ko'rib chiqish", icon: Eye },
];

export function SellerProductForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: categories } = useGetCategoryTreeQuery();
  const { data: existingProduct, isLoading: productLoading } = useGetProductByIdQuery(id!, { skip: !isEdit });
  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [uploadImages] = useUploadMultipleImagesMutation();

  const [step, setStep] = useState(1);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    trigger,
    watch,
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { basePrice: 0 },
  });

  const watchedValues = watch();

  useEffect(() => {
    if (existingProduct) {
      reset({
        name: existingProduct.name,
        categoryId: existingProduct.categoryId,
        description: existingProduct.description,
        shortDescription: existingProduct.shortDescription || "",
        basePrice: Number(existingProduct.basePrice),
        discountPrice: existingProduct.discountPrice ? Number(existingProduct.discountPrice) : undefined,
        discountEndsAt: existingProduct.discountEndsAt ? new Date(existingProduct.discountEndsAt).toISOString().slice(0, 16) : "",
      });

      if (existingProduct.variants) {
        setVariants(existingProduct.variants.map((v: any) => ({
          id: v.id,
          name: v.name,
          priceModifier: Number(v.priceModifier),
          stockQuantity: Number(v.stockQuantity),
          sku: v.sku || "",
        })));
      }

      if (existingProduct.images) {
        setExistingImages(existingProduct.images);
        setImagePreviews(existingProduct.images.map((img: any) => `/uploads${img.url}`));
      }
    }
  }, [existingProduct, reset]);

  // Flatten categories for select
  const flatCats: { id: string; name: string; depth: number }[] = [];
  function flatten(cats: any[], depth = 0) {
    cats?.forEach((c: any) => {
      flatCats.push({ id: c.id, name: c.name, depth });
      if (c.children?.length) flatten(c.children, depth + 1);
    });
  }
  flatten(categories ?? []);

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "",
        priceModifier: 0,
        stockQuantity: 0,
        sku: "",
      },
    ]);
  };

  const removeVariant = (vid: string) => {
    setVariants((prev) => prev.filter((v) => v.id !== vid));
  };

  const updateVariant = (vid: string, field: keyof VariantRow, value: any) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === vid ? { ...v, [field]: value } : v))
    );
  };

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (imageFiles.length + files.length > 10) {
      toast.error("Maksimum 10 ta rasm");
      return;
    }
    setImageFiles((prev) => [...prev, ...files]);
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const goNext = async () => {
    if (step === 1) {
      const valid = await trigger([
        "name",
        "categoryId",
        "description",
      ]);
      if (!valid) return;
    }
    if (step === 2) {
      const valid = await trigger(["basePrice"]);
      if (!valid) return;
    }
    setStep((s) => Math.min(s + 1, 4));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  const onSubmit = async (data: ProductForm) => {
    try {
      // Upload images first
      let uploadedImages: any[] = [];
      if (imageFiles.length > 0) {
        const res = await uploadImages({
          folder: "products",
          files: imageFiles,
        }).unwrap();
        uploadedImages = (res as any[]).map((u: any, i: number) => ({
          url: u.url ?? u.path,
          sortOrder: i,
          isPrimary: i === 0,
        }));
      }

      const payload: any = {
        ...data,
        discountEndsAt: data.discountEndsAt || undefined,
        discountPrice: data.discountPrice || undefined,
        ...(uploadedImages.length > 0 && { images: uploadedImages }),
        ...(variants.length > 0 && {
          variants: variants
            .filter((v) => v.name.trim() !== "")
            .map((v) => ({
              name: v.name,
              priceModifier: v.priceModifier,
              stockQuantity: v.stockQuantity,
              sku:
                v.sku?.trim() ||
                `SKU-${Date.now()}-${Math.random()
                  .toString(36)
                  .substring(2, 7)
                  .toUpperCase()}`,
            })),
        }),
      };

      if (isEdit) {
        await updateProduct({ id, ...payload }).unwrap();
        toast.success("Mahsulot yangilandi!");
      } else {
        await createProduct(payload).unwrap();
        toast.success("Mahsulot yaratildi!");
      }
      navigate("/seller/products");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Xatolik yuz berdi");
    }
  };

  const isSubmitting = creating || updating;
  const selectedCat = flatCats.find((c) => c.id === watchedValues.categoryId);

  if (isEdit && productLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate("/seller/products")}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Ortga
      </button>

      <h1 className="text-xl font-bold text-slate-900 mb-6">
        {isEdit ? "Mahsulotni tahrirlash" : "Yangi mahsulot"}
      </h1>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={`w-8 h-px ${
                  step > i ? "bg-slate-900" : "bg-stone-200"
                }`}
              />
            )}
            <button
              onClick={() => s.num < step && setStep(s.num)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                step === s.num
                  ? "bg-slate-900 text-white"
                  : step > s.num
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-stone-100 text-slate-400"
              }`}
            >
              {step > s.num ? (
                <Check className="w-4 h-4" />
              ) : (
                <s.icon className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white border border-stone-200 rounded-2xl p-6 space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Mahsulot nomi *
              </label>
              <input
                {...register("name")}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                placeholder="iPhone 15 Pro Max 256GB"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Kategoriya *
              </label>
              <select
                {...register("categoryId")}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              >
                <option value="">Tanlang...</option>
                {flatCats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {"— ".repeat(c.depth)}
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.categoryId.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Qisqa tavsif
              </label>
              <input
                {...register("shortDescription")}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                placeholder="Qisqacha haqida..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                To'liq tavsif *
              </label>
              <textarea
                {...register("description")}
                rows={5}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
                placeholder="Mahsulot haqida batafsil..."
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 2: Price & Variants */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-5"
          >
            <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-5">
              <h3 className="text-sm font-semibold text-slate-900">
                Narx ma'lumotlari
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Asosiy narx (so'm) *
                  </label>
                  <input
                    type="number"
                    {...register("basePrice")}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="500000"
                  />
                  {errors.basePrice && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.basePrice.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Chegirma narx
                  </label>
                  <input
                    type="number"
                    {...register("discountPrice")}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="450000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Chegirma tugash sanasi
                  </label>
                  <input
                    type="datetime-local"
                    {...register("discountEndsAt")}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Variants */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Variantlar{" "}
                  <span className="text-slate-400 font-normal">
                    (ixtiyoriy)
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={addVariant}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Qo'shish
                </button>
              </div>

              {variants.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">
                  Hali variant qo'shilmagan. Rang, o'lcham kabi variantlar
                  qo'shing.
                </p>
              ) : (
                <div className="space-y-3">
                  {variants.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl"
                    >
                      <GripVertical className="w-4 h-4 text-slate-300 shrink-0 cursor-grab" />
                      <input
                        value={v.name}
                        onChange={(e) =>
                          updateVariant(v.id, "name", e.target.value)
                        }
                        placeholder="Nomi (L / Ko'k)"
                        className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                      <input
                        type="number"
                        value={v.priceModifier}
                        onChange={(e) =>
                          updateVariant(
                            v.id,
                            "priceModifier",
                            Number(e.target.value)
                          )
                        }
                        placeholder="Narx farqi"
                        className="w-28 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                      <input
                        type="number"
                        value={v.stockQuantity}
                        onChange={(e) =>
                          updateVariant(
                            v.id,
                            "stockQuantity",
                            Number(e.target.value)
                          )
                        }
                        placeholder="Stok"
                        className="w-20 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => removeVariant(v.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 3: Images */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white border border-stone-200 rounded-2xl p-6"
          >
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              Rasmlar{" "}
              <span className="text-slate-400 font-normal">(max 10 ta)</span>
            </h3>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {imagePreviews.map((src, i) => (
                <div
                  key={i}
                  className="relative aspect-square bg-stone-100 rounded-xl overflow-hidden group"
                >
                  <img
                    src={src}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {i === 0 && (
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-slate-900 text-white text-[9px] font-bold rounded">
                      ASOSIY
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {imageFiles.length < 10 && (
                <label className="aspect-square bg-stone-50 border-2 border-dashed border-stone-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-slate-400 hover:bg-stone-100 transition-all">
                  <ImagePlus className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="text-[10px] text-slate-400 font-medium">
                    Rasm qo'shish
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageAdd}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="bg-white border border-stone-200 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Asosiy ma'lumotlar
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Nomi</dt>
                  <dd className="text-slate-900 font-medium">
                    {watchedValues.name}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Kategoriya</dt>
                  <dd className="text-slate-900">{selectedCat?.name ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Narx</dt>
                  <dd className="text-slate-900 font-bold">
                    {Number(watchedValues.basePrice || 0).toLocaleString(
                      "uz-UZ"
                    )}{" "}
                    so'm
                  </dd>
                </div>
                {watchedValues.discountPrice && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Chegirma narx</dt>
                    <dd className="text-red-600 font-bold">
                      {Number(watchedValues.discountPrice).toLocaleString(
                        "uz-UZ"
                      )}{" "}
                      so'm
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                Variantlar ({variants.length})
              </h3>
              {variants.length === 0 ? (
                <p className="text-sm text-slate-400">Variantsiz</p>
              ) : (
                <div className="space-y-1">
                  {variants.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between text-sm py-1.5"
                    >
                      <span className="text-slate-700">{v.name}</span>
                      <span className="text-slate-500">
                        {v.priceModifier > 0 && `+${v.priceModifier} so'm`}{" "}
                        · {v.stockQuantity} dona
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Rasmlar ({imageFiles.length})
              </h3>
              {imageFiles.length === 0 ? (
                <p className="text-sm text-slate-400">Rasm yuklanmagan</p>
              ) : (
                <div className="flex gap-2 overflow-x-auto">
                  {imagePreviews.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover shrink-0"
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={step === 1 ? () => navigate("/seller/products") : goBack}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {step === 1 ? "Bekor qilish" : "Ortga"}
          </button>

          {step < 4 ? (
            <motion.button
              type="button"
              onClick={goNext}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
            >
              Keyingi <ArrowRight className="w-4 h-4" />
            </motion.button>
          ) : (
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  {isEdit ? "Yangilash" : "Yaratish"}
                </>
              )}
            </motion.button>
          )}
        </div>
      </form>
    </div>
  );
}
