type Post = {
  title: string;
  content: string;
  coverImageUrl: string | null;
  readingMinutes: number;
  publishedAt: Date;
};

function CoverPlaceholder() {
  return (
    <div className="h-72 sm:h-96 bg-gradient-to-br from-[#17B6AE] to-[#0d8b84] rounded-2xl flex items-center justify-center">
      <svg className="w-20 h-20 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M9 8h6M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
      </svg>
    </div>
  );
}

export default function BlogArticleBody({ post, backHref }: { post: Post; backHref: string }) {
  const paragraphs = post.content.split(/\n\s*\n/).filter((p) => p.trim());

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <a href={backHref} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#17B6AE] mb-6 transition">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Tüm Makaleler
      </a>

      {post.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.coverImageUrl} alt={post.title} className="w-full h-72 sm:h-96 object-cover rounded-2xl mb-8" />
      ) : (
        <div className="mb-8">
          <CoverPlaceholder />
        </div>
      )}

      <p className="text-xs text-slate-400 mb-3">
        {new Date(post.publishedAt).toLocaleDateString("tr-TR")} · {post.readingMinutes} dk okuma
      </p>
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">{post.title}</h1>

      <div className="prose prose-slate max-w-none">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-slate-600 leading-relaxed mb-5 text-[15px]">
            {p.trim()}
          </p>
        ))}
      </div>
    </article>
  );
}
