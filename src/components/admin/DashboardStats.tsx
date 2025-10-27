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

export default function DashboardStats({ stats }: Props) {
  const statCards = [
    {
      name: "Estudiantes Totales",
      value: stats.totalStudents,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
      color: "from-blue-500 to-blue-600",
      bgLight: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      name: "Colegios",
      value: stats.totalSchools,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
      color: "from-green-500 to-green-600",
      bgLight: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      name: "Pagos Pendientes",
      value: stats.pendingPayments,
      subtitle: `$${stats.pendingAmount.toLocaleString("es-AR")}`,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "from-yellow-500 to-yellow-600",
      bgLight: "bg-yellow-50",
      textColor: "text-yellow-600",
      link: "/admin/payments?status=pending",
    },
    {
      name: "Ingresos Confirmados",
      value: `$${stats.totalRevenue.toLocaleString("es-AR")}`,
      subtitle: `${stats.approvedCount} pagos aprobados`,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "from-emerald-500 to-emerald-600",
      bgLight: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
    {
      name: "Balance Total Pendiente",
      value: `$${stats.totalBalance.toLocaleString("es-AR")}`,
      subtitle: `de $${stats.totalExpected.toLocaleString("es-AR")} esperado`,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "from-orange-500 to-orange-600",
      bgLight: "bg-orange-50",
      textColor: "text-orange-600",
    },
    {
      name: "Tasa de Aprobación",
      value: `${stats.approvalRate}%`,
      subtitle: `${stats.rejectedCount} rechazados`,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00 2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      color: "from-purple-500 to-purple-600",
      bgLight: "bg-purple-50",
      textColor: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat) => {
        const CardWrapper = stat.link ? "a" : "div";
        const cardProps = stat.link
          ? { href: stat.link, className: "cursor-pointer" }
          : {};

        return (
          <CardWrapper key={stat.name} {...cardProps}>
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all border border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.name}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stat.value}
                  </p>
                  {stat.subtitle && (
                    <p className="text-xs text-gray-500 mt-1">
                      {stat.subtitle}
                    </p>
                  )}
                </div>
                <div
                  className={`bg-linear-to-br ${stat.color} p-3 rounded-lg shadow-sm`}
                >
                  <div className="text-white">{stat.icon}</div>
                </div>
              </div>
            </div>
          </CardWrapper>
        );
      })}
    </div>
  );
}
