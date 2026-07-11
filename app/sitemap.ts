import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/blog", priority: 0.8, changeFrequency: "daily" },
  { path: "/register", priority: 0.6, changeFrequency: "monthly" },
  { path: "/login", priority: 0.3, changeFrequency: "monthly" },
  { path: "/aydinlatma-metni", priority: 0.2, changeFrequency: "yearly" },
  { path: "/acik-riza-metni", priority: 0.2, changeFrequency: "yearly" },
  { path: "/kullanim-kosullari", priority: 0.2, changeFrequency: "yearly" },
  { path: "/cerez-politikasi", priority: 0.2, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: new Date(),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const posts = await prisma.blogPost.findMany({
    select: { slug: true, publishedAt: true },
    orderBy: { publishedAt: "desc" },
  });

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.publishedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...postEntries];
}
