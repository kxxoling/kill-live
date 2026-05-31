"use client";

import { Eye, EyeOff, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { authClient, signIn } from "@/lib/auth-client";

const GithubIcon = () => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className="w-4 h-4 mr-2 fill-current"
    aria-label="GitHub"
  >
    <title>GitHub</title>
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

interface SignInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showGuestOption?: boolean;
}

export function SignInDialog({ open, onOpenChange, showGuestOption = true }: SignInDialogProps) {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    onOpenChange(false);
    setMode("signIn");
    setError("");
    setUsername("");
    setPassword("");
    setName("");
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "signIn") {
        const { error: signInError } = await signIn.username({
          username,
          password,
        });
        if (signInError) {
          setError(signInError.message || "Failed to sign in");
        } else {
          handleClose();
          window.location.reload();
        }
      } else {
        const { error: signUpError } = await authClient.signUp.email({
          email: `${username}@killlive.app`,
          password,
          name: name || username,
          username: username, // Pass the username field explicitly
        });
        if (signUpError) {
          setError(signUpError.message || "Failed to sign up");
        } else {
          handleClose();
          window.location.reload();
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("An unexpected error occurred. Please check console.");
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    try {
      await signIn.social({
        provider: "github",
        callbackURL: window.location.origin,
      });
    } catch (err) {
      console.error("Github sign in error:", err);
    }
  };

  const handleAnonymousSignIn = async () => {
    try {
      await signIn.anonymous();
      handleClose();
      window.location.reload();
    } catch (err) {
      console.error("Anonymous sign in error:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onClose={handleClose}
        className="w-[95%] sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4 sm:p-6"
      >
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-50 text-xl sm:text-2xl">
            {mode === "signIn" ? "Sign In" : "Create Account"}
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            {mode === "signIn"
              ? "Sign in to access your rooms and profile"
              : "Register to create your own rooms"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:py-4">
          <div className={`grid ${showGuestOption ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
            <Button
              variant="outline"
              onClick={handleGithubSignIn}
              className="w-full border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-800 h-10 sm:h-11"
            >
              <GithubIcon />
              GitHub
            </Button>
            {showGuestOption && (
              <Button
                variant="outline"
                onClick={handleAnonymousSignIn}
                className="w-full border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-800 h-10 sm:h-11"
              >
                <User className="w-4 h-4 mr-2" />
                Guest
              </Button>
            )}
          </div>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-2 text-slate-500 dark:text-slate-400">
                Or continue with
              </span>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-3">
              {mode === "signUp" && (
                <div className="space-y-1">
                  <Input
                    placeholder="Display Name (Optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-10 sm:h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50"
                  />
                </div>
              )}
              <div className="space-y-1">
                <Input
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  className="h-10 sm:h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50"
                />
              </div>
              <div className="space-y-1 relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === "signIn" ? "current-password" : "new-password"}
                  className="h-10 sm:h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 sm:h-11 text-base font-semibold"
            >
              {loading
                ? mode === "signIn"
                  ? "Signing in..."
                  : "Creating..."
                : mode === "signIn"
                  ? "Sign In"
                  : "Create Account"}
            </Button>
          </form>

          <div className="text-center mt-2">
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signIn" ? "signUp" : "signIn");
                setError("");
              }}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              {mode === "signIn"
                ? "Don't have an account? Sign Up"
                : "Already have an account? Sign In"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
