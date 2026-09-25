import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { useSecurityMessages } from "@/features/security/messages";
import { api, mutation, type User } from "@/lib/api";
import { policyInputSchema, policySchema } from "./contracts";
export function PolicyForm({
  members,
  user,
  onSaved,
}: {
  members: User[];
  user: User;
  onSaved: () => void;
}) {
  const m = useSecurityMessages();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const eligible = members.filter((member) => member.id !== user.id);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const input = policyInputSchema.safeParse({
      title: String(fields.get("title") || "").trim(),
      reviewer_ids: fields.getAll("reviewers").map(String),
      required_approvals: Number(fields.get("required")),
    });
    if (!input.success) {
      setError(true);
      return;
    }
    setPending(true);
    setError(false);
    try {
      await api(
        "/approvals/policies",
        policySchema,
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
  return (
    <section className="panel">
      <h2 className="text-lg font-semibold">{m.createPolicy}</h2>
      {eligible.length < 2 ? (
        <p className="subtext mt-4">{m.twoReviewers}</p>
      ) : (
        <form className="mt-5 space-y-4" onSubmit={submit}>
          <label className="block">
            <span className="field-label">{m.policyTitle}</span>
            <input className="field" name="title" required maxLength={160} />
          </label>
          <fieldset>
            <legend className="field-label">{m.reviewers}</legend>
            <div className="space-y-2">
              {eligible.map((member) => (
                <label
                  key={member.id}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm"
                >
                  <input name="reviewers" type="checkbox" value={member.id} />
                  <span>
                    {member.name}
                    <span className="mt-1 block text-xs text-secondary">
                      {member.email}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block">
            <span className="field-label">{m.required}</span>
            <input
              className="field"
              type="number"
              name="required"
              min={2}
              max={Math.min(10, eligible.length)}
              defaultValue={2}
              required
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {m.confirmRequired}
            </p>
          )}
          <Button type="submit" disabled={pending}>
            {m.createPolicy}
          </Button>
        </form>
      )}
    </section>
  );
}
