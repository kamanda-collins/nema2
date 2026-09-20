
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "./AuthProvider";
import { useToast } from "@/hooks/use-toast";

interface AuthSignUpFormProps {
  onSuccess?: () => void;
  onClose: () => void;
}

export const AuthSignUpForm: React.FC<AuthSignUpFormProps> = ({ onSuccess, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setShowThankYou(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(email, password, fullName);
      // Call Edge Function to send the "thank you" email (doesn't block UI)
      fetch("https://xeohypupypohmgahlugl.functions.supabase.co/send-thankyou-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          name: fullName
        })
      })
        .then(async res => {
          if (!res.ok) {
            const { error } = await res.json();
            console.error("Thank you email failed:", error);
            toast({
              title: "Notice",
              description: "Signup email could not be sent. (You are still signed up!)",
              variant: "default"
            });
          }
        })
        .catch(err => {
          console.error("Failed to send thank you email:", err);
        });

      setShowThankYou(true);
    } catch (error: any) {
      toast({ 
        title: "Sign up failed", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  // Show thank you UI if signed up
  if (showThankYou) {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-center text-green-600">Welcome to Geo-Labs! 🎉</DialogTitle>
          <DialogDescription className="text-center">
            Thank you for joining our community of environmental researchers and GIS professionals.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-center">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">What's Next?</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>✓ Check your email to verify your account</li>
              <li>✓ Set up your first monitoring points</li>
              <li>✓ Explore our environmental analysis tools</li>
              <li>✓ Generate professional maps and reports</li>
            </ul>
          </div>
          <Button 
            onClick={() => {
              onClose();
              resetForm();
              if (onSuccess) onSuccess();
            }} 
            className="w-full"
          >
            Start Exploring Geo-Labs
          </Button>
        </div>
      </>
    );
  }

  // Sign up form
  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div>
        <Label htmlFor="signup-name">Full Name</Label>
        <Input
          id="signup-name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account..." : "Sign Up"}
      </Button>
    </form>
  );
};

export default AuthSignUpForm;
