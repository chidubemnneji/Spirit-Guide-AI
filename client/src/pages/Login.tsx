import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { data: flagsData } = useQuery<Record<string, boolean>>({ queryKey: ["/api/flags"] });
  const googleEnabled = flagsData?.GOOGLE_AUTH === true;
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    if (!password) {
      newErrors.password = "Password is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);
    
    if (result.success) {
      const response = await fetch("/api/auth/me", { credentials: "include" });
      const data = await response.json();
      if (data.success && data.user) {
        setLocation(data.user.hasCompletedOnboarding ? "/devotion" : "/onboarding");
      } else {
        setLocation("/onboarding");
      }
    } else {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: result.error || "Invalid email or password",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col gradient-onboarding">
      <header className="flex items-center p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
          data-testid="button-back"
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </header>

      <main className="flex-1 flex flex-col justify-center px-6 pb-12">
        <motion.div 
          className="w-full max-w-md mx-auto space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="space-y-2">
            <h1 className="font-serif text-3xl font-bold">Welcome back</h1>
            <p className="text-muted-foreground">
              Sign in to continue your journey
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-email"
                className={`h-12 rounded-xl bg-card border-0 ${errors.email ? "ring-2 ring-destructive" : ""}`}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <button
                  type="button"
                  className="text-xs text-primary"
                  data-testid="link-forgot-password"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-password"
                  className={`h-12 rounded-xl bg-card border-0 pr-12 ${errors.password ? "ring-2 ring-destructive" : ""}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Eye className="w-5 h-5 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-14 rounded-2xl text-base font-semibold shadow-lg shadow-primary/25"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Google sign-in — only when flag enabled */}
          {googleEnabled && (
            <>
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 rounded-xl flex items-center gap-3 font-medium"
                onClick={() => window.location.href = "/api/auth/google"}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>
            </>
          )}

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button
                type="button"
                className="font-semibold text-primary"
                onClick={() => setLocation("/onboarding")}
                data-testid="link-signup"
              >
                Create one
              </button>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
