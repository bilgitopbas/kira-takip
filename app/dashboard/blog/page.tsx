import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BlogListSection from "@/components/blog/BlogListSection";

async function getPosts() {
  return prisma.blogPost.findMany({ orderBy: { publishedAt: "desc" } });
}

export default async function DashboardBlogPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const posts = await getPosts();

  return <BlogListSection posts={posts} basePath="/dashboard/blog" />;
}
