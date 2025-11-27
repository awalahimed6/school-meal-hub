import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify the request is from an authenticated admin
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || roleData?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get student data
    const { studentId } = await req.json();

    if (!studentId) {
      return new Response(
        JSON.stringify({ error: 'Student ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the student record to find the user_id
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('user_id, full_name')
      .eq('id', studentId)
      .single();

    if (studentError) {
      console.error('Error fetching student:', studentError);
      return new Response(
        JSON.stringify({ error: 'Student not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete from students table first (this will cascade delete meals and meal_ratings due to foreign key)
    console.log('Deleting student record:', studentId, student.full_name);
    const { error: deleteStudentError } = await supabaseAdmin
      .from('students')
      .delete()
      .eq('id', studentId);

    if (deleteStudentError) {
      console.error('Error deleting student record:', deleteStudentError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete student record', details: deleteStudentError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Student record deleted from database');

    // If student has an associated auth user, delete it
    if (student.user_id) {
      console.log('Deleting auth user and roles for user_id:', student.user_id);
      
      // Delete user_roles entry
      const { error: deleteRoleError } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', student.user_id);

      if (deleteRoleError) {
        console.error('Error deleting user role:', deleteRoleError);
      } else {
        console.log('User role deleted');
      }

      // Delete the auth user
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(
        student.user_id
      );

      if (deleteAuthError) {
        console.error('Error deleting auth user:', deleteAuthError.message);
        // Don't fail the whole operation if auth deletion fails
        // The student record is already deleted
      } else {
        console.log('Auth user deleted successfully:', student.user_id);
      }
    } else {
      console.log('Student has no associated auth user, skipping auth deletion');
    }

    console.log('Student deleted successfully:', student.full_name);

    return new Response(
      JSON.stringify({ 
        message: 'Student deleted successfully',
        student_name: student.full_name
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in delete-student-user function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
