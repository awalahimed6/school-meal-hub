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

    // Get today's date and calculate date range (next 7 days)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Calculate end date (7 days from now)
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 7);
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log("Fetching data for date range:", todayStr, "to", endDateStr, "current day:", dayOfWeek);

    // Fetch upcoming menus for the next 7 days
    const { data: upcomingMenus, error: menuError } = await supabase
      .from('weekly_menus')
      .select('date, meal_type, description')
      .gte('date', todayStr)
      .lte('date', endDateStr)
      .order('date', { ascending: true });

    if (menuError) {
      console.error("Error fetching upcoming menus:", menuError);
    }

    // Fetch ALL weekly menu templates (for all days of the week)
    const { data: allTemplates, error: templateError } = await supabase
      .from('weekly_menu_templates')
      .select('day_of_week, meal_type, main_dish, description')
      .order('day_of_week');

    if (templateError) {
      console.error("Error fetching menu templates:", templateError);
    }

    // Fetch knowledge base FAQs
    const { data: knowledgeBase, error: kbError } = await supabase
      .from('knowledge_base')
      .select('question, answer, category')
      .eq('is_active', true);

    if (kbError) {
      console.error("Error fetching knowledge base:", kbError);
    }

    // Build upcoming menus information
    let upcomingMenusInfo = "";
    if (upcomingMenus && upcomingMenus.length > 0) {
      // Group by date
      const menusByDate: Record<string, { breakfast?: string; lunch?: string; dinner?: string }> = {};
      
      for (const menu of upcomingMenus) {
        if (!menusByDate[menu.date]) {
          menusByDate[menu.date] = {};
        }
        menusByDate[menu.date][menu.meal_type as 'breakfast' | 'lunch' | 'dinner'] = menu.description;
      }
      
      upcomingMenusInfo = "\n=== UPCOMING SPECIFIC MENUS ===\n";
      for (const [date, meals] of Object.entries(menusByDate)) {
        const menuDate = new Date(date);
        const dayName = menuDate.toLocaleDateString('en-US', { weekday: 'long' });
        upcomingMenusInfo += `\n${dayName} (${date}):\n`;
        upcomingMenusInfo += `  - Breakfast: ${meals.breakfast || 'Not set'}\n`;
        upcomingMenusInfo += `  - Lunch: ${meals.lunch || 'Not set'}\n`;
        upcomingMenusInfo += `  - Dinner: ${meals.dinner || 'Not set'}\n`;
      }
    } else {
      upcomingMenusInfo = "\n=== UPCOMING SPECIFIC MENUS ===\nNo specific menus have been set for the upcoming week.\n";
    }

    // Build weekly templates information (the standard/default pattern)
    let templatesInfo = "";
    if (allTemplates && allTemplates.length > 0) {
      // Group by day of week
      const templatesByDay: Record<string, { breakfast?: string; lunch?: string; dinner?: string }> = {};
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      for (const template of allTemplates) {
        if (!templatesByDay[template.day_of_week]) {
          templatesByDay[template.day_of_week] = {};
        }
        const mealDesc = template.description 
          ? `${template.main_dish} - ${template.description}`
          : template.main_dish;
        templatesByDay[template.day_of_week][template.meal_type as 'breakfast' | 'lunch' | 'dinner'] = mealDesc;
      }
      
      templatesInfo = "\n=== WEEKLY STANDARD TEMPLATE (Default Pattern) ===\n";
      templatesInfo += "Use this if no specific menu is set for a date:\n";
      for (const day of dayOrder) {
        if (templatesByDay[day]) {
          templatesInfo += `\n${day}:\n`;
          templatesInfo += `  - Breakfast: ${templatesByDay[day].breakfast || 'Not set'}\n`;
          templatesInfo += `  - Lunch: ${templatesByDay[day].lunch || 'Not set'}\n`;
          templatesInfo += `  - Dinner: ${templatesByDay[day].dinner || 'Not set'}\n`;
        }
      }
    } else {
      templatesInfo = "\n=== WEEKLY STANDARD TEMPLATE ===\nNo weekly templates have been configured.\n";
    }

    // Build today's menu info specifically
    let todayMenuInfo = "";
    const todayMenuData = upcomingMenus?.filter(m => m.date === todayStr);
    const todayTemplate = allTemplates?.filter(t => t.day_of_week === dayOfWeek);
    
    if (todayMenuData && todayMenuData.length > 0) {
      const breakfast = todayMenuData.find(m => m.meal_type === 'breakfast');
      const lunch = todayMenuData.find(m => m.meal_type === 'lunch');
      const dinner = todayMenuData.find(m => m.meal_type === 'dinner');
      
      todayMenuInfo = `\n=== TODAY'S MENU (${todayStr} - ${dayOfWeek}) ===\n`;
      todayMenuInfo += `- Breakfast: ${breakfast?.description || 'Not set'}\n`;
      todayMenuInfo += `- Lunch: ${lunch?.description || 'Not set'}\n`;
      todayMenuInfo += `- Dinner: ${dinner?.description || 'Not set'}\n`;
    } else if (todayTemplate && todayTemplate.length > 0) {
      const breakfast = todayTemplate.find(t => t.meal_type === 'breakfast');
      const lunch = todayTemplate.find(t => t.meal_type === 'lunch');
      const dinner = todayTemplate.find(t => t.meal_type === 'dinner');
      
      todayMenuInfo = `\n=== TODAY'S MENU (${dayOfWeek} - From Weekly Template) ===\n`;
      todayMenuInfo += `- Breakfast: ${breakfast ? `${breakfast.main_dish}${breakfast.description ? ` - ${breakfast.description}` : ''}` : 'Not set'}\n`;
      todayMenuInfo += `- Lunch: ${lunch ? `${lunch.main_dish}${lunch.description ? ` - ${lunch.description}` : ''}` : 'Not set'}\n`;
      todayMenuInfo += `- Dinner: ${dinner ? `${dinner.main_dish}${dinner.description ? ` - ${dinner.description}` : ''}` : 'Not set'}\n`;
    } else {
      todayMenuInfo = `\n=== TODAY'S MENU ===\nNo menu has been set for today (${dayOfWeek}).\n`;
    }

    // Fetch meal schedules
    const { data: schedules, error: scheduleError } = await supabase
      .from('meal_schedules')
      .select('meal_type, start_time, end_time, is_active')
      .eq('is_active', true);

    if (scheduleError) {
      console.error("Error fetching schedules:", scheduleError);
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

      const breakfast = schedules.find((s: { meal_type: string }) => s.meal_type === 'breakfast');
      const lunch = schedules.find((s: { meal_type: string }) => s.meal_type === 'lunch');
      const dinner = schedules.find((s: { meal_type: string }) => s.meal_type === 'dinner');

      scheduleInfo = `\n=== MEAL SERVING TIMES ===\n`;
      scheduleInfo += `- Breakfast: ${breakfast ? `${formatTime(breakfast.start_time)} - ${formatTime(breakfast.end_time)}` : 'Not scheduled'}\n`;
      scheduleInfo += `- Lunch: ${lunch ? `${formatTime(lunch.start_time)} - ${formatTime(lunch.end_time)}` : 'Not scheduled'}\n`;
      scheduleInfo += `- Dinner: ${dinner ? `${formatTime(dinner.start_time)} - ${formatTime(dinner.end_time)}` : 'Not scheduled'}\n`;
    } else {
      scheduleInfo = `\n=== MEAL SERVING TIMES ===\nNo active schedules found.\n`;
    }

    // Build knowledge base information
    let knowledgeInfo = "";
    if (knowledgeBase && knowledgeBase.length > 0) {
      knowledgeInfo = "\n=== FREQUENTLY ASKED QUESTIONS ===\n";
      for (const item of knowledgeBase) {
        knowledgeInfo += `\nQ: ${item.question}\nA: ${item.answer}\n`;
      }
    }

    // Build the system prompt with real data
    const systemPrompt = `You are Campus Buddy, the official AI assistant for Ifa Boru Boarding School's meal management system.

You have access to REAL, LIVE data from the school's database. Always use this data to answer questions accurately.

=== CURRENT DATE CONTEXT ===
Current Date: ${todayStr}
Current Day: ${dayOfWeek}
Date Range Available: ${todayStr} to ${endDateStr}

${todayMenuInfo}
${upcomingMenusInfo}
${templatesInfo}
${scheduleInfo}
${knowledgeInfo}

=== YOUR RESPONSIBILITIES ===
1. Answer questions about TODAY's meals using the exact data above
2. Answer questions about FUTURE meals (tomorrow, next week, etc.) using:
   - First check "UPCOMING SPECIFIC MENUS" for that date
   - If not found, use "WEEKLY STANDARD TEMPLATE" based on the day of week
3. Provide accurate serving times from the schedule data
4. Answer FAQs using the knowledge base data above
5. Explain how the QR code check-in system works for meal attendance
6. Help students navigate the meal system app
7. Be friendly, helpful, and concise

=== IMPORTANT RULES ===
- NEVER guess or make up menu items - only use the data provided above
- For FAQs, use the exact answers from the knowledge base when available
- For future dates: Calculate the day of week to find the correct template
- If asked about a date beyond 7 days, explain you only have access to the next week's data
- If no menu is set, honestly tell the student and suggest they check with staff
- Keep responses brief and student-friendly
- For questions outside your knowledge, suggest contacting school administration`;
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
