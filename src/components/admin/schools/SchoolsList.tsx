"use client";

import { useState } from "react";
import Link from "next/link";
import CreateSchoolModal from "./CreateSchoolModal";
import EditSchoolModal from "./EditSchoolModal";
import DeleteSchoolModal from "./DeleteSchoolModal";
import { SchoolWithStats } from "@/types";

interface Props {
  schools: SchoolWithStats[];
}

export default function SchoolsList({ schools: initialSchools }: Props) {
  const [schools, setSchools] = useState(initialSchools);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<SchoolWithStats | null>(
    null,
  );
  const [deletingSchool, setDeletingSchool] = useState<SchoolWithStats | null>(
    null,
  );

  const handleSchoolCreated = (newSchool: SchoolWithStats) => {
    // Verificar que el colegio tenga id antes de agregarlo
    if (!newSchool.id) {
      console.error("School created without ID");
      return;
    }

    setSchools([
      ...schools,
      { ...newSchool, studentCount: 0, divisionCount: 0 },
    ]);
    setIsCreateModalOpen(false);
  };

  const handleSchoolUpdated = (updatedSchool: SchoolWithStats) => {
    setSchools(
      schools.map((s) =>
        s.id === updatedSchool.id
          ? {
              ...updatedSchool,
              studentCount: s.studentCount,
              divisionCount: s.divisionCount,
            }
          : s,
      ),
    );
    setEditingSchool(null);
  };

  const handleSchoolDeleted = (schoolId: string) => {
    setSchools(schools.filter((s) => s.id !== schoolId));
    setDeletingSchool(null);
  };

  return (
    <>
      {/* Create Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsCreateModalOpen(true)}
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
          Agregar Colegio
        </button>
      </div>

      {/* Schools Grid */}
      {schools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schools.map((school) => (
            <div key={school.id} className="mb-3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all overflow-hidden group">
                <Link
                  href={`/admin/schools/${school.id}`}
                  className="block group-hover:opacity-90 transition-opacity"
                >
                  <div className="p-6 pb-4">
                    {" "}
                    {/* 👈 Cambia pb-6 a pb-4 */}
                    {/* SchoolWithStats Name */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {school.name}
                          </h3>
                          <svg
                            className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                        {school.address && (
                          <p className="text-sm text-gray-600 flex items-start gap-1">
                            <svg
                              className="w-4 h-4 shrink-0 mt-0.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            <span>{school.address}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-blue-600 font-medium mb-1">
                          Estudiantes
                        </p>
                        <p className="text-2xl font-bold text-blue-700">
                          {school.studentCount}
                        </p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3">
                        <p className="text-xs text-purple-600 font-medium mb-1">
                          Divisiones
                        </p>
                        <p className="text-2xl font-bold text-purple-700">
                          {school.divisionCount}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Actions - DENTRO de la card pero FUERA del Link */}
                <div className="flex gap-2 px-6 pb-6 pt-2">
                  {" "}
                  {/* 👈 Agrega pt-2 para separación */}
                  <button
                    onClick={() => setEditingSchool(school)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setDeletingSchool(school)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
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
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay colegios registrados
          </h3>
          <p className="text-gray-600 mb-6">
            Agregá el primer colegio para comenzar
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
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
            Agregar Primer Colegio
          </button>
        </div>
      )}

      {/* Modals */}
      <CreateSchoolModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSchoolCreated={handleSchoolCreated}
      />

      {editingSchool && (
        <EditSchoolModal
          school={editingSchool}
          isOpen={!!editingSchool}
          onClose={() => setEditingSchool(null)}
          onSchoolUpdated={handleSchoolUpdated}
        />
      )}

      {deletingSchool && (
        <DeleteSchoolModal
          school={deletingSchool}
          isOpen={!!deletingSchool}
          onClose={() => setDeletingSchool(null)}
          onSchoolDeleted={handleSchoolDeleted}
        />
      )}
    </>
  );
}
