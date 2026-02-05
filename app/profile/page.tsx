"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { Camera, X, User, Mail, Shield, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Id } from "../../convex/_generated/dataModel";

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const generateUploadUrl = useMutation(api.mutations.users.generatePhotoUploadUrl);
  const updatePhoto = useMutation(api.mutations.users.updatePhoto);
  const deletePhoto = useMutation(api.mutations.users.deletePhoto);

  // Set initial photo preview from user data
  useEffect(() => {
    if (user?.photoUrl && !photoPreview) {
      setPhotoPreview(user.photoUrl);
    }
  }, [user?.photoUrl, photoPreview]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast("Please select an image file", "error");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast("Image must be less than 5MB", "error");
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setIsUploading(true);
      await deletePhoto({ id: user.id as Id<"users"> });
      setPhotoFile(null);
      setPhotoPreview(null);
      await refresh(); // Refresh auth context to update navbar
      toast("Photo removed successfully", "success");
    } catch (error: any) {
      toast(`Error: ${error.message || error}`, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadPhoto = async () => {
    if (!photoFile) return;

    setIsUploading(true);
    try {
      // Get upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload the file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": photoFile.type },
        body: photoFile,
      });

      if (!result.ok) {
        throw new Error("Failed to upload photo");
      }

      const { storageId } = await result.json();

      // Update user with new photo
      await updatePhoto({
        id: user.id as Id<"users">,
        photoId: storageId,
      });

      setPhotoFile(null);
      await refresh(); // Refresh auth context to update navbar
      toast("Photo updated successfully", "success");
    } catch (error: any) {
      toast(`Error: ${error.message || error}`, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const backLink = user.role === "admin" ? "/admin/dashboard" : "/teacher/schedule";

  return (
    <div className="min-h-screen bg-gray-50 p-4 pt-16 md:pt-8">
      <div className="mx-auto max-w-2xl">
        <Link
          href={backLink}
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {user.role === "admin" ? "Dashboard" : "Schedule"}
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">My Profile</CardTitle>
            <CardDescription>
              Manage your profile photo and view your account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Photo Section */}
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <div className="relative">
                {photoPreview ? (
                  <div className="relative">
                    <Image
                      src={photoPreview}
                      alt="Profile"
                      width={120}
                      height={120}
                      className="h-32 w-32 rounded-full object-cover ring-4 ring-gray-100 shadow-lg"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={isUploading}
                      className="absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-4xl font-bold text-white ring-4 ring-gray-100 shadow-lg">
                    {(user.name || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-3 sm:items-start">
                <h3 className="text-lg font-semibold text-gray-900">Profile Photo</h3>
                <p className="text-sm text-gray-500 text-center sm:text-left">
                  Upload a photo to personalize your account. JPG, PNG or GIF. Max 5MB.
                </p>
                <div className="flex flex-wrap gap-2">
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
                      <Camera className="h-4 w-4" />
                      Choose Photo
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                  {photoFile && (
                    <Button
                      onClick={handleUploadPhoto}
                      disabled={isUploading}
                    >
                      {isUploading ? "Uploading..." : "Save Photo"}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200" />

            {/* Account Info Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</p>
                      <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <Mail className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</p>
                      <p className="text-sm font-semibold text-gray-900">{user.email}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 sm:col-span-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                      <Shield className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Role</p>
                      <p className="text-sm font-semibold text-gray-900 capitalize">{user.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
