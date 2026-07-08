import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BlogArticleBody from "@/components/blog/BlogArticleBody";

async function getPost(slug: string) {
  return prisma.blogPost.findUnique({ where: { slug } });
}

export default async function DashboardBlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return <BlogArticleBody post={post} backHref="/dashboard/blog" />;
}
