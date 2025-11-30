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

    // Get list of admin and staff emails to exclude from cleanup
    const { data: staffEmails } = await supabaseAdmin
      .from('staff')
      .select('user_id');

    const { data: adminRoles } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    const excludedUserIds = [
      ...(staffEmails?.map(s => s.user_id).filter(Boolean) || []),
      ...(adminRoles?.map(r => r.user_id) || [])
    ];

    // Find orphaned auth users (auth users without student records)
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      throw new Error('Failed to fetch auth users');
    }

    const { data: students } = await supabaseAdmin
      .from('students')
      .select('user_id');

    const studentUserIds = students?.map(s => s.user_id).filter(Boolean) || [];
    
    const orphanedUsers = authUsers.users.filter(authUser => 
      !studentUserIds.includes(authUser.id) && 
      !excludedUserIds.includes(authUser.id)
    );

    console.log(`Found ${orphanedUsers.length} orphaned auth users`);

    // Delete orphaned users
    const deletedUsers = [];
    const errors = [];

    for (const orphanedUser of orphanedUsers) {
      try {
        console.log(`Deleting orphaned user: ${orphanedUser.email} (${orphanedUser.id})`);
        
        // Delete user_roles if exists
        await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('user_id', orphanedUser.id);

        // Delete auth user
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(orphanedUser.id);
        
        if (deleteError) {
          console.error(`Failed to delete user ${orphanedUser.email}:`, deleteError);
          errors.push({ email: orphanedUser.email, error: deleteError.message });
        } else {
          console.log(`Successfully deleted: ${orphanedUser.email}`);
          deletedUsers.push({ email: orphanedUser.email, id: orphanedUser.id });
        }
      } catch (error) {
        console.error(`Error processing user ${orphanedUser.email}:`, error);
        errors.push({ 
          email: orphanedUser.email, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Cleanup completed',
        deleted_count: deletedUsers.length,
        deleted_users: deletedUsers,
        errors: errors.length > 0 ? errors : undefined
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in cleanup-orphaned-users function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
