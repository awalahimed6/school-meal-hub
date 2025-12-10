import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received webhook request from Resend");

    // Get the webhook signing secret
    const webhookSecret = Deno.env.get("RESEND_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("RESEND_WEBHOOK_SECRET is not configured");
      return new Response(
        JSON.stringify({ error: "Webhook secret not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the raw body for signature verification
    const payload = await req.text();
    
    // Extract svix headers for signature verification
    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");

    // Validate that all required headers are present
    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error("Missing webhook signature headers");
      return new Response(
        JSON.stringify({ error: "Missing webhook signature headers" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify the webhook signature
    const wh = new Webhook(webhookSecret);
    let event: { type: string; data: Record<string, unknown> };
    
    try {
      event = wh.verify(payload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as { type: string; data: Record<string, unknown> };
    } catch (verifyError) {
      console.error("Webhook signature verification failed:", verifyError);
      return new Response(
        JSON.stringify({ error: "Invalid webhook signature" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Webhook signature verified successfully");
    console.log("Event type:", event.type);

    // Process email.received events
    if (event.type === "email.received") {
      const emailData = event.data as {
        from: string;
        to: string[];
        subject: string;
        email_id: string;
      };
      
      console.log("Received email:", {
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        email_id: emailData.email_id,
      });

      // Process emails sent to your Resend inbox
      const recipient = emailData.to[0] || "";
      const fromAddress = emailData.from;
      
      console.log("Processing email to:", recipient);
      console.log("From:", fromAddress);
      
      // Handle emails based on the recipient or sender
      if (recipient.includes("@xohonbo.resend.app")) {
        console.log("Email received at Resend inbox - processing");
        
        // You can route based on what was sent to the inbox
        // Example: support@school-snap-meal.lovable.app forwarded here
        // Example: Parent/student replies to system emails
        
        // TODO: Implement your logic here:
        // - Store in database
        // - Notify admins
        // - Auto-respond
        // - Create support tickets
      }

      // Optionally fetch the full email content and attachments
      // if you need to process them
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey && emailData.email_id) {
        try {
          // Fetch email content
          const emailResponse = await fetch(
            `https://api.resend.com/emails/${emailData.email_id}`,
            {
              headers: {
                Authorization: `Bearer ${resendApiKey}`,
              },
            }
          );

          if (emailResponse.ok) {
            const fullEmail = await emailResponse.json();
            console.log("Full email content retrieved");
            
            // Process email content
            // Example: Save to database, forward to team, etc.
            
          } else {
            console.error("Failed to fetch email content:", await emailResponse.text());
          }
        } catch (error) {
          console.error("Error fetching email content:", error);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Email received and processed" 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Handle other event types if needed
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Event received" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
