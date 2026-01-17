import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Supabase credentials not configured");
      throw new Error("Supabase credentials not configured");
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    console.log("Fetching data for date:", today, "day:", dayOfWeek);

    // Fetch today's menu from weekly_menus
    const { data: todayMenus, error: menuError } = await supabase
      .from('weekly_menus')
      .select('meal_type, description')
      .eq('date', today);

    if (menuError) {
      console.error("Error fetching menus:", menuError);
    }

    // Fetch menu templates as fallback (based on day of week)
    const { data: menuTemplates, error: templateError } = await supabase
      .from('weekly_menu_templates')
      .select('meal_type, main_dish, description')
      .eq('day_of_week', dayOfWeek);

    if (templateError) {
      console.error("Error fetching menu templates:", templateError);
    }

    // Fetch meal schedules
    const { data: schedules, error: scheduleError } = await supabase
      .from('meal_schedules')
      .select('meal_type, start_time, end_time, is_active')
      .eq('is_active', true);

    if (scheduleError) {
      console.error("Error fetching schedules:", scheduleError);
    }

    // Build menu information - prefer today's specific menu, fallback to templates
    let menuInfo = "";
    
    if (todayMenus && todayMenus.length > 0) {
      const breakfast = todayMenus.find(m => m.meal_type === 'breakfast');
      const lunch = todayMenus.find(m => m.meal_type === 'lunch');
      const dinner = todayMenus.find(m => m.meal_type === 'dinner');
      
      menuInfo = `
TODAY'S MENU (${today} - ${dayOfWeek}):
- Breakfast: ${breakfast?.description || 'Not set'}
- Lunch: ${lunch?.description || 'Not set'}
- Dinner: ${dinner?.description || 'Not set'}`;
    } else if (menuTemplates && menuTemplates.length > 0) {
      const breakfast = menuTemplates.find(m => m.meal_type === 'breakfast');
      const lunch = menuTemplates.find(m => m.meal_type === 'lunch');
      const dinner = menuTemplates.find(m => m.meal_type === 'dinner');
      
      menuInfo = `
TODAY'S MENU (${dayOfWeek} - Weekly Template):
- Breakfast: ${breakfast ? `${breakfast.main_dish}${breakfast.description ? ` - ${breakfast.description}` : ''}` : 'Not set'}
- Lunch: ${lunch ? `${lunch.main_dish}${lunch.description ? ` - ${lunch.description}` : ''}` : 'Not set'}
- Dinner: ${dinner ? `${dinner.main_dish}${dinner.description ? ` - ${dinner.description}` : ''}` : 'Not set'}`;
    } else {
      menuInfo = `
TODAY'S MENU: No menu has been set for today (${dayOfWeek}).`;
    }

    // Build schedule information
    let scheduleInfo = "";
    if (schedules && schedules.length > 0) {
      const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
      };

      const breakfast = schedules.find(s => s.meal_type === 'breakfast');
      const lunch = schedules.find(s => s.meal_type === 'lunch');
      const dinner = schedules.find(s => s.meal_type === 'dinner');

      scheduleInfo = `
MEAL SERVING TIMES:
- Breakfast: ${breakfast ? `${formatTime(breakfast.start_time)} - ${formatTime(breakfast.end_time)}` : 'Not scheduled'}
- Lunch: ${lunch ? `${formatTime(lunch.start_time)} - ${formatTime(lunch.end_time)}` : 'Not scheduled'}
- Dinner: ${dinner ? `${formatTime(dinner.start_time)} - ${formatTime(dinner.end_time)}` : 'Not scheduled'}`;
    } else {
      scheduleInfo = `
MEAL SERVING TIMES: No active schedules found.`;
    }

    // Build the system prompt with real data
    const systemPrompt = `You are Campus Buddy, the official AI assistant for Ifa Boru Boarding School's meal management system.

You have access to REAL, LIVE data from the school's database. Always use this data to answer questions accurately.

=== OFFICIAL SCHOOL DATA ===
${menuInfo}
${scheduleInfo}

=== YOUR RESPONSIBILITIES ===
1. Answer questions about today's meals using the EXACT menu data above
2. Provide accurate serving times from the schedule data
3. Explain how the QR code check-in system works for meal attendance
4. Help students navigate the meal system app
5. Be friendly, helpful, and concise

=== IMPORTANT RULES ===
- NEVER guess or make up menu items - only use the data provided above
- If no menu is set, honestly tell the student and suggest they check with staff
- Keep responses brief and student-friendly
- If asked about future meals, explain you only have access to today's data and weekly templates
- For questions outside your knowledge, suggest contacting school administration

Current Date: ${today}
Current Day: ${dayOfWeek}`;

    console.log("Calling AI with real data context");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that request.";
    
    console.log("Successfully generated AI response with real data");

    return new Response(
      JSON.stringify({ message: aiMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Chat assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
