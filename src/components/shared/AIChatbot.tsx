import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Bot, Sparkles, X, Send, User, Utensils, Clock, HelpCircle, ChevronRight, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
  quickReplies?: string[];
}

export const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Hello! I am your School Meal Hub AI Assistant 🍳. How can I help you today?",
      timestamp: format(new Date(), "hh:mm a"),
      quickReplies: [
        "What is the meal schedule?",
        "Show today's menu",
        "How do I check in for meals?",
        "Dietary & Allergy info",
      ],
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend,
      timestamp: format(new Date(), "hh:mm a"),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput("");
    setIsTyping(true);

    try {
      const botResponse = await generateAIResponse(textToSend);
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error("AI Chatbot error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: "I'm having trouble retrieving live data right now. Regular meal schedules are: Breakfast (7:00–8:30 AM), Lunch (12:00–1:30 PM), and Dinner (5:00–6:30 PM).",
          timestamp: format(new Date(), "hh:mm a"),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateAIResponse = async (userQuery: string): Promise<Message> => {
    const q = userQuery.toLowerCase();
    const now = new Date();
    const todayStr = format(now, "yyyy-MM-dd");

    // Query 1: Meal Schedule
    if (q.includes("schedule") || q.includes("time") || q.includes("when") || q.includes("hours")) {
      const { data: schedules } = await supabase
        .from("meal_schedules")
        .select("*")
        .eq("is_active", true);

      let text = "🕒 **Daily Meal Schedule:**\n\n";
      if (schedules && schedules.length > 0) {
        schedules.forEach((s) => {
          const typeCapitalized = s.meal_type.charAt(0).toUpperCase() + s.meal_type.slice(1);
          text += `• **${typeCapitalized}**: ${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)}\n`;
        });
      } else {
        text += "• **Breakfast**: 07:00 AM - 08:30 AM\n• **Lunch**: 12:00 PM - 01:30 PM\n• **Dinner**: 05:00 PM - 06:30 PM\n";
      }

      return {
        id: Date.now().toString(),
        sender: "bot",
        text,
        timestamp: format(now, "hh:mm a"),
        quickReplies: ["Show today's menu", "How do I check in for meals?"],
      };
    }

    // Query 2: Menu / Food / Meal
    if (q.includes("menu") || q.includes("food") || q.includes("eat") || q.includes("today") || q.includes("breakfast") || q.includes("lunch") || q.includes("dinner")) {
      const { data: menus } = await supabase
        .from("weekly_menus")
        .select("*")
        .eq("date", todayStr);

      let text = `🍽️ **Today's Menu (${format(now, "EEEE, MMM d")}):**\n\n`;
      if (menus && menus.length > 0) {
        menus.forEach((m) => {
          const typeCap = m.meal_type.charAt(0).toUpperCase() + m.meal_type.slice(1);
          text += `• **${typeCap}**: ${m.description}\n`;
        });
      } else {
        text += "No custom menu posted for today yet. Check back soon or visit the Menu page for weekly options!";
      }

      return {
        id: Date.now().toString(),
        sender: "bot",
        text,
        timestamp: format(now, "hh:mm a"),
        quickReplies: ["What is the meal schedule?", "Dietary & Allergy info"],
      };
    }

    // Query 3: Check-in / QR Code / Scanner / ID
    if (q.includes("check in") || q.includes("qr") || q.includes("scan") || q.includes("id") || q.includes("login")) {
      return {
        id: Date.now().toString(),
        sender: "bot",
        text: "📱 **How to Check In for Meals:**\n\n1. Log in to your **Student Portal**.\n2. Go to the **Home** tab to view your personal QR code.\n3. Show your QR code to cafeteria staff at the meal counter.\n4. Staff scans your code to confirm your meal entry!",
        timestamp: format(now, "hh:mm a"),
        quickReplies: ["What is the meal schedule?", "Show today's menu"],
      };
    }

    // Query 4: Allergy / Dietary
    if (q.includes("allergy") || q.includes("allergies") || q.includes("diet") || q.includes("vegan") || q.includes("vegetarian") || q.includes("health")) {
      return {
        id: Date.now().toString(),
        sender: "bot",
        text: "🥗 **Dietary & Allergy Care:**\n\nStudents can update dietary restrictions and allergies in their **Student Profile** page under Settings. Cafeteria staff review profile flags before serving.",
        timestamp: format(now, "hh:mm a"),
        quickReplies: ["Show today's menu", "What is the meal schedule?"],
      };
    }

    // Default Fallback
    return {
      id: Date.now().toString(),
      sender: "bot",
      text: "I'm here to assist with meal schedules, menus, QR check-ins, dietary options, and school cafeteria announcements! What would you like to know?",
      timestamp: format(now, "hh:mm a"),
      quickReplies: [
        "What is the meal schedule?",
        "Show today's menu",
        "How do I check in for meals?",
      ],
    };
  };

  return (
    <>
      {/* Floating Widget Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-primary text-primary-foreground hover:opacity-90 px-4 py-3.5 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 border border-primary-foreground/20 group"
          aria-label="Open AI Assistant"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <span className="font-bold text-sm tracking-tight hidden sm:inline">AI Meal Assistant</span>
        </button>
      )}

      {/* Floating Chat Modal Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] max-w-[400px] h-[540px] flex flex-col bg-card border border-border/90 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-primary text-primary-foreground px-5 py-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary-foreground/15 flex items-center justify-center border border-primary-foreground/20">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-none flex items-center gap-1.5">
                  Meal Hub AI Assistant
                </h3>
                <span className="text-[11px] text-primary-foreground/80 font-medium flex items-center gap-1 mt-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> Online • 24/7 Support
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="rounded-full text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/15 h-8 w-8"
              aria-label="Close Assistant"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-sm bg-background/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} space-y-2`}
              >
                <div
                  className={`flex items-start gap-2.5 max-w-[85%] ${
                    msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      msg.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground border border-border"
                    }`}
                  >
                    {msg.sender === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                  </div>
                  <div
                    className={`p-3.5 rounded-2xl whitespace-pre-line leading-relaxed text-xs ${
                      msg.sender === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-none font-medium shadow-xs"
                        : "bg-card text-foreground border border-border/80 rounded-tl-none shadow-xs"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>

                <span className="text-[10px] text-muted-foreground px-9">
                  {msg.timestamp}
                </span>

                {/* Quick Reply Chips */}
                {msg.quickReplies && msg.quickReplies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 pl-9 max-w-[90%]">
                    {msg.quickReplies.map((reply, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(reply)}
                        className="text-[11px] font-semibold bg-card hover:bg-primary hover:text-primary-foreground text-foreground border border-border/80 px-2.5 py-1.5 rounded-xl transition-all duration-150 flex items-center gap-1 shadow-2xs"
                      >
                        <span>{reply}</span>
                        <ChevronRight className="h-3 w-3 opacity-60" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pl-2 py-1">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
                <span>AI Assistant is searching data...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Footer Input */}
          <div className="p-3 bg-card border-t border-border/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about meals, schedules, menu..."
                className="text-xs bg-background border-border focus-visible:ring-primary rounded-xl"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isTyping}
                className="rounded-xl shrink-0 h-9 w-9 bg-primary text-primary-foreground shadow-xs"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
