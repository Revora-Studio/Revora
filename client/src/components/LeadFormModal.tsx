import { FormEvent, useMemo, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { businessTypes, isPresetBusinessType, otherBusinessType } from "@/data/businessTypes";
import { createLead } from "@/lib/api";
import { services } from "@/data/content";
import type { LeadInput } from "@/types";

type LeadFormModalProps = {
  open: boolean;
  onClose: () => void;
};

const initialForm: LeadInput = {
  name: "",
  email: "",
  phone: "",
  brandName: "",
  businessType: "Restaurant",
  city: "",
  monthlyBudget: "",
  services: ["Social Media Management"],
  goals: "",
  preferredDate: "",
  notes: ""
};

export function LeadFormModal({ open, onClose }: LeadFormModalProps) {
  const [form, setForm] = useState<LeadInput>(initialForm);
  const [customBusinessType, setCustomBusinessType] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState("");
  const serviceOptions = useMemo(() => services.map((service) => service.title), []);
  const businessTypeChoice = isPresetBusinessType(form.businessType) ? form.businessType : otherBusinessType;

  if (!open) return null;

  const update = (field: keyof LeadInput, value: string | string[]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateBusinessTypeChoice = (value: string) => {
    if (value === otherBusinessType) {
      update("businessType", customBusinessType);
      return;
    }
    setCustomBusinessType("");
    update("businessType", value);
  };

  const updateCustomBusinessType = (value: string) => {
    setCustomBusinessType(value);
    update("businessType", value);
  };

  const toggleService = (service: string) => {
    setForm((current) => {
      const active = current.services.includes(service);
      const next = active ? current.services.filter((item) => item !== service) : [...current.services, service];
      return { ...current, services: next.length ? next : [service] };
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setState("submitting");

    try {
      await createLead(form);
      setState("success");
      setForm(initialForm);
      setCustomBusinessType("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong.");
      setState("idle");
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="consultation-title">
      <div className="lead-modal">
        <button className="modal-close" type="button" aria-label="Close consultation form" onClick={onClose}>
          <X size={20} />
        </button>
        {state === "success" ? (
          <div className="success-state">
            <Check size={34} />
            <p className="eyebrow">Request received</p>
            <h2 id="consultation-title">Your consultation request is in the studio queue.</h2>
            <p>
              We will review your brand, category, and goals before reaching out, so the first call starts with a
              useful point of view.
            </p>
            <button className="nav-cta" type="button" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <form className="lead-form" onSubmit={submit}>
            <div className="form-intro">
              <p className="eyebrow">Book consultation</p>
              <h2 id="consultation-title">Tell us what you are building.</h2>
              <p>Share enough context for a serious brand and growth audit.</p>
            </div>

            <div className="form-grid">
              <label>
                Your name
                <input required value={form.name} onChange={(event) => update("name", event.target.value)} />
              </label>
              <label>
                Work email
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) => update("email", event.target.value)}
                />
              </label>
              <label>
                Phone / WhatsApp
                <input required value={form.phone} onChange={(event) => update("phone", event.target.value)} />
              </label>
              <label>
                Brand name
                <input
                  required
                  value={form.brandName}
                  onChange={(event) => update("brandName", event.target.value)}
                />
              </label>
              <label>
                Business type
                <select value={businessTypeChoice} onChange={(event) => updateBusinessTypeChoice(event.target.value)}>
                  {businessTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                  <option>{otherBusinessType}</option>
                </select>
              </label>
              {businessTypeChoice === otherBusinessType ? (
                <label>
                  Other business type
                  <input
                    required
                    value={customBusinessType}
                    onChange={(event) => updateCustomBusinessType(event.target.value)}
                    placeholder="Type your business category"
                  />
                </label>
              ) : null}
              <label>
                City
                <input required value={form.city} onChange={(event) => update("city", event.target.value)} />
              </label>
              <label>
                Monthly marketing budget
                <input
                  required
                  inputMode="numeric"
                  placeholder="Enter amount in Rs"
                  value={form.monthlyBudget}
                  onChange={(event) => update("monthlyBudget", event.target.value)}
                />
              </label>
              <label>
                Preferred call date
                <input
                  type="date"
                  value={form.preferredDate}
                  onChange={(event) => update("preferredDate", event.target.value)}
                />
              </label>
            </div>

            <div className="service-picker" aria-label="Services needed">
              {serviceOptions.map((service) => (
                <button
                  key={service}
                  type="button"
                  className={form.services.includes(service) ? "selected" : ""}
                  onClick={() => toggleService(service)}
                >
                  {service}
                </button>
              ))}
            </div>

            <label>
              What do you want the next 90 days to change?
              <textarea required value={form.goals} onChange={(event) => update("goals", event.target.value)} />
            </label>

            <label>
              Notes for the team
              <textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} />
            </label>

            {error ? <p className="form-error">{error}</p> : null}
            <button className="form-submit" type="submit" disabled={state === "submitting"}>
              {state === "submitting" ? <Loader2 className="spin" size={18} /> : null}
              Submit consultation request
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
