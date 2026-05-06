import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Activity, Heart } from "lucide-react";
import { signInWithPassword, signUpWithPassword, type AuthRole, type AuthSession } from "../lib/supabaseAuth";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultUserType?: AuthRole;
  onAuthSuccess?: (session: AuthSession) => void;
}

export function AuthModal({ open, onOpenChange, defaultUserType = 'patient', onAuthSuccess }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const isProviderPortal = defaultUserType === 'provider';

  useEffect(() => {
    if (open) {
      setError('');
    }
  }, [open]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get('login-email') || '').trim();
    const password = String(formData.get('login-password') || '');

    try {
      const session = await signInWithPassword(email, password);
      if (session.role !== defaultUserType) {
        setError(`This account is registered as a ${session.role}. Switch the portal type and try again.`)
        return
      }

      onAuthSuccess?.(session);
      onOpenChange(false);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Unable to log in right now.')
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const fullName = String(formData.get('signup-name') || '').trim();
    const email = String(formData.get('signup-email') || '').trim();
    const password = String(formData.get('signup-password') || '');
    const confirmPassword = String(formData.get('signup-confirm') || '');

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      setIsLoading(false)
      return
    }

    try {
      const session = await signUpWithPassword({
        email,
        password,
        fullName,
        role: defaultUserType,
      });

      if (session) {
        onAuthSuccess?.(session)
        onOpenChange(false)
        return
      }

      setError('Account created. Check your email to confirm your sign-up, then log in.')
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Unable to create your account right now.')
    } finally {
      setIsLoading(false)
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden bg-white z-1020 text-black/80">
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
            <TabsList className={`grid w-full mb-6 ${isProviderPortal ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <TabsTrigger value="login">Login</TabsTrigger>
              {!isProviderPortal && <TabsTrigger value="signup">Sign Up</TabsTrigger>}
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    name="login-email"
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
                    name="login-password"
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
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </TabsContent>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Sign Up Tab */}
            {!isProviderPortal && (
              <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
              
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    name="signup-name"
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
                    name="signup-email"
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
                    name="signup-password"
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
                    name="signup-confirm"
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
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
              </TabsContent>
            )}
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
