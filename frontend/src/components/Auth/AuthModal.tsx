import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from './AuthProvider';
import { useToast } from '@/hooks/use-toast';
import AuthSignUpForm from "./AuthSignUpForm";
import AuthSignInForm from "./AuthSignInForm";
import AuthForgotPasswordForm from "./AuthForgotPasswordForm";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ open, onOpenChange, onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      onOpenChange(false);
      if (onAuthSuccess) onAuthSuccess();
      toast({ title: "Welcome!", description: "You've been signed in with Google successfully." });
    } catch (error: any) {
      toast({
        title: "Google sign in failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset state when dialog closes
  const resetForm = () => {
    setEmail('');
    setShowForgotPassword(false);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="sm:max-w-[425px]">
        {showForgotPassword ? (
          <AuthForgotPasswordForm
            email={email}
            setEmail={setEmail}
            onBack={() => setShowForgotPassword(false)}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                Authentication
              </DialogTitle>
              <DialogDescription>
                Sign in to your account or create a new one to access all features.
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Continue with Google"}
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>
                <AuthSignInForm
                  email={email}
                  setEmail={setEmail}
                  onAuthSuccess={onAuthSuccess}
                  onForgotPassword={() => setShowForgotPassword(true)}
                  afterSignIn={() => onOpenChange(false)}
                />
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  {loading ? "Signing up..." : "Sign up with Google"}
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>
                <AuthSignUpForm
                  onSuccess={onAuthSuccess}
                  onClose={() => onOpenChange(false)}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
