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
      const isAdmin = set.has("admin");
      const isRevoked = set.has("user");
      return {
        id: u.id,
        email: u.email ?? null,
        created_at: u.created_at,
        is_admin: isAdmin,
        // Editors are allowed by default. The existing "user" role is used as
        // an explicit deny/revoked marker so admins can turn access off later.
        is_approved: isAdmin || !isRevoked,
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
        .delete()
        .eq("user_id", data.user_id)
        .eq("role", "user");
      if (error) throw new Error(error.message);
    } else {
      const { error: deleteModeratorError } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.user_id)
        .eq("role", "moderator");
      if (deleteModeratorError) throw new Error(deleteModeratorError.message);

      const { error: revokeError } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.user_id, role: "user" }, { onConflict: "user_id,role" });
      if (revokeError) throw new Error(revokeError.message);
    }
    return { ok: true };
  });
