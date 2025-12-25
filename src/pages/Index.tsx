import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Utensils, 
  Calendar, 
  Bell, 
  Users, 
  GraduationCap, 
  Lightbulb, 
  Coffee, 
  Sandwich, 
  Soup,
  Sun,
  Menu,
  X,
  ChevronRight,
  Star,
  Heart
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { StudentVoiceFeed } from "@/components/shared/StudentVoiceFeed";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const Index = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll for header background
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch announcements
  const { data: announcements } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data;
    },
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const isLoggedIn = !!user;

  const navLinks = [
    { name: "Home", href: "#" },
    { name: "About Us", href: "#features" },
    { name: "Schedule", href: "#schedule" },
    { name: "News", href: "#announcements" },
    { name: "Student Voice", href: "#student-voice" },
  ];

  const mealSchedule = [
    { meal: "Breakfast", time: "7:00 AM - 8:30 AM", icon: Coffee, description: "Start your day with a nutritious breakfast" },
    { meal: "Lunch", time: "12:00 PM - 1:30 PM", icon: Sandwich, description: "Refuel with a balanced midday meal" },
    { meal: "Dinner", time: "5:00 PM - 6:30 PM", icon: Soup, description: "End your day with a wholesome dinner" },
  ];

  const features = [
    {
      icon: GraduationCap,
      title: "Academic Excellence",
      description: "Our rigorous curriculum and dedicated faculty prepare students for top universities and future success.",
      color: "bg-secondary",
    },
    {
      icon: Users,
      title: "Thriving Community",
      description: "We foster a supportive and inclusive boarding environment where students build lifelong friendships.",
      color: "bg-primary",
    },
    {
      icon: Lightbulb,
      title: "Innovative Learning",
      description: "Integrating modern technology and teaching methods to equip students for the 21st century.",
      color: "bg-accent",
    },
  ];

  const handleDashboardNavigate = () => {
    if (role === "admin") navigate("/admin");
    else if (role === "staff") navigate("/staff");
    else if (role === "student") navigate("/student");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-card/95 backdrop-blur-md shadow-lg border-b border-border"
            : "bg-transparent"
        )}
      >
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary shadow-lg group-hover:scale-105 transition-transform">
              <Sun className="h-6 w-6 text-secondary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-foreground leading-tight">Ifa Boru</h1>
              <p className="text-xs text-muted-foreground">Boarding Secondary School</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Button onClick={handleDashboardNavigate} className="shadow-lg">
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link to="/auth">Login</Link>
                </Button>
                <Button asChild className="shadow-lg bg-primary hover:bg-primary/90">
                  <Link to="/auth">Apply Now</Link>
                </Button>
              </>
            )}
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-card border-b border-border animate-fade-in">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        
        {/* Decorative Elements */}
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 animate-fade-up">
              <Sun className="h-4 w-4" />
              <span>Nedjo Ifa Boru Boarding Secondary School</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
              <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                Ifa Boru:
              </span>{" "}
              Your Ray of Light to a{" "}
              <span className="text-primary">Bright Future</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: "0.2s" }}>
              Discover excellence in education at Nedjo's premier boarding secondary school, 
              where we nurture the leaders of tomorrow.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
              {isLoggedIn ? (
                <Button size="lg" onClick={handleDashboardNavigate} className="shadow-xl animate-glow">
                  Go to Dashboard
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild className="shadow-xl animate-glow">
                    <Link to="/auth">
                      Explore Admissions
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="border-2">
                    <a href="#schedule">Take a Virtual Tour</a>
                  </Button>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-16 max-w-lg mx-auto animate-fade-up" style={{ animationDelay: "0.4s" }}>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary">500+</p>
                <p className="text-sm text-muted-foreground">Students</p>
              </div>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-secondary">50+</p>
                <p className="text-sm text-muted-foreground">Faculty</p>
              </div>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-accent">95%</p>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-primary rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose <span className="text-primary">Ifa Boru?</span>
            </h2>
            <p className="text-muted-foreground">
              We provide a holistic educational experience that prepares students for success in all aspects of life.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature, index) => (
              <Card 
                key={feature.title} 
                className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={cn("absolute inset-0 opacity-5", feature.color)} />
                <CardHeader className="relative">
                  <div className={cn(
                    "inline-flex h-14 w-14 items-center justify-center rounded-xl mb-4 shadow-lg transition-transform group-hover:scale-110",
                    feature.color
                  )}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Meal Schedule Section */}
      <section id="schedule" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-4">
              <Calendar className="h-4 w-4" />
              <span>Daily Schedule</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              A Day at <span className="text-primary">Ifa Boru</span>
            </h2>
            <p className="text-muted-foreground">
              We ensure every student receives nutritious meals throughout the day to fuel their learning journey.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            {mealSchedule.map((item, index) => (
              <Card 
                key={item.meal} 
                className="group relative overflow-hidden border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-secondary" />
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <item.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{item.meal}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-lg font-semibold text-primary mb-2">{item.time}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Announcements Section */}
      {announcements && announcements.length > 0 && (
        <section id="announcements" className="py-24 bg-secondary/5">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
                <Bell className="h-4 w-4" />
                <span>Stay Updated</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Latest News & <span className="text-primary">Announcements</span>
              </h2>
              <p className="text-muted-foreground">
                Keep up with the latest happenings at our school.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
              {announcements.map((announcement) => (
                <Card 
                  key={announcement.id} 
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-primary"
                >
                  <CardHeader>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(announcement.created_at), "MMM d, yyyy")}</span>
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                      {announcement.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {announcement.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Student Voice Section */}
      <section id="student-voice" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-sm font-medium mb-4">
              <Heart className="h-4 w-4" />
              <span>Student Feedback</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              The Voice of <span className="text-primary">Our Students</span>
            </h2>
            <p className="text-muted-foreground">
              See what our students have to say about their dining experience.
            </p>
          </div>

          <StudentVoiceFeed showHeader={false} limit={6} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-secondary" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ 
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)", 
            backgroundSize: "20px 20px" 
          }} />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Begin Your Journey?
            </h2>
            <p className="text-lg text-white/80 mb-8">
              Join our community of learners and discover your potential at Ifa Boru. 
              Applications are now open for the upcoming academic year.
            </p>
            {!isLoggedIn && (
              <Button size="lg" variant="secondary" asChild className="shadow-xl">
                <Link to="/auth">
                  Apply Now
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 md:grid-cols-4">
            {/* Logo & About */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                  <Sun className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Ifa Boru</h3>
                  <p className="text-sm text-background/60">Boarding Secondary School</p>
                </div>
              </div>
              <p className="text-background/70 max-w-md">
                Nedjo Ifa Boru Boarding Secondary School - Where every student is a ray of light, 
                illuminating the path to a brighter future.
              </p>
              <p className="text-sm text-background/50 mt-4">
                Nejo, Ethiopia
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {navLinks.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="text-background/70 hover:text-primary transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4">Contact Us</h4>
              <ul className="space-y-2 text-sm text-background/70">
                <li>📍 Nejo, Ethiopia</li>
                <li>📧 info@ifaboru.edu.et</li>
                <li>📞 +251 XXX XXX XXX</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-background/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-background/50">
              © {new Date().getFullYear()} Nedjo Ifa Boru Boarding Secondary School. All rights reserved.
            </p>
            <p className="text-sm text-background/50">
              "Ifa Boru" - Ray of Light ☀️
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
