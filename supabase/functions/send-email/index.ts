import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import nodemailer from "npm:nodemailer@6.9.10";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: Deno.env.get("EMAIL_USER")!,
    pass: Deno.env.get("EMAIL_PASSWORD")!,
  },
});

function buildSummaryHtml(body: Record<string, any>): string {
  const {
    leadName, leadPhone, leadEmail, leadType,
    projectType, serviceType, timeline, budget, messages, tags,
  } = body;

  const msgRows = (messages || [])
    .map((m: any) => {
      const label = m.sender === "user"
        ? (leadName || "Client")
        : m.sender === "bot" ? "Bot" : "Admin";
      return `<tr><td style="padding:6px 12px;color:#64748b;font-size:12px;white-space:nowrap;vertical-align:top">${label}</td><td style="padding:6px 12px;font-size:13px">${m.text}</td></tr>`;
    })
    .join("");

  const tagBadges = (tags || [])
    .map((t: string) =>
      `<span style="display:inline-block;background:#f1f5f9;color:#334155;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;margin-right:4px">${t}</span>`
    )
    .join("");

  return `
    <div style="font-family:'Inter',system-ui,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
      <div style="background:#7eb1b8;padding:24px;color:white">
        <h2 style="margin:0;font-size:18px">New Chat Summary</h2>
        <p style="margin:4px 0 0;font-size:13px;opacity:0.85">Shotcount Wallpaper Hangers</p>
      </div>
      <div style="padding:24px">
        <h3 style="margin:0 0 16px;font-size:15px;color:#334155">Client Details</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          <tr><td style="padding:4px 0;color:#64748b;font-size:13px;width:120px">Name</td><td style="padding:4px 0;font-size:13px;font-weight:600">${leadName || "Not provided"}</td></tr>
          <tr><td style="padding:4px 0;color:#64748b;font-size:13px">Phone</td><td style="padding:4px 0;font-size:13px;font-weight:600">${leadPhone || "Not provided"}</td></tr>
          <tr><td style="padding:4px 0;color:#64748b;font-size:13px">Email</td><td style="padding:4px 0;font-size:13px;font-weight:600">${leadEmail || "Not provided"}</td></tr>
          <tr><td style="padding:4px 0;color:#64748b;font-size:13px">Type</td><td style="padding:4px 0;font-size:13px;font-weight:600">${leadType || "N/A"}</td></tr>
          <tr><td style="padding:4px 0;color:#64748b;font-size:13px">Project</td><td style="padding:4px 0;font-size:13px;font-weight:600">${projectType || "N/A"}</td></tr>
          <tr><td style="padding:4px 0;color:#64748b;font-size:13px">Service</td><td style="padding:4px 0;font-size:13px;font-weight:600">${serviceType || "N/A"}</td></tr>
          <tr><td style="padding:4px 0;color:#64748b;font-size:13px">Timeline</td><td style="padding:4px 0;font-size:13px;font-weight:600">${timeline || "N/A"}</td></tr>
          <tr><td style="padding:4px 0;color:#64748b;font-size:13px">Budget</td><td style="padding:4px 0;font-size:13px;font-weight:600">${budget || "N/A"}</td></tr>
        </table>
        ${tagBadges ? `<div style="margin-bottom:20px">${tagBadges}</div>` : ""}
        <h3 style="margin:0 0 12px;font-size:15px;color:#334155">Conversation</h3>
        <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:8px;overflow:hidden">
          ${msgRows || '<tr><td style="padding:12px;color:#94a3b8;font-size:13px">No messages</td></tr>'}
        </table>
      </div>
      <div style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center">
        <p style="margin:0;font-size:11px;color:#94a3b8">Sent automatically by Shotcount Concierge</p>
      </div>
    </div>
  `;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "send") {
      const { to, subject, html } = body;
      if (!to || !subject || !html) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: to, subject, html" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      await transport.sendMail({
        from: `"Shotcount Concierge" <${Deno.env.get("EMAIL_USER")}>`,
        to,
        subject,
        html,
      });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "chat-summary") {
      const ownerEmail = Deno.env.get("EMAIL_OWNER") || Deno.env.get("EMAIL_USER")!;
      const html = buildSummaryHtml(body);

      await transport.sendMail({
        from: `"Shotcount Concierge" <${Deno.env.get("EMAIL_USER")}>`,
        to: ownerEmail,
        subject: `New Lead: ${body.leadName || "Unknown"} - ${body.leadType || "Chat Summary"}`,
        html,
      });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "send" or "chat-summary".' }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("Email function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
