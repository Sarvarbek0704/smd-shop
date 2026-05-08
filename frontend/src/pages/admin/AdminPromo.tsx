import { useState } from "react";
import { useSendPromoMutation } from "@/store/api/adminApi";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Send, Loader2, Megaphone } from "lucide-react";

export function AdminPromo() {
  const [sendPromo, { isLoading }] = useSendPromoMutation();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Sarlavha va matnni kiriting");
      return;
    }
    try {
      const result: any = await sendPromo({ title, body }).unwrap();
      toast.success(`${result.sent} foydalanuvchiga yuborildi`);
      setTitle("");
      setBody("");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Xatolik");
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 mb-6">
        Promo bildirishnoma
      </h1>

      <div className="bg-white border border-stone-200 rounded-xl p-6 max-w-xl">
        <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-5">
          <Megaphone className="w-7 h-7 text-amber-700" />
        </div>

        <p className="text-sm text-slate-500 mb-6">
          Barcha aktiv foydalanuvchilarga bildirishnoma yuborish. Yangi aksiya,
          chegirma yoki muhim xabar haqida xabardor qiling.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Sarlavha *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              placeholder="Yoz chegirmalari!"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Matn *
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
              placeholder="Barcha elektronikaga 20% chegirma..."
            />
          </div>

          <motion.button
            onClick={handleSend}
            disabled={isLoading}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Hammaga yuborish
          </motion.button>
        </div>
      </div>
    </div>
  );
}
