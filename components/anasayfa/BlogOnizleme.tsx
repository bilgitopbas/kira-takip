import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { gecikme } from "./SvgTanimlari";

const KAPAKLAR = [
  "linear-gradient(140deg,var(--aku-500),var(--derin-1))",
  "linear-gradient(140deg,var(--pembe-300),#E07AA3)",
  "linear-gradient(140deg,var(--aku-300),var(--pembe-300))",
];

// Son üç blog yazısı; yazı yoksa bölüm hiç gösterilmez. Sorgu başarısız olursa
// ana sayfa çökmesin diye bölüm yine gizlenir.
export default async function BlogOnizleme() {
  const posts = await prisma.blogPost
    .findMany({
      orderBy: { publishedAt: "desc" },
      take: 3,
    })
    .catch((e: unknown) => {
      console.error("Ana sayfa blog önizlemesi alınamadı:", e);
      return [];
    });

  if (posts.length === 0) return null;

  return (
    <section className="blog bolum" aria-labelledby="blogBas">
      <div className="kap">
        <div className="blog-ust">
          <div>
            <span className="cip belir">Blog</span>
            <h2 className="belir" id="blogBas" style={gecikme(".08s")}>
              Mülk ve Kira Yönetimi Rehberi
            </h2>
          </div>
          <Link href="/blog" className="belir">
            Tüm Makaleleri Gör{" "}
            <svg width="16" height="16" aria-hidden="true">
              <use href="#ok" />
            </svg>
          </Link>
        </div>
        <div className="yazilar">
          {posts.map((post, i) => (
            <Link key={post.id} className="yazi belir" style={gecikme(`${i / 10}s`)} href={`/blog/${post.slug}`}>
              {post.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="kapak" src={post.coverImageUrl} alt={post.title} style={{ width: "100%", objectFit: "cover" }} />
              ) : (
                <div className="kapak" style={{ background: KAPAKLAR[i % KAPAKLAR.length] }} />
              )}
              <div className="m">
                <small>
                  {new Date(post.publishedAt).toLocaleDateString("tr-TR")} · {post.readingMinutes} dk okuma
                </small>
                <h3>{post.title}</h3>
                {post.excerpt && <p className="ozet">{post.excerpt}</p>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
