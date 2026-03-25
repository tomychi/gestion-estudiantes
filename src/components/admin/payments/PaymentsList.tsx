"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PaymentReviewModal from "./PaymentReviewModal";
import { PaymentWithUser, SchoolBasic } from "@/types";

interface Counts {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

interface Props {
  initialPayments: PaymentWithUser[];
  schools: SchoolBasic[];
  adminId: string;
  counts: Counts;
}

function formatARS(n: number) {
  return n.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

export default function PaymentsList({
  initialPayments,
  schools,
  adminId,
  counts,
}: Props) {
  const router = useRouter();
  const payments = initialPayments;

  const [selectedPayment, setSelectedPayment] =
    useState<PaymentWithUser | null>(null);
  const [selectedPayments, setSelectedPayments] = useState<PaymentWithUser[]>(
    [],
  );
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPayments = payments.filter((p) => {
    const matchStatus =
      statusFilter === "all" || p.status === statusFilter.toUpperCase();
    const matchSchool =
      !schoolFilter || p.user.schoolDivision?.school.id === schoolFilter;
    const q = searchTerm.toLowerCase();
    const matchSearch =
      !searchTerm ||
      p.user.firstName.toLowerCase().includes(q) ||
      p.user.lastName.toLowerCase().includes(q) ||
      p.user.dni.includes(searchTerm) ||
      p.transactionRef?.includes(searchTerm);
    return matchStatus && matchSchool && matchSearch;
  });

  const groupedPayments = filteredPayments.reduce(
    (acc, p) => {
      const key = p.transactionRef || p.id;
      if (!acc[key]) acc[key] = [];
      acc[key].push(p);
      return acc;
    },
    {} as Record<string, PaymentWithUser[]>,
  );

  const handleReviewClick = (payment: PaymentWithUser) => {
    const related = payments.filter(
      (p) => p.transactionRef === payment.transactionRef,
    );
    setSelectedPayment(payment);
    setSelectedPayments(related);
    setIsReviewModalOpen(true);
  };

  const handleReviewComplete = () => {
    setIsReviewModalOpen(false);
    setSelectedPayment(null);
    setSelectedPayments([]);
    router.refresh();
  };

  const hasFilters = searchTerm || statusFilter !== "all" || schoolFilter;

  return (
    <>
      <style>{`
        .pml-root {
          --font-display: 'Plus Jakarta Sans', sans-serif;
          --font-body:    'DM Sans', sans-serif;
          --surface:      #ffffff;
          --surface-2:    #f4f4f5;
          --surface-3:    #e4e4e7;
          --primary:      #00618e;
          --primary-mid:  #0089c6;
          --primary-tint: rgba(0,97,142,0.08);
          --text-1:       #18181b;
          --text-2:       #52525b;
          --text-3:       #a1a1aa;
          --success:      #0f7b55;
          --success-bg:   rgba(15,123,85,0.08);
          --warning:      #a16207;
          --warning-bg:   rgba(161,98,7,0.08);
          --danger:       #b91c1c;
          --danger-bg:    rgba(185,28,28,0.08);
          --r-md:  0.875rem;
          --r-lg:  1.25rem;
          --r-xl:  1.75rem;
          --r-full: 9999px;
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);

          font-family: var(--font-body);
          display: flex; flex-direction: column; gap: 1.25rem;
          -webkit-font-smoothing: antialiased;
        }
        .pml-root *, .pml-root *::before, .pml-root *::after {
          box-sizing: border-box; margin: 0; padding: 0;
        }

        /* ── Page header ─────────────────────────────────── */
        .pml-page-header { margin-bottom: 0.25rem; }
        .pml-title {
          font-family: var(--font-display);
          font-size: clamp(1.375rem, 3vw, 1.875rem);
          font-weight: 800; color: var(--text-1); letter-spacing: -0.02em;
        }
        .pml-sub { font-size: 0.875rem; color: var(--text-3); margin-top: 0.2rem; }

        /* ── Stat strip ──────────────────────────────────── */
        .pml-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }
        @media (min-width: 640px) { .pml-stats { grid-template-columns: repeat(4, 1fr); } }
        .pml-stat {
          background: var(--surface);
          border-radius: var(--r-lg);
          box-shadow: var(--shadow-sm);
          padding: 1rem 1.125rem;
        }
        .pml-stat__label {
          font-size: 0.75rem; font-weight: 600; color: var(--text-3);
          text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.375rem;
        }
        .pml-stat__value {
          font-family: var(--font-display);
          font-size: clamp(1.5rem, 3vw, 2rem);
          font-weight: 800; line-height: 1;
        }
        .pml-stat--pending  .pml-stat__value { color: var(--warning); }
        .pml-stat--approved .pml-stat__value { color: var(--success); }
        .pml-stat--rejected .pml-stat__value { color: var(--danger); }
        .pml-stat--total    .pml-stat__value { color: var(--primary); }

        /* ── Filters ─────────────────────────────────────── */
        .pml-filters {
          background: var(--surface);
          border-radius: var(--r-xl);
          box-shadow: var(--shadow-sm);
          padding: 1.125rem;
        }
        .pml-filters__grid {
          display: grid; grid-template-columns: 1fr; gap: 0.75rem;
        }
        @media (min-width: 640px) { .pml-filters__grid { grid-template-columns: 2fr 1fr 1fr; } }
        .pml-filter-label {
          font-size: 0.75rem; font-weight: 600; color: var(--text-2);
          margin-bottom: 0.375rem; display: block;
        }
        .pml-input, .pml-select {
          width: 100%; padding: 0.6875rem 0.875rem;
          border-radius: var(--r-md);
          border: 1.5px solid var(--surface-3);
          background: var(--surface-2);
          font-family: var(--font-body);
          font-size: 0.875rem; color: var(--text-1); outline: none;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
          -webkit-appearance: none;
        }
        .pml-input::placeholder { color: var(--text-3); }
        .pml-input:focus, .pml-select:focus {
          border-color: var(--primary); background: white;
          box-shadow: 0 0 0 3px rgba(0,97,142,0.12);
        }
        .pml-filters__meta {
          display: flex; align-items: center; justify-content: space-between;
          margin-top: 0.875rem; padding-top: 0.875rem;
          border-top: 1px solid var(--surface-3);
        }
        .pml-filters__count { font-size: 0.8125rem; color: var(--text-2); }
        .pml-filters__count strong { color: var(--text-1); font-weight: 700; }
        .pml-filters__clear {
          font-size: 0.8125rem; font-weight: 600; color: var(--primary);
          background: none; border: none; cursor: pointer; padding: 0;
          transition: opacity 0.12s;
        }
        .pml-filters__clear:hover { opacity: 0.7; }

        /* ── Table ───────────────────────────────────────── */
        .pml-table-wrap {
          background: var(--surface);
          border-radius: var(--r-xl);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
        }
        .pml-table { width: 100%; border-collapse: collapse; }
        .pml-table thead {
          background: var(--surface-2);
          border-bottom: 1px solid var(--surface-3);
        }
        .pml-table th {
          padding: 0.75rem 1.25rem;
          text-align: left;
          font-size: 0.6875rem; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--text-3); white-space: nowrap;
        }
        .pml-table th:last-child { text-align: right; }
        .pml-table td {
          padding: 0.875rem 1.25rem;
          border-bottom: 1px solid var(--surface-2);
          font-size: 0.875rem; color: var(--text-1);
          vertical-align: middle;
        }
        .pml-table td:last-child { text-align: right; }
        .pml-table tbody tr:last-child td { border-bottom: none; }
        .pml-table tbody tr { transition: background 0.1s; }
        .pml-table tbody tr:hover { background: var(--surface-2); }
        .pml-table tbody tr.pml-row--pending { background: rgba(161,98,7,0.03); }
        .pml-table tbody tr.pml-row--pending:hover { background: rgba(161,98,7,0.06); }

        /* ── Avatar ──────────────────────────────────────── */
        .pml-avatar {
          width: 2.25rem; height: 2.25rem; border-radius: var(--r-full);
          background: var(--primary-tint);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-display); font-size: 0.75rem; font-weight: 700;
          color: var(--primary); flex-shrink: 0;
        }
        .pml-student-name { font-weight: 600; color: var(--text-1); }
        .pml-student-dni  { font-size: 0.75rem; color: var(--text-3); margin-top: 0.1rem; }
        .pml-school-name  { font-weight: 500; }
        .pml-division     { font-size: 0.75rem; color: var(--text-3); margin-top: 0.1rem; }

        /* ── Badges ──────────────────────────────────────── */
        .pml-badge {
          display: inline-flex; align-items: center;
          padding: 0.2rem 0.625rem; border-radius: var(--r-full);
          font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.02em;
        }
        .pml-badge--approved { background: var(--success-bg); color: var(--success); }
        .pml-badge--pending  { background: var(--warning-bg); color: var(--warning); }
        .pml-badge--rejected { background: var(--danger-bg);  color: var(--danger); }

        /* ── Action links ────────────────────────────────── */
        .pml-act-btn {
          display: inline-flex; align-items: center; gap: 0.3rem;
          padding: 0.375rem 0.75rem; border-radius: var(--r-full);
          font-size: 0.8125rem; font-weight: 600;
          border: none; cursor: pointer; transition: background 0.12s;
        }
        .pml-act-btn--review {
          background: var(--primary-tint); color: var(--primary);
        }
        .pml-act-btn--review:hover { background: rgba(0,97,142,0.14); }
        .pml-act-btn--view {
          background: var(--surface-2); color: var(--text-2);
        }
        .pml-act-btn--view:hover { background: var(--surface-3); }

        /* ── Mobile cards ────────────────────────────────── */
        .pml-cards { display: flex; flex-direction: column; gap: 0.625rem; }
        .pml-card {
          background: var(--surface);
          border-radius: var(--r-lg);
          box-shadow: var(--shadow-sm);
          padding: 1rem;
        }
        .pml-card--pending { border-left: 3px solid var(--warning); }
        .pml-card__top { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
        .pml-card__info { flex: 1; min-width: 0; }
        .pml-card__right { text-align: right; flex-shrink: 0; }
        .pml-card__amount {
          font-family: var(--font-display); font-size: 1rem; font-weight: 800; color: var(--text-1);
        }
        .pml-card__meta {
          display: flex; align-items: center; justify-content: space-between;
          font-size: 0.75rem; color: var(--text-3);
          padding-top: 0.625rem; margin-top: 0.625rem;
          border-top: 1px solid var(--surface-2);
        }

        /* ── Empty ───────────────────────────────────────── */
        .pml-empty {
          background: var(--surface); border-radius: var(--r-xl);
          box-shadow: var(--shadow-sm); padding: 3rem 1.5rem; text-align: center;
        }
        .pml-empty__icon { width: 3.5rem; height: 3.5rem; margin: 0 auto 1rem; color: var(--text-3); }
        .pml-empty__title {
          font-family: var(--font-display); font-size: 1.0625rem; font-weight: 700;
          color: var(--text-1); margin-bottom: 0.375rem;
        }
        .pml-empty__sub { font-size: 0.875rem; color: var(--text-3); }

        /* ── Visibility ──────────────────────────────────── */
        .pml-desktop { display: none; }
        .pml-mobile  { display: flex; flex-direction: column; gap: 0.625rem; }
        @media (min-width: 768px) {
          .pml-desktop { display: block; }
          .pml-mobile  { display: none; }
        }
      `}</style>

      <div className="pml-root">
        {/* Header */}
        <div className="pml-page-header">
          <h1 className="pml-title">Gestión de pagos</h1>
          <p className="pml-sub">Revisá y aprobá los comprobantes de pago</p>
        </div>

        {/* Stats */}
        <div className="pml-stats">
          <div className="pml-stat pml-stat--pending">
            <p className="pml-stat__label">Pendientes</p>
            <p className="pml-stat__value">{counts.pending}</p>
          </div>
          <div className="pml-stat pml-stat--approved">
            <p className="pml-stat__label">Aprobados</p>
            <p className="pml-stat__value">{counts.approved}</p>
          </div>
          <div className="pml-stat pml-stat--rejected">
            <p className="pml-stat__label">Rechazados</p>
            <p className="pml-stat__value">{counts.rejected}</p>
          </div>
          <div className="pml-stat pml-stat--total">
            <p className="pml-stat__label">Total</p>
            <p className="pml-stat__value">{counts.total}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="pml-filters">
          <div className="pml-filters__grid">
            <div>
              <label className="pml-filter-label">Buscar</label>
              <input
                type="text"
                placeholder="Nombre, DNI o referencia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pml-input"
              />
            </div>
            <div>
              <label className="pml-filter-label">Estado</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pml-select"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendientes</option>
                <option value="approved">Aprobados</option>
                <option value="rejected">Rechazados</option>
              </select>
            </div>
            <div>
              <label className="pml-filter-label">Colegio</label>
              <select
                value={schoolFilter}
                onChange={(e) => setSchoolFilter(e.target.value)}
                className="pml-select"
              >
                <option value="">Todos</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="pml-filters__meta">
            <p className="pml-filters__count">
              <strong>{filteredPayments.length}</strong> de{" "}
              <strong>{payments.length}</strong> pagos
            </p>
            {hasFilters && (
              <button
                className="pml-filters__clear"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setSchoolFilter("");
                }}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {Object.keys(groupedPayments).length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="pml-desktop">
              <div className="pml-table-wrap">
                <table className="pml-table">
                  <thead>
                    <tr>
                      <th>Estudiante</th>
                      <th>Colegio / División</th>
                      <th>Cuota(s)</th>
                      <th>Monto</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(groupedPayments).map(([ref, group]) => {
                      const first = group[0];
                      const total = group.reduce((s, p) => s + p.amount, 0);
                      const installments = group
                        .map((p) => p.installmentNumber)
                        .filter(Boolean)
                        .sort((a, b) => a! - b!)
                        .join(", ");
                      const statusKey = first.status.toLowerCase() as
                        | "approved"
                        | "pending"
                        | "rejected";

                      return (
                        <tr
                          key={ref}
                          className={
                            first.status === "PENDING" ? "pml-row--pending" : ""
                          }
                        >
                          <td>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.75rem",
                              }}
                            >
                              <div className="pml-avatar">
                                {first.user.firstName[0]}
                                {first.user.lastName[0]}
                              </div>
                              <div>
                                <p className="pml-student-name">
                                  {first.user.firstName} {first.user.lastName}
                                </p>
                                <p className="pml-student-dni">
                                  DNI {first.user.dni}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td>
                            {first.user.schoolDivision ? (
                              <>
                                <p className="pml-school-name">
                                  {first.user.schoolDivision.school.name}
                                </p>
                                <p className="pml-division">
                                  {first.user.schoolDivision.division} ·{" "}
                                  {first.user.schoolDivision.year}
                                </p>
                              </>
                            ) : (
                              <span
                                style={{
                                  color: "var(--text-3)",
                                  fontSize: "0.875rem",
                                }}
                              >
                                Sin asignar
                              </span>
                            )}
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {installments || "—"}
                          </td>
                          <td>
                            <p
                              style={{
                                fontFamily: "var(--font-display)",
                                fontWeight: 700,
                              }}
                            >
                              {formatARS(total)}
                            </p>
                            {group.length > 1 && (
                              <p
                                style={{
                                  fontSize: "0.75rem",
                                  color: "var(--text-3)",
                                  marginTop: "0.1rem",
                                }}
                              >
                                {group.length} cuotas
                              </p>
                            )}
                          </td>
                          <td style={{ color: "var(--text-2)" }}>
                            {new Date(first.submittedAt).toLocaleDateString(
                              "es-AR",
                              { day: "numeric", month: "short" },
                            )}
                          </td>
                          <td>
                            <span
                              className={`pml-badge pml-badge--${statusKey}`}
                            >
                              {
                                {
                                  approved: "Aprobado",
                                  pending: "Pendiente",
                                  rejected: "Rechazado",
                                }[statusKey]
                              }
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => handleReviewClick(first)}
                              className={`pml-act-btn ${first.status === "PENDING" ? "pml-act-btn--review" : "pml-act-btn--view"}`}
                            >
                              {first.status === "PENDING" ? (
                                <>
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
                                  Revisar
                                </>
                              ) : (
                                "Ver detalles"
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="pml-mobile">
              {Object.entries(groupedPayments).map(([ref, group]) => {
                const first = group[0];
                const total = group.reduce((s, p) => s + p.amount, 0);
                const installments = group
                  .map((p) => p.installmentNumber)
                  .filter(Boolean)
                  .sort((a, b) => a! - b!)
                  .join(", ");
                const statusKey = first.status.toLowerCase() as
                  | "approved"
                  | "pending"
                  | "rejected";
                return (
                  <div
                    key={ref}
                    className={`pml-card${first.status === "PENDING" ? " pml-card--pending" : ""}`}
                  >
                    <div className="pml-card__top">
                      <div className="pml-avatar">
                        {first.user.firstName[0]}
                        {first.user.lastName[0]}
                      </div>
                      <div className="pml-card__info">
                        <p className="pml-student-name">
                          {first.user.firstName} {first.user.lastName}
                        </p>
                        <p className="pml-student-dni">DNI {first.user.dni}</p>
                      </div>
                      <div className="pml-card__right">
                        <p className="pml-card__amount">{formatARS(total)}</p>
                        <span
                          className={`pml-badge pml-badge--${statusKey}`}
                          style={{ marginTop: "0.25rem" }}
                        >
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
                    <div className="pml-card__meta">
                      <span>
                        {first.user.schoolDivision
                          ? `${first.user.schoolDivision.school.name} · ${first.user.schoolDivision.division}`
                          : "Sin asignar"}
                        {installments ? ` · Cuota(s) ${installments}` : ""}
                      </span>
                      <button
                        onClick={() => handleReviewClick(first)}
                        className={`pml-act-btn ${first.status === "PENDING" ? "pml-act-btn--review" : "pml-act-btn--view"}`}
                      >
                        {first.status === "PENDING" ? "Revisar" : "Ver"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="pml-empty">
            <svg
              className="pml-empty__icon"
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
            <p className="pml-empty__title">No se encontraron pagos</p>
            <p className="pml-empty__sub">
              {hasFilters
                ? "Intentá con otros filtros"
                : "Los pagos enviados por los estudiantes aparecerán aquí"}
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedPayment && selectedPayments.length > 0 && (
        <PaymentReviewModal
          payments={selectedPayments}
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedPayment(null);
            setSelectedPayments([]);
          }}
          onComplete={handleReviewComplete}
          adminId={adminId}
        />
      )}
    </>
  );
}
