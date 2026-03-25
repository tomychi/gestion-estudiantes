"use client";

import { useEffect, useState } from "react";
import { Payment, SerializedUserWithRelations } from "@/types";

interface Props {
  student: SerializedUserWithRelations;
  isOpen: boolean;
  onClose: () => void;
}

export default function TransferPaymentModalSingle({
  student,
  isOpen,
  onClose,
}: Props) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedInstallments, setSelectedInstallments] = useState<number[]>(
    [],
  );
  const [amount, setAmount] = useState("");
  const [transferReference, setTransferReference] = useState("");
  const [transferDate, setTransferDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const installmentAmount = student.totalAmount / student.installments;

  useEffect(() => {
    if (!isOpen) return;
    const fetchPayments = async () => {
      try {
        const res = await fetch(`/api/admin/students/${student.id}/payments`);
        const data = await res.json();
        if (data.success) setPayments(data.payments);
      } catch (err) {
        console.error("Error fetching payments:", err);
      }
    };
    fetchPayments();
    setSelectedInstallments([]);
    setAmount("");
    setTransferReference("");
    setTransferDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setError("");
    setSuccess(false);
  }, [isOpen, student.id]);

  const paidInstallments = new Set(
    payments
      .filter((p) => p.status === "APPROVED" && p.installmentNumber)
      .map((p) => p.installmentNumber as number),
  );
  const pendingInstallments = new Set(
    payments
      .filter((p) => p.status === "PENDING" && p.installmentNumber)
      .map((p) => p.installmentNumber as number),
  );

  const handleInstallmentToggle = (num: number) => {
    if (paidInstallments.has(num) || pendingInstallments.has(num)) return;
    setSelectedInstallments((prev) => {
      const next = prev.includes(num)
        ? prev.filter((n) => n !== num)
        : [...prev, num].sort((a, b) => a - b);
      setAmount((next.length * installmentAmount).toString());
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (selectedInstallments.length === 0) {
      setError("Seleccioná al menos una cuota");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError("Ingresá un monto válido");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/payments/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentDni: student.dni,
          installments: selectedInstallments,
          amount: parseFloat(amount),
          transferReference: transferReference.trim() || undefined,
          transferDate: transferDate || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Error al registrar la transferencia");
        setIsSubmitting(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al registrar la transferencia",
      );
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setSelectedInstallments([]);
    setAmount("");
    setTransferReference("");
    setTransferDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setError("");
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        .tpm-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          backdrop-filter: blur(2px);
        }
        .tpm-modal {
          --font-display: 'Plus Jakarta Sans', sans-serif;
          --font-body:    'DM Sans', sans-serif;
          --surface:      #ffffff;
          --surface-2:    #f4f4f5;
          --surface-3:    #e4e4e7;
          --primary:      #00618e;
          --primary-tint: rgba(0,97,142,0.08);
          --primary-tint-s: rgba(0,97,142,0.14);
          --primary-focus: rgba(0,97,142,0.15);
          --text-1:       #18181b;
          --text-2:       #52525b;
          --text-3:       #a1a1aa;
          --success:      #0f7b55;
          --success-bg:   rgba(15,123,85,0.08);
          --success-border: rgba(15,123,85,0.2);
          --warning:      #a16207;
          --warning-bg:   rgba(161,98,7,0.08);
          --warning-border: rgba(161,98,7,0.2);
          --danger:       #b91c1c;
          --danger-bg:    rgba(185,28,28,0.08);
          --danger-border: rgba(185,28,28,0.2);
          --r-md:  0.875rem;
          --r-lg:  1.25rem;
          --r-xl:  1.75rem;
          --r-full: 9999px;

          background: var(--surface);
          border-radius: var(--r-xl);
          box-shadow: 0 24px 60px rgba(0,0,0,0.18);
          width: 100%;
          max-width: 560px;
          max-height: 90svh;
          overflow-y: auto;
          font-family: var(--font-body);
          -webkit-font-smoothing: antialiased;
        }
        .tpm-modal *, .tpm-modal *::before, .tpm-modal *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* Header */
        .tpm-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          padding: 1.375rem 1.5rem 1.125rem;
          border-bottom: 1px solid var(--surface-3);
        }
        .tpm-header__icon {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: var(--r-md);
          background: var(--primary-tint);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          flex-shrink: 0;
          margin-bottom: 0.75rem;
        }
        .tpm-header__title {
          font-family: var(--font-display);
          font-size: 1.125rem;
          font-weight: 800;
          color: var(--text-1);
          letter-spacing: -0.01em;
        }
        .tpm-header__sub { font-size: 0.8125rem; color: var(--text-3); margin-top: 0.2rem; }
        .tpm-close {
          width: 2rem; height: 2rem;
          border-radius: var(--r-md);
          background: var(--surface-2);
          border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: var(--text-3);
          flex-shrink: 0;
          transition: background 0.12s, color 0.12s;
        }
        .tpm-close:hover { background: var(--surface-3); color: var(--text-1); }
        .tpm-close:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Balance strip */
        .tpm-balance {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          background: var(--surface-2);
          border-bottom: 1px solid var(--surface-3);
        }
        .tpm-balance__item {
          padding: 0.875rem 1rem;
          border-right: 1px solid var(--surface-3);
        }
        .tpm-balance__item:last-child { border-right: none; }
        .tpm-balance__label { font-size: 0.6875rem; font-weight: 600; color: var(--text-3); margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.04em; }
        .tpm-balance__value { font-family: var(--font-display); font-size: 1rem; font-weight: 800; color: var(--text-1); }
        .tpm-balance__value--primary { color: var(--primary); }

        /* Body */
        .tpm-body {
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.125rem;
        }

        /* Section label */
        .tpm-section-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-3);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 0.625rem;
        }

        /* Installment grid */
        .tpm-inst-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 0.5rem;
        }
        @media (min-width: 400px) {
          .tpm-inst-grid { grid-template-columns: repeat(8, 1fr); }
        }
        .tpm-inst-btn {
          aspect-ratio: 1;
          border-radius: var(--r-md);
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 700;
          border: 1.5px solid transparent;
          cursor: pointer;
          transition: all 0.12s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tpm-inst-btn--available {
          background: var(--surface-2);
          border-color: var(--surface-3);
          color: var(--text-2);
        }
        .tpm-inst-btn--available:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-tint); }
        .tpm-inst-btn--selected {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
          box-shadow: 0 3px 8px rgba(0,97,142,0.3);
        }
        .tpm-inst-btn--paid    { background: var(--success-bg); border-color: var(--success-border); color: var(--success); cursor: not-allowed; opacity: 0.7; }
        .tpm-inst-btn--pending { background: var(--warning-bg); border-color: var(--warning-border); color: var(--warning); cursor: not-allowed; opacity: 0.7; }

        /* Legend */
        .tpm-legend { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.5rem; }
        .tpm-legend__item { display: flex; align-items: center; gap: 0.375rem; font-size: 0.75rem; color: var(--text-2); }
        .tpm-legend__dot { width: 0.625rem; height: 0.625rem; border-radius: 0.25rem; flex-shrink: 0; }

        /* Selection summary */
        .tpm-selection {
          background: var(--primary-tint);
          border: 1px solid rgba(0,97,142,0.15);
          border-radius: var(--r-md);
          padding: 0.75rem 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .tpm-selection__label { font-size: 0.8125rem; font-weight: 600; color: var(--primary); }
        .tpm-selection__amount { font-family: var(--font-display); font-size: 1.0625rem; font-weight: 800; color: var(--primary); }

        /* Two-col grid */
        .tpm-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.875rem;
        }
        @media (max-width: 400px) { .tpm-2col { grid-template-columns: 1fr; } }

        /* Fields */
        .tpm-field { display: flex; flex-direction: column; gap: 0.375rem; }
        .tpm-label { font-size: 0.8125rem; font-weight: 600; color: var(--text-2); }
        .tpm-label__hint { font-weight: 400; color: var(--text-3); font-size: 0.75rem; }
        .tpm-input-wrap { position: relative; }
        .tpm-input-prefix {
          position: absolute; left: 0.875rem; top: 50%; transform: translateY(-50%);
          font-weight: 600; color: var(--text-3); pointer-events: none;
        }
        .tpm-input {
          width: 100%;
          padding: 0.6875rem 0.875rem;
          border-radius: var(--r-md);
          border: 1.5px solid var(--surface-3);
          background: var(--surface-2);
          font-family: var(--font-body);
          font-size: 0.9375rem;
          color: var(--text-1);
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
          -webkit-appearance: none;
        }
        .tpm-input::placeholder { color: var(--text-3); }
        .tpm-input:focus { border-color: var(--primary); background: white; box-shadow: 0 0 0 3px var(--primary-focus); }
        .tpm-input:disabled { opacity: 0.5; cursor: not-allowed; }
        .tpm-input--prefix { padding-left: 1.75rem; }
        .tpm-input--amount {
          font-family: var(--font-display);
          font-size: 1.125rem;
          font-weight: 700;
        }
        .tpm-input-sub { font-size: 0.75rem; color: var(--text-3); margin-top: 0.25rem; }
        .tpm-textarea { resize: none; min-height: 4.5rem; }

        /* Alerts */
        .tpm-alert {
          border-radius: var(--r-md);
          padding: 0.875rem 1rem;
          font-size: 0.8125rem;
          line-height: 1.4;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .tpm-alert--error   { background: var(--danger-bg);  border: 1px solid var(--danger-border);  color: var(--danger); }
        .tpm-alert--success { background: var(--success-bg); border: 1px solid var(--success-border); color: var(--success); font-weight: 600; }

        /* Footer */
        .tpm-footer {
          display: flex;
          gap: 0.625rem;
          padding: 1rem 1.5rem 1.375rem;
          border-top: 1px solid var(--surface-3);
        }
        .tpm-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border-radius: var(--r-full);
          font-family: var(--font-display);
          font-size: 0.9375rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: transform 0.12s, box-shadow 0.12s, background 0.12s, opacity 0.12s;
        }
        .tpm-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
        .tpm-btn--cancel { background: var(--surface-2); color: var(--text-2); flex-shrink: 0; }
        .tpm-btn--cancel:hover:not(:disabled) { background: var(--surface-3); }
        .tpm-btn--submit {
          flex: 1;
          background: linear-gradient(135deg, var(--primary) 0%, #0089c6 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(0,97,142,0.3);
        }
        .tpm-btn--submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0,97,142,0.38);
        }
        .tpm-spinner {
          width: 1rem; height: 1rem;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: tpm-spin 0.7s linear infinite;
        }
        @keyframes tpm-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="tpm-overlay" onClick={handleClose}>
        <div className="tpm-modal" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="tpm-header">
            <div>
              <div className="tpm-header__icon">
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
              <p className="tpm-header__title">Registrar transferencia</p>
              <p className="tpm-header__sub">
                {student.firstName} {student.lastName} · DNI {student.dni}
              </p>
            </div>
            <button
              className="tpm-close"
              onClick={handleClose}
              disabled={isSubmitting}
              aria-label="Cerrar"
            >
              <svg
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                viewBox="0 0 24 24"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Balance strip */}
          <div className="tpm-balance">
            <div className="tpm-balance__item">
              <p className="tpm-balance__label">Total</p>
              <p className="tpm-balance__value">
                ${student.totalAmount?.toLocaleString("es-AR")}
              </p>
            </div>
            <div className="tpm-balance__item">
              <p className="tpm-balance__label">Por cuota</p>
              <p className="tpm-balance__value">
                ${installmentAmount.toLocaleString("es-AR")}
              </p>
            </div>
            <div className="tpm-balance__item">
              <p className="tpm-balance__label">Saldo</p>
              <p className="tpm-balance__value tpm-balance__value--primary">
                ${student.balance?.toLocaleString("es-AR")}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="tpm-body">
              {/* Installments */}
              <div>
                <p className="tpm-section-label">Cuotas a pagar *</p>
                <div className="tpm-inst-grid">
                  {Array.from(
                    { length: student.installments },
                    (_, i) => i + 1,
                  ).map((num) => {
                    const state = paidInstallments.has(num)
                      ? "paid"
                      : pendingInstallments.has(num)
                        ? "pending"
                        : selectedInstallments.includes(num)
                          ? "selected"
                          : "available";
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleInstallmentToggle(num)}
                        disabled={
                          isSubmitting ||
                          state === "paid" ||
                          state === "pending"
                        }
                        className={`tpm-inst-btn tpm-inst-btn--${state}`}
                      >
                        {state === "paid"
                          ? "✓"
                          : state === "pending"
                            ? "◷"
                            : num}
                      </button>
                    );
                  })}
                </div>
                <div className="tpm-legend">
                  {[
                    { color: "var(--success)", label: "Pagada" },
                    { color: "var(--warning)", label: "En revisión" },
                    { color: "var(--primary)", label: "Seleccionada" },
                    { color: "var(--surface-3)", label: "Disponible" },
                  ].map(({ color, label }) => (
                    <div key={label} className="tpm-legend__item">
                      <div
                        className="tpm-legend__dot"
                        style={{ background: color }}
                      />
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Selection summary */}
              {selectedInstallments.length > 0 && (
                <div className="tpm-selection">
                  <span className="tpm-selection__label">
                    Cuota{selectedInstallments.length > 1 ? "s" : ""}{" "}
                    {selectedInstallments.join(", ")}
                  </span>
                  <span className="tpm-selection__amount">
                    $
                    {(
                      selectedInstallments.length * installmentAmount
                    ).toLocaleString("es-AR")}
                  </span>
                </div>
              )}

              {/* Transfer details */}
              <div className="tpm-2col">
                <div className="tpm-field">
                  <label className="tpm-label">
                    Referencia / operación{" "}
                    <span className="tpm-label__hint">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={transferReference}
                    onChange={(e) => setTransferReference(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="123456789"
                    className="tpm-input"
                  />
                </div>
                <div className="tpm-field">
                  <label className="tpm-label">Fecha de transferencia</label>
                  <input
                    type="date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    disabled={isSubmitting}
                    max={new Date().toISOString().split("T")[0]}
                    className="tpm-input"
                  />
                </div>
              </div>

              {/* Amount */}
              <div className="tpm-field">
                <label className="tpm-label">
                  Monto{" "}
                  <span className="tpm-label__hint">
                    (calculado automáticamente)
                  </span>
                </label>
                <div className="tpm-input-wrap">
                  <span className="tpm-input-prefix">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={isSubmitting}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0"
                    className="tpm-input tpm-input--prefix tpm-input--amount"
                  />
                </div>
                {selectedInstallments.length > 0 && (
                  <p className="tpm-input-sub">
                    {selectedInstallments.length} cuota(s) × $
                    {installmentAmount.toLocaleString("es-AR")}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="tpm-field">
                <label className="tpm-label">
                  Notas <span className="tpm-label__hint">(opcional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isSubmitting}
                  rows={2}
                  placeholder="Información adicional..."
                  className="tpm-input tpm-textarea"
                />
              </div>

              {/* Alerts */}
              {error && (
                <div className="tpm-alert tpm-alert--error">
                  <svg
                    width="14"
                    height="14"
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
                <div className="tpm-alert tpm-alert--success">
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
                  ¡Transferencia registrada! Recargando...
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="tpm-footer">
              <button
                type="button"
                className="tpm-btn tpm-btn--cancel"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="tpm-btn tpm-btn--submit"
                disabled={
                  isSubmitting ||
                  selectedInstallments.length === 0 ||
                  !amount ||
                  parseFloat(amount) <= 0
                }
              >
                {isSubmitting ? (
                  <>
                    <div className="tpm-spinner" /> Registrando...
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
                      strokeLinejoin="round"
                      viewBox="0 0 24 24"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Registrar transferencia
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
