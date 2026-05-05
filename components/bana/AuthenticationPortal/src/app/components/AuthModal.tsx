import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Activity, Heart, User, Stethoscope } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthSuccess?: (userType: 'patient' | 'provider') => void;
}

export function AuthModal({ open, onOpenChange, onAuthSuccess }: AuthModalProps) {
  const [userType, setUserType] = useState<'patient' | 'provider'>('patient');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsLoading(false);
    onAuthSuccess?.(userType);
    onOpenChange(false);
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsLoading(false);
    onAuthSuccess?.(userType);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden">
        {/* Header with FilCare Branding */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-4">
              {/* FilCare Logo */}
              <div className="relative">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Activity className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  FilCare
                </span>
                <Heart className="w-5 h-5 text-red-400 fill-red-400" />
              </div>
            </div>
            <DialogTitle className="text-white text-left">
              Welcome to FilCare
            </DialogTitle>
            <DialogDescription className="text-blue-100 text-left">
              Access your health portal to book appointments, manage records, and connect with healthcare providers.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Auth Tabs */}
        <div className="p-6">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                {/* User Type Selection */}
                <div className="space-y-3">
                  <Label>I am a:</Label>
                  <RadioGroup value={userType} onValueChange={(value) => setUserType(value as 'patient' | 'provider')} className="grid grid-cols-2 gap-3">
                    <div>
                      <RadioGroupItem value="patient" id="login-patient" className="peer sr-only" />
                      <Label
                        htmlFor="login-patient"
                        className="flex flex-col items-center justify-center rounded-xl border-2 border-border bg-background p-4 hover:bg-accent cursor-pointer peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 transition-all"
                      >
                        <User className="w-6 h-6 mb-2 text-blue-600" />
                        <span className="text-sm">Patient</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="provider" id="login-provider" className="peer sr-only" />
                      <Label
                        htmlFor="login-provider"
                        className="flex flex-col items-center justify-center rounded-xl border-2 border-border bg-background p-4 hover:bg-accent cursor-pointer peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 transition-all"
                      >
                        <Stethoscope className="w-6 h-6 mb-2 text-blue-600" />
                        <span className="text-sm">Provider</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="bg-input-background"
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="bg-input-background"
                  />
                </div>

                {/* Forgot Password */}
                <div className="text-right">
                  <button type="button" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </TabsContent>

            {/* Sign Up Tab */}
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                {/* User Type Selection */}
                <div className="space-y-3">
                  <Label>I am a:</Label>
                  <RadioGroup value={userType} onValueChange={(value) => setUserType(value as 'patient' | 'provider')} className="grid grid-cols-2 gap-3">
                    <div>
                      <RadioGroupItem value="patient" id="signup-patient" className="peer sr-only" />
                      <Label
                        htmlFor="signup-patient"
                        className="flex flex-col items-center justify-center rounded-xl border-2 border-border bg-background p-4 hover:bg-accent cursor-pointer peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 transition-all"
                      >
                        <User className="w-6 h-6 mb-2 text-blue-600" />
                        <span className="text-sm">Patient</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="provider" id="signup-provider" className="peer sr-only" />
                      <Label
                        htmlFor="signup-provider"
                        className="flex flex-col items-center justify-center rounded-xl border-2 border-border bg-background p-4 hover:bg-accent cursor-pointer peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 transition-all"
                      >
                        <Stethoscope className="w-6 h-6 mb-2 text-blue-600" />
                        <span className="text-sm">Provider</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Juan Dela Cruz"
                    required
                    className="bg-input-background"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="bg-input-background"
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="bg-input-background"
                  />
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="bg-input-background"
                  />
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    required
                    className="mt-1"
                  />
                  <Label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                    I agree to the{" "}
                    <button type="button" className="text-blue-600 hover:underline">
                      Terms & Conditions
                    </button>
                    {" "}and{" "}
                    <button type="button" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </button>
                  </Label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="border-t p-4 text-center text-sm text-muted-foreground bg-muted/30">
          Need help? Contact{" "}
          <button type="button" className="text-blue-600 hover:underline">
            support@filcare.ph
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
