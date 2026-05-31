"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Eye, EyeOff, Lock, Save, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  type ChangePasswordInput,
  changePasswordSchema,
  type ProfileInput,
  profileSchema,
} from "@/lib/schemas";
import { useChangePassword, useUpdateProfile } from "@/queries/use-user";

export default function ProfilePage() {
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const {
    register: regProfile,
    handleSubmit: submitProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
  });

  const {
    register: regPassword,
    handleSubmit: submitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onProfileSubmit = async (data: ProfileInput) => {
    try {
      await updateProfile.mutateAsync(data);
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: (err as Error).message || "Failed to update profile" });
    }
  };

  const onPasswordSubmit = async (data: ChangePasswordInput) => {
    try {
      await changePassword.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setMessage({ type: "success", text: "Password changed successfully!" });
      resetPassword();
    } catch (err) {
      setMessage({ type: "error", text: (err as Error).message || "Failed to change password" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <User className="w-8 h-8" />
          Profile Settings
        </h1>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitProfile(onProfileSubmit)} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">
                    Name
                  </label>
                  <Input id="name" placeholder="Your name" {...regProfile("name")} />
                  {profileErrors.name && (
                    <p className="text-sm text-red-500 mt-1">{profileErrors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="username" className="block text-sm font-medium mb-1">
                    Username
                  </label>
                  <Input
                    id="username"
                    placeholder="Choose a username"
                    {...regProfile("username")}
                  />
                  {profileErrors.username && (
                    <p className="text-sm text-red-500 mt-1">{profileErrors.username.message}</p>
                  )}
                </div>

                <Button type="submit" disabled={updateProfile.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  {updateProfile.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitPassword(onPasswordSubmit)} className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Enter current password"
                      {...regPassword("currentPassword")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="text-sm text-red-500 mt-1">
                      {passwordErrors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      {...regPassword("newPassword")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="text-sm text-red-500 mt-1">
                      {passwordErrors.newPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                    Confirm New Password
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    {...regPassword("confirmPassword")}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-sm text-red-500 mt-1">
                      {passwordErrors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button type="submit" disabled={changePassword.isPending} variant="secondary">
                  <Lock className="w-4 h-4 mr-2" />
                  {changePassword.isPending ? "Changing..." : "Change Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
