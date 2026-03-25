"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import InstallmentsTable from "./InstallmentsTable";
import { signOut } from "next-auth/react";
import {
  SerializedPayment,
  SerializedUserWithRelations,
  Session,
} from "@/types";

interface Props {
  session: Session;
  user: SerializedUserWithRelations;
  payments: SerializedPayment[];
}

function formatARS(amount: number) {
  return amount.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

function getInstallmentDueDate(userCreatedAt: string, num: number): Date {
  const d = new Date(userCreatedAt);
  d.setMonth(d.getMonth() + num);
  d.setDate(15);
  return d;
}

// ─── Payment Notification Toast ──────────────────────────────────────────────

function PaymentNotification({
  status,
  onClose,
}: {
  status: "success" | "failure" | "pending";
  onClose: () => void;
}) {
  const config = {
    success: {
      icon: "✓",
      title: "¡Pago exitoso!",
      message: "Tu pago fue aprobado. Las cuotas se actualizarán en breve.",
      cls: "toast--success",
    },
    failure: {
      icon: "✕",
      title: "Pago rechazado",
      message:
        "No pudimos procesar tu pago. Verificá tus datos e intentá de nuevo.",
      cls: "toast--failure",
    },
    pending: {
      icon: "◷",
      title: "Pago en proceso",
      message:
        "Tu pago está siendo revisado. Te notificaremos cuando se confirme.",
      cls: "toast--pending",
    },
  };
  const c = config[status];

  return (
    <div className={`toast ${c.cls}`} role="alert" aria-live="assertive">
      <span className="toast__icon">{c.icon}</span>
      <div className="toast__body">
        <p className="toast__title">{c.title}</p>
        <p className="toast__message">{c.message}</p>
      </div>
      <button onClick={onClose} className="toast__close" aria-label="Cerrar">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M12 4L4 12M4 4l8 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardClient({ session, user, payments }: Props) {
  const [selectedInstallments, setSelectedInstallments] = useState<number[]>(
    [],
  );
  const [isMPLoading, setIsMPLoading] = useState(false);
  const [paymentNotification, setPaymentNotification] = useState<
    "success" | "failure" | "pending" | null
  >(null);

  const installmentAmount = user.totalAmount / user.installments;
  const progressPct = Math.min((user.paidAmount / user.totalAmount) * 100, 100);
  const paidInstallmentsCount = Math.round(
    (user.paidAmount / user.totalAmount) * user.installments,
  );
  const isFullyPaid = user.balance === 0;

  const hasOverdue = Array.from(
    { length: user.installments },
    (_, i) => i + 1,
  ).some((num) => {
    const isPaid = payments.some(
      (p) => p.installmentNumber === num && p.status === "APPROVED",
    );
    const isPending = payments.some(
      (p) => p.installmentNumber === num && p.status === "PENDING",
    );
    return (
      !isPaid &&
      !isPending &&
      new Date() > getInstallmentDueDate(user.createdAt, num)
    );
  });

  const selectedTotal = selectedInstallments.length * installmentAmount;

  const handleMercadoPagoPayment = async () => {
    if (selectedInstallments.length === 0) return;
    setIsMPLoading(true);
    try {
      const response = await fetch("/api/mercadopago/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          installments: selectedInstallments,
          totalAmount: selectedTotal,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        alert(data.error || "Error al crear la preferencia de pago");
        setIsMPLoading(false);
        return;
      }
      window.location.href = data.init_point;
    } catch (err) {
      console.error("MercadoPago error:", err);
      alert("Error al procesar el pago. Intentá nuevamente.");
      setIsMPLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("payment") as
      | "success"
      | "failure"
      | "pending"
      | null;
    if (status) {
      setPaymentNotification(status);
      window.history.replaceState({}, "", "/dashboard");
      setTimeout(() => setPaymentNotification(null), 6000);
    }
  }, []);

  return (
    <>
      <style>{`
        /* ── Design Tokens ───────────────────────────────── */
        .alas-root {

          /* Surfaces */
          --bg:           #f4f4f5;
          --surface:      #ffffff;
          --surface-2:    #f4f4f5;
          --surface-3:    #ebebec;

          /* Brand */
          --primary:      #00618e;
          --primary-mid:  #0089c6;
          --primary-lite: #3eb7fe;
          --primary-tint: rgba(0, 97, 142, 0.07);

          /* Semantic */
          --success:      #0f7b55;
          --success-bg:   #ecfdf5;
          --success-border: rgba(15,123,85,0.2);
          --danger:       #b91c1c;
          --danger-bg:    #fff1f1;
          --danger-border: rgba(185,28,28,0.2);
          --warning:      #a16207;
          --warning-bg:   #fefce8;
          --warning-border: rgba(161,98,7,0.2);

          /* Text */
          --text-1:  #18181b;
          --text-2:  #52525b;
          --text-3:  #a1a1aa;

          /* Geometry */
          --r-sm:   0.625rem;
          --r-md:   1rem;
          --r-lg:   1.5rem;
          --r-xl:   2rem;
          --r-full: 9999px;

          /* Shadows */
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
          --shadow-md: 0 4px 16px rgba(0,0,0,0.07), 0 2px 6px rgba(0,0,0,0.04);
          --shadow-lg: 0 12px 40px rgba(0,0,0,0.09), 0 4px 12px rgba(0,0,0,0.05);

          font-family: var(--font-body);
          background: var(--bg);
          min-height: 100svh;
          color: var(--text-1);
          -webkit-font-smoothing: antialiased;
        }
        .alas-root *, .alas-root *::before, .alas-root *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* ── Header ──────────────────────────────────────── */
        .header {
          background: var(--surface);
          border-bottom: 1px solid var(--surface-3);
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .header__inner {
          max-width: 680px;
          margin: 0 auto;
          padding: 0.875rem 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }
        .header__brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 0;
        }
        .header__logo {
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 0.75rem;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-lite) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 10px rgba(0,97,142,0.3);
        }
        .header__text { min-width: 0; }
        .header__name {
          font-family: var(--font-display);
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--text-1);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .header__school {
          font-size: 0.75rem;
          color: var(--text-3);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 220px;
        }
        .btn-signout {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 0.875rem;
          border-radius: var(--r-full);
          font-family: var(--font-body);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--danger);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: background 0.15s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .btn-signout:hover { background: var(--danger-bg); }

        /* ── Main layout ─────────────────────────────────── */
        .main {
          max-width: 680px;
          margin: 0 auto;
          padding: 1.25rem 1.25rem 5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        /* ── Balance Card ────────────────────────────────── */
        .balance-card {
          border-radius: var(--r-xl);
          background: linear-gradient(135deg, #004e73 0%, var(--primary) 35%, var(--primary-mid) 70%, var(--primary-lite) 100%);
          padding: 1.625rem 1.5rem;
          color: white;
          position: relative;
          overflow: hidden;
          box-shadow: 0 12px 40px rgba(0,97,142,0.35), 0 4px 12px rgba(0,97,142,0.2);
        }
        .balance-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='300' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='260' cy='60' r='140' fill='rgba(255,255,255,0.05)'/%3E%3Ccircle cx='40' cy='260' r='100' fill='rgba(255,255,255,0.04)'/%3E%3C/svg%3E") no-repeat right top;
          pointer-events: none;
        }
        .balance-card__eyebrow {
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          opacity: 0.65;
          margin-bottom: 0.375rem;
        }
        .balance-card__amount {
          font-family: var(--font-display);
          font-size: clamp(2.5rem, 10vw, 3.75rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1;
          margin-bottom: 0.25rem;
        }
        .balance-card__of {
          font-size: 0.875rem;
          opacity: 0.6;
          margin-bottom: 1.375rem;
        }
        .balance-card__progress-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
          opacity: 0.8;
          margin-bottom: 0.5rem;
        }
        .balance-card__pct {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.875rem;
        }
        .balance-card__track {
          width: 100%;
          height: 6px;
          background: rgba(255,255,255,0.18);
          border-radius: var(--r-full);
          overflow: hidden;
          margin-bottom: 1.375rem;
        }
        .balance-card__fill {
          height: 100%;
          background: white;
          border-radius: var(--r-full);
          transition: width 1s cubic-bezier(0.34, 1.2, 0.64, 1);
          box-shadow: 0 0 8px rgba(255,255,255,0.6);
        }
        .balance-card__stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
          padding-top: 1.125rem;
          border-top: 1px solid rgba(255,255,255,0.15);
        }
        .balance-card__stat-label {
          font-size: 0.6875rem;
          opacity: 0.6;
          margin-bottom: 0.25rem;
          font-weight: 500;
        }
        .balance-card__stat-value {
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 700;
        }

        /* ── Alert overdue ───────────────────────────────── */
        .alert-overdue {
          border-radius: var(--r-lg);
          background: var(--danger-bg);
          border: 1px solid var(--danger-border);
          padding: 0.875rem 1rem;
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }
        .alert-overdue__icon-wrap {
          width: 1.75rem;
          height: 1.75rem;
          border-radius: var(--r-sm);
          background: var(--danger);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: white;
        }
        .alert-overdue__title {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--danger);
        }
        .alert-overdue__body {
          font-size: 0.8125rem;
          color: #7f1d1d;
          margin-top: 0.2rem;
          line-height: 1.4;
        }

        /* ── Cards ───────────────────────────────────────── */
        .card {
          background: var(--surface);
          border-radius: var(--r-xl);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
        }
        .card__header {
          padding: 1.25rem 1.25rem 0;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .card__title {
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-1);
        }
        .card__subtitle {
          font-size: 0.8125rem;
          color: var(--text-3);
          margin-top: 0.2rem;
        }
        .card__body { padding: 1.25rem; }

        /* ── Product row ─────────────────────────────────── */
        .product-row {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .product-row__icon-wrap {
          width: 3rem;
          height: 3rem;
          border-radius: var(--r-md);
          background: var(--primary-tint);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: var(--primary);
        }
        .product-row__name {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.9375rem;
          color: var(--text-1);
        }
        .product-row__desc {
          font-size: 0.8125rem;
          color: var(--text-2);
          margin-top: 0.2rem;
        }
        .product-row__size {
          display: inline-flex;
          align-items: center;
          margin-top: 0.375rem;
          padding: 0.2rem 0.625rem;
          background: var(--surface-2);
          border-radius: var(--r-full);
          font-size: 0.6875rem;
          font-weight: 700;
          color: var(--text-2);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        /* ── Pay CTA ─────────────────────────────────────── */
        .pay-cta {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 0.5rem;
        }
        .pay-cta__total {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.875rem 1rem;
          background: var(--primary-tint);
          border-radius: var(--r-md);
          margin-bottom: 0.25rem;
        }
        .pay-cta__total-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--primary);
        }
        .pay-cta__total-amount {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--primary);
          letter-spacing: -0.02em;
        }
        .btn-mp {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.625rem;
          width: 100%;
          padding: 1rem 1.5rem;
          border-radius: var(--r-full);
          font-family: var(--font-display);
          font-size: 0.9375rem;
          font-weight: 700;
          cursor: pointer;
          border: none;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .btn-mp--active {
          background: #ffffff;
          box-shadow: 0 6px 20px rgba(0,158,227,0.25);
          border: 2px solid rgba(0,158,227,0.3);
        }
        .btn-mp--active:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(0,158,227,0.35);
          border-color: #009EE3;
        }
        .btn-mp--active:active { transform: scale(0.99); }
        .btn-mp--disabled {
          background: var(--surface-3);
          color: var(--text-3);
          cursor: not-allowed;
        }
        .btn-mp__spinner {
          width: 1.125rem;
          height: 1.125rem;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .pay-cta__security {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          color: var(--text-3);
        }
        .pay-cta__security svg { color: var(--success); }

        /* ── Installments wrapper ────────────────────────── */
        .installments-wrapper {
          padding: 0 1.25rem 1.25rem;
        }

        /* ── Payment history ─────────────────────────────── */
        .payment-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 0 1.25rem 1.25rem;
        }
        .payment-item {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.875rem;
          border-radius: var(--r-lg);
          background: var(--surface-2);
          transition: background 0.12s;
        }
        .payment-item:hover { background: var(--surface-3); }
        .payment-item__avatar {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: var(--r-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 1rem;
        }
        .payment-item__avatar--approved { background: var(--success-bg); }
        .payment-item__avatar--rejected { background: var(--danger-bg); }
        .payment-item__avatar--pending  { background: var(--warning-bg); }
        .payment-item__info { flex: 1; min-width: 0; }
        .payment-item__title {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--text-1);
        }
        .payment-item__date {
          font-size: 0.75rem;
          color: var(--text-3);
          margin-top: 0.125rem;
        }
        .payment-item__rejection {
          font-size: 0.75rem;
          color: var(--danger);
          margin-top: 0.125rem;
        }
        .payment-item__right { text-align: right; flex-shrink: 0; }
        .payment-item__amount {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.9375rem;
          color: var(--text-1);
        }
        .badge {
          display: inline-flex;
          align-items: center;
          padding: 0.2rem 0.5rem;
          border-radius: var(--r-full);
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          margin-top: 0.25rem;
        }
        .badge--approved { background: var(--success-bg); color: var(--success); }
        .badge--rejected { background: var(--danger-bg);  color: var(--danger); }
        .badge--pending  { background: var(--warning-bg); color: var(--warning); }

        /* ── Empty state ─────────────────────────────────── */
        .empty-state {
          padding: 2.5rem 1.25rem;
          text-align: center;
        }
        .empty-state__icon {
          width: 3rem;
          height: 3rem;
          margin: 0 auto 0.875rem;
          color: var(--text-3);
        }
        .empty-state__title {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.9375rem;
          color: var(--text-2);
          margin-bottom: 0.25rem;
        }
        .empty-state__sub {
          font-size: 0.8125rem;
          color: var(--text-3);
        }

        /* ── Toast ───────────────────────────────────────── */
        .toast {
          position: fixed;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem 1.125rem;
          border-radius: var(--r-xl);
          box-shadow: var(--shadow-lg);
          max-width: calc(100vw - 2.5rem);
          width: 380px;
          animation: toastIn 0.35s cubic-bezier(0.34, 1.4, 0.64, 1) both;
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(1rem); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .toast--success { background: var(--success-bg); border: 1px solid var(--success-border); }
        .toast--failure { background: var(--danger-bg);  border: 1px solid var(--danger-border); }
        .toast--pending { background: var(--warning-bg); border: 1px solid var(--warning-border); }
        .toast__icon {
          width: 2rem;
          height: 2rem;
          border-radius: var(--r-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9375rem;
          font-weight: 700;
          flex-shrink: 0;
        }
        .toast--success .toast__icon { background: var(--success); color: white; }
        .toast--failure .toast__icon { background: var(--danger);  color: white; }
        .toast--pending .toast__icon { background: var(--warning); color: white; }
        .toast__body { flex: 1; }
        .toast__title { font-weight: 700; font-size: 0.875rem; color: var(--text-1); }
        .toast__message { font-size: 0.8125rem; color: var(--text-2); margin-top: 0.2rem; line-height: 1.4; }
        .toast__close {
          background: none;
          border: none;
          color: var(--text-3);
          cursor: pointer;
          padding: 0.25rem;
          flex-shrink: 0;
          border-radius: var(--r-sm);
          transition: background 0.12s, color 0.12s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .toast__close:hover { background: var(--surface-3); color: var(--text-1); }
      `}</style>

      <div className="alas-root">
        {/* ── Header ── */}
        <header className="header">
          <div className="header__inner">
            <div className="header__brand">
              <div className="header__logo">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
                  <path d="M16 3H8L6 7h12l-2-4z" />
                </svg>
              </div>
              <div className="header__text">
                <p className="header__name">
                  Hola, {session.user.firstName} 👋
                </p>
                <p className="header__school">
                  {user.schoolDivision?.school?.name} ·{" "}
                  {user.schoolDivision?.division}
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="btn-signout"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Salir
            </button>
          </div>
        </header>

        {/* ── Main ── */}
        <main className="main">
          {/* Balance Card */}
          <div className="balance-card">
            <p className="balance-card__eyebrow">Saldo pendiente</p>
            <p className="balance-card__amount">{formatARS(user.balance)}</p>
            <p className="balance-card__of">
              de {formatARS(user.totalAmount)} total
            </p>

            <div className="balance-card__progress-row">
              <span>Progreso de pago</span>
              <span className="balance-card__pct">
                {Math.round(progressPct)}%
              </span>
            </div>
            <div className="balance-card__track">
              <div
                className="balance-card__fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="balance-card__stats">
              <div>
                <p className="balance-card__stat-label">Pagado</p>
                <p className="balance-card__stat-value">
                  {formatARS(user.paidAmount)}
                </p>
              </div>
              <div>
                <p className="balance-card__stat-label">Cuotas</p>
                <p className="balance-card__stat-value">
                  {paidInstallmentsCount}/{user.installments}
                </p>
              </div>
              <div>
                <p className="balance-card__stat-label">Estado</p>
                <p className="balance-card__stat-value">
                  {isFullyPaid ? "✅ Al día" : "⏳ Activo"}
                </p>
              </div>
            </div>
          </div>

          {/* Overdue Alert */}
          {hasOverdue && (
            <div className="alert-overdue" role="alert">
              <div className="alert-overdue__icon-wrap">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <p className="alert-overdue__title">Tenés cuotas vencidas</p>
                <p className="alert-overdue__body">
                  Ponete al día con tus pagos para evitar inconvenientes.
                </p>
              </div>
            </div>
          )}

          {/* Product */}
          <div className="card">
            <div className="card__body">
              <div className="product-row">
                <div className="product-row__icon-wrap">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                  </svg>
                </div>
                <div>
                  <p className="product-row__name">{user.product.name}</p>
                  {user.product.description && (
                    <p className="product-row__desc">
                      {user.product.description}
                    </p>
                  )}
                  {user.size && (
                    <span className="product-row__size">Talle {user.size}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Installments + Pay */}
          <div className="card">
            <div className="card__header">
              <div>
                <p className="card__title">Cuotas</p>
                <p className="card__subtitle">
                  Seleccioná las que querés pagar
                </p>
              </div>
            </div>

            <div className="installments-wrapper">
              <InstallmentsTable
                totalInstallments={user.installments}
                installmentAmount={installmentAmount}
                existingPayments={payments}
                onSelectionChange={setSelectedInstallments}
                userCreatedAt={user.createdAt}
              />
            </div>

            {/* Pay CTA */}
            <div className="card__body" style={{ paddingTop: 0 }}>
              <div className="pay-cta">
                {selectedInstallments.length > 0 && (
                  <div className="pay-cta__total">
                    <span className="pay-cta__total-label">
                      {selectedInstallments.length} cuota
                      {selectedInstallments.length > 1 ? "s" : ""} seleccionada
                      {selectedInstallments.length > 1 ? "s" : ""}
                    </span>
                    <span className="pay-cta__total-amount">
                      {formatARS(selectedTotal)}
                    </span>
                  </div>
                )}
                <button
                  onClick={handleMercadoPagoPayment}
                  disabled={selectedInstallments.length === 0 || isMPLoading}
                  className={`btn-mp ${selectedInstallments.length > 0 && !isMPLoading ? "btn-mp--active" : "btn-mp--disabled"}`}
                >
                  {isMPLoading ? (
                    <>
                      <div className="btn-mp__spinner" />
                      Procesando...
                    </>
                  ) : (
                    <Image
                      src="/mp-logo.svg"
                      alt="Pagar con Mercado Pago"
                      width={160}
                      height={65}
                    />
                  )}
                </button>
                {selectedInstallments.length > 0 && !isMPLoading && (
                  <div className="pay-cta__security">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 1.5l8.5 3v6c0 5.25-3.5 9.75-8.5 11C7 20.25 3.5 15.75 3.5 10.5v-6L12 1.5zm3.5 7.5l-4 4-1.5-1.5-1 1L11.5 15l5-5-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Pago 100% seguro
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="card">
            <div className="card__header">
              <div>
                <p className="card__title">Historial de pagos</p>
                {payments.length > 0 && (
                  <p className="card__subtitle">
                    {payments.length} registro{payments.length > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>

            {payments.length > 0 ? (
              <div className="payment-list">
                {payments.map((payment) => {
                  const statusKey = payment.status.toLowerCase() as
                    | "approved"
                    | "rejected"
                    | "pending";
                  const statusMap = {
                    approved: { emoji: "✓", label: "Aprobado" },
                    rejected: { emoji: "✕", label: "Rechazado" },
                    pending: { emoji: "◷", label: "Pendiente" },
                  };
                  const s = statusMap[statusKey] ?? statusMap.pending;

                  return (
                    <div key={payment.id} className="payment-item">
                      <div
                        className={`payment-item__avatar payment-item__avatar--${statusKey}`}
                      >
                        <span
                          style={{
                            fontSize: "1.125rem",
                            fontWeight: 700,
                            color:
                              statusKey === "approved"
                                ? "var(--success)"
                                : statusKey === "rejected"
                                  ? "var(--danger)"
                                  : "var(--warning)",
                          }}
                        >
                          {s.emoji}
                        </span>
                      </div>
                      <div className="payment-item__info">
                        <p className="payment-item__title">
                          {payment.installmentNumber
                            ? `Cuota ${payment.installmentNumber}`
                            : "Sin cuota asignada"}
                        </p>
                        <p className="payment-item__date">
                          {new Date(payment.submittedAt).toLocaleDateString(
                            "es-AR",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </p>
                        {payment.status === "REJECTED" &&
                          payment.rejectionReason && (
                            <p className="payment-item__rejection">
                              {payment.rejectionReason}
                            </p>
                          )}
                      </div>
                      <div className="payment-item__right">
                        <p className="payment-item__amount">
                          {formatARS(payment.amount)}
                        </p>
                        <span className={`badge badge--${statusKey}`}>
                          {s.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <svg
                  className="empty-state__icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="empty-state__title">Sin pagos todavía</p>
                <p className="empty-state__sub">
                  Seleccioná cuotas arriba para empezar
                </p>
              </div>
            )}
          </div>
        </main>

        {/* Toast */}
        {paymentNotification && (
          <PaymentNotification
            status={paymentNotification}
            onClose={() => setPaymentNotification(null)}
          />
        )}
      </div>
    </>
  );
}
