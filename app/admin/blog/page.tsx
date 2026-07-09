"use client";

import { useEffect, useState } from "react";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
  readingMinutes: number;
  publishedAt: string;
};

const EMPTY_FORM = { title: "", excerpt: "", content: "", coverImageUrl: "", readingMinutes: "5" };

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function loadPosts() {
    setLoading(true);
    fetch("/api/admin/blog")
      .then((r) => r.json())
      .then((d) => setPosts(d.posts || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadPosts();
  }, []);

  function startNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowForm(true);
  }

  function startEdit(post: BlogPost) {
    setEditingId(post.id);
    setForm({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      coverImageUrl: post.coverImageUrl || "",
      readingMinutes: String(post.readingMinutes),
    });
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const url = editingId ? `/api/admin/blog/${editingId}` : "/api/admin/blog";
    const method = editingId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Kaydedilemedi.");
      return;
    }

    setShowForm(false);
    loadPosts();
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu makaleyi silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    loadPosts();
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Blog Yönetimi</h1>
          <p className="text-sm text-slate-400 mt-1">
            Buradan eklediğiniz makaleler hem genel sitede (/blog) hem müşteri panelinde otomatik olarak yayınlanır.
          </p>
        </div>
        <button
          onClick={startNew}
          className="bg-[#17B6AE] hover:bg-[#149891] text-white font-semibold px-5 py-2.5 rounded-xl transition text-sm"
        >
          Yeni Makale
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-base font-bold text-slate-800 mb-4">{editingId ? "Makaleyi Düzenle" : "Yeni Makale"}</h2>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Üst Başlık</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Alt Başlık / Özet</label>
              <textarea
                required
                rows={2}
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Makale İçeriği</label>
              <textarea
                required
                rows={10}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Paragrafları boş satırla ayırabilirsiniz."
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kapak Görseli URL (opsiyonel)</label>
                <input
                  value={form.coverImageUrl}
                  onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Okuma Süresi (dk)</label>
                <input
                  type="number"
                  min={1}
                  value={form.readingMinutes}
                  onChange={(e) => setForm({ ...form, readingMinutes: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#17B6AE] hover:bg-[#149891] disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm"
              >
                {saving ? "Kaydediliyor..." : editingId ? "Güncelle" : "Yayınla"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-sm text-slate-500 hover:text-slate-700 font-medium px-4"
              >
                Vazgeç
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#17B6AE] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-16">Henüz makale eklenmedi.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {posts.map((post) => (
              <div key={post.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700">{post.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    /blog/{post.slug} · {post.readingMinutes} dk · {new Date(post.publishedAt).toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(post)}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-gray-50 text-slate-600 hover:bg-gray-100 transition"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-red-50 text-red-500 hover:bg-red-100 transition"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
