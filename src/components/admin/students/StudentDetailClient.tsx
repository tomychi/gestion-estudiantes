"use client";

import { useState } from "react";
import EditStudentModal from "./EditStudentModal";
import CashPaymentModalSingle from "./CashPaymentModalSingle";
import TransferPaymentModalSingle from "./TransferPaymentModalSingle";
import type {
  SerializedUserWithRelations,
  SerializedPayment,
  InstallmentStatus,
  PaymentStats,
} from "@/types";

interface Props {
  student: SerializedUserWithRelations;
  payments: SerializedPayment[];
  installmentStatus: InstallmentStatus[];
  stats: PaymentStats;
}

function formatARS(n: number) {
  return n.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

export default function StudentDetailClient({
  student,
  payments,
  installmentStatus,
  stats,
}: Props) {
  const [selectedTab, setSelectedTab] = useState<"info" | "payments">("info");
  const [approvingPayments, setApprovingPayments] = useState<Set<string>>(
    new Set(),
  );
  const [rejectingPayments, setRejectingPayments] = useState<Set<string>>(
    new Set(),
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCashPaymentOpen, setIsCashPaymentOpen] = useState(false);
  const [isTransferPaymentOpen, setIsTransferPaymentOpen] = useState(false);

  const progressPct = Math.min(
    (student.paidAmount / student.totalAmount) * 100,
    100,
  );
  const paidInstallments = installmentStatus.filter((i) => i.paid).length;

  const handleQuickApprove = async (paymentId: string) => {
    if (!confirm("¿Aprobar este pago?")) return;
    setApprovingPayments((prev) => new Set(prev).add(paymentId));
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPROVE" }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Error al aprobar");
        return;
      }
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setApprovingPayments((prev) => {
        const s = new Set(prev);
        s.delete(paymentId);
        return s;
      });
    }
  };

  const handleQuickReject = async (paymentId: string) => {
    const reason = prompt("Razón del rechazo:");
    if (!reason?.trim()) return;
    setRejectingPayments((prev) => new Set(prev).add(paymentId));
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REJECT",
          rejectionReason: reason.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Error al rechazar");
        return;
      }
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setRejectingPayments((prev) => {
        const s = new Set(prev);
        s.delete(paymentId);
        return s;
      });
    }
  };

  return (
    <>
      <style>{`
        /* ── Tokens ──────────────────────────────────────── */
        .sd-root {
          --font-display: 'Plus Jakarta Sans', sans-serif;
          --font-body:    'DM Sans', sans-serif;
          --surface:      #ffffff;
          --surface-2:    #f4f4f5;
          --surface-3:    #e4e4e7;
          --primary:      #00618e;
          --primary-mid:  #0089c6;
          --primary-tint: rgba(0,97,142,0.08);
          --primary-tint-s: rgba(0,97,142,0.14);
          --text-1:       #18181b;
          --text-2:       #52525b;
          --text-3:       #a1a1aa;
          --success:      #0f7b55;
          --success-bg:   rgba(15,123,85,0.08);
          --success-border: rgba(15,123,85,0.18);
          --warning:      #a16207;
          --warning-bg:   rgba(161,98,7,0.08);
          --warning-border: rgba(161,98,7,0.18);
          --danger:       #b91c1c;
          --danger-bg:    rgba(185,28,28,0.08);
          --danger-border: rgba(185,28,28,0.18);
          --r-sm:  0.5rem;
          --r-md:  0.875rem;
          --r-lg:  1.25rem;
          --r-xl:  1.75rem;
          --r-full: 9999px;
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);

          font-family: var(--font-body);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          -webkit-font-smoothing: antialiased;
        }
        .sd-root *, .sd-root *::before, .sd-root *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* ── Page header ─────────────────────────────────── */
        .sd-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .sd-name {
          font-family: var(--font-display);
          font-size: clamp(1.25rem, 3vw, 1.75rem);
          font-weight: 800;
          color: var(--text-1);
          letter-spacing: -0.02em;
        }
        .sd-meta {
          font-size: 0.875rem;
          color: var(--text-3);
          margin-top: 0.2rem;
        }
        .sd-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .sd-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5625rem 1rem;
          border-radius: var(--r-full);
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: transform 0.12s, box-shadow 0.12s, background 0.12s;
          white-space: nowrap;
        }
        .sd-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .sd-btn--cash {
          background: var(--success-bg);
          color: var(--success);
          border: 1.5px solid var(--success-border);
        }
        .sd-btn--cash:hover { background: rgba(15,123,85,0.14); }
        .sd-btn--transfer {
          background: var(--primary-tint);
          color: var(--primary);
          border: 1.5px solid rgba(0,97,142,0.2);
        }
        .sd-btn--transfer:hover { background: var(--primary-tint-s); }
        .sd-btn--edit {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-mid) 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(0,97,142,0.25);
        }
        .sd-btn--edit:hover { box-shadow: 0 6px 16px rgba(0,97,142,0.35); }

        /* ── Stat cards ──────────────────────────────────── */
        .sd-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }
        @media (min-width: 768px) {
          .sd-stats { grid-template-columns: repeat(4, 1fr); }
        }
        .sd-stat {
          background: var(--surface);
          border-radius: var(--r-lg);
          box-shadow: var(--shadow-sm);
          padding: 1rem 1.125rem;
        }
        .sd-stat__label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-3);
          margin-bottom: 0.5rem;
        }
        .sd-stat__value {
          font-family: var(--font-display);
          font-size: clamp(1.25rem, 3vw, 1.625rem);
          font-weight: 800;
          color: var(--text-1);
          letter-spacing: -0.02em;
          line-height: 1;
        }
        .sd-stat__sub {
          font-size: 0.6875rem;
          color: var(--text-3);
          margin-top: 0.25rem;
        }
        .sd-stat__progress {
          margin-top: 0.625rem;
          height: 4px;
          background: var(--surface-3);
          border-radius: var(--r-full);
          overflow: hidden;
        }
        .sd-stat__fill {
          height: 100%;
          border-radius: var(--r-full);
          background: linear-gradient(90deg, var(--primary) 0%, var(--primary-mid) 100%);
          transition: width 0.8s cubic-bezier(0.34,1.2,0.64,1);
        }

        /* ── Tabs ────────────────────────────────────────── */
        .sd-tabs {
          display: flex;
          gap: 0;
          border-bottom: 1px solid var(--surface-3);
        }
        .sd-tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.875rem 1.25rem 0.875rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-3);
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          margin-bottom: -1px;
          transition: color 0.12s, border-color 0.12s;
        }
        .sd-tab:hover { color: var(--text-1); }
        .sd-tab--active { color: var(--primary); border-bottom-color: var(--primary); }
        .sd-tab__badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 1.25rem;
          height: 1.25rem;
          padding: 0 0.3rem;
          border-radius: var(--r-full);
          font-size: 0.6875rem;
          font-weight: 800;
          background: var(--warning-bg);
          color: var(--warning);
        }

        /* ── Info tab layout ─────────────────────────────── */
        .sd-info-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        @media (min-width: 1024px) {
          .sd-info-grid { grid-template-columns: 1fr 340px; }
        }
        .sd-info-left { display: flex; flex-direction: column; gap: 1rem; }
        .sd-info-right { display: flex; flex-direction: column; gap: 1rem; }

        /* ── Info cards ──────────────────────────────────── */
        .sd-card {
          background: var(--surface);
          border-radius: var(--r-xl);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
        }
        .sd-card__header {
          padding: 1rem 1.25rem 0;
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--text-3);
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .sd-card__body { padding: 1rem 1.25rem 1.25rem; }
        .sd-data-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.875rem;
        }
        .sd-data-item__label {
          font-size: 0.75rem;
          color: var(--text-3);
          font-weight: 500;
          margin-bottom: 0.2rem;
        }
        .sd-data-item__value {
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--text-1);
        }

        /* ── Notes banner ────────────────────────────────── */
        .sd-notes {
          background: var(--warning-bg);
          border: 1px solid var(--warning-border);
          border-radius: var(--r-lg);
          padding: 0.875rem 1rem;
        }
        .sd-notes__title {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--warning);
          margin-bottom: 0.375rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .sd-notes__text { font-size: 0.875rem; color: #713f12; line-height: 1.5; }

        /* ── Installment list ────────────────────────────── */
        .sd-inst-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .sd-inst-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: var(--r-md);
          border: 1px solid transparent;
        }
        .sd-inst-item--paid    { background: var(--success-bg); border-color: var(--success-border); }
        .sd-inst-item--partial { background: var(--warning-bg); border-color: var(--warning-border); }
        .sd-inst-item--unpaid  { background: var(--surface-2); border-color: var(--surface-3); }
        .sd-inst-bullet {
          width: 2rem;
          height: 2rem;
          border-radius: var(--r-full);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 700;
          flex-shrink: 0;
        }
        .sd-inst-bullet--paid    { background: var(--success); color: white; }
        .sd-inst-bullet--partial { background: var(--warning); color: white; }
        .sd-inst-bullet--unpaid  { background: var(--surface-3); color: var(--text-3); }
        .sd-inst-info { flex: 1; min-width: 0; }
        .sd-inst-name { font-size: 0.875rem; font-weight: 600; }
        .sd-inst-name--paid    { color: var(--success); }
        .sd-inst-name--partial { color: var(--warning); }
        .sd-inst-name--unpaid  { color: var(--text-2); }
        .sd-inst-partial { font-size: 0.6875rem; color: var(--warning); margin-top: 0.1rem; }
        .sd-inst-date   { font-size: 0.6875rem; color: var(--success); margin-top: 0.1rem; }
        .sd-inst-amount { font-family: var(--font-display); font-size: 0.875rem; font-weight: 700; }
        .sd-inst-amount--paid    { color: var(--success); }
        .sd-inst-amount--partial { color: var(--warning); }
        .sd-inst-amount--unpaid  { color: var(--text-3); }

        /* ── Payments table ──────────────────────────────── */
        .sd-table-wrap {
          background: var(--surface);
          border-radius: var(--r-xl);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
        }
        .sd-table {
          width: 100%;
          border-collapse: collapse;
        }
        .sd-table thead {
          background: var(--surface-2);
          border-bottom: 1px solid var(--surface-3);
        }
        .sd-table th {
          padding: 0.75rem 1.25rem;
          text-align: left;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-3);
          white-space: nowrap;
        }
        .sd-table th:last-child { text-align: right; }
        .sd-table td {
          padding: 0.875rem 1.25rem;
          border-bottom: 1px solid var(--surface-2);
          font-size: 0.875rem;
          color: var(--text-1);
          vertical-align: middle;
        }
        .sd-table td:last-child { text-align: right; }
        .sd-table tbody tr:last-child td { border-bottom: none; }
        .sd-table tbody tr:hover { background: var(--surface-2); }

        /* ── Status badges ───────────────────────────────── */
        .sd-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.2rem 0.625rem;
          border-radius: var(--r-full);
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.02em;
        }
        .sd-badge--approved { background: var(--success-bg); color: var(--success); }
        .sd-badge--pending  { background: var(--warning-bg); color: var(--warning); }
        .sd-badge--rejected { background: var(--danger-bg);  color: var(--danger); }

        /* ── Table action buttons ────────────────────────── */
        .sd-act-btns { display: flex; align-items: center; justify-content: flex-end; gap: 0.375rem; }
        .sd-act-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.375rem 0.75rem;
          border-radius: var(--r-full);
          font-size: 0.75rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: background 0.12s, opacity 0.12s;
        }
        .sd-act-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .sd-act-btn--approve {
          background: var(--success-bg);
          color: var(--success);
          border: 1px solid var(--success-border);
        }
        .sd-act-btn--approve:hover:not(:disabled) { background: rgba(15,123,85,0.14); }
        .sd-act-btn--reject {
          background: var(--danger-bg);
          color: var(--danger);
          border: 1px solid var(--danger-border);
        }
        .sd-act-btn--reject:hover:not(:disabled) { background: rgba(185,28,28,0.14); }
        .sd-spinner {
          width: 0.75rem;
          height: 0.75rem;
          border: 1.5px solid currentColor;
          border-top-color: transparent;
          border-radius: 50%;
          animation: sd-spin 0.7s linear infinite;
          opacity: 0.6;
        }
        @keyframes sd-spin { to { transform: rotate(360deg); } }

        /* ── Empty state ─────────────────────────────────── */
        .sd-empty {
          padding: 3rem 1.5rem;
          text-align: center;
          color: var(--text-3);
        }
        .sd-empty svg { margin: 0 auto 0.875rem; }
        .sd-empty p { font-size: 0.9375rem; font-weight: 500; color: var(--text-2); }
      `}</style>

      <div className="sd-root">
        {/* ── Page header ── */}
        <div className="sd-page-header">
          <div>
            <h1 className="sd-name">
              {student.firstName} {student.lastName}
            </h1>
            <p className="sd-meta">
              DNI {student.dni} · {student.schoolDivision?.school.name} —{" "}
              {student.schoolDivision?.division}
            </p>
          </div>
          <div className="sd-actions">
            <button
              className="sd-btn sd-btn--cash"
              onClick={() => setIsCashPaymentOpen(true)}
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
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
              </svg>
              Efectivo
            </button>
            <button
              className="sd-btn sd-btn--transfer"
              onClick={() => setIsTransferPaymentOpen(true)}
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
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              Transferencia
            </button>
            <button
              className="sd-btn sd-btn--edit"
              onClick={() => setIsEditModalOpen(true)}
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
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Editar
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="sd-stats">
          <div className="sd-stat">
            <p className="sd-stat__label">Saldo pendiente</p>
            <p className="sd-stat__value">{formatARS(student.balance)}</p>
            <p className="sd-stat__sub">de {formatARS(student.totalAmount)}</p>
            <div className="sd-stat__progress">
              <div
                className="sd-stat__fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          <div className="sd-stat">
            <p className="sd-stat__label">Pagos aprobados</p>
            <p className="sd-stat__value">{stats.approved}</p>
            <p className="sd-stat__sub">
              {formatARS(student.paidAmount)} cobrado
            </p>
          </div>
          <div className="sd-stat">
            <p className="sd-stat__label">Pagos pendientes</p>
            <p className="sd-stat__value">{stats.pending}</p>
            <p className="sd-stat__sub">
              {stats.rejected} rechazado{stats.rejected !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="sd-stat">
            <p className="sd-stat__label">Cuotas pagadas</p>
            <p className="sd-stat__value">
              {paidInstallments} / {student.installments}
            </p>
            <p className="sd-stat__sub">
              {Math.round((paidInstallments / student.installments) * 100)}%
              completado
            </p>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="sd-tabs">
          <button
            className={`sd-tab${selectedTab === "info" ? " sd-tab--active" : ""}`}
            onClick={() => setSelectedTab("info")}
          >
            Información personal
          </button>
          <button
            className={`sd-tab${selectedTab === "payments" ? " sd-tab--active" : ""}`}
            onClick={() => setSelectedTab("payments")}
          >
            Historial de pagos
            {stats.pending > 0 && (
              <span className="sd-tab__badge">{stats.pending}</span>
            )}
          </button>
        </div>

        {/* ── Info tab ── */}
        {selectedTab === "info" && (
          <div className="sd-info-grid">
            <div className="sd-info-left">
              {/* Personal */}
              <div className="sd-card">
                <p className="sd-card__header">Datos personales</p>
                <div className="sd-card__body">
                  <div className="sd-data-grid">
                    {[
                      { label: "Nombre", value: student.firstName },
                      { label: "Apellido", value: student.lastName },
                      { label: "DNI", value: student.dni },
                      { label: "Talle", value: student.size || "—" },
                      { label: "Email", value: student.email || "—" },
                      { label: "Teléfono", value: student.phone || "—" },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="sd-data-item__label">{label}</p>
                        <p className="sd-data-item__value">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Academic */}
              {student.schoolDivision && (
                <div className="sd-card">
                  <p className="sd-card__header">Información académica</p>
                  <div className="sd-card__body">
                    <div style={{ marginBottom: "0.875rem" }}>
                      <p className="sd-data-item__label">Colegio</p>
                      <p className="sd-data-item__value">
                        {student.schoolDivision.school.name}
                      </p>
                      {student.schoolDivision.school.address && (
                        <p
                          style={{
                            fontSize: "0.8125rem",
                            color: "var(--text-3)",
                            marginTop: "0.15rem",
                          }}
                        >
                          {student.schoolDivision.school.address}
                        </p>
                      )}
                    </div>
                    <div className="sd-data-grid">
                      <div>
                        <p className="sd-data-item__label">División</p>
                        <p className="sd-data-item__value">
                          {student.schoolDivision.division}
                        </p>
                      </div>
                      <div>
                        <p className="sd-data-item__label">Año de egreso</p>
                        <p className="sd-data-item__value">
                          {student.schoolDivision.year}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {student.notes && (
                <div className="sd-notes">
                  <p className="sd-notes__title">Notas</p>
                  <p className="sd-notes__text">{student.notes}</p>
                </div>
              )}
            </div>

            <div className="sd-info-right">
              {/* Product */}
              <div className="sd-card">
                <p className="sd-card__header">Producto</p>
                <div className="sd-card__body">
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    <div>
                      <p className="sd-data-item__label">Nombre</p>
                      <p className="sd-data-item__value">
                        {student.product?.name || "—"}
                      </p>
                    </div>
                    {student.product?.description && (
                      <div>
                        <p className="sd-data-item__label">Descripción</p>
                        <p
                          style={{
                            fontSize: "0.875rem",
                            color: "var(--text-2)",
                          }}
                        >
                          {student.product.description}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="sd-data-item__label">Precio actual</p>
                      <p className="sd-data-item__value">
                        {formatARS(student.product?.currentPrice ?? 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Installments */}
              <div className="sd-card">
                <p className="sd-card__header">Estado de cuotas</p>
                <div className="sd-card__body">
                  <div className="sd-inst-list">
                    {installmentStatus.map((inst) => {
                      const state = inst.paid
                        ? "paid"
                        : inst.amountPaid > 0
                          ? "partial"
                          : "unpaid";
                      return (
                        <div
                          key={inst.number}
                          className={`sd-inst-item sd-inst-item--${state}`}
                        >
                          <div
                            className={`sd-inst-bullet sd-inst-bullet--${state}`}
                          >
                            {inst.paid ? (
                              <svg
                                width="12"
                                height="12"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                viewBox="0 0 24 24"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : (
                              inst.number
                            )}
                          </div>
                          <div className="sd-inst-info">
                            <p
                              className={`sd-inst-name sd-inst-name--${state}`}
                            >
                              Cuota {inst.number}
                            </p>
                            {state === "partial" && (
                              <p className="sd-inst-partial">
                                {formatARS(inst.amountPaid)} de{" "}
                                {formatARS(inst.amount)}
                              </p>
                            )}
                            {state === "paid" && inst.paymentDate && (
                              <p className="sd-inst-date">
                                {new Date(inst.paymentDate).toLocaleDateString(
                                  "es-AR",
                                )}
                              </p>
                            )}
                          </div>
                          <p
                            className={`sd-inst-amount sd-inst-amount--${state}`}
                          >
                            {formatARS(inst.amount)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Payments tab ── */}
        {selectedTab === "payments" &&
          (payments.length > 0 ? (
            <div className="sd-table-wrap">
              <table className="sd-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Cuota</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th>Notas</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const statusKey = payment.status.toLowerCase() as
                      | "approved"
                      | "pending"
                      | "rejected";
                    return (
                      <tr key={payment.id}>
                        <td style={{ color: "var(--text-2)" }}>
                          {new Date(payment.submittedAt).toLocaleDateString(
                            "es-AR",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          {payment.installmentNumber || "—"}
                        </td>
                        <td
                          style={{
                            fontFamily: "var(--font-display)",
                            fontWeight: 700,
                          }}
                        >
                          {formatARS(payment.amount)}
                        </td>
                        <td>
                          <span className={`sd-badge sd-badge--${statusKey}`}>
                            {
                              {
                                approved: "Aprobado",
                                pending: "Pendiente",
                                rejected: "Rechazado",
                              }[statusKey]
                            }
                          </span>
                        </td>
                        <td
                          style={{ color: "var(--text-3)", maxWidth: "180px" }}
                        >
                          <span
                            style={{
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {payment.notes || "—"}
                          </span>
                        </td>
                        <td>
                          {payment.status === "PENDING" ? (
                            <div className="sd-act-btns">
                              <button
                                className="sd-act-btn sd-act-btn--approve"
                                onClick={() => handleQuickApprove(payment.id)}
                                disabled={approvingPayments.has(payment.id)}
                              >
                                {approvingPayments.has(payment.id) ? (
                                  <>
                                    <div className="sd-spinner" /> Aprobando
                                  </>
                                ) : (
                                  <>
                                    <svg
                                      width="11"
                                      height="11"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      viewBox="0 0 24 24"
                                    >
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>{" "}
                                    Aprobar
                                  </>
                                )}
                              </button>
                              <button
                                className="sd-act-btn sd-act-btn--reject"
                                onClick={() => handleQuickReject(payment.id)}
                                disabled={rejectingPayments.has(payment.id)}
                              >
                                {rejectingPayments.has(payment.id) ? (
                                  <>
                                    <div className="sd-spinner" /> Rechazando
                                  </>
                                ) : (
                                  <>
                                    <svg
                                      width="11"
                                      height="11"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      viewBox="0 0 24 24"
                                    >
                                      <line x1="18" y1="6" x2="6" y2="18" />
                                      <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>{" "}
                                    Rechazar
                                  </>
                                )}
                              </button>
                            </div>
                          ) : (
                            <span
                              style={{
                                color: "var(--text-3)",
                                fontSize: "0.75rem",
                              }}
                            >
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="sd-table-wrap">
              <div className="sd-empty">
                <svg
                  width="40"
                  height="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p>No hay pagos registrados</p>
              </div>
            </div>
          ))}

        {/* Modals */}
        <EditStudentModal
          student={student}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
        <CashPaymentModalSingle
          student={student}
          isOpen={isCashPaymentOpen}
          onClose={() => setIsCashPaymentOpen(false)}
        />
        <TransferPaymentModalSingle
          student={student}
          isOpen={isTransferPaymentOpen}
          onClose={() => setIsTransferPaymentOpen(false)}
        />
      </div>
    </>
  );
}
