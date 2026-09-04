import { useState, type KeyboardEvent } from "react";
import { useProfile, useUpdateProfile } from "../hooks/useProfile";

type ToastState = {
  message: string;
  type: "success" | "error";
} | null;

export function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [toast, setToast] = useState<ToastState>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleNameEdit = () => {
    setNameInput(profile?.full_name ?? "");
    setEditingName(true);
  };

  const handleNameSave = () => {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === profile?.full_name) {
      setEditingName(false);
      return;
    }
    updateProfile.mutate(
      { full_name: trimmed },
      {
        onSuccess: () => {
          setEditingName(false);
          showToast("Name updated successfully.", "success");
        },
        onError: () => {
          showToast("Failed to update name.", "error");
        },
      }
    );
  };

  const handleNameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleNameSave();
    if (e.key === "Escape") setEditingName(false);
  };

  const handlePasswordSubmit = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("All password fields are required.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match.", "error");
      return;
    }
    if (newPassword.length < 8) {
      showToast("New password must be at least 8 characters.", "error");
      return;
    }
    updateProfile.mutate(
      { current_password: currentPassword, new_password: newPassword },
      {
        onSuccess: () => {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          showToast("Password changed successfully.", "success");
        },
        onError: (error) => {
          const message = error.message.includes("Current password")
            ? "Current password is incorrect."
            : "Failed to change password.";
          showToast(message, "error");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-gray-400 text-sm">Loading profile…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 px-6 py-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Profile</h1>

      {toast && (
        <div
          className={`mb-6 px-4 py-3 rounded-md text-sm font-medium ${
            toast.type === "success"
              ? "bg-green-800 text-green-100"
              : "bg-red-800 text-red-100"
          }`}
        >
          {toast.message}
        </div>
      )}

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Account info
        </h2>

        <div className="bg-gray-800 rounded-lg divide-y divide-gray-700">
          <div className="px-4 py-4 flex items-center justify-between gap-4">
            <span className="text-sm text-gray-400 w-20 flex-shrink-0">Name</span>
            {editingName ? (
              <input
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={handleNameKeyDown}
                className="flex-1 bg-gray-700 text-gray-100 rounded px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <>
                <span className="flex-1 text-sm text-gray-100">
                  {profile?.full_name}
                </span>
                <button
                  type="button"
                  onClick={handleNameEdit}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Edit
                </button>
              </>
            )}
          </div>

          <div className="px-4 py-4 flex items-center gap-4">
            <span className="text-sm text-gray-400 w-20 flex-shrink-0">Email</span>
            <span className="flex-1 text-sm text-gray-100">{profile?.email}</span>
          </div>

          <div className="px-4 py-4 flex items-center gap-4">
            <span className="text-sm text-gray-400 w-20 flex-shrink-0">
              Member since
            </span>
            <span className="flex-1 text-sm text-gray-100">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "—"}
            </span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Change password
        </h2>

        <div className="bg-gray-800 rounded-lg px-4 py-5 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Current password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-gray-700 text-gray-100 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">
              New password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-gray-700 text-gray-100 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Confirm new password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-gray-700 text-gray-100 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="button"
            onClick={handlePasswordSubmit}
            disabled={updateProfile.isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded px-4 py-2 transition-colors"
          >
            {updateProfile.isPending ? "Saving…" : "Change password"}
          </button>
        </div>
      </section>
    </div>
  );
}
