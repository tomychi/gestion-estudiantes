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
      <style>{`
        .scl-root {
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
          --danger:       #b91c1c;
          --danger-bg:    rgba(185,28,28,0.08);
          --danger-border: rgba(185,28,28,0.2);
          --r-md:  0.875rem;
          --r-lg:  1.25rem;
          --r-xl:  1.75rem;
          --r-full: 9999px;
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
          --shadow-md: 0 4px 16px rgba(0,0,0,0.08);

          font-family: var(--font-body);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          -webkit-font-smoothing: antialiased;
        }
        .scl-root *, .scl-root *::before, .scl-root *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* ── Page header ─────────────────────────────────── */
        .scl-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .scl-title {
          font-family: var(--font-display);
          font-size: clamp(1.375rem, 3vw, 1.875rem);
          font-weight: 800;
          color: var(--text-1);
          letter-spacing: -0.02em;
        }
        .scl-sub { font-size: 0.875rem; color: var(--text-3); margin-top: 0.2rem; }

        /* ── Buttons ─────────────────────────────────────── */
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.125rem;
          border-radius: var(--r-full);
          font-family: var(--font-display);
          font-size: 0.875rem;
          font-weight: 700;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-mid) 100%);
          color: white;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,97,142,0.3);
          transition: transform 0.15s, box-shadow 0.15s;
          white-space: nowrap;
          text-decoration: none;
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,97,142,0.38); }

        /* ── Info banner ─────────────────────────────────── */
        .scl-info {
          background: var(--primary-tint);
          border: 1px solid rgba(0,97,142,0.14);
          border-radius: var(--r-lg);
          padding: 0.875rem 1rem;
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }
        .scl-info__icon {
          width: 1.75rem;
          height: 1.75rem;
          border-radius: var(--r-md);
          background: var(--primary-tint-s);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          flex-shrink: 0;
        }
        .scl-info__title { font-size: 0.8125rem; font-weight: 700; color: var(--primary); margin-bottom: 0.2rem; }
        .scl-info__body  { font-size: 0.8125rem; color: #004e73; line-height: 1.4; }

        /* ── Grid ────────────────────────────────────────── */
        .scl-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.875rem;
        }
        @media (min-width: 640px)  { .scl-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1280px) { .scl-grid { grid-template-columns: repeat(3, 1fr); } }

        /* ── Card ────────────────────────────────────────── */
        .scl-card {
          background: var(--surface);
          border-radius: var(--r-xl);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: box-shadow 0.15s, transform 0.15s;
        }
        .scl-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }

        .scl-card__link {
          display: block;
          padding: 1.25rem 1.25rem 1rem;
          text-decoration: none;
          flex: 1;
        }
        .scl-card__name-row {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          margin-bottom: 0.375rem;
        }
        .scl-card__name {
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-1);
          transition: color 0.12s;
        }
        .scl-card:hover .scl-card__name { color: var(--primary); }
        .scl-card__arrow {
          color: var(--text-3);
          transition: color 0.12s, transform 0.12s;
          flex-shrink: 0;
        }
        .scl-card:hover .scl-card__arrow { color: var(--primary); transform: translateX(3px); }
        .scl-card__address {
          display: flex;
          align-items: flex-start;
          gap: 0.25rem;
          font-size: 0.8125rem;
          color: var(--text-3);
          margin-bottom: 1rem;
        }
        .scl-card__address svg { flex-shrink: 0; margin-top: 0.1rem; }

        /* Stats inside card */
        .scl-card__stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          padding-top: 0.875rem;
          border-top: 1px solid var(--surface-2);
        }
        .scl-stat {
          border-radius: var(--r-md);
          padding: 0.625rem 0.75rem;
        }
        .scl-stat--students { background: var(--primary-tint); }
        .scl-stat--divisions { background: rgba(124,58,237,0.07); }
        .scl-stat__label {
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 0.2rem;
        }
        .scl-stat--students .scl-stat__label { color: var(--primary); }
        .scl-stat--divisions .scl-stat__label { color: #7c3aed; }
        .scl-stat__value {
          font-family: var(--font-display);
          font-size: 1.375rem;
          font-weight: 800;
          line-height: 1;
        }
        .scl-stat--students .scl-stat__value  { color: var(--primary); }
        .scl-stat--divisions .scl-stat__value { color: #7c3aed; }

        /* Card actions */
        .scl-card__actions {
          display: flex;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border-top: 1px solid var(--surface-2);
          background: var(--surface-2);
        }
        .scl-card__act-btn {
          flex: 1;
          padding: 0.5rem;
          border-radius: var(--r-md);
          font-size: 0.8125rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: background 0.12s;
        }
        .scl-card__act-btn--edit {
          background: var(--primary-tint);
          color: var(--primary);
        }
        .scl-card__act-btn--edit:hover { background: var(--primary-tint-s); }
        .scl-card__act-btn--delete {
          background: var(--danger-bg);
          color: var(--danger);
        }
        .scl-card__act-btn--delete:hover { background: rgba(185,28,28,0.14); }

        /* ── Empty state ─────────────────────────────────── */
        .scl-empty {
          background: var(--surface);
          border-radius: var(--r-xl);
          box-shadow: var(--shadow-sm);
          padding: 3rem 1.5rem;
          text-align: center;
        }
        .scl-empty__icon { width: 3.5rem; height: 3.5rem; margin: 0 auto 1rem; color: var(--text-3); }
        .scl-empty__title {
          font-family: var(--font-display);
          font-size: 1.0625rem;
          font-weight: 700;
          color: var(--text-1);
          margin-bottom: 0.375rem;
        }
        .scl-empty__sub { font-size: 0.875rem; color: var(--text-3); margin-bottom: 1.5rem; }
      `}</style>

      <div className="scl-root">
        {/* Page header */}
        <div className="scl-page-header">
          <div>
            <h1 className="scl-title">Colegios</h1>
            <p className="scl-sub">Gestioná los colegios del sistema</p>
          </div>
          <button
            className="btn-primary"
            onClick={() => setIsCreateModalOpen(true)}
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
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Agregar colegio
          </button>
        </div>

        {/* Info banner */}
        <div className="scl-info">
          <div className="scl-info__icon">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <p className="scl-info__title">
              Las divisiones se crean automáticamente
            </p>
            <p className="scl-info__body">
              Cuando cargues o importes estudiantes, el sistema creará las
              divisiones con el año de egreso correspondiente.
            </p>
          </div>
        </div>

        {/* Grid or empty */}
        {schools.length > 0 ? (
          <div className="scl-grid">
            {schools.map((school) => (
              <div key={school.id} className="scl-card">
                <Link
                  href={`/admin/schools/${school.id}`}
                  className="scl-card__link"
                >
                  <div className="scl-card__name-row">
                    <span className="scl-card__name">{school.name}</span>
                    <svg
                      className="scl-card__arrow"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      viewBox="0 0 24 24"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                  {school.address && (
                    <p className="scl-card__address">
                      <svg
                        width="12"
                        height="12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {school.address}
                    </p>
                  )}
                  <div className="scl-card__stats">
                    <div className="scl-stat scl-stat--students">
                      <p className="scl-stat__label">Estudiantes</p>
                      <p className="scl-stat__value">{school.studentCount}</p>
                    </div>
                    <div className="scl-stat scl-stat--divisions">
                      <p className="scl-stat__label">Divisiones</p>
                      <p className="scl-stat__value">{school.divisionCount}</p>
                    </div>
                  </div>
                </Link>
                <div className="scl-card__actions">
                  <button
                    className="scl-card__act-btn scl-card__act-btn--edit"
                    onClick={() => setEditingSchool(school)}
                  >
                    Editar
                  </button>
                  <button
                    className="scl-card__act-btn scl-card__act-btn--delete"
                    onClick={() => setDeletingSchool(school)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="scl-empty">
            <svg
              className="scl-empty__icon"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"
              />
            </svg>
            <p className="scl-empty__title">No hay colegios registrados</p>
            <p className="scl-empty__sub">
              Agregá el primer colegio para comenzar
            </p>
            <button
              className="btn-primary"
              style={{ margin: "0 auto" }}
              onClick={() => setIsCreateModalOpen(true)}
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
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Agregar primer colegio
            </button>
          </div>
        )}
      </div>

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
