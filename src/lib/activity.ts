// Ortak işlem geçmişi (aktivite) yardımcıları.
import { supabase } from "@/integrations/supabase/client";

export type ActivityEntity = "customer" | "property" | "request" | "survey" | "quote" | "project" | "opportunity";

export type ActivityRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  actor_id: string | null;
  activity_type: string;
  note: string | null;
  old_status: string | null;
  new_status: string | null;
  created_at: string;
};

export async function logActivity(input: {
  entity: ActivityEntity;
  entityId: string;
  type?: string;
  note?: string | null;
  oldStatus?: string | null;
  newStatus?: string | null;
}) {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase.from("activity_log").insert({
    entity_type: input.entity,
    entity_id: input.entityId,
    actor_id: userData.user?.id ?? null,
    activity_type: input.type ?? "note",
    note: input.note ?? null,
    old_status: input.oldStatus ?? null,
    new_status: input.newStatus ?? null,
  });
  if (error) throw error;
}

export async function fetchActivities(entity: ActivityEntity, entityId: string) {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("entity_type", entity)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as ActivityRow[];
}
