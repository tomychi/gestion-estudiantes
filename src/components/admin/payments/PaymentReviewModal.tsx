"use client";

import { PaymentWithUser } from "@/types";
import Image from "next/image";
import { useState } from "react";

interface Props {
  payments: PaymentWithUser[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  adminId: string;
}

function formatARS(n: number) {
  return n.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

export default function PaymentReviewModal({
  payments,
  isOpen,
  onClose,
  onComplete,
  adminId,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const payment = payments[0];
  const totalAmount = payments.reduce((s, p) => s + p.amount, 0);
  const installmentNumbers = payments
    .map((p) => p.installmentNumber)
    .filter((n) => n !== null)
    .sort((a, b) => a! - b!);

  const isPending = payment.status === "PENDING";

  const handleApprove = async () => {
    if (!confirm(`¿Aprobar este pago de ${payments.length} cuota(s)?`)) return;
    setIsSubmitting(true);
    setError("");
    try {
      const results = await Promise.all(
        payments.map((p) =>
          fetch(`/api/admin/payments/${p.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "APPROVE", reviewedBy: adminId }),
          }).then((r) => r.json()),
        ),
      );
      const failed = results.filter((r) => !r.success);
      if (failed.length) {
        setError(
          failed[0].error || `Error al aprobar ${failed.length} cuota(s)`,
        );
        setIsSubmitting(false);
        return;
      }
      onComplete();
    } catch (err) {
      setError(`Error de conexión. ${err instanceof Error ? err.message : ""}`);
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError("Ingresá una razón para el rechazo");
      return;
    }
    if (!confirm(`¿Rechazar este pago de ${payments.length} cuota(s)?`)) return;
    setIsSubmitting(true);
    setError("");
    try {
      const results = await Promise.all(
        payments.map((p) =>
          fetch(`/api/admin/payments/${p.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "REJECT",
              rejectionReason: rejectionReason.trim(),
              reviewedBy: adminId,
            }),
          }).then((r) => r.json()),
        ),
      );
      const failed = results.filter((r) => !r.success);
      if (failed.length) {
        setError(
          failed[0].error || `Error al rechazar ${failed.length} cuota(s)`,
        );
        setIsSubmitting(false);
        return;
      }
      onComplete();
    } catch (err) {
      setError(`Error de conexión. ${err instanceof Error ? err.message : ""}`);
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const statusKey = payment.status.toLowerCase() as
    | "approved"
    | "pending"
    | "rejected";
  const newBalance = payment.user.balance - totalAmount;

  return (
    <>
      <style>{`
        .prm-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.55);
          z-index: 50;
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
          backdrop-filter: blur(2px);
        }
        .prm-modal {
          --font-display: 'Plus Jakarta Sans', sans-serif;
          --font-body:    'DM Sans', sans-serif;
          --surface:      #ffffff;
          --surface-2:    #f4f4f5;
          --surface-3:    #e4e4e7;
          --primary:      #00618e;
          --primary-mid:  #0089c6;
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
          --r-sm:  0.5rem;
          --r-md:  0.875rem;
          --r-lg:  1.25rem;
          --r-xl:  1.75rem;
          --r-full: 9999px;

          background: var(--surface);
          border-radius: var(--r-xl);
          box-shadow: 0 24px 60px rgba(0,0,0,0.2);
          width: 100%;
          max-width: 760px;
          max-height: 90svh;
          overflow-y: auto;
          font-family: var(--font-body);
          -webkit-font-smoothing: antialiased;
        }
        .prm-modal *, .prm-modal *::before, .prm-modal *::after {
          box-sizing: border-box; margin: 0; padding: 0;
        }

        /* Sticky header */
        .prm-header {
          position: sticky; top: 0; z-index: 10;
          background: var(--surface);
          border-bottom: 1px solid var(--surface-3);
          padding: 1.25rem 1.5rem;
          display: flex; align-items: center; justify-content: space-between; gap: 1rem;
        }
        .prm-header__left { display: flex; align-items: center; gap: 0.75rem; }
        .prm-header__icon {
          width: 2.5rem; height: 2.5rem; border-radius: var(--r-md);
          background: var(--primary-tint);
          display: flex; align-items: center; justify-content: center;
          color: var(--primary); flex-shrink: 0;
        }
        .prm-header__title {
          font-family: var(--font-display);
          font-size: 1.125rem; font-weight: 800;
          color: var(--text-1); letter-spacing: -0.01em;
        }
        .prm-header__sub { font-size: 0.8125rem; color: var(--text-3); margin-top: 0.15rem; }
        .prm-close {
          width: 2rem; height: 2rem; border-radius: var(--r-md);
          background: var(--surface-2); border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--text-3); flex-shrink: 0;
          transition: background 0.12s, color 0.12s;
        }
        .prm-close:hover { background: var(--surface-3); color: var(--text-1); }
        .prm-close:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Body */
        .prm-body {
          padding: 1.25rem 1.5rem;
          display: flex; flex-direction: column; gap: 1.25rem;
        }

        /* Section label */
        .prm-section-label {
          font-size: 0.6875rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.07em;
          color: var(--text-3); margin-bottom: 0.75rem;
        }

        /* Info card */
        .prm-info-card {
          background: var(--surface-2);
          border-radius: var(--r-lg);
          padding: 1rem 1.125rem;
        }
        .prm-data-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 0.875rem;
        }
        @media (min-width: 500px) {
          .prm-data-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .prm-data-label { font-size: 0.6875rem; color: var(--text-3); font-weight: 500; margin-bottom: 0.2rem; }
        .prm-data-value { font-size: 0.875rem; font-weight: 600; color: var(--text-1); }

        /* Two-col layout */
        .prm-2col {
          display: grid; grid-template-columns: 1fr; gap: 1rem;
        }
        @media (min-width: 600px) {
          .prm-2col { grid-template-columns: 1fr 1fr; }
        }

        /* Payment details */
        .prm-detail-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .prm-detail-row {
          display: flex; align-items: center; justify-content: space-between;
          font-size: 0.875rem;
        }
        .prm-detail-row__label { color: var(--text-2); }
        .prm-detail-row__value { font-weight: 600; color: var(--text-1); }
        .prm-detail-row__value--mono { font-family: monospace; font-size: 0.8125rem; }
        .prm-detail-row--total .prm-detail-row__value {
          font-family: var(--font-display); font-size: 1.125rem; font-weight: 800; color: var(--text-1);
        }

        /* Status inline */
        .prm-status {
          font-size: 0.8125rem; font-weight: 700;
        }
        .prm-status--approved { color: var(--success); }
        .prm-status--pending  { color: var(--warning); }
        .prm-status--rejected { color: var(--danger); }

        /* Balance block */
        .prm-balance {
          background: var(--primary-tint);
          border-radius: var(--r-lg);
          padding: 1rem 1.125rem;
        }
        .prm-balance__row {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 0.875rem; margin-bottom: 0.5rem;
        }
        .prm-balance__row:last-child { margin-bottom: 0; }
        .prm-balance__label { color: var(--primary); font-weight: 500; }
        .prm-balance__value { font-family: var(--font-display); font-weight: 700; color: var(--primary); }
        .prm-balance__row--total {
          padding-top: 0.5rem; margin-top: 0.375rem;
          border-top: 1px solid rgba(0,97,142,0.15);
        }
        .prm-balance__row--total .prm-balance__value { font-size: 1.125rem; }

        /* Post-approve preview */
        .prm-approve-preview {
          background: var(--success-bg);
          border: 1px solid var(--success-border);
          border-radius: var(--r-md);
          padding: 0.75rem 1rem;
          font-size: 0.8125rem; color: var(--success);
          margin-top: 0.625rem;
        }
        .prm-approve-preview strong { font-weight: 700; }

        /* Notes */
        .prm-notes {
          background: var(--surface-2);
          border-radius: var(--r-md);
          padding: 0.75rem 0.875rem;
          font-size: 0.875rem; color: var(--text-2); line-height: 1.5;
        }
        .prm-rejection-note {
          background: var(--danger-bg);
          border: 1px solid var(--danger-border);
          border-radius: var(--r-md);
          padding: 0.75rem 0.875rem;
          font-size: 0.875rem; color: var(--danger); line-height: 1.5;
        }

        /* Receipt */
        .prm-receipt {
          border-radius: var(--r-lg);
          overflow: hidden;
          border: 1px solid var(--surface-3);
          background: var(--surface-2);
        }
        .prm-receipt__open {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.625rem 1.125rem;
          border-radius: var(--r-full);
          font-family: var(--font-display); font-size: 0.875rem; font-weight: 700;
          background: var(--primary-tint); color: var(--primary);
          text-decoration: none; margin: 0.875rem auto 0; display: flex; justify-content: center;
          transition: background 0.12s;
        }
        .prm-receipt__open:hover { background: var(--primary-tint-s); }

        /* Reject form */
        .prm-reject-form {
          background: var(--danger-bg);
          border: 1px solid var(--danger-border);
          border-radius: var(--r-lg);
          padding: 1rem;
        }
        .prm-reject-form__label {
          font-size: 0.8125rem; font-weight: 700; color: var(--danger);
          margin-bottom: 0.625rem; display: block;
        }
        .prm-reject-textarea {
          width: 100%; padding: 0.6875rem 0.875rem;
          border-radius: var(--r-md);
          border: 1.5px solid var(--danger-border);
          background: white;
          font-family: var(--font-body); font-size: 0.9375rem; color: var(--text-1);
          outline: none; resize: none; min-height: 5rem;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .prm-reject-textarea:focus {
          border-color: var(--danger);
          box-shadow: 0 0 0 3px rgba(185,28,28,0.12);
        }
        .prm-reject-textarea:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Alert */
        .prm-alert {
          border-radius: var(--r-md); padding: 0.75rem 0.875rem;
          font-size: 0.8125rem; background: var(--danger-bg);
          border: 1px solid var(--danger-border); color: var(--danger);
        }

        /* Footer */
        .prm-footer {
          display: flex; gap: 0.625rem;
          padding: 1rem 1.5rem 1.375rem;
          border-top: 1px solid var(--surface-3);
          flex-wrap: wrap;
        }
        .prm-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
          padding: 0.75rem 1.25rem; border-radius: var(--r-full);
          font-family: var(--font-display); font-size: 0.9375rem; font-weight: 700;
          border: none; cursor: pointer;
          transition: transform 0.12s, box-shadow 0.12s, background 0.12s, opacity 0.12s;
        }
        .prm-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
        .prm-btn--cancel { background: var(--surface-2); color: var(--text-2); flex-shrink: 0; }
        .prm-btn--cancel:hover:not(:disabled) { background: var(--surface-3); }
        .prm-btn--reject {
          flex: 1; background: var(--danger-bg); color: var(--danger);
          border: 1.5px solid var(--danger-border);
        }
        .prm-btn--reject:hover:not(:disabled) { background: rgba(185,28,28,0.14); }
        .prm-btn--approve {
          flex: 1; background: linear-gradient(135deg, var(--success) 0%, #0fa86e 100%);
          color: white; box-shadow: 0 4px 12px rgba(15,123,85,0.3);
        }
        .prm-btn--approve:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(15,123,85,0.38); }
        .prm-btn--confirm-reject {
          flex: 1; background: var(--danger); color: white;
          box-shadow: 0 4px 12px rgba(185,28,28,0.25);
        }
        .prm-btn--confirm-reject:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(185,28,28,0.35); }
        .prm-spinner {
          width: 1rem; height: 1rem;
          border: 2px solid rgba(255,255,255,0.3); border-top-color: white;
          border-radius: 50%; animation: prm-spin 0.7s linear infinite;
        }
        @keyframes prm-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="prm-overlay" onClick={onClose}>
        <div className="prm-modal" onClick={(e) => e.stopPropagation()}>
          {/* Sticky header */}
          <div className="prm-header">
            <div className="prm-header__left">
              <div className="prm-header__icon">
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
                  <rect x="1" y="4" width="22" height="16" rx="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
              <div>
                <p className="prm-header__title">
                  {isPending ? "Revisar pago" : "Detalles del pago"}
                </p>
                <p className="prm-header__sub">
                  {payment.user.firstName} {payment.user.lastName} · DNI{" "}
                  {payment.user.dni}
                </p>
              </div>
            </div>
            <button
              className="prm-close"
              onClick={onClose}
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

          <div className="prm-body">
            {/* Error */}
            {error && <div className="prm-alert">{error}</div>}

            {/* Student info */}
            <div>
              <p className="prm-section-label">Información del estudiante</p>
              <div className="prm-info-card">
                <div className="prm-data-grid">
                  {[
                    {
                      label: "Nombre",
                      value: `${payment.user.firstName} ${payment.user.lastName}`,
                    },
                    { label: "DNI", value: payment.user.dni },
                    {
                      label: "Colegio",
                      value: payment.user.schoolDivision?.school.name || "N/A",
                    },
                    {
                      label: "División",
                      value: payment.user.schoolDivision
                        ? `${payment.user.schoolDivision.division} · ${payment.user.schoolDivision.year}`
                        : "N/A",
                    },
                    { label: "Email", value: payment.user.email || "N/A" },
                    { label: "Producto", value: payment.user.product.name },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="prm-data-label">{label}</p>
                      <p className="prm-data-value">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Payment + balance side-by-side */}
            <div className="prm-2col">
              {/* Payment details */}
              <div>
                <p className="prm-section-label">Detalles del pago</p>
                <div className="prm-detail-list">
                  <div className="prm-detail-row prm-detail-row--total">
                    <span className="prm-detail-row__label">Monto total</span>
                    <span className="prm-detail-row__value">
                      {formatARS(totalAmount)}
                    </span>
                  </div>
                  <div className="prm-detail-row">
                    <span className="prm-detail-row__label">Cuota(s)</span>
                    <span className="prm-detail-row__value">
                      {installmentNumbers.join(", ")}
                    </span>
                  </div>
                  {payments.length > 1 && (
                    <div className="prm-detail-row">
                      <span className="prm-detail-row__label">Cantidad</span>
                      <span className="prm-detail-row__value">
                        {payments.length} cuotas
                      </span>
                    </div>
                  )}
                  <div className="prm-detail-row">
                    <span className="prm-detail-row__label">Fecha envío</span>
                    <span className="prm-detail-row__value">
                      {new Date(payment.submittedAt).toLocaleDateString(
                        "es-AR",
                        { day: "numeric", month: "short", year: "numeric" },
                      )}
                    </span>
                  </div>
                  <div className="prm-detail-row">
                    <span className="prm-detail-row__label">Referencia</span>
                    <span className="prm-detail-row__value prm-detail-row__value--mono">
                      {payment.transactionRef || "—"}
                    </span>
                  </div>
                  <div className="prm-detail-row">
                    <span className="prm-detail-row__label">Estado</span>
                    <span className={`prm-status prm-status--${statusKey}`}>
                      {
                        {
                          approved: "Aprobado",
                          pending: "Pendiente",
                          rejected: "Rechazado",
                        }[statusKey]
                      }
                    </span>
                  </div>
                </div>

                {payment.notes && (
                  <div style={{ marginTop: "0.875rem" }}>
                    <p className="prm-section-label">Notas del estudiante</p>
                    <p className="prm-notes">{payment.notes}</p>
                  </div>
                )}
                {payment.rejectionReason && (
                  <div style={{ marginTop: "0.875rem" }}>
                    <p
                      className="prm-section-label"
                      style={{ color: "var(--danger)" }}
                    >
                      Razón de rechazo
                    </p>
                    <p className="prm-rejection-note">
                      {payment.rejectionReason}
                    </p>
                  </div>
                )}
              </div>

              {/* Balance */}
              <div>
                <p className="prm-section-label">Estado de cuenta</p>
                <div className="prm-balance">
                  <div className="prm-balance__row">
                    <span className="prm-balance__label">Total</span>
                    <span className="prm-balance__value">
                      {formatARS(payment.user.totalAmount)}
                    </span>
                  </div>
                  <div className="prm-balance__row">
                    <span className="prm-balance__label">Pagado</span>
                    <span className="prm-balance__value">
                      {formatARS(payment.user.paidAmount)}
                    </span>
                  </div>
                  <div className="prm-balance__row prm-balance__row--total">
                    <span className="prm-balance__label">Saldo actual</span>
                    <span className="prm-balance__value">
                      {formatARS(payment.user.balance)}
                    </span>
                  </div>
                  <div
                    className="prm-balance__row"
                    style={{ marginTop: "0.375rem" }}
                  >
                    <span className="prm-balance__label">Cuotas totales</span>
                    <span className="prm-balance__value">
                      {payment.user.installments}
                    </span>
                  </div>
                </div>
                {isPending && (
                  <div className="prm-approve-preview">
                    <strong>Saldo si se aprueba:</strong>{" "}
                    {formatARS(newBalance)}
                  </div>
                )}
              </div>
            </div>

            {/* Receipt */}
            {payment.receiptUrl && (
              <div>
                <p className="prm-section-label">Comprobante de pago</p>
                <div className="prm-receipt">
                  {/\.(jpg|jpeg|png|webp)$/i.test(payment.receiptUrl) ? (
                    <Image
                      src={payment.receiptUrl}
                      alt="Comprobante"
                      width={800}
                      height={500}
                      className="w-full h-auto max-h-[500px] object-contain"
                    />
                  ) : (
                    <>
                      <iframe
                        src={payment.receiptUrl}
                        className="w-full"
                        style={{
                          height: "480px",
                          border: "none",
                          display: "block",
                        }}
                        title="Preview Comprobante PDF"
                      />
                      <a
                        href={payment.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="prm-receipt__open"
                      >
                        <svg
                          width="14"
                          height="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          viewBox="0 0 24 24"
                        >
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                        </svg>
                        Abrir en nueva pestaña
                      </a>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Reject form */}
            {showRejectForm && isPending && (
              <div className="prm-reject-form">
                <label className="prm-reject-form__label">
                  Razón del rechazo *
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Explicá por qué rechazás este pago..."
                  className="prm-reject-textarea"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="prm-footer">
            <button
              type="button"
              className="prm-btn prm-btn--cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {isPending ? "Cancelar" : "Cerrar"}
            </button>

            {isPending && !showRejectForm && (
              <>
                <button
                  type="button"
                  className="prm-btn prm-btn--reject"
                  onClick={() => setShowRejectForm(true)}
                  disabled={isSubmitting}
                >
                  Rechazar
                </button>
                <button
                  type="button"
                  className="prm-btn prm-btn--approve"
                  onClick={handleApprove}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="prm-spinner" /> Aprobando...
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
                      </svg>{" "}
                      Aprobar pago
                    </>
                  )}
                </button>
              </>
            )}

            {showRejectForm && (
              <button
                type="button"
                className="prm-btn prm-btn--confirm-reject"
                onClick={handleReject}
                disabled={isSubmitting || !rejectionReason.trim()}
              >
                {isSubmitting ? (
                  <>
                    <div className="prm-spinner" /> Rechazando...
                  </>
                ) : (
                  "Confirmar rechazo"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
