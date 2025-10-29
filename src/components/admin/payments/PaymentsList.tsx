// src/components/admin/payments/PaymentsList.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PaymentReviewModal from "./PaymentReviewModal";
import { PaymentWithUser, SchoolBasic } from "@/types";

interface Props {
  initialPayments: PaymentWithUser[];
  schools: SchoolBasic[];
  adminId: string;
}

export default function PaymentsList({
  initialPayments,
  schools,
  adminId,
}: Props) {
  const router = useRouter();
  const payments = initialPayments;
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentWithUser | null>(null);
  const [selectedPayments, setSelectedPayments] = useState<PaymentWithUser[]>(
    [],
  ); // Array of related payments
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [schoolFilter, setSchoolFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    const matchesStatus =
      statusFilter === "all" || payment.status === statusFilter.toUpperCase();

    const matchesSchool =
      schoolFilter === "" ||
      payment.user.schoolDivision?.school.id === schoolFilter;

    const matchesSearch =
      searchTerm === "" ||
      payment.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.user.dni.includes(searchTerm) ||
      payment.transactionRef?.includes(searchTerm);

    return matchesStatus && matchesSchool && matchesSearch;
  });

  // Group by transaction ref for display
  const groupedPayments = filteredPayments.reduce(
    (acc, payment) => {
      const ref = payment.transactionRef || payment.id;
      if (!acc[ref]) {
        acc[ref] = [];
      }
      acc[ref].push(payment);
      return acc;
    },
    {} as Record<string, PaymentWithUser[]>,
  );

  const handleReviewClick = (payment: PaymentWithUser) => {
    // Find all payments with the same transaction reference
    const relatedPayments = payments.filter(
      (p) => p.transactionRef === payment.transactionRef,
    );

    setSelectedPayment(payment);
    setSelectedPayments(relatedPayments); // Pass all related payments
    setIsReviewModalOpen(true);
  };

  const handleReviewComplete = () => {
    setIsReviewModalOpen(false);
    setSelectedPayment(null);
    setSelectedPayments([]);
    router.refresh();
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
    };

    const labels = {
      PENDING: "Pendiente",
      APPROVED: "Aprobado",
      REJECTED: "Rechazado",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}
      >
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              placeholder="Nombre, DNI o Ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendientes</option>
              <option value="approved">Aprobados</option>
              <option value="rejected">Rechazados</option>
            </select>
          </div>

          {/* School Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Colegio
            </label>
            <select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todos los colegios</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando{" "}
            <span className="font-semibold">{filteredPayments.length}</span> de{" "}
            <span className="font-semibold">{payments.length}</span> pagos
          </div>
          {(searchTerm || statusFilter !== "all" || schoolFilter) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setSchoolFilter("");
              }}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Payments Table */}
      {Object.keys(groupedPayments).length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estudiante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Colegio / División
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cuota(s)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(groupedPayments).map(([ref, groupPayments]) => {
                  const firstPayment = groupPayments[0];
                  const totalAmount = groupPayments.reduce(
                    (sum, p) => sum + p.amount,
                    0,
                  );
                  const installments = groupPayments
                    .map((p) => p.installmentNumber)
                    .filter((n) => n !== null)
                    .sort((a, b) => a! - b!)
                    .join(", ");

                  return (
                    <tr
                      key={ref}
                      className={`hover:bg-gray-50 ${
                        firstPayment.status === "PENDING"
                          ? "bg-yellow-50/30"
                          : ""
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 font-semibold text-sm">
                              {firstPayment.user.firstName[0]}
                              {firstPayment.user.lastName[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {firstPayment.user.firstName}{" "}
                              {firstPayment.user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              DNI: {firstPayment.user.dni}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {firstPayment.user.schoolDivision ? (
                          <div className="text-sm">
                            <div className="text-gray-900">
                              {firstPayment.user.schoolDivision.school.name}
                            </div>
                            <div className="text-gray-500">
                              {firstPayment.user.schoolDivision.division} -{" "}
                              {firstPayment.user.schoolDivision.year}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">
                            Sin asignar
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {installments || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          ${totalAmount.toLocaleString("es-AR")}
                        </div>
                        {groupPayments.length > 1 && (
                          <div className="text-xs text-gray-500">
                            {groupPayments.length} cuota(s)
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(firstPayment.submittedAt).toLocaleDateString(
                          "es-AR",
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(firstPayment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {firstPayment.status === "PENDING" ? (
                          <button
                            onClick={() => handleReviewClick(firstPayment)}
                            className="text-indigo-600 hover:text-indigo-900 font-medium"
                          >
                            Revisar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReviewClick(firstPayment)}
                            className="text-gray-600 hover:text-gray-900 font-medium"
                          >
                            Ver detalles
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No se encontraron pagos
          </h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== "all" || schoolFilter
              ? "Intentá con otros filtros"
              : "Los pagos enviados por los estudiantes aparecerán aquí"}
          </p>
        </div>
      )}

      {/* Review Modal */}
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
    </div>
  );
}
