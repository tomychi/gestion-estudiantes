"use client";

import { SerializedPayment } from "@/types";
import { useState } from "react";

interface Props {
  totalInstallments: number;
  installmentAmount: number;
  existingPayments: SerializedPayment[];
  onSelectionChange: (selectedInstallments: number[]) => void;
  disabled?: boolean;
  userCreatedAt: string;
}

function formatARS(amount: number) {
  return amount.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

export default function InstallmentsTable({
  totalInstallments,
  installmentAmount,
  existingPayments,
  onSelectionChange,
  disabled = false,
  userCreatedAt,
}: Props) {
  const [selectedInstallments, setSelectedInstallments] = useState<number[]>(
    [],
  );

  // ─── Derived sets ────────────────────────────────────────────────────────────

  const paidSet = new Set(
    existingPayments
      .filter((p) => p.status === "APPROVED" && p.installmentNumber)
      .map((p) => p.installmentNumber as number),
  );

  const pendingSet = new Set(
    existingPayments
      .filter((p) => p.status === "PENDING" && p.installmentNumber)
      .map((p) => p.installmentNumber as number),
  );

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const getDueDate = (num: number): Date | null => {
    if (!userCreatedAt) return null;
    const d = new Date(userCreatedAt);
    d.setMonth(d.getMonth() + num);
    d.setDate(15);
    return d;
  };

  const isOverdue = (num: number): boolean => {
    const due = getDueDate(num);
    return (
      !!due && !paidSet.has(num) && !pendingSet.has(num) && new Date() > due
    );
  };

  const isDueSoon = (num: number): boolean => {
    const due = getDueDate(num);
    if (!due || paidSet.has(num) || pendingSet.has(num)) return false;
    const days = Math.ceil((due.getTime() - Date.now()) / 86400000);
    return days > 0 && days <= 7;
  };

  const formatDueDate = (num: number): string => {
    const due = getDueDate(num);
    return due
      ? due.toLocaleDateString("es-AR", { day: "numeric", month: "short" })
      : "-";
  };

  const getPaymentDate = (num: number): string | null => {
    const p = existingPayments.find(
      (p) => p.installmentNumber === num && p.status === "APPROVED",
    );
    return p?.submittedAt
      ? new Date(p.submittedAt).toLocaleDateString("es-AR", {
          day: "numeric",
          month: "short",
        })
      : null;
  };

  // ─── Toggle ──────────────────────────────────────────────────────────────────

  const handleToggle = (num: number) => {
    if (disabled || paidSet.has(num) || pendingSet.has(num)) return;

    setSelectedInstallments((prev) => {
      const next = prev.includes(num)
        ? prev.filter((n) => n !== num)
        : [...prev, num].sort((a, b) => a - b);
      setTimeout(() => onSelectionChange(next), 0);
      return next;
    });
  };

  // ─── Status helpers ───────────────────────────────────────────────────────────

  type Status =
    | "paid"
    | "pending"
    | "selected"
    | "overdue"
    | "due-soon"
    | "unpaid";

  const getStatus = (num: number): Status => {
    if (paidSet.has(num)) return "paid";
    if (pendingSet.has(num)) return "pending";
    if (selectedInstallments.includes(num)) return "selected";
    if (isOverdue(num)) return "overdue";
    if (isDueSoon(num)) return "due-soon";
    return "unpaid";
  };

  const STATUS_CONFIG: Record<
    Status,
    {
      rowCls: string;
      badgeLabel: string;
      badgeCls: string;
      icon: string;
    }
  > = {
    paid: {
      rowCls: "row--paid",
      badgeLabel: "Pagada",
      badgeCls: "badge--paid",
      icon: "✓",
    },
    pending: {
      rowCls: "row--pending",
      badgeLabel: "En revisión",
      badgeCls: "badge--pending",
      icon: "◷",
    },
    selected: {
      rowCls: "row--selected",
      badgeLabel: "Seleccionada",
      badgeCls: "badge--selected",
      icon: "●",
    },
    overdue: {
      rowCls: "row--overdue",
      badgeLabel: "Vencida",
      badgeCls: "badge--overdue",
      icon: "!",
    },
    "due-soon": {
      rowCls: "",
      badgeLabel: "Vence pronto",
      badgeCls: "badge--soon",
      icon: "◷",
    },
    unpaid: {
      rowCls: "",
      badgeLabel: "Pendiente",
      badgeCls: "badge--unpaid",
      icon: "",
    },
  };

  const installments = Array.from(
    { length: totalInstallments },
    (_, i) => i + 1,
  );

  return (
    <>
      <style>{`
        /* ── Tokens (inherit from parent where possible) ──── */
        .it-root {
          --it-paid-bg:     rgba(15,123,85,0.06);
          --it-paid-border: rgba(15,123,85,0.15);
          --it-paid-text:   #0f7b55;
          --it-pending-bg:  rgba(161,98,7,0.07);
          --it-pending-border: rgba(161,98,7,0.2);
          --it-pending-text: #a16207;
          --it-sel-bg:      rgba(0,97,142,0.07);
          --it-sel-border:  rgba(0,97,142,0.3);
          --it-sel-text:    #00618e;
          --it-over-bg:     rgba(185,28,28,0.06);
          --it-over-border: rgba(185,28,28,0.2);
          --it-over-text:   #b91c1c;
          --it-soon-bg:     rgba(234,88,12,0.07);
          --it-soon-border: rgba(234,88,12,0.18);
          --it-soon-text:   #c2410c;
          --it-surface:     #f4f4f5;
          --it-border:      #e4e4e7;
          --it-text1:       #18181b;
          --it-text2:       #52525b;
          --it-text3:       #a1a1aa;
          --it-primary:     #00618e;
          --it-r:           0.875rem;
          font-family: 'DM Sans', sans-serif;
        }
        .it-root *, .it-root *::before, .it-root *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* ── Grid ────────────────────────────────────────── */
        .it-grid {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        /* ── Row ─────────────────────────────────────────── */
        .it-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem;
          border-radius: var(--it-r);
          background: var(--it-surface);
          border: 1.5px solid transparent;
          transition: background 0.12s, border-color 0.12s, transform 0.1s;
          user-select: none;
        }
        .it-row--interactive { cursor: pointer; }
        .it-row--interactive:active { transform: scale(0.99); }
        .it-row--interactive:hover { background: #ececed; }
        .it-row--disabled { cursor: not-allowed; opacity: 0.7; }

        .it-row.row--paid     { background: var(--it-paid-bg);    border-color: var(--it-paid-border); }
        .it-row.row--pending  { background: var(--it-pending-bg); border-color: var(--it-pending-border); }
        .it-row.row--selected { background: var(--it-sel-bg);     border-color: var(--it-sel-border); }
        .it-row.row--overdue  { background: var(--it-over-bg);    border-color: var(--it-over-border); }

        /* ── Checkbox ────────────────────────────────────── */
        .it-checkbox {
          width: 1.25rem;
          height: 1.25rem;
          border-radius: 0.375rem;
          border: 2px solid var(--it-border);
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: border-color 0.12s, background 0.12s;
        }
        .it-checkbox--checked {
          background: var(--it-primary);
          border-color: var(--it-primary);
          color: white;
        }
        .it-checkbox--paid {
          background: var(--it-paid-text);
          border-color: var(--it-paid-text);
          color: white;
        }
        .it-checkbox--pending {
          background: var(--it-pending-text);
          border-color: var(--it-pending-text);
          color: white;
        }
        .it-checkbox__check {
          font-size: 0.7rem;
          font-weight: 700;
          line-height: 1;
        }

        /* ── Number pill ─────────────────────────────────── */
        .it-num {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--it-text2);
          min-width: 1.5rem;
          flex-shrink: 0;
        }

        /* ── Info section ────────────────────────────────── */
        .it-info { flex: 1; min-width: 0; }
        .it-info__label {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--it-text1);
        }
        .it-info__date {
          font-size: 0.75rem;
          color: var(--it-text3);
          margin-top: 0.125rem;
        }

        /* ── Right side ──────────────────────────────────── */
        .it-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.25rem;
          flex-shrink: 0;
        }
        .it-amount {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--it-text1);
        }

        /* ── Badges ──────────────────────────────────────── */
        .it-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.2rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.02em;
        }
        .badge--paid     { background: var(--it-paid-bg);    color: var(--it-paid-text);    border: 1px solid var(--it-paid-border); }
        .badge--pending  { background: var(--it-pending-bg); color: var(--it-pending-text); border: 1px solid var(--it-pending-border); }
        .badge--selected { background: var(--it-sel-bg);     color: var(--it-sel-text);     border: 1px solid var(--it-sel-border); }
        .badge--overdue  { background: var(--it-over-bg);    color: var(--it-over-text);    border: 1px solid var(--it-over-border); }
        .badge--soon     { background: var(--it-soon-bg);    color: var(--it-soon-text);    border: 1px solid var(--it-soon-border); }
        .badge--unpaid   { background: var(--it-surface);    color: var(--it-text3);        border: 1px solid var(--it-border); }

        /* ── Legend ──────────────────────────────────────── */
        .it-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 0.625rem;
          padding-top: 0.875rem;
          margin-top: 0.25rem;
          border-top: 1px solid var(--it-border);
        }
        .it-legend__item {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          color: var(--it-text2);
        }
        .it-legend__dot {
          width: 0.625rem;
          height: 0.625rem;
          border-radius: 50%;
          flex-shrink: 0;
        }
      `}</style>

      <div className="it-root">
        <div className="it-grid">
          {installments.map((num) => {
            const status = getStatus(num);
            const cfg = STATUS_CONFIG[status];
            const isInteractive =
              !disabled && !paidSet.has(num) && !pendingSet.has(num);
            const paymentDate = getPaymentDate(num);

            const checkboxCls = paidSet.has(num)
              ? "it-checkbox--paid"
              : pendingSet.has(num)
                ? "it-checkbox--pending"
                : selectedInstallments.includes(num)
                  ? "it-checkbox--checked"
                  : "";

            const showCheck =
              paidSet.has(num) ||
              pendingSet.has(num) ||
              selectedInstallments.includes(num);

            return (
              <div
                key={num}
                className={`it-row ${cfg.rowCls} ${isInteractive ? "it-row--interactive" : "it-row--disabled"}`}
                onClick={() => handleToggle(num)}
                role="checkbox"
                aria-checked={
                  selectedInstallments.includes(num) || paidSet.has(num)
                }
                tabIndex={isInteractive ? 0 : -1}
                onKeyDown={(e) => e.key === " " && handleToggle(num)}
              >
                {/* Checkbox */}
                <div className={`it-checkbox ${checkboxCls}`}>
                  {showCheck && (
                    <span className="it-checkbox__check">
                      {paidSet.has(num) || selectedInstallments.includes(num)
                        ? "✓"
                        : "◷"}
                    </span>
                  )}
                </div>

                {/* Number */}
                <span className="it-num">#{num}</span>

                {/* Info */}
                <div className="it-info">
                  <p className="it-info__label">Cuota {num}</p>
                  <p className="it-info__date">
                    {paymentDate
                      ? `Pagada el ${paymentDate}`
                      : `Vence ${formatDueDate(num)}`}
                  </p>
                </div>

                {/* Right */}
                <div className="it-right">
                  <span className="it-amount">
                    {formatARS(installmentAmount)}
                  </span>
                  <span className={`it-badge ${cfg.badgeCls}`}>
                    {cfg.badgeLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="it-legend" role="list" aria-label="Referencias">
          {[
            { color: "var(--it-paid-text)", label: "Pagada" },
            { color: "var(--it-pending-text)", label: "En revisión" },
            { color: "var(--it-sel-text)", label: "Seleccionada" },
            { color: "var(--it-over-text)", label: "Vencida" },
            { color: "var(--it-text3)", label: "Pendiente" },
          ].map(({ color, label }) => (
            <div key={label} className="it-legend__item" role="listitem">
              <div className="it-legend__dot" style={{ background: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
