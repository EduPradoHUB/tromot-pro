import React, { useEffect, useRef } from "react";

/**
 * Embed do blog Soro. Injeta o script oficial dentro do container.
 * Repassa o parâmetro ?post= da URL atual para abrir um artigo específico.
 */
export const SoroEmbed: React.FC<{ className?: string }> = ({ className }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    // Limpa execuções anteriores (StrictMode / navegação SPA)
    container.innerHTML = '<div id="soro-blog"></div>';

    const params = new URLSearchParams(window.location.search);
    let url =
      "https://app.trysoro.com/api/embed/b6af03d4-4496-4a15-bd85-86fad2d01f9c";
    if (params.get("post")) {
      url += "?post=" + encodeURIComponent(params.get("post") as string);
    }

    const s = document.createElement("script");
    s.src = url;
    s.async = true;
    container.appendChild(s);

    return () => {
      container.innerHTML = "";
    };
  }, []);

  return <div ref={ref} className={className} />;
};

export default SoroEmbed;