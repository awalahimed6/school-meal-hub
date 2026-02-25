import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const RESET_PAGE_URL = "https://nibsbss-school-meal.vercel.app/reset-password";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const isValidEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = (await req.json()) as { email?: string };

    // Always return success to prevent email enumeration
    if (!email || !isValidEmail(email)) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");

    if (!brevoApiKey) {
      console.error("BREVO_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Generate recovery link with token
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: RESET_PAGE_URL },
    });

    if (error) {
      console.warn("Recovery link generation skipped:", error.message);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract token from the generated link
    const tokenHash = data?.properties?.hashed_token;
    const actionLink = data?.properties?.action_link;
    const tokenFromLink = actionLink
      ? new URL(actionLink).searchParams.get("token") || new URL(actionLink).searchParams.get("token_hash")
      : null;
    const token = tokenHash || tokenFromLink;

    if (!token) {
      console.warn("No recovery token found");
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resetLink = `${RESET_PAGE_URL}?token=${encodeURIComponent(token)}`;

    // Send email via Brevo API
    const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: "School Meal System", email: "no-reply@nibsbss.edu" },
        to: [{ email }],
        subject: "Reset Your Password - School Meal System",
        htmlContent: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937;">
            <div style="text-align:center;margin-bottom:24px;">
              <h1 style="font-size:24px;color:#1e40af;margin:0;">School Meal System</h1>
            </div>
            <h2 style="font-size:20px;margin-bottom:12px;">Reset Your Password</h2>
            <p style="margin-bottom:20px;line-height:1.6;">We received a request to reset your password. Click the button below to set a new password:</p>
            <div style="text-align:center;margin:28px 0;">
              <a href="${resetLink}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
                Reset Password
              </a>
            </div>
            <p style="font-size:13px;color:#6b7280;line-height:1.5;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="font-size:13px;word-break:break-all;color:#2563eb;margin-bottom:20px;">${resetLink}</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />
            <p style="font-size:12px;color:#9ca3af;">If you didn't request this, you can safely ignore this email. This link will expire soon for your security.</p>
          </div>
        `,
      }),
    });

    if (!brevoResponse.ok) {
      const errBody = await brevoResponse.text();
      console.error(`Brevo API error [${brevoResponse.status}]:`, errBody);
      return new Response(JSON.stringify({ error: "Failed to send reset email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("request-password-reset error:", error);
    return new Response(JSON.stringify({ error: "Failed to process password reset" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
