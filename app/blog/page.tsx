import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BlogListSection from "@/components/blog/BlogListSection";
import { prisma } from "@/lib/prisma";

async function getPosts() {
  return prisma.blogPost.findMany({ orderBy: { publishedAt: "desc" } });
}

export default async function BlogListPage() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <BlogListSection posts={posts} basePath="/blog" />
      </section>
      <Footer />
    </div>
  );
}
