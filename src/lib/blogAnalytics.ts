import { supabase } from "@/integrations/supabase/client";

export async function trackBlogEvent(
  eventType: "blog_cta_click" | "blog_read",
  metadata: Record<string, unknown> = {},
) {
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;
    if (!userId) return; // RLS exige autenticado
    await supabase.from("analytics_events").insert({
      event_type: eventType,
      user_id: userId,
      metadata,
    });
  } catch (err) {
    console.warn("trackBlogEvent failed", err);
  }
}

export function getPostIdFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("post");
}