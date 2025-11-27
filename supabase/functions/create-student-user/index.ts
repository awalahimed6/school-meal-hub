import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the requester is an authenticated admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error("Error getting user:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      console.error("User is not an admin:", roleError);
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { email, password, fullName, grade, sex, status, profileImage } = await req.json();

    if (!email || !fullName || !grade || !sex) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const defaultPassword = password || "Welcome123!";

    // Create the auth user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      if (createError.message.includes("already registered")) {
        return new Response(
          JSON.stringify({ error: "Email already registered" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!newUser.user) {
      return new Response(
        JSON.stringify({ error: "Failed to create user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = newUser.user.id;
    let studentId: string | null = null;

    try {
      // Generate student ID
      const { data: generatedId, error: idError } = await supabaseAdmin.rpc("generate_student_id");
      
      if (idError) {
        console.error("Error generating student ID:", idError);
        throw new Error("Failed to generate student ID");
      }

      studentId = generatedId;

      // Insert into students table
      const { error: studentError } = await supabaseAdmin
        .from("students")
        .insert({
          student_id: studentId,
          user_id: userId,
          full_name: fullName,
          grade,
          sex,
          status: status || "active",
          profile_image: profileImage || null,
        });

      if (studentError) {
        console.error("Error creating student record:", studentError);
        throw new Error("Failed to create student record");
      }

      // Assign student role
      const { error: roleInsertError } = await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id: userId,
          role: "student",
        });

      if (roleInsertError) {
        console.error("Error assigning student role:", roleInsertError);
        throw new Error("Failed to assign student role");
      }

      console.log("Student user created successfully:", { userId, studentId, email });

      return new Response(
        JSON.stringify({
          user_id: userId,
          student_id: studentId,
          email,
          message: "Student account created successfully",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (error) {
      // Rollback: delete the auth user if database operations failed
      console.error("Error during student creation, rolling back:", error);
      
      await supabaseAdmin.auth.admin.deleteUser(userId);
      
      // Also try to clean up any partial records
      if (studentId) {
        await supabaseAdmin.from("students").delete().eq("student_id", studentId);
      }
      await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);

      return new Response(
        JSON.stringify({ error: error.message || "Failed to create student account" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
