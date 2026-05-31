"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isDark = mounted ? (resolvedTheme || theme) === "dark" : false;

  return (
    <div className="flex items-center gap-2">
      <Sun className="h-4 w-4" />
      <Switch
        id="theme-toggle"
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      />
      <Moon className="h-4 w-4" />
      <Label htmlFor="theme-toggle" className="sr-only">
        Toggle dark mode
      </Label>
    </div>
  );
}
