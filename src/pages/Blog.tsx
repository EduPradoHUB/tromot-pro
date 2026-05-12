import React, { useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import SoroEmbed from "@/components/SoroEmbed";
import { trackBlogEvent, getPostIdFromUrl } from "@/lib/blogAnalytics";

/**
 * Página do Blog. Mede leitura efetiva: dispara `blog_read` quando o
 * usuário rola >50% da página OU permanece >30s (o que ocorrer primeiro).
 */
const Blog: React.FC = () => {
  const fired = useRef(false);

  useEffect(() => {
    const postId = getPostIdFromUrl();

    const fire = (reason: "scroll" | "time") => {
      if (fired.current) return;
      fired.current = true;
      trackBlogEvent("blog_read", { post_id: postId, reason });
    };

    const onScroll = () => {
      const doc = document.documentElement;
      const scrolled = window.scrollY + window.innerHeight;
      const total = doc.scrollHeight;
      if (total > 0 && scrolled / total > 0.5) fire("scroll");
    };

    const t = window.setTimeout(() => fire("time"), 30000);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="container py-8">
      <Helmet>
        <title>Blog Tromot PRO | Dicas técnicas e novidades</title>
        <meta
          name="description"
          content="Artigos técnicos, dicas de instalação e novidades para instaladores e técnicos automotivos."
        />
        <link rel="canonical" href="https://pro.tromot.com/blog" />
      </Helmet>
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold">Blog Tromot PRO</h1>
        <p className="text-muted-foreground mt-2">
          Conteúdos técnicos atualizados a cada 2 dias.
        </p>
      </header>
      <SoroEmbed className="min-h-[60vh]" />
    </div>
  );
};

export default Blog;