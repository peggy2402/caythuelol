'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useLanguage } from '@/lib/i18n';
import { toast } from 'sonner';
import { Send, User, Shield, MapPin, Loader2, MessageSquare } from 'lucide-react';

interface Message {
  _id: string;
  content: string;
  sender_id: {
    _id: string;
    username: string;
    profile: { avatar: string };
    role: string;
  };
  created_at: string;
  is_system_message: boolean;
}

interface OrderDetails {
  _id: string;
  status: string;
  service_type: string;
  details: {
    current_rank: string;
    desired_rank: string;
    server: string;
    account_username: string;
  };
  pricing: {
    total_amount: number;
  };
  created_at: string;
}

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); // Unwrap params (Next.js 15/14 pattern)
  const { t } = useLanguage();
  
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Lấy thông tin user hiện tại từ localStorage (để xác định tin nhắn của mình)
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setCurrentUser(JSON.parse(userStr));
  }, []);

  // Fetch Order & Messages
  const fetchData = async () => {
    try {
      // 1. Fetch Messages
      const msgRes = await fetch(`/api/orders/${id}/messages`);
      const msgData = await msgRes.json();
      
      if (msgRes.ok) {
        setMessages(msgData.messages);
      }

      // 2. Fetch Order Details (Tạm thời dùng API list và filter vì chưa có API get single order)
      // Trong thực tế bạn nên tạo thêm API GET /api/orders/[id]
      const orderRes = await fetch('/api/orders'); 
      const orderData = await orderRes.json();
      if (orderRes.ok) {
        // Tìm đơn hàng trong danh sách trả về (Available hoặc MyOrders)
        const allOrders = [...(orderData.orders || []), ...(orderData.availableOrders || []), ...(orderData.myOrders || [])];
        const found = allOrders.find((o: any) => o._id === id);
        if (found) setOrder(found);
      }

    } catch (error) {
      console.error(error);
      toast.error(t('serverError'));
    } finally {
      setLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchData();
  }, [id]);

  // Polling Messages (Realtime simulation) - 3 giây/lần
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!id) return;
      const res = await fetch(`/api/orders/${id}/messages`);
      if (res.ok) {
        const data = await res.json();
        // Chỉ update nếu có tin nhắn mới (so sánh độ dài)
        setMessages(prev => {
            if (data.messages.length !== prev.length) return data.messages;
            return prev;
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [id]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const res = await fetch(`/api/orders/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessages([...messages, data.message]);
        setNewMessage('');
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>;
  if (!order) return <div className="text-center py-20 text-zinc-500">Order not found</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      {/* Left Column: Order Info */}
      <div className="lg:col-span-1 space-y-6 overflow-y-auto pr-2">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            {t('orderDetails')}
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b border-zinc-800">
              <span className="text-zinc-400">Mã đơn:</span>
              <span className="text-white font-mono">#{order._id.slice(-6)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-800">
              <span className="text-zinc-400">Dịch vụ:</span>
              <span className="text-blue-400 font-bold">{order.service_type}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-800">
              <span className="text-zinc-400">Rank:</span>
              <span className="text-white">{order.details.current_rank} ➔ {order.details.desired_rank}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-800">
              <span className="text-zinc-400">Server:</span>
              <span className="text-white flex items-center gap-1"><MapPin className="w-3 h-3" /> {order.details.server}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-800">
              <span className="text-zinc-400">Trạng thái:</span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                order.status === 'COMPLETED' ? 'bg-green-500/20 text-green-500' :
                order.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-500' :
                'bg-zinc-800 text-zinc-400'
              }`}>
                {order.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Chat */}
      <div className="lg:col-span-2 flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden h-full">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-blue-500" />
          <h3 className="font-bold text-white">{t('chatTitle')}</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-950/50">
          {messages.map((msg) => {
            const isMe = msg.sender_id._id === currentUser?._id;
            return (
              <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-4 py-2 rounded-2xl text-sm max-w-[80%] ${isMe ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-200'}`}>
                  {msg.content}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-zinc-900 border-t border-zinc-800">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={t('typeMessage')} className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
            <button type="submit" disabled={sending || !newMessage.trim()} className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-lg">{sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
