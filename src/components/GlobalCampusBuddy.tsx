import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Bot, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const GlobalCampusBuddy = () => {
  const location = useLocation();
  const isStudentDashboard = location.pathname === "/student";
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm Nejo Campus Buddy 🎓 How can I help you today with our meal system or school information?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Draggable FAB state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const hasMoved = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    hasMoved.current = false;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMoved.current = true;
    }
    setPosition({
      x: dragRef.current.startPosX + dx,
      y: dragRef.current.startPosY + dy,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    dragRef.current = null;

    // Snap to nearest horizontal edge
    if (fabRef.current) {
      const rect = fabRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const screenW = window.innerWidth;
      const baseBottom = isStudentDashboard ? 112 : 24;

      if (centerX < screenW / 2) {
        // Snap to left edge
        setPosition({ x: -(screenW - 24 - rect.width - 24), y: position.y });
      } else {
        // Snap to right edge (reset x to 0)
        setPosition({ x: 0, y: position.y });
      }
    }
  };

  const handleFabClick = () => {
    if (!hasMoved.current) {
      setIsOpen(!isOpen);
    }
  };

  useEffect(() => {
    // Find the viewport inside ScrollArea and scroll to bottom
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat-assistant", {
        body: {
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        },
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(error.message || "Failed to get response");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data?.message || "I'm sorry, I couldn't process that request.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message. Please try again.",
        variant: "destructive",
      });
      // Add error message to chat
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Backdrop overlay to close on outside tap */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Draggable Floating Action Button */}
      <Button
        ref={fabRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleFabClick}
        className={`fixed z-50 h-14 w-14 rounded-full shadow-2xl bg-gradient-to-r from-primary to-orange-600 touch-none select-none ${
          isDragging ? "scale-110 shadow-3xl cursor-grabbing" : "hover:scale-110 cursor-grab transition-all duration-300"
        }`}
        style={{
          right: `${24 - position.x}px`,
          bottom: `${(isStudentDashboard ? 112 : 24) - position.y}px`,
        }}
        size="icon"
      >
        {isOpen ? (
          <X className="h-6 w-6 pointer-events-none" />
        ) : (
          <MessageCircle className="h-6 w-6 pointer-events-none" />
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className={`fixed z-50 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300 rounded-2xl border-0 ring-1 ring-border/50 ${
          isStudentDashboard
            ? "bottom-32 right-4 left-4 h-[65dvh] sm:left-auto sm:w-[400px] sm:h-[520px] sm:right-6"
            : "inset-0 h-[100dvh] rounded-none sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[400px] sm:h-[600px] sm:rounded-2xl"
        }`}>
          {/* Header */}
          <CardHeader className="bg-gradient-to-r from-[hsl(220_16%_18%)] via-[hsl(220_14%_15%)] to-[hsl(220_12%_12%)] text-white p-4 flex-shrink-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(42_80%_55%/0.08)] to-transparent" />
            <div className="relative flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[hsl(42_90%_55%)] to-[hsl(24_95%_53%)] flex items-center justify-center shadow-lg shadow-[hsl(42_80%_50%/0.3)]">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="block leading-tight">Campus Buddy</span>
                  <span className="text-[10px] font-normal text-white/50 tracking-wide uppercase">AI Assistant</span>
                </div>
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8 rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 p-0 overflow-hidden bg-card">
            <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
              <div className="space-y-3">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-primary to-[hsl(24_90%_48%)] text-primary-foreground rounded-br-md shadow-sm"
                          : "bg-muted text-foreground rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Thinking...
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>

          {/* Input */}
          <div className="p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-3 border-t flex-shrink-0 bg-card">
            <div className="flex gap-2 items-center">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                disabled={isLoading}
                className="flex-1 rounded-xl border-muted bg-muted/50 focus:bg-card"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="bg-gradient-to-r from-primary to-[hsl(24_90%_48%)] hover:opacity-90 rounded-xl h-10 w-10 shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};
