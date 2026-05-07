import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Activity, Heart } from "lucide-react";
import { signInWithPassword, signUpWithPassword, type AuthSession, type AuthRole } from "../lib/supabaseAuth";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultUserType?: AuthRole;
  onAuthSuccess?: (session: AuthSession) => void;
}

export function AuthModal({ open, onOpenChange, defaultUserType, onAuthSuccess }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    if (!open) {
      return;
    }

    setActiveTab('login');
  }, [open]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const session = await signInWithPassword(email, password);
      // If this modal was opened specifically for providers, ensure the
      // authenticated account is actually a provider. If not, show an error
      // and do not call onAuthSuccess (so nothing is stored or used to proceed).
       if (defaultUserType === 'provider' && session.role !== 'provider') {
        setError('This account is not a provider account. Please use a provider account to continue.');
        return;
      }

      if (defaultUserType === 'patient' && session.role !== 'patient') {
        setError('This account is not a patient account. Please use a patient account to continue.');
        return;
      }
      onAuthSuccess?.(session);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = (email.split('@')[0] || 'Patient').trim();
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const session = await signUpWithPassword({ email, password, fullName });
      if (session) {
        onAuthSuccess?.(session);
        onOpenChange(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const isProviderOnly = defaultUserType === 'provider';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden bg-white z-1020 text-black/80">
        {/* Header with FilCare Branding */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-4 text-white">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
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
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'signup')} className="w-full">
            <TabsList className={`grid w-full mb-2 ${isProviderOnly ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <TabsTrigger value="login">Login</TabsTrigger>
              {!isProviderOnly && <TabsTrigger value="signup">Sign Up</TabsTrigger>}
            </TabsList>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 text-red-600 text-sm text-center bg-red-50 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="bg-input-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="bg-input-background"
                  />
                </div>

                <div className="text-right">
                  <button type="button" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </TabsContent>

            {/* Sign Up Tab */}
            {!isProviderOnly && (
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-2">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      className="bg-input-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      className="bg-input-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirm Password</Label>
                    <Input
                      id="signup-confirm"
                      name="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      required
                      className="bg-input-background"
                    />
                  </div>

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