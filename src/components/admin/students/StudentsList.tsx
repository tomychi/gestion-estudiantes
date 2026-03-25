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

function formatARS(n: number) {
  return n.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

export default function StudentsList({
  students: initialStudents,
  schools,
  products,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const divisionFilter = searchParams?.get("division") || "";

  const [students, setStudents] = useState(initialStudents);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] =
    useState<SerializedUserWithRelations | null>(null);
  const [isQuickSizeModalOpen, setIsQuickSizeModalOpen] = useState(false);
  const [sizeEditStudent, setSizeEditStudent] =
    useState<SerializedUserWithRelations | null>(null);
  const [divisionInfo, setDivisionInfo] = useState<{
    name: string;
    schoolName: string;
  } | null>(null);

  useEffect(() => {
    if (divisionFilter) {
      const s = students.find((s) => s.schoolDivision?.id === divisionFilter);
      if (s?.schoolDivision) {
        setDivisionInfo({
          name: `${s.schoolDivision.division} - ${s.schoolDivision.year}`,
          schoolName: s.schoolDivision.school.name,
        });
      }
    }
  }, [divisionFilter, students]);

  const filteredStudents = students.filter((student) => {
    const norm = normalizeForSearch(searchTerm);
    const matchesSearch =
      !searchTerm ||
      normalizeForSearch(student.firstName).includes(norm) ||
      normalizeForSearch(student.lastName).includes(norm) ||
      normalizeForSearch(`${student.firstName} ${student.lastName}`).includes(
        norm,
      ) ||
      normalizeForSearch(student.dni).includes(norm) ||
      (student.email && normalizeForSearch(student.email).includes(norm));
    const matchesSchool =
      !selectedSchool || student.schoolDivision?.school.id === selectedSchool;
    const matchesProduct =
      !selectedProduct || student.product.id === selectedProduct;
    const matchesDivision =
      !divisionFilter || student.schoolDivision?.id === divisionFilter;
    return matchesSearch && matchesSchool && matchesProduct && matchesDivision;
  });

  const hasFilters = !!(searchTerm || selectedSchool || selectedProduct);

  const handleSizeClick = (student: SerializedUserWithRelations) => {
    setSizeEditStudent(student);
    setIsQuickSizeModalOpen(true);
  };

  const handleSizeUpdate = (studentId: string, newSize: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, size: newSize } : s)),
    );
  };

  return (
    <>
      <style>{`
        /* ── Tokens ──────────────────────────────────────── */
        .sl-root {
          --font-display: 'Plus Jakarta Sans', sans-serif;
          --font-body:    'DM Sans', sans-serif;
          --bg:           #f4f4f5;
          --surface:      #ffffff;
          --surface-2:    #f4f4f5;
          --surface-3:    #e4e4e7;
          --primary:      #00618e;
          --primary-tint: rgba(0,97,142,0.08);
          --primary-tint-s: rgba(0,97,142,0.14);
          --text-1:       #18181b;
          --text-2:       #52525b;
          --text-3:       #a1a1aa;
          --success:      #0f7b55;
          --success-bg:   rgba(15,123,85,0.08);
          --warning:      #a16207;
          --warning-bg:   rgba(161,98,7,0.08);
          --danger:       #b91c1c;
          --danger-bg:    rgba(185,28,28,0.08);
          --r-sm:  0.5rem;
          --r-md:  0.875rem;
          --r-lg:  1.25rem;
          --r-xl:  1.75rem;
          --r-full: 9999px;
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);

          font-family: var(--font-body);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          -webkit-font-smoothing: antialiased;
        }
        .sl-root *, .sl-root *::before, .sl-root *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* ── Page header ─────────────────────────────────── */
        .sl-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .sl-page-title {
          font-family: var(--font-display);
          font-size: clamp(1.375rem, 3vw, 1.875rem);
          font-weight: 800;
          color: var(--text-1);
          letter-spacing: -0.02em;
        }
        .sl-page-sub {
          font-size: 0.875rem;
          color: var(--text-3);
          margin-top: 0.2rem;
        }
        .sl-actions {
          display: flex;
          gap: 0.625rem;
          flex-wrap: wrap;
        }
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.125rem;
          border-radius: var(--r-full);
          font-family: var(--font-display);
          font-size: 0.875rem;
          font-weight: 700;
          background: linear-gradient(135deg, var(--primary) 0%, #0089c6 100%);
          color: white;
          text-decoration: none;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,97,142,0.3);
          transition: transform 0.15s, box-shadow 0.15s;
          white-space: nowrap;
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0,97,142,0.35);
        }
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.125rem;
          border-radius: var(--r-full);
          font-family: var(--font-display);
          font-size: 0.875rem;
          font-weight: 700;
          background: rgba(15,123,85,0.1);
          color: var(--success);
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: background 0.15s;
          white-space: nowrap;
        }
        .btn-secondary:hover { background: rgba(15,123,85,0.16); }

        /* ── Division banner ─────────────────────────────── */
        .sl-division-banner {
          background: var(--primary-tint);
          border: 1px solid rgba(0,97,142,0.15);
          border-radius: var(--r-lg);
          padding: 0.875rem 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .sl-division-banner__info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .sl-division-banner__icon {
          width: 2rem;
          height: 2rem;
          border-radius: var(--r-sm);
          background: var(--primary-tint-s);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          flex-shrink: 0;
        }
        .sl-division-banner__label { font-size: 0.75rem; color: var(--primary); font-weight: 600; }
        .sl-division-banner__name {
          font-family: var(--font-display);
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--primary);
        }
        .sl-division-banner__clear {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.4rem 0.875rem;
          border-radius: var(--r-full);
          font-size: 0.8125rem;
          font-weight: 600;
          background: white;
          color: var(--primary);
          border: 1px solid rgba(0,97,142,0.2);
          cursor: pointer;
          transition: background 0.12s;
          white-space: nowrap;
        }
        .sl-division-banner__clear:hover { background: var(--primary-tint-s); }

        /* ── Filters ─────────────────────────────────────── */
        .sl-filters {
          background: var(--surface);
          border-radius: var(--r-xl);
          box-shadow: var(--shadow-sm);
          padding: 1.125rem;
        }
        .sl-filters__grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.75rem;
        }
        @media (min-width: 640px) {
          .sl-filters__grid { grid-template-columns: 2fr 1fr 1fr; }
        }
        .sl-filter-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-2);
          margin-bottom: 0.375rem;
          display: block;
        }
        .sl-input, .sl-select {
          width: 100%;
          padding: 0.6875rem 0.875rem;
          border-radius: var(--r-md);
          border: 1.5px solid var(--surface-3);
          background: var(--surface-2);
          font-family: var(--font-body);
          font-size: 0.875rem;
          color: var(--text-1);
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          -webkit-appearance: none;
        }
        .sl-input::placeholder { color: var(--text-3); }
        .sl-input:focus, .sl-select:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(0,97,142,0.12);
          background: white;
        }
        .sl-input-wrap { position: relative; }
        .sl-input-clear {
          position: absolute;
          right: 0.625rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-3);
          display: flex;
          padding: 0.25rem;
          border-radius: var(--r-sm);
          transition: color 0.12s;
        }
        .sl-input-clear:hover { color: var(--text-1); }
        .sl-filters__meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 0.875rem;
          padding-top: 0.875rem;
          border-top: 1px solid var(--surface-3);
        }
        .sl-filters__count { font-size: 0.8125rem; color: var(--text-2); }
        .sl-filters__count strong { color: var(--text-1); font-weight: 700; }
        .sl-filters__clear {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--primary);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: opacity 0.12s;
        }
        .sl-filters__clear:hover { opacity: 0.7; }

        /* ── Table (desktop) ─────────────────────────────── */
        .sl-table-wrap {
          background: var(--surface);
          border-radius: var(--r-xl);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
        }
        .sl-table {
          width: 100%;
          border-collapse: collapse;
        }
        .sl-table thead {
          background: var(--surface-2);
          border-bottom: 1px solid var(--surface-3);
        }
        .sl-table th {
          padding: 0.75rem 1.25rem;
          text-align: left;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-3);
          white-space: nowrap;
        }
        .sl-table td {
          padding: 0.875rem 1.25rem;
          border-bottom: 1px solid var(--surface-2);
          vertical-align: middle;
        }
        .sl-table tbody tr:last-child td { border-bottom: none; }
        .sl-table tbody tr {
          cursor: pointer;
          transition: background 0.1s;
        }
        .sl-table tbody tr:hover { background: var(--surface-2); }

        /* ── Avatar ──────────────────────────────────────── */
        .sl-avatar {
          width: 2.25rem;
          height: 2.25rem;
          border-radius: var(--r-full);
          background: var(--primary-tint);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--primary);
          flex-shrink: 0;
        }
        .sl-student-name {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--text-1);
        }
        .sl-student-dni {
          font-size: 0.75rem;
          color: var(--text-3);
          margin-top: 0.1rem;
        }
        .sl-school-name { font-size: 0.875rem; color: var(--text-1); font-weight: 500; }
        .sl-division { font-size: 0.75rem; color: var(--text-3); margin-top: 0.1rem; }

        /* ── Size chip ───────────────────────────────────── */
        .sl-size-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.625rem;
          border-radius: var(--r-full);
          font-size: 0.75rem;
          font-weight: 700;
          background: var(--primary-tint);
          color: var(--primary);
          border: none;
          cursor: pointer;
          transition: background 0.12s;
        }
        .sl-size-chip:hover { background: var(--primary-tint-s); }
        .sl-size-add {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--primary);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: opacity 0.12s;
          white-space: nowrap;
        }
        .sl-size-add:hover { opacity: 0.7; }

        /* ── Balance ─────────────────────────────────────── */
        .sl-balance-ok   { font-weight: 700; font-size: 0.875rem; color: var(--success); }
        .sl-balance-due  { font-weight: 700; font-size: 0.875rem; color: var(--warning); }
        .sl-balance-sub  { font-size: 0.6875rem; color: var(--text-3); margin-top: 0.1rem; }

        /* ── Mobile cards ────────────────────────────────── */
        .sl-cards {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }
        .sl-card {
          background: var(--surface);
          border-radius: var(--r-lg);
          box-shadow: var(--shadow-sm);
          padding: 1rem;
          cursor: pointer;
          transition: box-shadow 0.12s;
        }
        .sl-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
        .sl-card__top {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .sl-card__info { flex: 1; min-width: 0; }
        .sl-card__balance { text-align: right; flex-shrink: 0; }
        .sl-card__school {
          font-size: 0.75rem;
          color: var(--text-3);
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px solid var(--surface-2);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        /* ── Empty state ─────────────────────────────────── */
        .sl-empty {
          background: var(--surface);
          border-radius: var(--r-xl);
          box-shadow: var(--shadow-sm);
          padding: 3rem 1.5rem;
          text-align: center;
        }
        .sl-empty__icon {
          width: 3.5rem;
          height: 3.5rem;
          margin: 0 auto 1rem;
          color: var(--text-3);
        }
        .sl-empty__title {
          font-family: var(--font-display);
          font-size: 1.0625rem;
          font-weight: 700;
          color: var(--text-1);
          margin-bottom: 0.375rem;
        }
        .sl-empty__sub { font-size: 0.875rem; color: var(--text-3); margin-bottom: 1.5rem; }
        .sl-empty__actions { display: flex; gap: 0.625rem; justify-content: center; flex-wrap: wrap; }

        /* ── Visibility helpers ──────────────────────────── */
        .sl-desktop { display: none; }
        .sl-mobile  { display: flex; flex-direction: column; gap: 0.625rem; }
        @media (min-width: 768px) {
          .sl-desktop { display: block; }
          .sl-mobile  { display: none; }
        }
      `}</style>

      <div className="sl-root">
        {/* Page header */}
        <div className="sl-page-header">
          <div>
            <h1 className="sl-page-title">Estudiantes</h1>
            <p className="sl-page-sub">Gestioná los estudiantes y sus pagos</p>
          </div>
          <div className="sl-actions">
            <Link href="/admin/students/create" className="btn-primary">
              <svg
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                viewBox="0 0 24 24"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Agregar
            </Link>
            <Link href="/admin/students/import" className="btn-secondary">
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
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              Importar Excel
            </Link>
          </div>
        </div>

        {/* Division filter banner */}
        {divisionFilter && divisionInfo && (
          <div className="sl-division-banner">
            <div className="sl-division-banner__info">
              <div className="sl-division-banner__icon">
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
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
              </div>
              <div>
                <p className="sl-division-banner__label">
                  Filtrando por división
                </p>
                <p className="sl-division-banner__name">
                  {divisionInfo.schoolName} — {divisionInfo.name}
                </p>
              </div>
            </div>
            <button
              className="sl-division-banner__clear"
              onClick={() => router.push("/admin/students")}
            >
              <svg
                width="12"
                height="12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                viewBox="0 0 24 24"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Quitar filtro
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="sl-filters">
          <div className="sl-filters__grid">
            <div>
              <label htmlFor="search" className="sl-filter-label">
                Buscar
              </label>
              <div className="sl-input-wrap">
                <input
                  id="search"
                  type="text"
                  placeholder="Nombre, apellido, DNI o email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="sl-input"
                  style={searchTerm ? { paddingRight: "2.25rem" } : {}}
                />
                {searchTerm && (
                  <button
                    className="sl-input-clear"
                    onClick={() => setSearchTerm("")}
                    aria-label="Limpiar búsqueda"
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
                )}
              </div>
            </div>
            <div>
              <label htmlFor="school" className="sl-filter-label">
                Colegio
              </label>
              <select
                id="school"
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="sl-select"
              >
                <option value="">Todos</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="product" className="sl-filter-label">
                Producto
              </label>
              <select
                id="product"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="sl-select"
              >
                <option value="">Todos</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="sl-filters__meta">
            <p className="sl-filters__count">
              <strong>{filteredStudents.length}</strong> de{" "}
              <strong>{students.length}</strong> estudiantes
            </p>
            {hasFilters && (
              <button
                className="sl-filters__clear"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedSchool("");
                  setSelectedProduct("");
                }}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {filteredStudents.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="sl-desktop">
              <div className="sl-table-wrap">
                <table className="sl-table">
                  <thead>
                    <tr>
                      <th>Estudiante</th>
                      <th>Colegio / División</th>
                      <th>Producto</th>
                      <th>Talle</th>
                      <th>Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr
                        key={student.id}
                        onClick={() =>
                          router.push(`/admin/students/${student.id}`)
                        }
                      >
                        {/* Student */}
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.75rem",
                            }}
                          >
                            <div className="sl-avatar">
                              {student.firstName[0]}
                              {student.lastName[0]}
                            </div>
                            <div>
                              <p className="sl-student-name">
                                {student.firstName} {student.lastName}
                              </p>
                              <p className="sl-student-dni">
                                DNI {student.dni}
                              </p>
                            </div>
                          </div>
                        </td>
                        {/* School */}
                        <td>
                          {student.schoolDivision ? (
                            <>
                              <p className="sl-school-name">
                                {student.schoolDivision.school.name}
                              </p>
                              <p className="sl-division">
                                {student.schoolDivision.division} ·{" "}
                                {student.schoolDivision.year}
                              </p>
                            </>
                          ) : (
                            <span
                              style={{
                                fontSize: "0.8125rem",
                                color: "var(--text-3)",
                              }}
                            >
                              Sin asignar
                            </span>
                          )}
                        </td>
                        {/* Product */}
                        <td
                          style={{
                            fontSize: "0.875rem",
                            color: "var(--text-1)",
                          }}
                        >
                          {student.product?.name || "—"}
                        </td>
                        {/* Size — stop propagation */}
                        <td onClick={(e) => e.stopPropagation()}>
                          {student.size ? (
                            <button
                              className="sl-size-chip"
                              onClick={() => handleSizeClick(student)}
                            >
                              {student.size}
                              <svg
                                width="10"
                                height="10"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                viewBox="0 0 24 24"
                              >
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                          ) : (
                            <button
                              className="sl-size-add"
                              onClick={() => handleSizeClick(student)}
                            >
                              + Agregar talle
                            </button>
                          )}
                        </td>
                        {/* Balance */}
                        <td>
                          <p
                            className={
                              student.balance === 0
                                ? "sl-balance-ok"
                                : "sl-balance-due"
                            }
                          >
                            {formatARS(student.balance)}
                          </p>
                          <p className="sl-balance-sub">
                            de {formatARS(student.totalAmount)}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="sl-mobile">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="sl-card"
                  onClick={() => router.push(`/admin/students/${student.id}`)}
                >
                  <div className="sl-card__top">
                    <div className="sl-avatar">
                      {student.firstName[0]}
                      {student.lastName[0]}
                    </div>
                    <div className="sl-card__info">
                      <p className="sl-student-name">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="sl-student-dni">DNI {student.dni}</p>
                    </div>
                    <div className="sl-card__balance">
                      <p
                        className={
                          student.balance === 0
                            ? "sl-balance-ok"
                            : "sl-balance-due"
                        }
                      >
                        {formatARS(student.balance)}
                      </p>
                      <p className="sl-balance-sub">
                        {student.balance === 0 ? "Al día" : "pendiente"}
                      </p>
                    </div>
                  </div>
                  <div className="sl-card__school">
                    <span>
                      {student.schoolDivision
                        ? `${student.schoolDivision.school.name} · ${student.schoolDivision.division}`
                        : "Sin asignar"}
                    </span>
                    {student.size ? (
                      <button
                        className="sl-size-chip"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSizeClick(student);
                        }}
                      >
                        {student.size}
                      </button>
                    ) : (
                      <button
                        className="sl-size-add"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSizeClick(student);
                        }}
                      >
                        + Talle
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="sl-empty">
            <svg
              className="sl-empty__icon"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
              />
            </svg>
            <p className="sl-empty__title">
              {hasFilters || divisionFilter
                ? "Sin resultados"
                : "No hay estudiantes"}
            </p>
            <p className="sl-empty__sub">
              {hasFilters || divisionFilter
                ? "Intentá con otros filtros o términos de búsqueda"
                : "Agregá el primer estudiante para comenzar"}
            </p>
            {!hasFilters && !divisionFilter && (
              <div className="sl-empty__actions">
                <Link href="/admin/students/create" className="btn-primary">
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    viewBox="0 0 24 24"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Agregar estudiante
                </Link>
                <Link href="/admin/students/import" className="btn-secondary">
                  Importar Excel
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Modals */}
        {selectedStudent && (
          <EditStudentModal
            student={selectedStudent}
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedStudent(null);
            }}
          />
        )}
        {sizeEditStudent && (
          <QuickSizeModal
            studentId={sizeEditStudent.id}
            studentName={`${sizeEditStudent.firstName} ${sizeEditStudent.lastName}`}
            currentSize={sizeEditStudent.size}
            isOpen={isQuickSizeModalOpen}
            onClose={() => {
              setIsQuickSizeModalOpen(false);
              setSizeEditStudent(null);
            }}
            onSuccess={(newSize) =>
              handleSizeUpdate(sizeEditStudent.id, newSize)
            }
          />
        )}
      </div>
    </>
  );
}
