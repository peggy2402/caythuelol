// src/app/(dashboard)/admin/blogs/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, FileText, Image as ImageIcon, X, Tag } from 'lucide-react';
import Image from 'next/image';
import QuillEditor from '@/components/QuillEditor';

interface Blog {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  thumbnail: string;
  isPublished: boolean;
  tags: string[];
  createdAt: string;
  author: { username: string };
}

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    thumbnail: '',
    isPublished: false,
    tags: ''
  });

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/blogs');
      const data = await res.json();
      if (res.ok) setBlogs(data.blogs);
    } catch (e) { toast.error('Lỗi tải bài viết'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingBlog ? `/api/admin/blogs/${editingBlog._id}` : '/api/admin/blogs';
      const method = editingBlog ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          // Chuyển chuỗi tags thành mảng
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        })
      });

      if (res.ok) {
        toast.success(editingBlog ? 'Cập nhật thành công' : 'Tạo bài viết thành công');
        setIsModalOpen(false);
        fetchBlogs();
      } else {
        toast.error('Có lỗi xảy ra');
      }
    } catch (e) { toast.error('Lỗi kết nối'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa bài viết này?')) return;
    try {
      await fetch(`/api/admin/blogs/${id}`, { method: 'DELETE' });
      toast.success('Đã xóa bài viết');
      fetchBlogs();
    } catch (e) { toast.error('Lỗi xóa bài viết'); }
  };

  const openModal = (blog?: Blog) => {
    if (blog) {
      setEditingBlog(blog);
      setFormData({
        title: blog.title,
        content: blog.content,
        excerpt: blog.excerpt,
        thumbnail: blog.thumbnail,
        isPublished: blog.isPublished,
        tags: (blog.tags || []).join(', ') // Chuyển mảng tags thành chuỗi
      });
    } else {
      setEditingBlog(null);
      setFormData({ title: '', content: '', excerpt: '', thumbnail: '', isPublished: false, tags: '' });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="text-blue-500" /> Quản lý Bài viết
          </h1>
          <p className="text-zinc-400 text-sm">Tin tức, hướng dẫn và thông báo hệ thống.</p>
        </div>
        <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors">
          <Plus size={18} /> Viết bài mới
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map(blog => (
            <div key={blog._id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group hover:border-zinc-700 transition-all">
              <div className="relative h-48 bg-zinc-800">
                {blog.thumbnail ? (
                  <Image src={blog.thumbnail} alt={blog.title} fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-zinc-600"><ImageIcon size={32} /></div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${blog.isPublished ? 'bg-green-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                    {blog.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-white text-lg mb-2 line-clamp-2">{blog.title}</h3>
                <p className="text-zinc-400 text-sm line-clamp-3 mb-4">{blog.excerpt}</p>
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  <span className="text-xs text-zinc-500">{new Date(blog.createdAt).toLocaleDateString('vi-VN')}</span>
                  <div className="flex gap-2">
                    <button onClick={() => openModal(blog)} className="p-2 hover:bg-zinc-800 rounded-lg text-blue-400 transition-colors"><Pencil size={16} /></button>
                    <button onClick={() => handleDelete(blog._id)} className="p-2 hover:bg-zinc-800 rounded-lg text-red-400 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center sticky top-0 bg-zinc-900 z-10">
              <h3 className="text-xl font-bold text-white">{editingBlog ? 'Chỉnh sửa bài viết' : 'Viết bài mới'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Tiêu đề</label>
                    <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Mô tả ngắn</label>
                    <textarea rows={3} value={formData.excerpt} onChange={e => setFormData({...formData, excerpt: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Ảnh Thumbnail (URL)</label>
                    <input type="text" value={formData.thumbnail} onChange={e => setFormData({...formData, thumbnail: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Tags (Phân cách bằng dấu phẩy)</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input type="text" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-white focus:border-blue-500 outline-none" placeholder="Meta & Guide, Esports..." />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="publish" checked={formData.isPublished} onChange={e => setFormData({...formData, isPublished: e.target.checked})} className="w-5 h-5 rounded bg-zinc-800 border-zinc-700 text-blue-600 focus:ring-0" />
                    <label htmlFor="publish" className="text-white font-medium cursor-pointer">Xuất bản ngay</label>
                  </div>
                </div>
                <div className="h-full flex flex-col">
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Nội dung</label>
                  <div className="flex-1 min-h-[300px] bg-zinc-950 rounded-lg border border-zinc-800">
                    <QuillEditor value={formData.content} onChange={value => setFormData({...formData, content: value})} />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">Hủy</button>
                <button type="submit" className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors">Lưu bài viết</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
