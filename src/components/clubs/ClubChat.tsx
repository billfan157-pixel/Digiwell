import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Send, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import AvatarFrame, { getFrameEffects, getRankTitle } from "../AvatarFrame";

interface Message {
  id: string;
  club_id: string;
  user_id: string;
  message: string;
  message_type: 'text' | 'system';
  created_at: string;
  profiles?: {
    nickname: string;
    avatar_url: string | null;
    level: number;
  };
}

export default function ClubChat({ clubId, userId }: { clubId: string; userId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    if (!clubId || clubId === 'undefined') return;

    const { data, error } = await supabase
      .from("club_messages")
      .select(`*, profiles (nickname, avatar_url, level)`)
      .eq("club_id", clubId)
      .order("created_at", { ascending: true })
      .limit(100); // Nên có limit để tránh tràn RAM

    if (!error && data) {
      setMessages(data);
      setTimeout(scrollBottom, 100);
    }
  };

  // HÀM TỐI ƯU REALTIME: Chỉ fetch tin mới nhất
  const fetchNewMessage = async (msgId: string) => {
    const { data } = await supabase
      .from("club_messages")
      .select(`*, profiles (nickname, avatar_url, level)`)
      .eq("id", msgId)
      .single();
      
    if (data) {
      setMessages((prev) => [...prev, data]);
      setTimeout(scrollBottom, 100);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchMessages();

    const channel = supabase
      .channel(`club-chat-${clubId}`)
      .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "club_messages",
          filter: `club_id=eq.${clubId}`,
        },
        (payload: any) => {
          // GỌI HÀM NÀY THAY VÌ FETCH TOÀN BỘ
          fetchNewMessage(payload.new.id);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [clubId]);

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault(); // CHẶN LOAD TRANG KHI BẤM ENTER
    if (!text.trim()) return;

    setSending(true);
    
    // Lưu lại text lỡ lỗi còn khôi phục được
    const tempText = text.trim();
    setText(""); 

    const { error } = await supabase.from("club_messages").insert({
      club_id: clubId,
      user_id: userId,
      message: tempText,
      message_type: 'text' // Mặc định là text
    });

    if (error) {
      toast.error("Không gửi được tin nhắn");
      setText(tempText); // Trả lại text cho user
    }

    setSending(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* message list */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((msg) => {
          const mine = msg.user_id === userId;

          // RENDER TIN NHẮN HỆ THỐNG
          if (msg.message_type === 'system') {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <span className="bg-white/10 text-slate-400 text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full font-bold">
                  {msg.message}
                </span>
              </div>
            );
          }

          // RENDER TIN NHẮN BÌNH THƯỜNG
          return (
            <div key={msg.id} className={`flex items-end gap-3 ${mine ? "justify-end" : "justify-start"}`}>
              {!mine && (
                <div className="flex-shrink-0">
                  <AvatarFrame 
                    level={msg.profiles?.level || 1}
                    avatarUrl={msg.profiles?.avatar_url || null}
                    size="sm"
                    showBadge={false}
                  />
                </div>
              )}
              <div className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-md ${
                  mine ? "bg-cyan-500 text-black rounded-tr-sm" : "bg-slate-800 text-white rounded-tl-sm border border-white/5"
                }`}
              >
                {!mine && (
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[11px] text-cyan-400 font-black">
                      {msg.profiles?.nickname || "Đồng đạo"}
                    </p>
                    <span className={`text-[9px] font-bold uppercase ${getFrameEffects(msg.profiles?.level || 1).textColor}`}>
                      {getRankTitle(msg.profiles?.level || 1)}
                    </span>
                  </div>
                )}
                <p className="text-sm leading-relaxed">{msg.message}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* input - ĐỔI THÀNH FORM ĐỂ BẮT SỰ KIỆN ENTER */}
      <form onSubmit={sendMessage} className="border-t border-slate-800 p-3 flex gap-2 bg-slate-900/50">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nhắn gì đó cho bang hội..."
          className="flex-1 bg-slate-800 border border-white/5 text-white rounded-xl px-4 py-3 outline-none focus:border-cyan-500/50 transition-colors"
        />

        <button
          type="submit"
          disabled={sending || !text.trim()} // Rỗng thì mờ nút luôn
          className="w-12 h-12 rounded-xl bg-cyan-500 flex items-center justify-center text-black active:scale-95 transition-transform disabled:opacity-50"
        >
          {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
}