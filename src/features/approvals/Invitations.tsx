import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { useSecurityMessages } from "@/features/security/messages";
import { api, mutation, type User } from "@/lib/api";
import {
  acceptSchema,
  type InvitationsData,
  invitationInputSchema,
  invitationSchema,
} from "./contracts";
export function Invitations({
  data,
  user,
  onSaved,
}: {
  data: InvitationsData;
  user: User;
  onSaved: () => void;
}) {
  const m = useSecurityMessages();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);
  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") || "")
      .trim()
      .toLowerCase();
    const recipient_user_id = String(
      new FormData(form).get("recipient_user_id") || "",
    ).trim();
    const input = invitationInputSchema.safeParse({
      email,
      recipient_user_id,
      role: "reviewer",
    });
    if (!input.success) {
      setError(true);
      return;
    }
    setPending(true);
    setError(false);
    setSaved(false);
    try {
      await api("/invitations", invitationSchema, mutation("POST", input.data));
      form.reset();
      setSaved(true);
      onSaved();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }
  async function accept(id: string) {
    setPending(true);
    setError(false);
    try {
      await api(
        `/invitations/${encodeURIComponent(id)}/accept`,
        acceptSchema,
        mutation("POST", {}),
      );
      onSaved();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="panel">
      <h2 className="text-lg font-semibold">{m.invite}</h2>
      <p className="subtext mt-3">{m.inviteHelp}</p>
      {user.role === "owner" &&
        user.account_type !== "personal" &&
        !user.demo && (
          <form onSubmit={invite} className="mt-5 flex flex-col gap-3">
            <input
              name="email"
              type="email"
              required
              maxLength={254}
              aria-label={m.emailAddress}
              placeholder={m.emailAddress}
              className="field"
            />
            <input
              name="recipient_user_id"
              required
              maxLength={36}
              pattern="[0-9a-fA-F-]{36}"
              aria-label={m.recipientId}
              placeholder={m.recipientId}
              className="field"
            />
            <p className="text-xs leading-6 text-secondary">
              {m.accountIdHelp}
            </p>
            <Button type="submit" disabled={pending}>
              {m.invite}
            </Button>
          </form>
        )}
      {saved && (
        <output className="mt-3 block text-xs text-good">
          {m.invitationSent}
        </output>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {m.error}
        </p>
      )}
      <h3 className="mt-7 text-sm font-semibold">{m.incoming}</h3>
      <ul className="mt-3 space-y-3">
        {data.incoming
          .filter((item) => item.status === "pending")
          .map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"
            >
              <div>
                <p className="text-sm font-medium">{item.workspace_name}</p>
                <p className="mt-1 text-xs text-secondary">
                  {item.inviter_name}
                </p>
                {!item.recipient_user_id && (
                  <p className="mt-2 max-w-sm text-xs text-warning">
                    {m.legacyInvitation}
                  </p>
                )}
              </div>
              <Button
                variant="secondary"
                disabled={pending || item.recipient_user_id !== user.id}
                onClick={() => accept(item.id)}
              >
                {m.accept}
              </Button>
            </li>
          ))}
      </ul>
      {!data.incoming.some((item) => item.status === "pending") && (
        <p className="subtext mt-2">{m.noInvitations}</p>
      )}
      {data.outgoing.length > 0 && (
        <ul className="mt-5 space-y-2 border-t border-border pt-5">
          {data.outgoing.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap justify-between gap-2 text-xs"
            >
              <span className="break-all">{item.email}</span>
              <span className="text-secondary">
                {item.status === "accepted" ? m.saved : m.pending}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
