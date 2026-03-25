"use client";

import { Payment, SerializedUserWithRelations } from "@/types";
import { useEffect, useState } from "react";

interface Props {
  student: SerializedUserWithRelations;
  isOpen: boolean;
  onClose: () => void;
}

export default function CashPaymentModalSingle({
  student,
  isOpen,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedInstallments, setSelectedInstallments] = useState<number[]>(
    [],
  );
  const [amount, setAmount] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [notes, setNotes] = useState("");

  const installmentAmount = student.totalAmount / student.installments;

  const calculateCoveredInstallments = (paymentAmount: number) => {
    if (!paymentAmount || paymentAmount <= 0) return 0;
    if (paymentAmount >= student.totalAmount) return student.installments;
    const exactCovered = paymentAmount / installmentAmount;
    const floorCovered = Math.floor(exactCovered);
    return exactCovered - floorCovered >= 0.98
      ? Math.min(floorCovered + 1, student.installments)
      : floorCovered;
  };

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

  const handleAmountChange = (value: string) => {
    setAmount(value);
    const num = parseFloat(value);
    if (!num || num <= 0) return;
    const coveredCount = calculateCoveredInstallments(num);
    const available = Array.from(
      { length: student.installments },
      (_, i) => i + 1,
    ).filter((n) => !paidInstallments.has(n) && !pendingInstallments.has(n));
    setSelectedInstallments(available.slice(0, coveredCount));
  };

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
    setReceiptNumber("");
    setNotes("");
    setError("");
    setSuccess("");
  }, [isOpen, student.id]);

  const toggleInstallment = (num: number) => {
    if (paidInstallments.has(num) || pendingInstallments.has(num)) return;
    setSelectedInstallments((prev) =>
      prev.includes(num)
        ? prev.filter((i) => i !== num)
        : [...prev, num].sort((a, b) => a - b),
    );
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payments/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentDni: student.dni,
          installments: selectedInstallments,
          amount: parseFloat(amount),
          receiptNumber: receiptNumber || null,
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Error al registrar el pago");
        return;
      }
      setSuccess(data.message);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al registrar el pago",
      );
    } finally {
      setLoading(false);
    }
  };

  // Mismatch warning
  const mismatchWarning = (() => {
    if (!selectedInstallments.length || !amount) return null;
    const expected = selectedInstallments.length * installmentAmount;
    const actual = parseFloat(amount);
    if ((Math.abs(expected - actual) / expected) * 100 > 5) {
      return { expected, actual };
    }
    return null;
  })();

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        .cpm-overlay {
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
        .cpm-modal {
          --font-display: 'Plus Jakarta Sans', sans-serif;
          --font-body:    'DM Sans', sans-serif;
          --surface:      #ffffff;
          --surface-2:    #f4f4f5;
          --surface-3:    #e4e4e7;
          --primary:      #00618e;
          --primary-tint: rgba(0,97,142,0.08);
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
        .cpm-modal *, .cpm-modal *::before, .cpm-modal *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* Header */
        .cpm-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          padding: 1.375rem 1.5rem 1.125rem;
          border-bottom: 1px solid var(--surface-3);
        }
        .cpm-header__icon {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: var(--r-md);
          background: var(--success-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--success);
          flex-shrink: 0;
          margin-bottom: 0.75rem;
        }
        .cpm-header__title {
          font-family: var(--font-display);
          font-size: 1.125rem;
          font-weight: 800;
          color: var(--text-1);
          letter-spacing: -0.01em;
        }
        .cpm-header__sub {
          font-size: 0.8125rem;
          color: var(--text-3);
          margin-top: 0.2rem;
        }
        .cpm-close {
          width: 2rem;
          height: 2rem;
          border-radius: var(--r-md);
          background: var(--surface-2);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-3);
          flex-shrink: 0;
          transition: background 0.12s, color 0.12s;
        }
        .cpm-close:hover { background: var(--surface-3); color: var(--text-1); }

        /* Balance strip */
        .cpm-balance {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          background: var(--surface-2);
          border-bottom: 1px solid var(--surface-3);
        }
        .cpm-balance__item {
          padding: 0.875rem 1rem;
          border-right: 1px solid var(--surface-3);
        }
        .cpm-balance__item:last-child { border-right: none; }
        .cpm-balance__label { font-size: 0.6875rem; font-weight: 600; color: var(--text-3); margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.04em; }
        .cpm-balance__value { font-family: var(--font-display); font-size: 1rem; font-weight: 800; color: var(--text-1); }
        .cpm-balance__value--primary { color: var(--primary); }

        /* Body */
        .cpm-body {
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.125rem;
        }

        /* Section label */
        .cpm-section-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-3);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 0.625rem;
        }

        /* Installment grid */
        .cpm-inst-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 0.5rem;
        }
        @media (min-width: 400px) {
          .cpm-inst-grid { grid-template-columns: repeat(8, 1fr); }
        }
        .cpm-inst-btn {
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
        .cpm-inst-btn--available {
          background: var(--surface-2);
          border-color: var(--surface-3);
          color: var(--text-2);
        }
        .cpm-inst-btn--available:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-tint); }
        .cpm-inst-btn--selected {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
          box-shadow: 0 3px 8px rgba(0,97,142,0.3);
        }
        .cpm-inst-btn--paid {
          background: var(--success-bg);
          border-color: var(--success-border);
          color: var(--success);
          cursor: not-allowed;
          opacity: 0.7;
        }
        .cpm-inst-btn--pending {
          background: var(--warning-bg);
          border-color: var(--warning-border);
          color: var(--warning);
          cursor: not-allowed;
          opacity: 0.7;
        }

        /* Legend */
        .cpm-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }
        .cpm-legend__item {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          color: var(--text-2);
        }
        .cpm-legend__dot {
          width: 0.625rem;
          height: 0.625rem;
          border-radius: 0.25rem;
          flex-shrink: 0;
        }

        /* Selection summary */
        .cpm-selection {
          background: var(--primary-tint);
          border: 1px solid rgba(0,97,142,0.15);
          border-radius: var(--r-md);
          padding: 0.75rem 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .cpm-selection__label { font-size: 0.8125rem; font-weight: 600; color: var(--primary); }
        .cpm-selection__amount { font-family: var(--font-display); font-size: 1.0625rem; font-weight: 800; color: var(--primary); }

        /* Input */
        .cpm-field { display: flex; flex-direction: column; gap: 0.375rem; }
        .cpm-label { font-size: 0.8125rem; font-weight: 600; color: var(--text-2); }
        .cpm-label__hint { font-weight: 400; color: var(--text-3); font-size: 0.75rem; }
        .cpm-input-wrap { position: relative; }
        .cpm-input-prefix {
          position: absolute;
          left: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          font-weight: 600;
          color: var(--text-3);
          pointer-events: none;
        }
        .cpm-input {
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
        .cpm-input--prefix { padding-left: 1.75rem; }
        .cpm-input::placeholder { color: var(--text-3); }
        .cpm-input:focus { border-color: var(--primary); background: white; box-shadow: 0 0 0 3px var(--primary-focus); }
        .cpm-input-hint { font-size: 0.75rem; color: var(--primary); margin-top: 0.25rem; }
        .cpm-textarea { resize: vertical; min-height: 4.5rem; }

        /* Alerts */
        .cpm-alert {
          border-radius: var(--r-md);
          padding: 0.875rem 1rem;
          font-size: 0.8125rem;
          line-height: 1.4;
        }
        .cpm-alert--error   { background: var(--danger-bg);  border: 1px solid var(--danger-border);  color: var(--danger); }
        .cpm-alert--success { background: var(--success-bg); border: 1px solid var(--success-border); color: var(--success); }
        .cpm-alert--warning { background: var(--warning-bg); border: 1px solid var(--warning-border); color: var(--warning); }
        .cpm-alert__title { font-weight: 700; margin-bottom: 0.25rem; }

        /* Footer */
        .cpm-footer {
          display: flex;
          gap: 0.625rem;
          padding: 1rem 1.5rem 1.375rem;
          border-top: 1px solid var(--surface-3);
        }
        .cpm-btn {
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
        .cpm-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
        .cpm-btn--cancel { background: var(--surface-2); color: var(--text-2); flex-shrink: 0; }
        .cpm-btn--cancel:hover:not(:disabled) { background: var(--surface-3); }
        .cpm-btn--submit {
          flex: 1;
          background: linear-gradient(135deg, var(--success) 0%, #0fa86e 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(15,123,85,0.3);
        }
        .cpm-btn--submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(15,123,85,0.38);
        }
        .cpm-spinner {
          width: 1rem; height: 1rem;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: cpm-spin 0.7s linear infinite;
        }
        @keyframes cpm-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="cpm-overlay" onClick={onClose}>
        <div className="cpm-modal" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="cpm-header">
            <div>
              <div className="cpm-header__icon">
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
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                </svg>
              </div>
              <p className="cpm-header__title">Pago en efectivo</p>
              <p className="cpm-header__sub">
                {student.firstName} {student.lastName} · DNI {student.dni}
              </p>
            </div>
            <button className="cpm-close" onClick={onClose} aria-label="Cerrar">
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
          <div className="cpm-balance">
            <div className="cpm-balance__item">
              <p className="cpm-balance__label">Total</p>
              <p className="cpm-balance__value">
                ${student.totalAmount?.toLocaleString("es-AR")}
              </p>
            </div>
            <div className="cpm-balance__item">
              <p className="cpm-balance__label">Pagado</p>
              <p className="cpm-balance__value">
                ${student.paidAmount?.toLocaleString("es-AR")}
              </p>
            </div>
            <div className="cpm-balance__item">
              <p className="cpm-balance__label">Saldo</p>
              <p className="cpm-balance__value cpm-balance__value--primary">
                ${student.balance?.toLocaleString("es-AR")}
              </p>
            </div>
          </div>

          {/* Form body */}
          <form onSubmit={submitPayment}>
            <div className="cpm-body">
              {/* Installments */}
              <div>
                <p className="cpm-section-label">Cuotas a pagar</p>
                <div className="cpm-inst-grid">
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
                        onClick={() => toggleInstallment(num)}
                        disabled={state === "paid" || state === "pending"}
                        className={`cpm-inst-btn cpm-inst-btn--${state}`}
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
                <div className="cpm-legend">
                  {[
                    { color: "var(--success)", label: "Pagada" },
                    { color: "var(--warning)", label: "En revisión" },
                    { color: "var(--primary)", label: "Seleccionada" },
                    { color: "var(--surface-3)", label: "Disponible" },
                  ].map(({ color, label }) => (
                    <div key={label} className="cpm-legend__item">
                      <div
                        className="cpm-legend__dot"
                        style={{ background: color }}
                      />
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Selection summary */}
              {selectedInstallments.length > 0 && (
                <div className="cpm-selection">
                  <span className="cpm-selection__label">
                    Cuota{selectedInstallments.length > 1 ? "s" : ""}{" "}
                    {selectedInstallments.join(", ")}
                  </span>
                  <span className="cpm-selection__amount">
                    $
                    {(
                      selectedInstallments.length * installmentAmount
                    ).toLocaleString("es-AR")}
                  </span>
                </div>
              )}

              {/* Amount */}
              <div className="cpm-field">
                <label className="cpm-label">Monto recibido</label>
                <div className="cpm-input-wrap">
                  <span className="cpm-input-prefix">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0"
                    className="cpm-input cpm-input--prefix"
                  />
                </div>
                {amount && parseFloat(amount) > 0 && (
                  <p className="cpm-input-hint">
                    Cubre aproximadamente{" "}
                    {calculateCoveredInstallments(parseFloat(amount))} cuota(s)
                  </p>
                )}
              </div>

              {/* Receipt */}
              <div className="cpm-field">
                <label className="cpm-label">
                  Número de recibo{" "}
                  <span className="cpm-label__hint">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder="REC-001"
                  className="cpm-input"
                />
              </div>

              {/* Notes */}
              <div className="cpm-field">
                <label className="cpm-label">
                  Notas <span className="cpm-label__hint">(opcional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Información adicional..."
                  rows={2}
                  className="cpm-input cpm-textarea"
                />
              </div>

              {/* Mismatch warning */}
              {mismatchWarning && (
                <div className="cpm-alert cpm-alert--warning">
                  <p className="cpm-alert__title">Diferencia de monto</p>
                  <p>
                    {selectedInstallments.length} cuota(s) equivalen a $
                    {mismatchWarning.expected.toLocaleString("es-AR")}, pero
                    ingresaste ${mismatchWarning.actual.toLocaleString("es-AR")}
                    .
                  </p>
                  {mismatchWarning.actual > mismatchWarning.expected && (
                    <p style={{ marginTop: "0.25rem", fontWeight: 600 }}>
                      Con ese monto podrías cubrir{" "}
                      {calculateCoveredInstallments(mismatchWarning.actual)}{" "}
                      cuota(s).
                    </p>
                  )}
                </div>
              )}

              {error && (
                <div className="cpm-alert cpm-alert--error">{error}</div>
              )}
              {success && (
                <div className="cpm-alert cpm-alert--success">{success}</div>
              )}
            </div>

            {/* Footer */}
            <div className="cpm-footer">
              <button
                type="button"
                className="cpm-btn cpm-btn--cancel"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="cpm-btn cpm-btn--submit"
                disabled={
                  loading || selectedInstallments.length === 0 || !amount
                }
              >
                {loading ? (
                  <>
                    <div className="cpm-spinner" /> Registrando...
                  </>
                ) : (
                  "Registrar pago"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
