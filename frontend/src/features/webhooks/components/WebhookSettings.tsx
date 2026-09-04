import { useState } from "react";
import {
  useWebhooks,
  useCreateWebhook,
  useUpdateWebhook,
  useDeleteWebhook,
} from "../hooks/useWebhooks";
import type { WebhookEvent, CreateWebhookInput } from "../api";

const ALL_EVENTS: { value: WebhookEvent; label: string }[] = [
  { value: "task.created", label: "Task created" },
  { value: "task.updated", label: "Task updated" },
  { value: "task.moved", label: "Task moved" },
  { value: "task.archived", label: "Task archived" },
];

const INITIAL_FORM: CreateWebhookInput = {
  url: "",
  events: [],
  secret: "",
};

interface Props {
  workspaceId: string;
}

export function WebhookSettings({ workspaceId }: Props) {
  const { data: webhooks = [], isLoading, isError } = useWebhooks(workspaceId);
  const createMutation = useCreateWebhook(workspaceId);
  const updateMutation = useUpdateWebhook(workspaceId);
  const deleteMutation = useDeleteWebhook(workspaceId);

  const [isAddingWebhook, setIsAddingWebhook] = useState(false);
  const [form, setForm] = useState<CreateWebhookInput>(INITIAL_FORM);
  const [formError, setFormError] = useState("");

  function handleEventToggle(event: WebhookEvent) {
    const nextEvents = form.events.includes(event)
      ? form.events.filter((e) => e !== event)
      : [...form.events, event];
    setForm({ ...form, events: nextEvents });
  }

  async function handleCreate() {
    setFormError("");
    if (form.url.trim().length === 0) {
      setFormError("URL is required.");
      return;
    }
    if (form.events.length === 0) {
      setFormError("Select at least one event.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        url: form.url.trim(),
        events: form.events,
        secret: form.secret?.trim() || undefined,
      });
      setForm(INITIAL_FORM);
      setIsAddingWebhook(false);
    } catch {
      setFormError("Failed to create webhook. Please try again.");
    }
  }

  function handleCancel() {
    setForm(INITIAL_FORM);
    setFormError("");
    setIsAddingWebhook(false);
  }

  async function handleToggleActive(webhookId: string, isActive: boolean) {
    await updateMutation.mutateAsync({
      webhookId,
      data: { is_active: !isActive },
    });
  }

  async function handleDelete(webhookId: string) {
    await deleteMutation.mutateAsync(webhookId);
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-400">Loading webhooks...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-400">Failed to load webhooks.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Webhooks</h2>
          <p className="text-sm text-gray-400 mt-1">
            Receive HTTP POST notifications when events occur in this workspace.
          </p>
        </div>
        {!isAddingWebhook && (
          <button
            type="button"
            onClick={() => setIsAddingWebhook(true)}
            className="shrink-0 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white
                       hover:bg-blue-700 transition-colors"
          >
            Add webhook
          </button>
        )}
      </div>

      {/* Add webhook form */}
      {isAddingWebhook && (
        <div className="mb-6 rounded-xl border border-gray-700 bg-gray-800 p-5">
          <h3 className="text-sm font-semibold text-white mb-4">New webhook</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Payload URL <span className="text-red-400">*</span>
              </label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://example.com/webhook"
                className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm
                           text-white placeholder:text-gray-500 focus:border-blue-500
                           focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Events <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_EVENTS.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.events.includes(value)}
                      onChange={() => handleEventToggle(value)}
                      className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600
                                 focus:ring-blue-500 focus:ring-offset-gray-800"
                    />
                    <span className="text-sm text-gray-300">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Secret{" "}
                <span className="text-gray-500">(optional — used for signature verification)</span>
              </label>
              <input
                type="text"
                value={form.secret}
                onChange={(e) => setForm({ ...form, secret: e.target.value })}
                placeholder="my-signing-secret"
                className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm
                           text-white placeholder:text-gray-500 focus:border-blue-500
                           focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {formError.length > 0 && (
            <p className="mt-3 text-sm text-red-400">{formError}</p>
          )}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white
                         hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createMutation.isPending ? "Creating..." : "Create webhook"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-md px-4 py-2 text-sm text-gray-400 hover:text-gray-200
                         hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Webhook list */}
      {webhooks.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-700 p-8 text-center">
          <p className="text-sm text-gray-500">No webhooks configured yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="rounded-xl border border-gray-700 bg-gray-800 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">
                    {webhook.url}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {webhook.events.map((event) => (
                      <span
                        key={event}
                        className="inline-flex rounded-full bg-gray-700 px-2 py-0.5 text-xs
                                   font-medium text-gray-300"
                      >
                        {event}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`text-xs font-medium ${
                        webhook.is_active ? "text-green-400" : "text-gray-500"
                      }`}
                    >
                      {webhook.is_active ? "Active" : "Inactive"}
                    </span>
                    <span className="text-xs text-gray-600">·</span>
                    <span className="text-xs text-gray-500">
                      Added {new Date(webhook.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Active toggle */}
                  <button
                    type="button"
                    onClick={() =>
                      handleToggleActive(webhook.id, webhook.is_active)
                    }
                    disabled={
                      updateMutation.isPending &&
                      updateMutation.variables?.webhookId === webhook.id
                    }
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full
                               border-2 border-transparent transition-colors duration-200 ease-in-out
                               focus:outline-none disabled:opacity-50 ${
                                 webhook.is_active ? "bg-blue-600" : "bg-gray-600"
                               }`}
                    title={webhook.is_active ? "Disable" : "Enable"}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition
                                  duration-200 ease-in-out ${
                                    webhook.is_active
                                      ? "translate-x-4"
                                      : "translate-x-0"
                                  }`}
                    />
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(webhook.id)}
                    disabled={
                      deleteMutation.isPending &&
                      deleteMutation.variables === webhook.id
                    }
                    className="rounded-md p-1.5 text-gray-500 hover:bg-gray-700 hover:text-red-400
                               transition-colors disabled:opacity-50"
                    title="Delete webhook"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
