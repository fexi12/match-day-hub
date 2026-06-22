const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") ?? "franciscoemailcontact@gmail.com";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "onboarding@resend.dev";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: { email?: string; user_id?: string; created_at?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const { email, user_id, created_at } = body;

  if (!email) {
    return new Response("Missing email", { status: 400 });
  }

  if (!RESEND_API_KEY) {
    console.error("[notify-new-user] RESEND_API_KEY not configured");
    return new Response("Email service not configured", { status: 500 });
  }

  const signupDate = created_at
    ? new Date(created_at).toLocaleString("en-GB", { timeZone: "Europe/Lisbon" })
    : "—";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject: `New sign-up on Ararat Porto FC Hub: ${email}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
          <h2 style="color:#1e3a5f;margin-bottom:4px">Ararat Porto FC Hub</h2>
          <p style="color:#d44a2a;font-weight:bold;margin-top:0">New user signed up</p>
          <table style="width:100%;border-collapse:collapse;margin-top:16px">
            <tr>
              <td style="padding:8px 12px 8px 0;color:#666;font-size:13px;white-space:nowrap">Email</td>
              <td style="padding:8px 0;font-weight:bold">${email}</td>
            </tr>
            <tr>
              <td style="padding:8px 12px 8px 0;color:#666;font-size:13px;white-space:nowrap">User ID</td>
              <td style="padding:8px 0;font-family:monospace;font-size:12px;color:#555">${user_id ?? "—"}</td>
            </tr>
            <tr>
              <td style="padding:8px 12px 8px 0;color:#666;font-size:13px;white-space:nowrap">Signed up</td>
              <td style="padding:8px 0">${signupDate}</td>
            </tr>
          </table>
          <p style="margin-top:24px">
            <a href="https://match-day-hub.pages.dev/admin"
               style="display:inline-block;background:#d44a2a;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold">
              Open Admin Panel →
            </a>
          </p>
          <p style="margin-top:20px;color:#999;font-size:12px;border-top:1px solid #eee;padding-top:12px">
            Go to the Admin panel to grant Editor or Deleter access to this user.
          </p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[notify-new-user] Resend error:", err);
    return new Response("Failed to send email", { status: 502 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
