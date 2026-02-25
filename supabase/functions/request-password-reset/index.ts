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
    console.log("Password reset requested for:", email);

    // Always return success to prevent email enumeration
    if (!email || !isValidEmail(email)) {
      console.log("Invalid or missing email, returning success silently");
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");

    console.log("SUPABASE_URL present:", !!supabaseUrl);
    console.log("SERVICE_ROLE_KEY present:", !!serviceRoleKey);
    console.log("BREVO_API_KEY present:", !!brevoApiKey);

    if (!brevoApiKey) {
      console.error("BREVO_API_KEY is not configured");
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Generate recovery link with token
    console.log("Generating recovery link...");
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: RESET_PAGE_URL },
    });

    if (error) {
      console.warn("Recovery link generation failed:", error.message);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("generateLink response data keys:", data ? Object.keys(data) : "null");
    console.log("properties:", data?.properties ? Object.keys(data.properties) : "null");
    console.log("action_link:", data?.properties?.action_link ? "present" : "missing");
    console.log("hashed_token:", data?.properties?.hashed_token ? "present" : "missing");

    // Use provider-generated action link to preserve token integrity,
    // while forcing redirect target to the canonical reset page.
    const actionLink = data?.properties?.action_link;

    if (!actionLink) {
      console.warn("No recovery action_link found in response");
      console.log("Full data.properties:", JSON.stringify(data?.properties));
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let resetLink = actionLink;
    try {
      const actionUrl = new URL(actionLink);
      actionUrl.searchParams.set("redirect_to", RESET_PAGE_URL);
      resetLink = actionUrl.toString();
      console.log("Reset action_link normalized to redirect_to:", RESET_PAGE_URL);
    } catch (parseError) {
      console.warn("Failed to normalize action_link redirect_to, using original action_link", parseError);
    }

    console.log("Reset link generated (domain only):", new URL(resetLink).origin);

    // Send email via Brevo API
    console.log("Sending email via Brevo...");
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

    const brevoBody = await brevoResponse.text();
    console.log(`Brevo response status: ${brevoResponse.status}`);
    console.log(`Brevo response body: ${brevoBody}`);

    if (!brevoResponse.ok) {
      console.error(`Brevo API error [${brevoResponse.status}]:`, brevoBody);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Password reset email sent successfully");
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("request-password-reset error:", error);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
