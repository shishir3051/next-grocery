"use client";

import { useCallback, useEffect, useState } from "react";
import { Inbox, Loader2, Mail, Phone, Send, Trash2, CheckCircle2, Archive, RotateCcw, ReceiptText } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { cn } from "@/lib/cn";
import { PANEL_CLASS, LABEL_CLASS, INPUT_CLASS, HELP_CLASS, BADGE_CLASS, BADGE_TONES, ICON_BUTTON_DANGER_CLASS } from "@/components/admin/adminStyles";

type Status = "new" | "read" | "replied" | "closed";

interface Reply { body: string; sentByName: string; sentAt: string }
interface Message {
  _id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  orderRef: string;
  message: string;
  status: Status;
  replies: Reply[];
  createdAt: string;
}

const FILTERS: { key: "" | Status; label: string }[] = [
  { key: "", label: "All" },
  { key: "new", label: "New" },
  { key: "read", label: "Read" },
  { key: "replied", label: "Replied" },
  { key: "closed", label: "Closed" },
];

const STATUS_TONE: Record<Status, keyof typeof BADGE_TONES> = {
  new: "brand",
  read: "neutral",
  replied: "success",
  closed: "neutral",
};

const reference = (id: string) => `#${id.slice(-6).toUpperCase()}`;
const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function AdminMessagesPage() {
  const [filter, setFilter] = useState<"" | Status>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [counts, setCounts] = useState<Record<Status, number>>({ new: 0, read: 0, replied: 0, closed: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const selected = messages.find(m => m._id === selectedId) ?? null;

  // Bumping reloadKey re-fetches the list (after a reply or delete).
  const [reloadKey, setReloadKey] = useState(0);
  const load = useCallback(() => setReloadKey(k => k + 1), []);

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/messages${filter ? `?status=${filter}` : ""}`)
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (!active) return;
        setMessages(data.messages);
        setCounts(data.counts);
      })
      .catch(() => { if (active) toast.error("Couldn't load messages"); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [filter, reloadKey]);

  const replaceMessage = (updated: Message) =>
    setMessages(list => list.map(m => (m._id === updated._id ? updated : m)));

  const patch = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Update failed");
    replaceMessage(data.contact);
    return data.contact as Message;
  };

  const setStatus = async (id: string, status: Status, quiet = false) => {
    try {
      await patch(id, { status });
      if (!quiet) toast.success(`Marked as ${status}`);
      const res = await fetch(`/api/admin/messages${filter ? `?status=${filter}` : ""}`);
      if (res.ok) setCounts((await res.json()).counts);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  };

  const open = (message: Message) => {
    setSelectedId(message._id);
    setReply("");
    if (message.status === "new") setStatus(message._id, "read", true);
  };

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || reply.trim().length === 0) return;
    setIsSending(true);
    try {
      await patch(selected._id, { reply });
      setReply("");
      toast.success(`Reply emailed to ${selected.email}`);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reply failed");
    } finally {
      setIsSending(false);
    }
  };

  const remove = async () => {
    if (!selected) return;
    const res = await fetch(`/api/admin/messages/${selected._id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Message deleted");
      setSelectedId(null);
      load();
    } else {
      toast.error("Delete failed");
    }
    setConfirmDelete(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Customer messages</h2>
        <p className="text-sm text-slate-500">Messages from the contact page. Replies are emailed to the customer and kept here.</p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter messages">
        {FILTERS.map(f => {
          const count = f.key ? counts[f.key] : Object.values(counts).reduce((a, b) => a + b, 0);
          return (
            <button
              key={f.label}
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => { setFilter(f.key); setSelectedId(null); setIsLoading(true); }}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === f.key ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              {f.label} <span className="ml-1 tabular-nums opacity-80">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* List */}
        <div className={cn(PANEL_CLASS, "lg:col-span-2 overflow-hidden")}>
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              <span className="ml-2 text-sm">Loading messages…</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-slate-500">
              <Inbox className="h-6 w-6" aria-hidden="true" />
              <p className="text-sm">No messages here yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {messages.map(m => (
                <li key={m._id}>
                  <button
                    onClick={() => open(m)}
                    className={cn(
                      "w-full px-3 py-2 text-left transition-colors hover:bg-slate-50",
                      selectedId === m._id && "bg-brand-50/60"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className={cn("truncate text-sm text-slate-900", m.status === "new" ? "font-bold" : "font-medium")}>{m.name}</span>
                      <span className="flex-shrink-0 text-xs text-slate-500">{formatDate(m.createdAt)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={cn(BADGE_CLASS, BADGE_TONES[STATUS_TONE[m.status]])}>{m.status}</span>
                      <span className="truncate text-xs text-slate-600">{m.subject}</span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-slate-500">{m.message}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Detail */}
        <div className={cn(PANEL_CLASS, "lg:col-span-3 p-4")}>
          {!selected ? (
            <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 text-center text-slate-500">
              <Mail className="h-6 w-6" aria-hidden="true" />
              <p className="text-sm">Select a message to read and reply.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">{reference(selected._id)} · {formatDate(selected.createdAt)}</p>
                  <h3 className="mt-1 text-base font-semibold text-slate-900">{selected.subject}</h3>
                  <p className="mt-1 text-sm text-slate-700">
                    {selected.name} · <a href={`mailto:${selected.email}`} className="text-brand-700 hover:underline break-all">{selected.email}</a>
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    {selected.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" aria-hidden="true" />{selected.phone}</span>}
                    {selected.orderRef && <span className="inline-flex items-center gap-1"><ReceiptText className="h-3.5 w-3.5" aria-hidden="true" />Order {selected.orderRef}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {selected.status !== "closed" ? (
                    <Button variant="secondary" size="sm" onClick={() => setStatus(selected._id, "closed")}>
                      <Archive className="h-4 w-4" aria-hidden="true" /> Close
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => setStatus(selected._id, "read")}>
                      <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reopen
                    </Button>
                  )}
                  <button className={ICON_BUTTON_DANGER_CLASS} aria-label="Delete message" onClick={() => setConfirmDelete(true)}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Customer text is rendered as plain text (never HTML). */}
              <div className="whitespace-pre-line rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-800">
                {selected.message}
              </div>

              {selected.replies.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-900">Replies</p>
                  {selected.replies.map((r, i) => (
                    <div key={i} className="rounded-xl border border-success-100 bg-success-50/50 p-3">
                      <p className="flex items-center gap-1.5 text-xs text-slate-500">
                        <CheckCircle2 className="h-3.5 w-3.5 text-success-600" aria-hidden="true" />
                        {r.sentByName || "Admin"} · {formatDate(r.sentAt)}
                      </p>
                      <p className="mt-2 whitespace-pre-line text-sm text-slate-800">{r.body}</p>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={sendReply} className="space-y-3 border-t border-slate-100 pt-4">
                <label htmlFor="reply-body" className={LABEL_CLASS}>Reply to {selected.name}</label>
                <textarea
                  id="reply-body"
                  rows={5}
                  maxLength={5000}
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Write your answer…"
                  className={cn(INPUT_CLASS, "resize-y")}
                />
                <p className={HELP_CLASS}>Sent by email to {selected.email}, with their original message quoted below.</p>
                <Button type="submit" size="sm" loading={isSending} disabled={!reply.trim()}>
                  {!isSending && <Send className="h-4 w-4" aria-hidden="true" />}
                  {isSending ? "Sending…" : "Send reply"}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={remove}
        title="Delete this message?"
        message="The message and its replies will be removed permanently."
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
}
