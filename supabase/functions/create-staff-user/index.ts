import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, fullName, position } = await req.json();

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the requester is an admin
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Not authorized - Admin role required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the new staff user using admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError) {
      // Handle specific error cases
      if (createError.message?.includes("already been registered")) {
        return new Response(
          JSON.stringify({ error: "A staff member with this email already exists. Please use a different email address." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw createError;
    }

    if (!newUser.user) {
      throw new Error("Failed to create user");
    }

    const userId = newUser.user.id;

    // Generate staff ID
    const { data: staffId, error: idError } = await supabaseAdmin.rpc("generate_staff_id");
    if (idError) throw idError;

    // Create staff record
    const { error: staffError } = await supabaseAdmin.from("staff").insert({
      staff_id: staffId,
      full_name: fullName,
      position,
      user_id: userId,
    });

    if (staffError) {
      // Cleanup: delete the auth user if staff record creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw staffError;
    }

    // Assign staff role
    const { error: roleError } = await supabaseAdmin.rpc("create_staff_role", {
      _user_id: userId,
    });

    if (roleError) {
      // Cleanup: delete staff record and auth user if role assignment fails
      await supabaseAdmin.from("staff").delete().eq("user_id", userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw roleError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { id: userId, email, staff_id: staffId } 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating staff user:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
