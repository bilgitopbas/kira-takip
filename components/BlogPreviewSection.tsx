import { prisma } from "@/lib/prisma";

function CoverPlaceholder() {
  return (
    <div className="h-40 bg-gradient-to-br from-[#17B6AE] to-[#0d8b84] flex items-center justify-center">
      <svg className="w-10 h-10 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M9 8h6M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
      </svg>
    </div>
  );
}

export default async function BlogPreviewSection() {
  const posts = await prisma.blogPost.findMany({
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  if (posts.length === 0) return null;

  return (
    <section className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <span className="inline-block text-xs font-bold text-[#17B6AE] bg-[#17B6AE]/10 px-4 py-1.5 rounded-full mb-3 uppercase tracking-widest">
              Blog
            </span>
            <h2 className="text-3xl font-bold text-slate-800">Mülk ve Kira Yönetimi Rehberi</h2>
          </div>
          <a
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#17B6AE] hover:text-[#149891] transition"
          >
            Tüm Makaleleri Gör
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <a
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col"
            >
              {post.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.coverImageUrl} alt={post.title} className="h-40 w-full object-cover" />
              ) : (
                <CoverPlaceholder />
              )}
              <div className="p-5 flex-1 flex flex-col">
                <p className="text-xs text-slate-400 mb-2">
                  {new Date(post.publishedAt).toLocaleDateString("tr-TR")} · {post.readingMinutes} dk okuma
                </p>
                <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-[#17B6AE] transition leading-snug">
                  {post.title}
                </h3>
                <p className="text-sm text-slate-500 flex-1 line-clamp-3">{post.excerpt}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
