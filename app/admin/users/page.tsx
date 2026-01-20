"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner, Skeleton } from "@/components/ui/loading";
import { toast } from "@/components/ui/toast";
import { Users, Plus, Edit2, Trash2, Mail, UserCheck, UserX, Shield, GraduationCap } from "lucide-react";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { hashPassword } from "@/lib/password";

export default function UsersPage() {
  const users = useQuery(api.queries.users.getAll);
  const subjects = useQuery(api.queries.subjects.getAll);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showLinkTeacherForm, setShowLinkTeacherForm] = useState<string | null>(null);

  if (!users || !subjects) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-48" />
                <Skeleton className="mt-4 h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-600">Create and manage users, link them to teacher profiles</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>

      {showForm && (
        <UserForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
          }}
        />
      )}

      {editingId && (
        <UserForm
          userId={editingId}
          onClose={() => setEditingId(null)}
          onSuccess={() => {
            setEditingId(null);
          }}
        />
      )}

      {showLinkTeacherForm && (
        <LinkTeacherForm
          userId={showLinkTeacherForm}
          subjects={subjects}
          onClose={() => setShowLinkTeacherForm(null)}
          onSuccess={() => {
            setShowLinkTeacherForm(null);
          }}
        />
      )}

      {users.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Users className="h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No users found</h3>
            <p className="mt-2 text-sm text-gray-600">
              Get started by creating your first user.
            </p>
            <Button className="mt-6" onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user: any) => (
            <Card
              key={user._id}
              className="transition-all hover:shadow-lg hover:shadow-gray-200"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {user.role === "admin" ? (
                        <Shield className="h-5 w-5 text-purple-500" />
                      ) : (
                        <Users className="h-5 w-5 text-blue-500" />
                      )}
                      <span className="text-lg">{user.name}</span>
                    </CardTitle>
                    {user.role === "admin" && (
                      <span className="mt-1 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{user.email}</span>
                  </div>
                  
                  {user.teacherProfile ? (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-green-800">
                        <UserCheck className="h-4 w-4" />
                        <span>Linked to Teacher Profile</span>
                      </div>
                      <p className="mt-1 text-xs text-green-700">
                        {user.teacherProfile.subjects.length} subject(s) assigned
                      </p>
                    </div>
                  ) : user.role === "teacher" ? (
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-yellow-800">
                        <UserX className="h-4 w-4" />
                        <span>No Teacher Profile</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 w-full"
                        onClick={() => setShowLinkTeacherForm(user._id)}
                      >
                        <GraduationCap className="mr-2 h-3.5 w-3.5" />
                        Link Teacher Profile
                      </Button>
                    </div>
                  ) : null}
                </div>
                
                <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(user._id)}
                    className="flex-1"
                  >
                    <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <DeleteUserButton userId={user._id} userName={user.name} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function UserForm({
  userId,
  onClose,
  onSuccess,
}: {
  userId?: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "teacher">("teacher");
  const [isLoading, setIsLoading] = useState(false);
  
  const createUser = useMutation(api.mutations.users.create);
  const updateUser = useMutation(api.mutations.users.update);
  const user = useQuery(
    api.queries.users.getById,
    userId ? { id: userId as Id<"users"> } : "skip"
  );

  // Update form when user data loads
  if (user && userId && name === "") {
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (userId) {
        const updates: any = { id: userId as Id<"users"> };
        if (name) updates.name = name;
        if (email) updates.email = email;
        if (role) updates.role = role;
        if (password) {
          updates.passwordHash = hashPassword(password);
        }
        
        await updateUser(updates);
        toast("User updated successfully", "success");
      } else {
        if (!password) {
          toast("Password is required for new users", "error");
          setIsLoading(false);
          return;
        }
        
        const passwordHash = hashPassword(password);
        await createUser({
          name,
          email,
          passwordHash,
          role,
        });
        toast("User created successfully", "success");
      }
      onSuccess();
    } catch (error: any) {
      toast(`Error: ${error.message || error}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl">{userId ? "Edit User" : "Create User"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "admin" | "teacher")}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {userId ? "New Password (leave empty to keep current)" : "Password"} <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={!userId}
                placeholder="••••••••"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? "Saving..." : userId ? "Update User" : "Create User"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function LinkTeacherForm({
  userId,
  subjects,
  onClose,
  onSuccess,
}: {
  userId: string;
  subjects: Doc<"subjects">[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const createTeacher = useMutation(api.mutations.teachers.create);
  const user = useQuery(
    api.queries.users.getById,
    { id: userId as Id<"users"> }
  );

  // Pre-fill form with user data
  if (user && name === "") {
    setName(user.name);
    setEmail(user.email);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await createTeacher({
        userId: userId as Id<"users">,
        name,
        email,
        subjects: selectedSubjects as Id<"subjects">[],
      });
      toast("Teacher profile linked successfully", "success");
      onSuccess();
    } catch (error: any) {
      toast(`Error: ${error.message || error}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-xl">Link Teacher Profile</CardTitle>
          <CardDescription>
            Create a teacher profile for this user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="Teacher name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="teacher@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Subjects</label>
              <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3">
                {subjects.length === 0 ? (
                  <p className="text-sm text-gray-500">No subjects available. Create subjects first.</p>
                ) : (
                  subjects.map((subject) => (
                    <label
                      key={subject._id}
                      className="flex cursor-pointer items-center rounded-md p-2 transition-colors hover:bg-white"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSubjects.includes(subject._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSubjects([...selectedSubjects, subject._id]);
                          } else {
                            setSelectedSubjects(
                              selectedSubjects.filter((id) => id !== subject._id)
                            );
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{subject.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? "Linking..." : "Link Teacher Profile"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function DeleteUserButton({ userId, userName }: { userId: string; userName: string }) {
  const deleteUser = useMutation(api.mutations.users.deleteUser);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This will also delete their teacher profile if linked.`)) return;
    try {
      await deleteUser({ id: userId as Id<"users"> });
      toast("User deleted successfully", "success");
    } catch (error: any) {
      toast(`Error: ${error.message || error}`, "error");
    }
  };

  return (
    <Button size="sm" variant="destructive" onClick={handleDelete}>
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
