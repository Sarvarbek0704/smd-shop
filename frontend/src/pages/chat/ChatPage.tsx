import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetMyRoomsQuery,
  useGetRoomMessagesQuery,
  useMarkRoomReadMutation,
} from "@/store/api/chatApi";
import { useSocket } from "@/hooks/useSocket";
import { useAppSelector } from "@/store/store";
import { selectCurrentUser } from "@/store/slices/authSlice";
import {
  MessageCircle,
  Send,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Image as ImageIcon,
  Check,
  CheckCheck,
  Circle,
  PackageOpen,
  ArrowLeft,
} from "lucide-react";

export function ChatPage() {
  const user = useAppSelector(selectCurrentUser);
  const { connected, emit, on } = useSocket();
  const { data: rooms, refetch: refetchRooms } = useGetMyRoomsQuery();
  const [markRead] = useMarkRoomReadMutation();

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [typing, setTyping] = useState<string | null>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);

  const roomsList = rooms ?? [];
  const selectedRoom = roomsList.find((r: any) => r.id === selectedRoomId);

  // Room messages yuklab olish
  const { data: roomMessages } = useGetRoomMessagesQuery(
    { roomId: selectedRoomId ?? "", limit: 50 },
    { skip: !selectedRoomId },
  );

  // Xonaga qo'shilish va xabarlarni o'rnatish
  useEffect(() => {
    if (!selectedRoomId || !connected) return;

    emit("join_room", { roomId: selectedRoomId });
    markRead(selectedRoomId);

    return () => {
      emit("leave_room", { roomId: selectedRoomId });
    };
  }, [selectedRoomId, connected]);

  useEffect(() => {
    if (roomMessages?.data) {
      setMessages(roomMessages.data);
    }
  }, [roomMessages]);

  // Real-time xabarlar
  useEffect(() => {
    if (!connected) return;

    const unsub1 = on("new_message", (msg: any) => {
      if (msg.roomId === selectedRoomId) {
        setMessages((prev) => [...prev, msg]);
        if (msg.senderId !== user?.id) {
          markRead(selectedRoomId!);
        }
      }
      refetchRooms();
    });

    const unsub2 = on("user_typing", (data: any) => {
      if (data.roomId === selectedRoomId && data.userId !== user?.id) {
        setTyping(data.userId);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTyping(null), 3000);
      }
    });

    const unsub3 = on("user_stop_typing", (data: any) => {
      if (data.roomId === selectedRoomId) {
        setTyping(null);
      }
    });

    const unsub4 = on("messages_read", () => {
      setMessages((prev) =>
        prev.map((m) =>
          m.senderId === user?.id
            ? { ...m, isRead: true, readAt: new Date().toISOString() }
            : m,
        ),
      );
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
    };
  }, [connected, selectedRoomId, user?.id]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const handleSend = () => {
    if (!inputText.trim() || !selectedRoomId) return;

    emit("send_message", {
      roomId: selectedRoomId,
      content: inputText.trim(),
    });

    emit("typing_stop", { roomId: selectedRoomId });
    setInputText("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (value: string) => {
    setInputText(value);
    if (selectedRoomId) {
      emit("typing_start", { roomId: selectedRoomId });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        emit("typing_stop", { roomId: selectedRoomId });
      }, 2000);
    }
  };

  const selectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    setMobileShowChat(true);
    setMessages([]);
    setTyping(null);
  };

  const getOtherUser = (room: any) => {
    if (!user) return null;
    return room.buyerId === user.id ? room.seller : room.buyer;
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("uz-UZ", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Bugun";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Kecha";
    return d.toLocaleDateString("uz-UZ", { day: "numeric", month: "short" });
  };

  // Xabarlarni sana bo'yicha guruhlash
  const groupedMessages = messages.reduce(
    (groups: { date: string; msgs: any[] }[], msg) => {
      const dateStr = new Date(msg.createdAt).toDateString();
      const last = groups[groups.length - 1];
      if (last && new Date(last.msgs[0].createdAt).toDateString() === dateStr) {
        last.msgs.push(msg);
      } else {
        groups.push({ date: dateStr, msgs: [msg] });
      }
      return groups;
    },
    [],
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <Link to="/" className="hover:text-slate-900">
          Bosh sahifa
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-medium">Xabarlar</span>
      </div>

      <div
        className="bg-white border border-stone-200 rounded-2xl overflow-hidden"
        style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}
      >
        <div className="flex h-full">
          {/* Rooms list */}
          <div
            className={`w-full md:w-80 border-r border-stone-100 flex flex-col ${mobileShowChat ? "hidden md:flex" : "flex"}`}
          >
            <div className="p-4 border-b border-stone-100">
              <h2 className="text-lg font-bold text-slate-900">Xabarlar</h2>
              {connected && (
                <span className="text-[10px] text-emerald-600 font-medium">
                  Online
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {roomsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <MessageCircle className="w-12 h-12 text-stone-300 mb-3" />
                  <p className="text-sm text-slate-500">Hali xabarlar yo'q</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Mahsulot sahifasidan sotuvchiga yozing
                  </p>
                </div>
              ) : (
                roomsList.map((room: any) => {
                  const other = getOtherUser(room);
                  const isSelected = room.id === selectedRoomId;

                  return (
                    <button
                      key={room.id}
                      onClick={() => selectRoom(room.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-b border-stone-50 ${
                        isSelected ? "bg-stone-100" : "hover:bg-stone-50"
                      }`}
                    >
                      <div className="w-11 h-11 bg-slate-800 rounded-xl flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
                        {other?.firstName?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {other?.firstName} {other?.lastName}
                          </p>
                          {room.lastMessage && (
                            <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                              {formatTime(room.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-xs text-slate-500 truncate">
                            {room.lastMessage?.content ?? "Xabar yo'q"}
                          </p>
                          {room.unreadCount > 0 && (
                            <span className="ml-2 min-w-[18px] h-[18px] px-1 bg-slate-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                              {room.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {room.product?.name}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat area */}
          <div
            className={`flex-1 flex flex-col ${!mobileShowChat && !selectedRoomId ? "hidden md:flex" : "flex"} ${mobileShowChat ? "" : !selectedRoomId ? "" : ""}`}
          >
            {!selectedRoomId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <div className="w-20 h-20 bg-stone-100 rounded-2xl flex items-center justify-center mb-4">
                  <MessageCircle className="w-10 h-10 text-stone-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-1">
                  Chatni tanlang
                </h3>
                <p className="text-sm text-slate-500">
                  Chap tomondan suhbatni tanlang
                </p>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-3">
                  <button
                    onClick={() => {
                      setMobileShowChat(false);
                      setSelectedRoomId(null);
                    }}
                    className="md:hidden p-1 text-slate-500 hover:text-slate-900"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  {selectedRoom &&
                    (() => {
                      const other = getOtherUser(selectedRoom);
                      return (
                        <>
                          <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
                            {other?.firstName?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900">
                              {other?.firstName} {other?.lastName}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {selectedRoom.product?.name}
                            </p>
                          </div>
                          <Link
                            to={`/products/${selectedRoom.product?.slug}`}
                            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-stone-100 rounded-lg text-xs text-slate-600 hover:bg-stone-200 transition-colors"
                          >
                            <PackageOpen className="w-3.5 h-3.5" />
                            Mahsulot
                          </Link>
                        </>
                      );
                    })()}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm text-slate-400">
                        Hali xabar yo'q. Birinchi bo'lib yozing!
                      </p>
                    </div>
                  ) : (
                    groupedMessages.map((group) => (
                      <div key={group.date}>
                        {/* Date divider */}
                        <div className="flex items-center justify-center my-4">
                          <span className="px-3 py-1 bg-stone-100 text-[11px] text-slate-500 font-medium rounded-full">
                            {formatDate(group.msgs[0].createdAt)}
                          </span>
                        </div>

                        {group.msgs.map((msg: any) => {
                          const isMine = msg.senderId === user?.id;

                          return (
                            <motion.div
                              key={msg.id}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.15 }}
                              className={`flex mb-2 ${isMine ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[75%] sm:max-w-[60%] px-3.5 py-2.5 rounded-2xl ${
                                  isMine
                                    ? "bg-slate-900 text-white rounded-br-md"
                                    : "bg-stone-100 text-slate-900 rounded-bl-md"
                                }`}
                              >
                                {msg.messageType === "image" ? (
                                  <img
                                    src={`/uploads${msg.content}`}
                                    alt=""
                                    className="max-w-full rounded-lg"
                                  />
                                ) : (
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                    {msg.content}
                                  </p>
                                )}
                                <div
                                  className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}
                                >
                                  <span
                                    className={`text-[10px] ${isMine ? "text-slate-400" : "text-slate-400"}`}
                                  >
                                    {formatTime(msg.createdAt)}
                                  </span>
                                  {isMine &&
                                    (msg.isRead ? (
                                      <CheckCheck className="w-3.5 h-3.5 text-amber-400" />
                                    ) : (
                                      <Check className="w-3.5 h-3.5 text-slate-500" />
                                    ))}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ))
                  )}

                  {/* Typing indicator */}
                  {typing && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="px-4 py-2.5 bg-stone-100 rounded-2xl rounded-bl-md">
                        <div className="flex items-center gap-1">
                          <div
                            className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          />
                          <div
                            className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <div
                            className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-stone-100">
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputText}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Xabar yozing..."
                      className="flex-1 px-4 py-2.5 bg-stone-100 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                      autoFocus
                    />
                    <motion.button
                      onClick={handleSend}
                      disabled={!inputText.trim()}
                      whileTap={{ scale: 0.9 }}
                      className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
