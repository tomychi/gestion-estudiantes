"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  SchoolDivision,
  SchoolFormData,
  ProductFormData,
  CreateStudentPayload,
} from "@/types";

interface Props {
  schools: SchoolFormData[];
  products: ProductFormData[];
}

// ─── Reusable field primitives ────────────────────────────────────────────────

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="csf-field">
      <label className="csf-label">
        {label}
        {hint && <span className="csf-label__hint">{hint}</span>}
      </label>
      {children}
      {error && <p className="csf-field-error">{error}</p>}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`csf-input${props.className ? ` ${props.className}` : ""}`}
    />
  );
}

function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement> & {
    children: React.ReactNode;
  },
) {
  return (
    <select {...props} className="csf-input csf-select">
      {props.children}
    </select>
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className="csf-input csf-textarea" />;
}

// ─── Toggle group ─────────────────────────────────────────────────────────────

function ToggleGroup({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div className="csf-toggle-group">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          className={`csf-toggle-btn${value === opt.value ? " csf-toggle-btn--active" : ""}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="csf-section">
      <p className="csf-section__title">{title}</p>
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CreateStudentForm({ schools, products }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [schoolMode, setSchoolMode] = useState<"existing" | "new">("existing");
  const [divisionMode, setDivisionMode] = useState<"existing" | "new">(
    "existing",
  );
  const [divisions, setDivisions] = useState<SchoolDivision[]>([]);
  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const prevProductIdRef = useRef<string | undefined>(undefined);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dni: "",
    email: "",
    phone: "",
    size: "",
    schoolId: "",
    divisionId: "",
    schoolName: "",
    schoolAddress: "",
    divisionName: "",
    divisionYear: new Date().getFullYear() + 1,
    productId: "",
    totalAmount: "",
    installments: 3,
    paidAmount: "",
    notes: "",
  });

  const set = (patch: Partial<typeof formData>) =>
    setFormData((prev) => ({ ...prev, ...patch }));

  const loadDivisions = useCallback(async (schoolId: string) => {
    setLoadingDivisions(true);
    try {
      const res = await fetch(`/api/admin/schools/${schoolId}/divisions`);
      const result = await res.json();
      setDivisions(
        result.success && result.data ? (result.data as SchoolDivision[]) : [],
      );
    } catch {
      setDivisions([]);
    } finally {
      setLoadingDivisions(false);
    }
  }, []);

  useEffect(() => {
    if (schoolMode === "existing" && formData.schoolId) {
      loadDivisions(formData.schoolId);
    } else {
      setDivisions([]);
      setFormData((prev) => ({ ...prev, divisionId: "" }));
    }
  }, [formData.schoolId, schoolMode, loadDivisions]);

  useEffect(() => {
    if (
      divisionMode === "existing" &&
      divisions.length === 0 &&
      !loadingDivisions &&
      formData.schoolId
    ) {
      setDivisionMode("new");
    }
  }, [divisions, loadingDivisions, divisionMode, formData.schoolId]);

  useEffect(() => {
    const changed = prevProductIdRef.current !== formData.productId;
    if (formData.productId && changed) {
      const product = products.find((p) => p.id === formData.productId);
      const price = product?.currentPrice;
      if (price && (!formData.totalAmount || changed)) {
        setFormData((prev) => ({ ...prev, totalAmount: price.toString() }));
      }
    }
    prevProductIdRef.current = formData.productId;
  }, [formData.productId, formData.totalAmount, products]);

  const handleSubmit = async (e: React.FormEvent, andAddAnother = false) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const payload: Partial<CreateStudentPayload> & {
        schoolId?: string;
        schoolName?: string;
        schoolAddress?: string;
        divisionId?: string;
        divisionName?: string;
        divisionYear?: number;
      } = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        dni: formData.dni.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        size: formData.size.trim() || undefined,
        productId: formData.productId,
        totalAmount: parseFloat(formData.totalAmount),
        installments: formData.installments,
        paidAmount: formData.paidAmount
          ? parseFloat(formData.paidAmount)
          : undefined,
        notes: formData.notes.trim() || undefined,
      };

      if (schoolMode === "existing") {
        payload.schoolId = formData.schoolId;
      } else {
        payload.schoolName = formData.schoolName.trim();
        payload.schoolAddress = formData.schoolAddress.trim() || undefined;
      }

      if (divisionMode === "existing" && schoolMode === "existing") {
        payload.divisionId = formData.divisionId;
        const sel = divisions.find((d) => d.id === formData.divisionId);
        if (sel) {
          payload.divisionName = sel.division;
          payload.divisionYear = sel.year;
        }
      } else {
        payload.divisionName = formData.divisionName.trim();
        payload.divisionYear = formData.divisionYear;
      }

      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!result.success) {
        setError(result.error || "Error al crear el estudiante");
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      if (andAddAnother) {
        set({
          firstName: "",
          lastName: "",
          dni: "",
          email: "",
          phone: "",
          size: "",
          paidAmount: "",
          notes: "",
        });
        setSuccess(false);
        setIsSubmitting(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setTimeout(() => router.push("/admin/students?created=true"), 1500);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al crear el estudiante",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        /* ── Tokens ──────────────────────────────────────── */
        .csf-root {
          --font-display: 'Plus Jakarta Sans', sans-serif;
          --font-body:    'DM Sans', sans-serif;
          --surface:      #ffffff;
          --surface-2:    #f4f4f5;
          --surface-3:    #e4e4e7;
          --primary:      #00618e;
          --primary-mid:  #0089c6;
          --primary-focus: rgba(0,97,142,0.15);
          --primary-tint: rgba(0,97,142,0.08);
          --success:      #0f7b55;
          --success-bg:   rgba(15,123,85,0.08);
          --success-border: rgba(15,123,85,0.2);
          --danger:       #b91c1c;
          --danger-bg:    rgba(185,28,28,0.07);
          --danger-border: rgba(185,28,28,0.2);
          --text-1:       #18181b;
          --text-2:       #52525b;
          --text-3:       #a1a1aa;
          --r-sm:  0.5rem;
          --r-md:  0.875rem;
          --r-lg:  1.25rem;
          --r-xl:  1.75rem;
          --r-full: 9999px;
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);

          font-family: var(--font-body);
          -webkit-font-smoothing: antialiased;
        }
        .csf-root *, .csf-root *::before, .csf-root *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* ── Card ────────────────────────────────────────── */
        .csf-card {
          background: var(--surface);
          border-radius: var(--r-xl);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        /* ── Section ─────────────────────────────────────── */
        .csf-section {
          padding: 1.375rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          border-bottom: 1px solid var(--surface-3);
        }
        .csf-section:last-child { border-bottom: none; }
        .csf-section__title {
          font-family: var(--font-display);
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-2);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        /* ── Grid ────────────────────────────────────────── */
        .csf-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.875rem;
        }
        @media (min-width: 540px) {
          .csf-grid { grid-template-columns: 1fr 1fr; }
          .csf-grid--full { grid-column: 1 / -1; }
        }

        /* ── Field ───────────────────────────────────────── */
        .csf-field { display: flex; flex-direction: column; gap: 0.35rem; }
        .csf-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-2);
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }
        .csf-label__hint {
          font-size: 0.75rem;
          font-weight: 400;
          color: var(--text-3);
        }
        .csf-field-error {
          font-size: 0.75rem;
          color: var(--danger);
          font-weight: 500;
        }

        /* ── Inputs ──────────────────────────────────────── */
        .csf-input {
          width: 100%;
          padding: 0.6875rem 0.875rem;
          border-radius: var(--r-md);
          border: 1.5px solid var(--surface-3);
          background: var(--surface-2);
          font-family: var(--font-body);
          font-size: 0.9375rem;
          color: var(--text-1);
          outline: none;
          transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
          -webkit-appearance: none;
        }
        .csf-input::placeholder { color: var(--text-3); }
        .csf-input:focus {
          border-color: var(--primary);
          background: var(--surface);
          box-shadow: 0 0 0 3px var(--primary-focus);
        }
        .csf-input:disabled { opacity: 0.5; cursor: not-allowed; }
        .csf-textarea { resize: vertical; min-height: 5rem; }

        /* ── Toggle group ────────────────────────────────── */
        .csf-toggle-group {
          display: flex;
          gap: 0.375rem;
          flex-wrap: wrap;
        }
        .csf-toggle-btn {
          padding: 0.5rem 1rem;
          border-radius: var(--r-full);
          font-family: var(--font-body);
          font-size: 0.8125rem;
          font-weight: 600;
          border: 1.5px solid var(--surface-3);
          background: var(--surface-2);
          color: var(--text-2);
          cursor: pointer;
          transition: all 0.12s;
        }
        .csf-toggle-btn:hover { background: var(--surface-3); }
        .csf-toggle-btn--active {
          background: var(--primary-tint);
          border-color: var(--primary);
          color: var(--primary);
        }
        .csf-toggle-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── Loading ─────────────────────────────────────── */
        .csf-loading {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8125rem;
          color: var(--text-3);
        }
        .csf-spinner {
          width: 1rem;
          height: 1rem;
          border: 2px solid var(--surface-3);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: csf-spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes csf-spin { to { transform: rotate(360deg); } }

        /* ── Empty state ─────────────────────────────────── */
        .csf-empty {
          font-size: 0.8125rem;
          color: var(--text-3);
          font-style: italic;
          padding: 0.5rem 0;
        }

        /* ── Alerts ──────────────────────────────────────── */
        .csf-alert {
          border-radius: var(--r-md);
          padding: 0.875rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.625rem;
          font-size: 0.8125rem;
          font-weight: 500;
        }
        .csf-alert--error {
          background: var(--danger-bg);
          border: 1px solid var(--danger-border);
          color: var(--danger);
        }
        .csf-alert--success {
          background: var(--success-bg);
          border: 1px solid var(--success-border);
          color: var(--success);
        }

        /* ── Footer actions ──────────────────────────────── */
        .csf-footer {
          padding: 1.125rem 1.5rem;
          background: var(--surface-2);
          border-top: 1px solid var(--surface-3);
          display: flex;
          gap: 0.625rem;
          flex-wrap: wrap;
          align-items: center;
        }
        .csf-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.6875rem 1.25rem;
          border-radius: var(--r-full);
          font-family: var(--font-display);
          font-size: 0.875rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: transform 0.12s, box-shadow 0.12s, background 0.12s, opacity 0.12s;
          white-space: nowrap;
        }
        .csf-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none !important; }
        .csf-btn--cancel {
          background: var(--surface-3);
          color: var(--text-2);
        }
        .csf-btn--cancel:hover:not(:disabled) { background: #d4d4d8; }
        .csf-btn--add {
          background: var(--success-bg);
          color: var(--success);
          border: 1.5px solid var(--success-border);
        }
        .csf-btn--add:hover:not(:disabled) { background: rgba(15,123,85,0.14); }
        .csf-btn--submit {
          flex: 1;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-mid) 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(0,97,142,0.3);
        }
        .csf-btn--submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0,97,142,0.38);
        }
      `}</style>

      <div className="csf-root">
        <form className="csf-card" onSubmit={(e) => handleSubmit(e, false)}>
          {/* ── Alerts ── */}
          {(error || success) && (
            <div style={{ padding: "1rem 1.5rem" }}>
              {error && (
                <div className="csf-alert csf-alert--error">
                  <svg
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {error}
                </div>
              )}
              {success && (
                <div className="csf-alert csf-alert--success">
                  <svg
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  ¡Estudiante creado! Redirigiendo...
                </div>
              )}
            </div>
          )}

          {/* ── Sección: Datos personales ── */}
          <Section title="Datos personales">
            <div className="csf-grid">
              <Field label="Nombre *">
                <Input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => set({ firstName: e.target.value })}
                  disabled={isSubmitting}
                />
              </Field>
              <Field label="Apellido *">
                <Input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => set({ lastName: e.target.value })}
                  disabled={isSubmitting}
                />
              </Field>
              <Field label="DNI *" hint="(contraseña inicial)">
                <Input
                  type="text"
                  required
                  maxLength={8}
                  pattern="\d{7,8}"
                  placeholder="12345678"
                  value={formData.dni}
                  onChange={(e) => set({ dni: e.target.value })}
                  disabled={isSubmitting}
                />
              </Field>
              <Field label="Talle">
                <Input
                  type="text"
                  placeholder="S, M, L, XL…"
                  value={formData.size}
                  onChange={(e) => set({ size: e.target.value })}
                  disabled={isSubmitting}
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => set({ email: e.target.value })}
                  disabled={isSubmitting}
                />
              </Field>
              <Field label="Teléfono">
                <Input
                  type="tel"
                  placeholder="351XXXXXXX"
                  value={formData.phone}
                  onChange={(e) => set({ phone: e.target.value })}
                  disabled={isSubmitting}
                />
              </Field>
            </div>
          </Section>

          {/* ── Sección: Colegio ── */}
          <Section title="Colegio y división">
            <ToggleGroup
              value={schoolMode}
              onChange={(v) => setSchoolMode(v as "existing" | "new")}
              options={[
                { value: "existing", label: "Colegio existente" },
                { value: "new", label: "Crear colegio nuevo" },
              ]}
              disabled={isSubmitting}
            />

            {schoolMode === "existing" ? (
              <>
                <Field label="Colegio *">
                  <Select
                    required
                    value={formData.schoolId}
                    onChange={(e) => set({ schoolId: e.target.value })}
                    disabled={isSubmitting}
                  >
                    <option value="">Seleccionar...</option>
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                {formData.schoolId && (
                  <>
                    <ToggleGroup
                      value={divisionMode}
                      onChange={(v) => setDivisionMode(v as "existing" | "new")}
                      options={[
                        { value: "existing", label: "División existente" },
                        { value: "new", label: "Crear división nueva" },
                      ]}
                      disabled={isSubmitting}
                    />

                    {divisionMode === "existing" ? (
                      <Field label="División *">
                        {loadingDivisions ? (
                          <div className="csf-loading">
                            <div className="csf-spinner" /> Cargando
                            divisiones...
                          </div>
                        ) : divisions.length > 0 ? (
                          <Select
                            required
                            value={formData.divisionId}
                            onChange={(e) =>
                              set({ divisionId: e.target.value })
                            }
                            disabled={isSubmitting}
                          >
                            <option value="">Seleccionar...</option>
                            {divisions.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.division} - {d.year}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <p className="csf-empty">
                            Este colegio no tiene divisiones. Creá una nueva.
                          </p>
                        )}
                      </Field>
                    ) : (
                      <div className="csf-grid">
                        <Field label="Nombre de división *" hint="ej: 5to A">
                          <Input
                            type="text"
                            required
                            placeholder="5to A"
                            value={formData.divisionName}
                            onChange={(e) =>
                              set({ divisionName: e.target.value })
                            }
                            disabled={isSubmitting}
                          />
                        </Field>
                        <Field label="Año de egreso *">
                          <Input
                            type="number"
                            required
                            min={2020}
                            max={2050}
                            value={formData.divisionYear}
                            onChange={(e) =>
                              set({
                                divisionYear: parseInt(e.target.value) || 2025,
                              })
                            }
                            disabled={isSubmitting}
                          />
                        </Field>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                <Field label="Nombre del colegio *">
                  <Input
                    type="text"
                    required
                    placeholder="Ej: Colegio Nacional"
                    value={formData.schoolName}
                    onChange={(e) => set({ schoolName: e.target.value })}
                    disabled={isSubmitting}
                  />
                </Field>
                <Field label="Dirección">
                  <Input
                    type="text"
                    placeholder="Ej: Bolívar 263, CABA"
                    value={formData.schoolAddress}
                    onChange={(e) => set({ schoolAddress: e.target.value })}
                    disabled={isSubmitting}
                  />
                </Field>
                <div className="csf-grid">
                  <Field label="División *" hint="ej: 5to A">
                    <Input
                      type="text"
                      required
                      placeholder="5to A"
                      value={formData.divisionName}
                      onChange={(e) => set({ divisionName: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </Field>
                  <Field label="Año de egreso *">
                    <Input
                      type="number"
                      required
                      min={2020}
                      max={2050}
                      value={formData.divisionYear}
                      onChange={(e) =>
                        set({ divisionYear: parseInt(e.target.value) || 2025 })
                      }
                      disabled={isSubmitting}
                    />
                  </Field>
                </div>
              </>
            )}
          </Section>

          {/* ── Sección: Producto y pago ── */}
          <Section title="Producto y pago">
            <Field label="Producto *">
              <Select
                required
                value={formData.productId}
                onChange={(e) => set({ productId: e.target.value })}
                disabled={isSubmitting}
              >
                <option value="">Seleccionar producto...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ${(p.currentPrice ?? 0).toLocaleString("es-AR")}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="csf-grid">
              <Field label="Total a pagar *">
                <Input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  placeholder="150000"
                  value={formData.totalAmount}
                  onChange={(e) => set({ totalAmount: e.target.value })}
                  disabled={isSubmitting}
                />
              </Field>
              <Field label="Cuotas *">
                <Input
                  type="number"
                  required
                  min="1"
                  max="12"
                  value={formData.installments}
                  onChange={(e) =>
                    set({ installments: parseInt(e.target.value) || 1 })
                  }
                  disabled={isSubmitting}
                />
              </Field>
              <Field label="Ya pagó" hint="(opcional)">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={formData.paidAmount}
                  onChange={(e) => set({ paidAmount: e.target.value })}
                  disabled={isSubmitting}
                />
              </Field>
            </div>
          </Section>

          {/* ── Sección: Notas ── */}
          <Section title="Notas">
            <Textarea
              rows={3}
              placeholder="Información adicional sobre el estudiante..."
              value={formData.notes}
              onChange={(e) => set({ notes: e.target.value })}
              disabled={isSubmitting}
            />
          </Section>

          {/* ── Footer ── */}
          <div className="csf-footer">
            <button
              type="button"
              className="csf-btn csf-btn--cancel"
              onClick={() => router.push("/admin/students")}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="csf-btn csf-btn--add"
              onClick={(e) => handleSubmit(e, true)}
              disabled={isSubmitting || success}
            >
              {isSubmitting ? (
                <>
                  <div
                    className="csf-spinner"
                    style={{ borderTopColor: "var(--success)" }}
                  />{" "}
                  Guardando...
                </>
              ) : (
                <>
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    viewBox="0 0 24 24"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Guardar y crear otro
                </>
              )}
            </button>
            <button
              type="submit"
              className="csf-btn csf-btn--submit"
              disabled={isSubmitting || success}
            >
              {isSubmitting ? (
                <>
                  <div
                    className="csf-spinner"
                    style={{ borderTopColor: "white" }}
                  />{" "}
                  Guardando...
                </>
              ) : success ? (
                <>
                  <svg
                    width="14"
                    height="14"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Guardado — redirigiendo…
                </>
              ) : (
                "Guardar estudiante"
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
