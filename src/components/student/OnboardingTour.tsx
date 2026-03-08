import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Home, UtensilsCrossed, History, Megaphone, User, 
  QrCode, Star, ArrowRight, Sparkles, X, Check
} from "lucide-react";

interface OnboardingTourProps {
  studentName: string;
  onComplete: () => void;
}

const steps = [
  {
    icon: Sparkles,
    emoji: "👋",
    title: "Welcome to SchoolSnap!",
    description: "We're glad to have you here. Let's take a quick tour to help you get started with the meal management system.",
    color: "from-primary to-accent",
    iconBg: "bg-primary/15 text-primary",
  },
  {
    icon: Home,
    emoji: "🏠",
    title: "Your Dashboard",
    description: "The Home tab shows your daily meal status, monthly statistics, and quick actions to navigate around the app.",
    color: "from-primary to-secondary",
    iconBg: "bg-primary/15 text-primary",
  },
  {
    icon: QrCode,
    emoji: "📱",
    title: "QR Code Scanning",
    description: "Show your personal QR code at the cafeteria to check in for meals. Staff will scan it to record your attendance.",
    color: "from-secondary to-primary",
    iconBg: "bg-secondary/15 text-secondary",
  },
  {
    icon: UtensilsCrossed,
    emoji: "🍽️",
    title: "Daily Menu",
    description: "Check the Menu tab to see what's being served for breakfast, lunch, and dinner each day.",
    color: "from-accent to-primary",
    iconBg: "bg-accent/15 text-accent",
  },
  {
    icon: Star,
    emoji: "⭐",
    title: "Rate Your Meals",
    description: "After eating, visit the History tab to rate your meals and share feedback. You can even upload photos!",
    color: "from-primary to-accent",
    iconBg: "bg-accent/15 text-accent",
  },
  {
    icon: Megaphone,
    emoji: "📢",
    title: "Community Voice",
    description: "See what other students are saying about meals in the Voice tab. Like and engage with their feedback!",
    color: "from-secondary to-accent",
    iconBg: "bg-secondary/15 text-secondary",
  },
  {
    icon: Check,
    emoji: "🎉",
    title: "You're All Set!",
    description: "That's everything you need to know. Enjoy your meals and don't forget to share your feedback!",
    color: "from-primary to-accent",
    iconBg: "bg-primary/15 text-primary",
  },
];

export const OnboardingTour = ({ studentName, onComplete }: OnboardingTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const StepIcon = step.icon;

  const handleNext = () => {
    if (isLast) {
      handleClose();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onComplete(), 300);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-6 transition-opacity duration-300 ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={handleSkip} />

      {/* Card */}
      <div
        className={`relative w-full max-w-sm bg-card rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 ${
          isExiting ? "scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        {/* Skip button */}
        {!isLast && (
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-card/80 backdrop-blur flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Gradient Header */}
        <div className={`bg-gradient-to-br ${step.color} px-6 pt-10 pb-12 text-center relative overflow-hidden`}>
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-card/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-card/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div
            key={currentStep}
            className="relative page-enter"
          >
            <span className="text-5xl block mb-3">{step.emoji}</span>
            <h2 className="text-xl font-extrabold text-primary-foreground">
              {isFirst ? `Hey ${studentName}! ${step.title}` : step.title}
            </h2>
          </div>

          {/* Curved bottom */}
          <div className="absolute -bottom-1 left-0 right-0 h-6 bg-card rounded-t-[24px]" />
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-2">
          <div key={currentStep} className="page-enter">
            <p className="text-sm text-muted-foreground text-center leading-relaxed mb-6">
              {step.description}
            </p>
          </div>

          {/* Progress Dots */}
          <div className="flex items-center justify-center gap-1.5 mb-5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? "w-6 bg-primary"
                    : idx < currentStep
                    ? "w-2 bg-primary/40"
                    : "w-2 bg-muted-foreground/20"
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {!isFirst && !isLast && (
              <Button
                variant="ghost"
                onClick={() => setCurrentStep((s) => s - 1)}
                className="flex-1 rounded-xl"
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              className={`flex-1 rounded-xl gap-2 font-bold ${isFirst || isLast ? "w-full" : ""}`}
            >
              {isLast ? (
                <>
                  Get Started
                  <Sparkles className="h-4 w-4" />
                </>
              ) : isFirst ? (
                <>
                  Let's Go!
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
