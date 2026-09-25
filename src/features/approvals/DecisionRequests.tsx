import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { useSecurityMessages } from "@/features/security/messages";
import { api, mutation, type User } from "@/lib/api";
import {
  type ApprovalsData,
  approvalSchema,
  requestInputSchema,
} from "./contracts";
import { DecisionCanvas } from "./DecisionCanvas";
export function DecisionRequests({
  data,
  user,
  onSaved,
}: {
  data: ApprovalsData;
  user: User;
  onSaved: () => void;
}) {
  const m = useSecurityMessages();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const eligible = data.policies.filter(
    (policy) => !policy.reviewer_ids.includes(user.id),
  );
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const input = requestInputSchema.safeParse({
      policy_id: String(fields.get("policy")),
      title: String(fields.get("title") || "").trim(),
      description: String(fields.get("description") || "").trim(),
    });
    if (!input.success) {
      setError(true);
      return;
    }
    setPending(true);
    setError(false);
    try {
      await api(
        "/approvals/requests",
        approvalSchema,
        mutation("POST", input.data),
      );
      form.reset();
      onSaved();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }
  async function vote(id: string, decision: "approve" | "reject") {
    setPending(true);
    setError(false);
    try {
      await api(
        `/approvals/requests/${encodeURIComponent(id)}/votes`,
        approvalSchema,
        mutation("POST", { decision }),
      );
      onSaved();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="mt-6">
      {eligible.length > 0 && (
        <details className="panel">
          <summary className="cursor-pointer text-lg font-semibold">
            {m.newRequest}
          </summary>
          <form onSubmit={create} className="mt-5 grid gap-4 sm:grid-cols-2">
            <label>
              <span className="field-label">{m.policy}</span>
              <select name="policy" className="field" required>
                {eligible.map((policy) => (
                  <option key={policy.id} value={policy.id}>
                    {policy.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">{m.requestTitle}</span>
              <input name="title" className="field" maxLength={160} required />
            </label>
            <label className="sm:col-span-2">
              <span className="field-label">{m.description}</span>
              <textarea
                name="description"
                rows={3}
                maxLength={4000}
                className="field"
                required
              />
            </label>
            <Button type="submit" disabled={pending}>
              {m.request}
            </Button>
          </form>
        </details>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {m.error}
        </p>
      )}
      <div className="mt-6 space-y-5">
        {data.requests.map((request) => (
          <article key={request.id} className="panel">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="tag">{m[request.status]}</span>
                <h3 className="mt-4 text-xl font-semibold">{request.title}</h3>
                <p className="subtext mt-3 whitespace-pre-wrap">
                  {request.description}
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => setOpen(open === request.id ? null : request.id)}
              >
                {m.decisionMap}
              </Button>
            </div>
            {open === request.id && (
              <DecisionCanvas request={request} members={data.members} />
            )}
            <p className="mt-5 text-xs text-secondary">
              {m.votes}:{" "}
              {
                request.votes.filter((item) => item.decision === "approve")
                  .length
              }{" "}
              / {request.required_approvals} · {m.noExecution}
            </p>
            {request.votes.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {request.votes.map((item) => (
                  <li key={item.id} className="tag">
                    {item.reviewer_name} · {m[item.decision]}
                  </li>
                ))}
              </ul>
            )}
            {request.status === "pending" &&
              request.created_by !== user.id &&
              request.reviewer_ids.includes(user.id) &&
              !request.votes.some((item) => item.reviewer_id === user.id) && (
                <div className="mt-5 flex gap-3">
                  <Button
                    disabled={pending}
                    onClick={() => vote(request.id, "approve")}
                  >
                    {m.approve}
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={pending}
                    onClick={() => vote(request.id, "reject")}
                  >
                    {m.reject}
                  </Button>
                </div>
              )}
          </article>
        ))}
      </div>
      {!data.requests.length && <p className="subtext mt-6">{m.noRequests}</p>}
    </section>
  );
}
