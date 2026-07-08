import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";

async function getPosts() {
  return prisma.blogPost.findMany({ orderBy: { publishedAt: "desc" } });
}

function CoverPlaceholder() {
  return (
    <div className="h-48 bg-gradient-to-br from-[#17B6AE] to-[#0d8b84] flex items-center justify-center">
      <svg className="w-14 h-14 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M9 8h6M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
      </svg>
    </div>
  );
}

export default async function BlogListPage() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12 text-center">
          <p className="text-xs font-bold text-[#17B6AE] uppercase tracking-widest mb-2">Blog</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
            Mülk ve Kira Yönetimi Rehberi
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto">
            Mülk sahipleri ve kiracılar için pratik bilgiler, yasal süreçler ve ipuçları.
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="text-center text-slate-500">Henüz makale yayınlanmadı.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <a
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col"
              >
                {post.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.coverImageUrl} alt={post.title} className="h-48 w-full object-cover" />
                ) : (
                  <CoverPlaceholder />
                )}
                <div className="p-6 flex-1 flex flex-col">
                  <p className="text-xs text-slate-400 mb-2">
                    {new Date(post.publishedAt).toLocaleDateString("tr-TR")} · {post.readingMinutes} dk okuma
                  </p>
                  <h2 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-[#17B6AE] transition">
                    {post.title}
                  </h2>
                  <p className="text-sm text-slate-500 flex-1 line-clamp-3">{post.excerpt}</p>
                  <p className="text-sm font-semibold text-[#17B6AE] mt-4">
                    Devamı için tıklayınız →
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
