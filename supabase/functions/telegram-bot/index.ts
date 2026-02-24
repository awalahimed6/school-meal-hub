import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!TELEGRAM_BOT_TOKEN || !LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing required environment variables");
    return new Response("Server configuration error", { status: 500 });
  }

  try {
    const update = await req.json();
    console.log("Received Telegram update:", JSON.stringify(update));

    // Extract message info
    const message = update.message;
    if (!message || !message.text) {
      console.log("No text message in update, skipping");
      return new Response("OK", { status: 200 });
    }

    const chatId = message.chat.id;
    const userMessage = message.text;
    const userName = message.from?.first_name || "Student";

    console.log(`Processing message from ${userName} (${chatId}): ${userMessage}`);

    // Handle /start command
    if (userMessage === "/start") {
      await sendTelegramMessage(
        TELEGRAM_BOT_TOKEN,
        chatId,
        `👋 Hello ${userName}! I'm Nejo Campus Buddy, your school meal assistant 🎓\n\nI can help you with:\n• Today's menu and meal times\n• Upcoming menus for the week\n• School information & FAQs\n\nJust ask me anything!`
      );
      return new Response("OK", { status: 200 });
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];
    const dayOfWeek = new Date().toLocaleDateString("en-US", { weekday: "long" });

    // Fetch today's menu
    const { data: todayMenus, error: menuError } = await supabase
      .from("weekly_menus")
      .select("*")
      .eq("date", today);

    if (menuError) {
      console.error("Error fetching menus:", menuError);
    }

    // Fetch upcoming menus (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split("T")[0];

    const { data: upcomingMenus, error: upcomingError } = await supabase
      .from("weekly_menus")
      .select("*")
      .gte("date", today)
      .lte("date", nextWeekStr)
      .order("date", { ascending: true });

    if (upcomingError) {
      console.error("Error fetching upcoming menus:", upcomingError);
    }

    // Fetch weekly menu templates (fallback)
    const { data: templates, error: templatesError } = await supabase
      .from("weekly_menu_templates")
      .select("*");

    if (templatesError) {
      console.error("Error fetching templates:", templatesError);
    }

    // Fetch meal schedules
    const { data: schedules, error: schedulesError } = await supabase
      .from("meal_schedules")
      .select("*")
      .eq("is_active", true);

    if (schedulesError) {
      console.error("Error fetching schedules:", schedulesError);
    }

    // Fetch knowledge base
    const { data: knowledgeBase, error: kbError } = await supabase
      .from("knowledge_base")
      .select("*")
      .eq("is_active", true);

    if (kbError) {
      console.error("Error fetching knowledge base:", kbError);
    }

    // Build context information
    let todayMenuInfo = "No menu data available for today.";
    if (todayMenus && todayMenus.length > 0) {
      todayMenuInfo = todayMenus
        .map((m) => `${m.meal_type.toUpperCase()}: ${m.description}`)
        .join("\n");
    }

    let upcomingMenusInfo = "";
    if (upcomingMenus && upcomingMenus.length > 0) {
      const menusByDate: Record<string, string[]> = {};
      upcomingMenus.forEach((m) => {
        if (!menusByDate[m.date]) menusByDate[m.date] = [];
        menusByDate[m.date].push(`${m.meal_type}: ${m.description}`);
      });
      upcomingMenusInfo = Object.entries(menusByDate)
        .map(([date, meals]) => `${date}: ${meals.join(", ")}`)
        .join("\n");
    }

    let templatesInfo = "";
    if (templates && templates.length > 0) {
      const templatesByDay: Record<string, string[]> = {};
      templates.forEach((t) => {
        if (!templatesByDay[t.day_of_week]) templatesByDay[t.day_of_week] = [];
        templatesByDay[t.day_of_week].push(`${t.meal_type}: ${t.main_dish}`);
      });
      templatesInfo = Object.entries(templatesByDay)
        .map(([day, meals]) => `${day}: ${meals.join(", ")}`)
        .join("\n");
    }

    let scheduleInfo = "No schedule available.";
    if (schedules && schedules.length > 0) {
      scheduleInfo = schedules
        .map((s) => `${s.meal_type}: ${s.start_time} - ${s.end_time}`)
        .join("\n");
    }

    let knowledgeInfo = "";
    if (knowledgeBase && knowledgeBase.length > 0) {
      knowledgeInfo = knowledgeBase
        .map((kb) => `Q: ${kb.question}\nA: ${kb.answer}`)
        .join("\n\n");
    }

    // Build system prompt
    const systemPrompt = `You are Nejo Campus Buddy, the friendly school meal assistant on Telegram. You help students with meal-related questions.

TODAY'S DATE: ${today} (${dayOfWeek})

TODAY'S MENU:
${todayMenuInfo}

UPCOMING MENUS (Next 7 Days):
${upcomingMenusInfo || "No upcoming menus scheduled."}

WEEKLY MENU TEMPLATES (Default Schedule):
${templatesInfo || "No templates available."}

MEAL SCHEDULES:
${scheduleInfo}

KNOWLEDGE BASE (FAQs):
${knowledgeInfo || "No FAQs available."}

GUIDELINES:
- Be friendly, helpful, and concise (Telegram messages should be brief)
- Use emojis to make responses engaging 🍽️
- If asked about today's menu, use the TODAY'S MENU section
- For future dates, check UPCOMING MENUS first, then fall back to WEEKLY MENU TEMPLATES
- Answer FAQs using the KNOWLEDGE BASE
- If you don't know something, say so politely
- Keep responses under 300 words for Telegram readability`;

    // Call AI
    console.log("Calling Lovable AI...");
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      await sendTelegramMessage(
        TELEGRAM_BOT_TOKEN,
        chatId,
        "🔧 Nejo Campus Buddy is offline right now. Please try again later!"
      );
      return new Response("OK", { status: 200 });
    }

    const aiData = await aiResponse.json();
    const aiMessage = aiData.choices?.[0]?.message?.content || "I couldn't generate a response.";

    console.log("AI response:", aiMessage);

    // Send response to Telegram
    await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, aiMessage);

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error processing request:", error);
    
    // Try to send error message if we have chat info
    try {
      const update = await req.clone().json();
      const chatId = update.message?.chat?.id;
      if (chatId && Deno.env.get("TELEGRAM_BOT_TOKEN")) {
        await sendTelegramMessage(
          Deno.env.get("TELEGRAM_BOT_TOKEN")!,
          chatId,
          "🔧 Nejo Campus Buddy is offline right now. Please try again later!"
        );
      }
    } catch {
      // Ignore secondary errors
    }

    return new Response("OK", { status: 200 });
  }
});

async function sendTelegramMessage(token: string, chatId: number, text: string): Promise<void> {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "HTML",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Telegram API error:", error);
    throw new Error(`Failed to send Telegram message: ${error}`);
  }

  console.log("Message sent successfully to chat:", chatId);
}
