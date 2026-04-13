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

async function summarizeConversation(
  messages: Array<{ sender: string; text: string }>,
  leadName: string,
): Promise<string> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey || !messages?.length) {
    return "No conversation to summarize.";
  }

  const transcript = messages
    .map((m) => {
      const label = m.sender === "user" ? (leadName || "Client") : m.sender === "bot" ? "Bot" : "Admin";
      return `${label}: ${m.text}`;
    })
    .join("\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: `You are a business assistant for Shotcount Wallpaper Hangers. Summarize the following chat conversation into a concise, professional email briefing for the business owner. Include:
1. A one-line overview of what the client wants.
2. Key details gathered (project type, scope, timeline, budget if mentioned).
3. Client's interest level and urgency (hot lead, warm, exploratory).
4. Any specific requests, concerns, or follow-up actions needed.
5. Recommended next steps.

Keep it brief, scannable, and action-oriented. Use short paragraphs and bullet points. Do not use em dashes or en dashes.

IMPORTANT: Do NOT include any sign-off, closing, or signature like "Best regards" or "[Your Name]". The email template already has a footer. End with your last actionable point and nothing else.`,
        },
        {
          role: "user",
          content: `Chat transcript:\n\n${transcript}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    console.error("OpenAI API error:", await res.text());
    return "Could not generate summary. Please review the conversation in the inbox.";
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "Summary unavailable.";
}

function buildSummaryHtml(body: Record<string, any>, aiSummary: string): string {
  const {
    leadName, leadPhone, leadEmail, leadType,
    projectType, serviceType, timeline, budget, tags,
  } = body;

  const tagBadges = (tags || [])
    .map((t: string) =>
      `<span style="display:inline-block;background:#f1f5f9;color:#334155;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;margin-right:4px">${t}</span>`
    )
    .join("");

  const summaryHtml = aiSummary
    .replace(/\n/g, "<br>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/- /g, "&bull; ");

  return `
    <div style="font-family:'Inter',system-ui,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
      <div style="background:#7eb1b8;padding:24px;color:white">
        <h2 style="margin:0;font-size:18px">New Lead Summary</h2>
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
        <h3 style="margin:0 0 12px;font-size:15px;color:#334155">Conversation Summary</h3>
        <div style="background:#f8fafc;border-radius:8px;padding:16px;font-size:13px;line-height:1.7;color:#334155">
          ${summaryHtml}
        </div>
      </div>
      <div style="padding:20px 24px;background:#f8fafc;border-top:1px solid #e2e8f0">
        <p style="margin:0 0 4px;font-size:13px;color:#64748b">Best regards,</p>
        <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:#334155">ShotCount Assistant</p>
        <p style="margin:0 0 4px;font-size:12px;color:#64748b">Shotcount Wallpaper Hangers</p>
        <a href="https://www.shotcount.com" style="font-size:12px;color:#7eb1b8;text-decoration:none">www.shotcount.com</a>
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

      const aiSummary = await summarizeConversation(
        body.messages || [],
        body.leadName || "Client",
      );

      const html = buildSummaryHtml(body, aiSummary);

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
