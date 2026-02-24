import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "https://esm.sh/resend@4.0.0";

const DEFAULT_RESET_PAGE = "https://nibsbss-school-meal.vercel.app/reset-password";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const isValidEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email);

const getResetPageUrl = (candidate?: string) => {
  if (!candidate) return DEFAULT_RESET_PAGE;

  try {
    const parsed = new URL(candidate);
    const allowed = new URL(DEFAULT_RESET_PAGE);

    if (parsed.origin !== allowed.origin) {
      return DEFAULT_RESET_PAGE;
    }

    return `${allowed.origin}/reset-password`;
  } catch {
    return DEFAULT_RESET_PAGE;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectUrl } = (await req.json()) as {
      email?: string;
      redirectUrl?: string;
    };

    if (!email || !isValidEmail(email)) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const resend = new Resend(resendApiKey);
    const resetPageUrl = getResetPageUrl(redirectUrl);

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: resetPageUrl,
      },
    });

    if (error) {
      console.warn("Recovery link generation skipped:", error.message);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tokenHashFromProps = data?.properties?.hashed_token;
    const actionLink = data?.properties?.action_link;
    const tokenFromActionLink = actionLink
      ? new URL(actionLink).searchParams.get("token") || new URL(actionLink).searchParams.get("token_hash")
      : null;

    const tokenHash = tokenHashFromProps || tokenFromActionLink;

    if (!tokenHash) {
      console.warn("No recovery token found while generating password reset link");
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customResetLink = `${resetPageUrl}?token=${encodeURIComponent(tokenHash)}`;

    await resend.emails.send({
      from: "School Meal System <onboarding@resend.dev>",
      to: [email],
      subject: "Reset Your Password - School Meal System",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; margin: 0 auto;">
          <h2 style="margin-bottom: 12px;">Reset Your Password</h2>
          <p>We received a request to reset your password.</p>
          <p>
            <a href="${customResetLink}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;">
              Reset Password
            </a>
          </p>
          <p>This link expires soon for your security.</p>
          <p style="word-break: break-all; color: #2563eb;">${customResetLink}</p>
        </div>
      `,
    });

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
