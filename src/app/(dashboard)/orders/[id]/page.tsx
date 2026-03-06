'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useLanguage } from '@/lib/i18n';
import { toast } from 'sonner';
import { Send, User, Shield, MapPin, Loader2, MessageSquare, Swords, Trophy, XCircle, ChevronDown, ChevronUp, X, Minimize2, Maximize2 } from 'lucide-react';

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
  serviceType: string;
  details: {
    current_rank: string;
    desired_rank: string;
    server: string;
    account_username: string;
    [key: string]: any;
  };
  pricing: {
    total_amount: number;
    deposit_amount?: number;
  };
  payment?: {
    deposit_paid: boolean;
  };
  createdAt: string;
  // New fields
  match_history?: Array<{
    match_id?: string;
    mode: string;
    champion: string;
    result: 'WIN' | 'LOSS';
    lp_change: number;
    reason?: string;
  }>;
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
  const [showDetails, setShowDetails] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  
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

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
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

  const isBooster = currentUser?.role === 'BOOSTER';
  const chatTitle = isBooster ? 'Trao đổi với Khách hàng' : t('chatTitle');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)] relative">
      {/* Left Column: Order Info */}
      <div className="lg:col-span-1 space-y-6 overflow-y-auto pr-2">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              {t('orderDetails')}
            </h2>
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="text-zinc-400 hover:text-white flex items-center gap-1 text-sm"
            >
              {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showDetails ? 'Thu gọn' : 'Xem thêm'}
            </button>
          </div>
          
          {/* Basic Info (Always Visible) */}
          <div className="space-y-3 mb-4">
             <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm">Trạng thái:</span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  order.status === 'COMPLETED' ? 'bg-green-500/20 text-green-500' :
                  order.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-500' :
                  'bg-zinc-800 text-zinc-400'
                }`}>
                  {order.status}
                </span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm">Tiến độ:</span>
                <span className="text-white font-medium text-sm">
                    {order.details.current_rank || order.details.current_level || 'N/A'} 
                    {' ➔ '} 
                    {order.details.desired_rank || order.details.desired_level || 'N/A'}
                </span>
             </div>
          </div>

          {/* Detailed Info (Collapsible) */}
          {showDetails && (
            <div className="space-y-3 pt-4 border-t border-zinc-800 animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="flex justify-between py-1">
                    <span className="text-zinc-500 text-xs">Mã đơn:</span>
                    <span className="text-zinc-300 text-xs font-mono">#{order._id.slice(-6).toUpperCase()}</span>
                </div>
                <div className="flex justify-between py-1">
                    <span className="text-zinc-500 text-xs">Dịch vụ:</span>
                    <span className="text-blue-400 text-xs font-bold">{order.serviceType}</span>
                </div>
                <div className="flex justify-between py-1">
                    <span className="text-zinc-500 text-xs">Server:</span>
                    <span className="text-zinc-300 text-xs">{order.details.server}</span>
                </div>
                <div className="flex justify-between py-1">
                    <span className="text-zinc-500 text-xs">Tài khoản Game:</span>
                    <span className="text-zinc-300 text-xs font-mono">{order.details.account_username}</span>
                </div>
                
                <div className="bg-zinc-950 p-3 rounded-lg mt-2 space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-zinc-500">Tổng tiền:</span>
                        <span className="text-white font-bold">{order.pricing.total_amount.toLocaleString()} đ</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-zinc-500">Đã cọc:</span>
                        <span className="text-green-400 font-bold">{order.pricing.deposit_amount?.toLocaleString() || 0} đ</span>
                    </div>
                </div>
            </div>
          )}
        </div>

        {/* Match History Tracking (New Feature) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Swords className="w-5 h-5 text-red-500" />
                Tiến độ trận đấu
            </h2>
            
            {order.match_history && order.match_history.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-zinc-500 uppercase bg-zinc-950/50">
                            <tr>
                                <th className="px-3 py-2">Tướng</th>
                                <th className="px-3 py-2">Kết quả</th>
                                <th className="px-3 py-2">LP</th>
                                <th className="px-3 py-2">Ghi chú</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {order.match_history.map((match, idx) => (
                                <tr key={idx} className="hover:bg-zinc-800/30">
                                    <td className="px-3 py-2 font-medium text-white">{match.champion}</td>
                                    <td className="px-3 py-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                            match.result === 'WIN' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                                        }`}>
                                            {match.result}
                                        </span>
                                    </td>
                                    <td className={`px-3 py-2 font-bold ${match.lp_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {match.lp_change > 0 ? '+' : ''}{match.lp_change}
                                    </td>
                                    <td className="px-3 py-2 text-zinc-500 text-xs truncate max-w-[100px]" title={match.reason}>
                                        {match.reason || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-8 text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-lg">
                    Chưa có trận đấu nào được cập nhật.
                </div>
            )}
        </div>
      </div>

      {/* Right Column: Chat */}
      <div className={`fixed bottom-0 right-4 w-80 lg:static lg:w-auto lg:col-span-2 flex flex-col bg-zinc-900 border border-zinc-800 rounded-t-xl lg:rounded-xl overflow-hidden transition-all duration-300 shadow-2xl z-50 ${isChatOpen ? 'h-[500px] lg:h-full' : 'h-12'}`}>
        <div 
            className="p-4 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between cursor-pointer lg:cursor-default"
            onClick={() => window.innerWidth < 1024 && setIsChatOpen(!isChatOpen)}
        >
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-white">{chatTitle}</h3>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setIsChatOpen(!isChatOpen); }} className="text-zinc-400 hover:text-white lg:hidden">
            {isChatOpen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>

        {isChatOpen && (
        <>
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
        </>
        )}
      </div>
    </div>
  );
}
