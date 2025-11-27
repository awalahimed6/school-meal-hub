import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordChangeConfirmationRequest {
  email: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: PasswordChangeConfirmationRequest = await req.json();

    console.log("Sending password change confirmation to:", email);

    const emailResponse = await resend.emails.send({
      from: "School Meal System <onboarding@resend.dev>",
      to: [email],
      subject: "Password Successfully Changed - School Meal System",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .content {
                background: #f9fafb;
                padding: 30px;
                border-radius: 0 0 10px 10px;
              }
              .success {
                background: #d1fae5;
                border-left: 4px solid #10b981;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .warning {
                background: #fef3c7;
                border-left: 4px solid #f59e0b;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                color: #666;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0;">🍽️ School Meal System</h1>
            </div>
            <div class="content">
              <h2>Password Changed Successfully</h2>
              <div class="success">
                <strong>✓ Success!</strong><br>
                Your password has been successfully changed.
              </div>
              <p>Hello,</p>
              <p>This is to confirm that your password for your School Meal System account was recently changed.</p>
              <p><strong>Date:</strong> ${new Date().toLocaleString('en-US', { 
                dateStyle: 'full', 
                timeStyle: 'short' 
              })}</p>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong><br>
                If you did not make this change, please contact your system administrator immediately as your account may have been compromised.
              </div>
              <p>For security reasons, we recommend:</p>
              <ul>
                <li>Using a strong, unique password</li>
                <li>Not sharing your password with anyone</li>
                <li>Changing your password regularly</li>
              </ul>
            </div>
            <div class="footer">
              <p>School Meal System<br>Nutrition & Management</p>
              <p style="font-size: 12px;">This is an automated email. Please do not reply.</p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending password change confirmation:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to send email";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
