import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import logoUrl from "@/assets/logo.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Github } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    rememberMe: false,
  });

  const handleReplitAuth = () => {
    window.location.href = "/api/login";
  };

  const handleLocalAuth = async (isSignUp: boolean) => {
    setIsLoading(true);
    try {
      // TODO: Implement local auth API calls
      console.log(isSignUp ? "Sign up" : "Sign in", formData);
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gf-graphite border-gf-smoke/20">
        <DialogHeader>
          <DialogTitle className="text-center font-display text-2xl text-gf-snow mb-2 flex flex-col items-center">
            <img 
              src={logoUrl} 
              alt="GirlFanz" 
              className="h-36 w-auto mb-2" 
              data-testid="img-auth-logo"
            />
            Welcome to the Revolution
          </DialogTitle>
          <p className="text-center text-gf-smoke">Join the cyber-glam creator revolution</p>
        </DialogHeader>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gf-graphite">
            <TabsTrigger 
              value="signin" 
              className="data-[state=active]:bg-gf-pink data-[state=active]:text-gf-snow"
            >
              Sign In
            </TabsTrigger>
            <TabsTrigger 
              value="signup"
              className="data-[state=active]:bg-gf-pink data-[state=active]:text-gf-snow"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>

          {/* Replit OAuth */}
          <Button
            onClick={handleReplitAuth}
            className="w-full bg-gf-graphite border border-gf-smoke/20 text-gf-snow hover:border-gf-violet mb-4 mt-6"
            variant="outline"
          >
            <Github className="mr-2 h-4 w-4" />
            Continue with Replit
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gf-smoke/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gf-graphite text-gf-smoke">Or continue with email</span>
            </div>
          </div>

          <TabsContent value="signin" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email" className="text-gf-smoke">Email</Label>
              <Input
                id="signin-email"
                type="email"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-gf-graphite border-gf-smoke/20 text-gf-snow placeholder-gf-smoke focus:border-gf-pink"
                data-testid="input-signin-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signin-password" className="text-gf-smoke">Password</Label>
              <Input
                id="signin-password"
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-gf-graphite border-gf-smoke/20 text-gf-snow placeholder-gf-smoke focus:border-gf-pink"
                data-testid="input-signin-password"
              />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) => setFormData({ ...formData, rememberMe: !!checked })}
                />
                <Label htmlFor="remember" className="text-gf-smoke">Remember me</Label>
              </div>
              <a href="#" className="text-gf-pink hover:text-gf-violet">Forgot password?</a>
            </div>
            
            <Button 
              onClick={() => handleLocalAuth(false)}
              disabled={isLoading}
              className="w-full bg-gf-gradient text-gf-snow hover:shadow-glow-pink"
              data-testid="button-signin"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-username" className="text-gf-smoke">Username</Label>
              <Input
                id="signup-username"
                type="text"
                placeholder="Choose a username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="bg-gf-graphite border-gf-smoke/20 text-gf-snow placeholder-gf-smoke focus:border-gf-pink"
                data-testid="input-signup-username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email" className="text-gf-smoke">Email</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-gf-graphite border-gf-smoke/20 text-gf-snow placeholder-gf-smoke focus:border-gf-pink"
                data-testid="input-signup-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password" className="text-gf-smoke">Password</Label>
              <Input
                id="signup-password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-gf-graphite border-gf-smoke/20 text-gf-snow placeholder-gf-smoke focus:border-gf-pink"
                data-testid="input-signup-password"
              />
            </div>
            
            <Button 
              onClick={() => handleLocalAuth(true)}
              disabled={isLoading}
              className="w-full bg-gf-gradient text-gf-snow hover:shadow-glow-pink"
              data-testid="button-signup"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </TabsContent>
        </Tabs>

        <div className="text-center text-sm text-gf-smoke">
          By continuing, you agree to our{" "}
          <a href="#" className="text-gf-pink">Terms</a> and{" "}
          <a href="#" className="text-gf-pink">Privacy Policy</a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
