"use client";

import { LogIn, LogOut, Plus, Video } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

interface HeaderProps {
  session: {
    user: {
      id: string;
      name?: string | null;
      isAnonymous?: boolean | null;
    };
  } | null;
  onSignInClick: () => void;
  onCreateRoomClick: () => void;
  onSignOut: () => void;
}

export function Header({ session, onSignInClick, onCreateRoomClick, onSignOut }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4 mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          <span className="font-semibold">Kill Live</span>
        </Link>

        <div className="flex items-center gap-4">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink href="/" className={navigationMenuTriggerStyle()}>
                  Rooms
                </NavigationMenuLink>
              </NavigationMenuItem>
              {session && !session.user.isAnonymous && (
                <NavigationMenuItem>
                  <NavigationMenuLink href="/profile" className={navigationMenuTriggerStyle()}>
                    Profile
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>

          <ThemeToggle />

          {session && !session.user.isAnonymous ? (
            <>
              <Button onClick={onCreateRoomClick} size="sm">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:ml-2 sm:inline">Create Room</span>
              </Button>

              <div className="flex items-center gap-2">
                <Avatar name={session.user.name || "User"} size={28} variant="beam" />
                <span className="text-sm font-medium hidden sm:inline">
                  {session.user.name || "User"}
                </span>
              </div>

              <Button onClick={onSignOut} variant="ghost" size="sm">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              {session?.user?.isAnonymous && (
                <Button onClick={onSignOut} variant="ghost" size="sm">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:ml-2 sm:inline">Exit Guest</span>
                </Button>
              )}
              <Button onClick={onSignInClick} size="sm">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:ml-2 sm:inline">Sign In</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
