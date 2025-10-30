"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import EditStudentModal from "./EditStudentModal";
import QuickSizeModal from "./QuickSizeModal";
import { normalizeForSearch } from "@/lib/utils/search";
import type {
  SerializedUserWithRelations,
  SchoolFormData,
  ProductFormData,
} from "@/types";

interface Props {
  students: SerializedUserWithRelations[];
  schools: SchoolFormData[];
  products: ProductFormData[];
}
export default function StudentsList({
  students: initialStudents,
  schools,
  products,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get division filter from URL
  const divisionFilter = searchParams?.get("division") || "";

  // Use setter to enable updates
  const [students, setStudents] = useState(initialStudents);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] =
    useState<SerializedUserWithRelations | null>(null);

  // Quick size modal state
  const [isQuickSizeModalOpen, setIsQuickSizeModalOpen] = useState(false);
  const [sizeEditStudent, setSizeEditStudent] =
    useState<SerializedUserWithRelations | null>(null);

  // Get division info if filtering
  const [divisionInfo, setDivisionInfo] = useState<{
    name: string;
    schoolName: string;
  } | null>(null);

  useEffect(() => {
    if (divisionFilter) {
      // Find the student with this division to get division info
      const studentWithDivision = students.find(
        (s) => s.schoolDivision?.id === divisionFilter,
      );
      if (studentWithDivision?.schoolDivision) {
        setDivisionInfo({
          name: `${studentWithDivision.schoolDivision.division} - ${studentWithDivision.schoolDivision.year}`,
          schoolName: studentWithDivision.schoolDivision.school.name,
        });
      }
    }
  }, [divisionFilter, students]);

  // Filter students with accent-insensitive search
  const filteredStudents = students.filter((student) => {
    // Accent-insensitive search
    const normalizedSearch = normalizeForSearch(searchTerm);
    const matchesSearch =
      searchTerm === "" ||
      normalizeForSearch(student.firstName).includes(normalizedSearch) ||
      normalizeForSearch(student.lastName).includes(normalizedSearch) ||
      normalizeForSearch(`${student.firstName} ${student.lastName}`).includes(
        normalizedSearch,
      ) ||
      normalizeForSearch(student.dni).includes(normalizedSearch) ||
      (student.email &&
        normalizeForSearch(student.email).includes(normalizedSearch));

    const matchesSchool =
      selectedSchool === "" ||
      student.schoolDivision?.school.id === selectedSchool;

    const matchesProduct =
      selectedProduct === "" || student.product.id === selectedProduct;

    // Division filter from URL
    const matchesDivision =
      divisionFilter === "" || student.schoolDivision?.id === divisionFilter;

    return matchesSearch && matchesSchool && matchesProduct && matchesDivision;
  });

  const getBalanceColor = (balance: number) => {
    if (balance === 0) return "text-green-600";
    if (balance > 0) return "text-orange-600";
    return "text-gray-600";
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedStudent(null);
  };

  const handleSizeClick = (student: SerializedUserWithRelations) => {
    setSizeEditStudent(student);
    setIsQuickSizeModalOpen(true);
  };

  const handleCloseQuickSizeModal = () => {
    setIsQuickSizeModalOpen(false);
    setSizeEditStudent(null);
  };

  const handleSizeUpdate = (studentId: string, newSize: string) => {
    // Update the local state immediately for instant feedback
    setStudents((prevStudents) =>
      prevStudents.map((student) =>
        student.id === studentId ? { ...student, size: newSize } : student,
      ),
    );
  };

  return (
    <div className="space-y-6">
      {/* Division Filter Banner */}
      {divisionFilter && divisionInfo && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-indigo-600 font-medium">
                  Filtrando por división
                </p>
                <p className="text-lg font-bold text-indigo-900">
                  {divisionInfo.schoolName} - {divisionInfo.name}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/admin/students")}
              className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 border border-indigo-300 rounded-lg hover:bg-indigo-50 font-medium transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Quitar filtro
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/students/create"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Agregar Estudiante
        </Link>
        <Link
          href="/admin/students/import"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          Importar desde Excel
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Buscar
            </label>
            <div className="relative">
              <input
                id="search"
                type="text"
                placeholder="Nombre, apellido, DNI o email (ignora acentos)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pr-10 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Limpiar búsqueda"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
            {searchTerm && (
              <p className="mt-1 text-xs text-gray-500">
                Buscando: &quot;{searchTerm}&quot; (ignora acentos y mayúsculas)
              </p>
            )}
          </div>

          {/* School Filter */}
          <div>
            <label
              htmlFor="school"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Colegio
            </label>
            <select
              id="school"
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Todos los colegios</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>

          {/* Product Filter */}
          <div>
            <label
              htmlFor="product"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Producto
            </label>
            <select
              id="product"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Todos los productos</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando{" "}
            <span className="font-semibold">{filteredStudents.length}</span> de{" "}
            <span className="font-semibold">{students.length}</span> estudiantes
          </div>
          {(searchTerm || selectedSchool || selectedProduct) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedSchool("");
                setSelectedProduct("");
              }}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Students Table */}
      {filteredStudents.length > 0 ? (
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
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Talle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    onClick={() => router.push(`/admin/students/${student.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-semibold text-sm">
                            {student.firstName[0]}
                            {student.lastName[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            DNI: {student.dni}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.schoolDivision ? (
                        <div className="text-sm">
                          <div className="text-gray-900">
                            {student.schoolDivision.school.name}
                          </div>
                          <div className="text-gray-500">
                            {student.schoolDivision.division} -{" "}
                            {student.schoolDivision.year}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">
                          Sin asignar
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.product.name}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()} // Evita que se abra el detalle al editar talle
                    >
                      {student.size ? (
                        <button
                          onClick={() => handleSizeClick(student)}
                          className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-800 hover:bg-indigo-200 transition-colors cursor-pointer group"
                          title="Click para cambiar talle"
                        >
                          {student.size}
                          <svg
                            className="w-3.5 h-3.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSizeClick(student)}
                          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                        >
                          + Agregar talle
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div
                          className={`font-semibold ${getBalanceColor(student.balance)}`}
                        >
                          ${student.balance.toLocaleString("es-AR")}
                        </div>
                        <div className="text-gray-500 text-xs">
                          de ${student.totalAmount.toLocaleString("es-AR")}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
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
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm || selectedSchool || selectedProduct || divisionFilter
              ? "No se encontraron estudiantes"
              : "No hay estudiantes registrados"}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedSchool || selectedProduct || divisionFilter
              ? "Intentá con otros filtros o términos de búsqueda"
              : "Agregá el primer estudiante para comenzar"}
          </p>
          {!searchTerm &&
            !selectedSchool &&
            !selectedProduct &&
            !divisionFilter && (
              <div className="flex gap-3 justify-center">
                <Link
                  href="/admin/students/create"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Agregar Estudiante
                </Link>
                <Link
                  href="/admin/students/import"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Importar desde Excel
                </Link>
              </div>
            )}
        </div>
      )}

      {/* Full Edit Modal */}
      {selectedStudent && (
        <EditStudentModal
          student={selectedStudent}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
        />
      )}

      {/* Quick Size Modal */}
      {sizeEditStudent && (
        <QuickSizeModal
          studentId={sizeEditStudent.id}
          studentName={`${sizeEditStudent.firstName} ${sizeEditStudent.lastName}`}
          currentSize={sizeEditStudent.size}
          isOpen={isQuickSizeModalOpen}
          onClose={handleCloseQuickSizeModal}
          onSuccess={(newSize) => handleSizeUpdate(sizeEditStudent.id, newSize)}
        />
      )}
    </div>
  );
}
