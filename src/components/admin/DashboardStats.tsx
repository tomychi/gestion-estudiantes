"use client";

interface Stats {
  totalStudents: number;
  totalSchools: number;
  totalProducts: number;
  pendingPayments: number;
  totalRevenue: number;
  pendingAmount: number;
  totalBalance: number;
  totalExpected: number;
  approvalRate: number;
  approvedCount: number;
  rejectedCount: number;
}

interface Props {
  stats: Stats;
}

function formatARS(n: number) {
  return n.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

export default function DashboardStats({ stats }: Props) {
  const collectionPct =
    stats.totalExpected > 0
      ? Math.round(
          ((stats.totalExpected - stats.totalBalance) / stats.totalExpected) *
            100,
        )
      : 0;

  const cards = [
    {
      label: "Estudiantes",
      value: stats.totalStudents.toString(),
      sub: `${stats.totalSchools} colegio${stats.totalSchools !== 1 ? "s" : ""}`,
      accent: "#00618e",
      accentBg: "rgba(0,97,142,0.08)",
      icon: (
        <svg
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      ),
    },
    {
      label: "Ingresos confirmados",
      value: formatARS(stats.totalRevenue),
      sub: `${stats.approvedCount} pago${stats.approvedCount !== 1 ? "s" : ""} aprobado${stats.approvedCount !== 1 ? "s" : ""}`,
      accent: "#0f7b55",
      accentBg: "rgba(15,123,85,0.08)",
      icon: (
        <svg
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
    {
      label: "Pagos pendientes",
      value: stats.pendingPayments.toString(),
      sub: formatARS(stats.pendingAmount) + " en revisión",
      accent: "#a16207",
      accentBg: "rgba(161,98,7,0.08)",
      icon: (
        <svg
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      href: "/admin/payments?status=pending",
      urgent: stats.pendingPayments > 0,
    },
    {
      label: "Saldo por cobrar",
      value: formatARS(stats.totalBalance),
      sub: `de ${formatARS(stats.totalExpected)} esperado`,
      accent: "#c2410c",
      accentBg: "rgba(194,65,12,0.08)",
      icon: (
        <svg
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      ),
    },
    {
      label: "Tasa de aprobación",
      value: `${stats.approvalRate}%`,
      sub: `${stats.rejectedCount} rechazado${stats.rejectedCount !== 1 ? "s" : ""}`,
      accent: "#7c3aed",
      accentBg: "rgba(124,58,237,0.08)",
      icon: (
        <svg
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      label: "Cobrado del total",
      value: `${collectionPct}%`,
      sub: "progreso de recaudación",
      accent: "#0f7b55",
      accentBg: "rgba(15,123,85,0.08)",
      progress: collectionPct,
      icon: (
        <svg
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <style>{`
        .ds-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.875rem;
        }
        @media (min-width: 768px) {
          .ds-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 1280px) {
          .ds-grid { grid-template-columns: repeat(6, 1fr); }
        }
        .ds-card {
          background: #ffffff;
          border-radius: 1.25rem;
          padding: 1.125rem 1.125rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
          text-decoration: none;
          transition: box-shadow 0.15s, transform 0.15s;
          position: relative;
          overflow: hidden;
        }
        .ds-card:hover {
          box-shadow: 0 6px 20px rgba(0,0,0,0.08);
          transform: translateY(-1px);
        }
        .ds-card--urgent::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: #a16207;
          border-radius: 1.25rem 1.25rem 0 0;
        }
        .ds-card__icon {
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ds-card__value {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: clamp(1.125rem, 2vw, 1.5rem);
          font-weight: 800;
          color: #18181b;
          letter-spacing: -0.02em;
          line-height: 1;
        }
        .ds-card__label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #52525b;
          margin-top: 0.25rem;
        }
        .ds-card__sub {
          font-size: 0.6875rem;
          color: #a1a1aa;
          margin-top: 0.125rem;
        }
        .ds-card__track {
          width: 100%;
          height: 4px;
          background: #e4e4e7;
          border-radius: 9999px;
          overflow: hidden;
          margin-top: 0.25rem;
        }
        .ds-card__fill {
          height: 100%;
          border-radius: 9999px;
          transition: width 0.8s cubic-bezier(0.34,1.2,0.64,1);
        }
      `}</style>

      <div className="ds-grid">
        {cards.map((card) => {
          const Tag = card.href ? "a" : "div";
          const props = card.href ? { href: card.href } : {};

          return (
            <Tag
              key={card.label}
              {...props}
              className={`ds-card${card.urgent ? " ds-card--urgent" : ""}`}
            >
              <div
                className="ds-card__icon"
                style={{ background: card.accentBg, color: card.accent }}
              >
                {card.icon}
              </div>
              <div>
                <p className="ds-card__value">{card.value}</p>
                <p className="ds-card__label">{card.label}</p>
                <p className="ds-card__sub">{card.sub}</p>
              </div>
              {card.progress !== undefined && (
                <div className="ds-card__track">
                  <div
                    className="ds-card__fill"
                    style={{
                      width: `${card.progress}%`,
                      background: card.accent,
                    }}
                  />
                </div>
              )}
            </Tag>
          );
        })}
      </div>
    </>
  );
}
