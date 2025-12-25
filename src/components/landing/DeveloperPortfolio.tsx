import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Code, ExternalLink, Send } from "lucide-react";

export const DeveloperPortfolio = () => {
  const [isOpen, setIsOpen] = useState(false);

  const skills = [
    "React",
    "TypeScript",
    "Tailwind CSS",
    "Supabase",
    "Node.js",
    "Next.js",
  ];

  return (
    <>
      {/* Floating Action Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-2xl hover:scale-110 transition-transform bg-gradient-to-br from-primary to-secondary"
        size="icon"
      >
        <Code className="h-6 w-6" />
      </Button>

      {/* Developer Portfolio Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              Developer Profile
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-6 py-4">
            {/* Profile Photo */}
            <div className="relative">
              <div className="h-28 w-28 rounded-full bg-gradient-to-br from-primary to-secondary p-1">
                <div className="h-full w-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                  <div className="text-4xl font-bold text-primary">A</div>
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-green-500 border-4 border-card flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
              </div>
            </div>

            {/* Name */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-foreground">Awalex</h3>
              <p className="text-sm text-muted-foreground">
                Full Stack Developer
              </p>
            </div>

            {/* Skills */}
            <div className="flex flex-wrap justify-center gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20"
                >
                  {skill}
                </span>
              ))}
            </div>

            {/* Social Links */}
            <div className="flex gap-3 w-full">
              <Button
                asChild
                variant="outline"
                className="flex-1"
              >
                <a
                  href="https://v0-futuristic-portfolio-website-pied.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Portfolio
                </a>
              </Button>
              <Button
                asChild
                className="flex-1"
              >
                <a
                  href="https://t.me/Awalex6"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Telegram
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
