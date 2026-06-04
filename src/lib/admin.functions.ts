import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getSupabaseAdminClient } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

export type AdminUserRow = {
  id: string;
  email: string | null;
  created_at: string;
  is_admin: boolean;
  is_approved: boolean;
};

export const listUsersWithRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUserRow[]> => {
    await assertAdmin(context.userId);

    const supabaseAdmin = getSupabaseAdminClient();
    const { data: usersRes, error: usersErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (usersErr) throw new Error(usersErr.message);

    const { data: roles, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");
    if (rolesErr) throw new Error(rolesErr.message);

    const byUser = new Map<string, Set<string>>();
    for (const r of roles ?? []) {
      const set = byUser.get(r.user_id) ?? new Set<string>();
      set.add(r.role);
      byUser.set(r.user_id, set);
    }

    return usersRes.users.map((u) => {
      const set = byUser.get(u.id) ?? new Set<string>();
      return {
        id: u.id,
        email: u.email ?? null,
        created_at: u.created_at,
        is_admin: set.has("admin"),
        is_approved: set.has("admin") || set.has("moderator"),
      };
    });
  });

export const setUserApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        user_id: z.string().uuid(),
        approved: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    const supabaseAdmin = getSupabaseAdminClient();
    if (data.approved) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.user_id, role: "moderator" }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.user_id)
        .eq("role", "moderator");
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
