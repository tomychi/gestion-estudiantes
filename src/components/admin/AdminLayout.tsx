"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";

interface Props {
  children: React.ReactNode;
  session: Session;
}

const NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: (
      <svg
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    name: "Estudiantes",
    href: "/admin/students",
    icon: (
      <svg
        width="18"
        height="18"
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
    name: "Colegios",
    href: "/admin/schools",
    icon: (
      <svg
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
      </svg>
    ),
  },
  {
    name: "Productos",
    href: "/admin/products",
    icon: (
      <svg
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  },
  {
    name: "Pagos",
    href: "/admin/payments",
    icon: (
      <svg
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    name: "Configuración",
    href: "/admin/settings",
    icon: (
      <svg
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

export default function AdminLayout({ children, session }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const initials =
    `${session.user.firstName?.[0] ?? ""}${session.user.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <>
      <style>{`
        /* ── Tokens ──────────────────────────────────────── */
        .al-root {
          --font-display: 'Plus Jakarta Sans', sans-serif;
          --font-body:    'DM Sans', sans-serif;
          --bg:           #f4f4f5;
          --surface:      #ffffff;
          --surface-2:    #f4f4f5;
          --surface-3:    #e4e4e7;
          --primary:      #00618e;
          --primary-mid:  #0089c6;
          --primary-lite: #3eb7fe;
          --primary-tint: rgba(0,97,142,0.08);
          --primary-tint-strong: rgba(0,97,142,0.14);
          --text-1:       #18181b;
          --text-2:       #52525b;
          --text-3:       #a1a1aa;
          --danger:       #b91c1c;
          --danger-bg:    #fff1f1;
          --sidebar-w:    15rem;
          --header-h:     3.5rem;
          --r-sm:  0.5rem;
          --r-md:  0.875rem;
          --r-lg:  1.25rem;
          --r-xl:  1.75rem;
          --r-full: 9999px;

          font-family: var(--font-body);
          background: var(--bg);
          min-height: 100svh;
          -webkit-font-smoothing: antialiased;
          display: flex;
        }
        .al-root *, .al-root *::before, .al-root *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* ── Backdrop ────────────────────────────────────── */
        .al-backdrop {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          z-index: 40;
        }
        .al-backdrop--open { display: block; }
        @media (min-width: 1024px) {
          .al-backdrop { display: none !important; }
        }

        /* ── Sidebar ─────────────────────────────────────── */
        .al-sidebar {
          position: fixed;
          inset-block: 0;
          left: 0;
          width: var(--sidebar-w);
          background: var(--surface);
          border-right: 1px solid var(--surface-3);
          display: flex;
          flex-direction: column;
          z-index: 50;
          transform: translateX(-100%);
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .al-sidebar--open { transform: translateX(0); }
        @media (min-width: 1024px) {
          .al-sidebar { transform: translateX(0); }
        }

        /* ── Sidebar brand ───────────────────────────────── */
        .al-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1.125rem 1.25rem;
          border-bottom: 1px solid var(--surface-3);
        }
        .al-brand__logo {
          width: 2.25rem;
          height: 2.25rem;
          border-radius: var(--r-md);
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-lite) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: white;
          box-shadow: 0 4px 10px rgba(0,97,142,0.3);
        }
        .al-brand__name {
          font-family: var(--font-display);
          font-size: 0.9375rem;
          font-weight: 800;
          color: var(--text-1);
          letter-spacing: -0.01em;
        }
        .al-brand__role {
          font-size: 0.6875rem;
          color: var(--text-3);
          font-weight: 500;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        /* ── Nav ─────────────────────────────────────────── */
        .al-nav {
          flex: 1;
          overflow-y: auto;
          padding: 0.75rem 0.625rem;
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }
        .al-nav__section {
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-3);
          padding: 0.625rem 0.75rem 0.375rem;
          margin-top: 0.5rem;
        }
        .al-nav__item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 0.75rem;
          border-radius: var(--r-md);
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-2);
          text-decoration: none;
          transition: background 0.12s, color 0.12s;
          position: relative;
        }
        .al-nav__item:hover {
          background: var(--surface-2);
          color: var(--text-1);
        }
        .al-nav__item--active {
          background: var(--primary-tint);
          color: var(--primary);
          font-weight: 600;
        }
        .al-nav__item--active:hover {
          background: var(--primary-tint-strong);
          color: var(--primary);
        }
        .al-nav__item--active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 25%;
          bottom: 25%;
          width: 3px;
          border-radius: 0 var(--r-full) var(--r-full) 0;
          background: var(--primary);
        }

        /* ── Sidebar user ────────────────────────────────── */
        .al-user {
          padding: 0.875rem 1rem;
          border-top: 1px solid var(--surface-3);
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }
        .al-user__info {
          display: flex;
          align-items: center;
          gap: 0.625rem;
        }
        .al-user__avatar {
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
        .al-user__name {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-1);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .al-user__label {
          font-size: 0.6875rem;
          color: var(--text-3);
        }
        .al-signout {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.5rem;
          border-radius: var(--r-md);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--danger);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: background 0.12s;
        }
        .al-signout:hover { background: var(--danger-bg); }

        /* ── Main wrapper ────────────────────────────────── */
        .al-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        @media (min-width: 1024px) {
          .al-main { margin-left: var(--sidebar-w); }
        }

        /* ── Mobile topbar ───────────────────────────────── */
        .al-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1rem;
          height: var(--header-h);
          background: var(--surface);
          border-bottom: 1px solid var(--surface-3);
          position: sticky;
          top: 0;
          z-index: 30;
        }
        @media (min-width: 1024px) {
          .al-topbar { display: none; }
        }
        .al-topbar__title {
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 800;
          color: var(--text-1);
        }
        .al-menu-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.25rem;
          height: 2.25rem;
          border-radius: var(--r-md);
          background: var(--surface-2);
          border: none;
          cursor: pointer;
          color: var(--text-2);
          transition: background 0.12s;
        }
        .al-menu-btn:hover { background: var(--surface-3); }

        /* ── Content ─────────────────────────────────────── */
        .al-content {
          flex: 1;
          padding: 1.75rem 1.5rem 3rem;
          min-width: 0;
        }
        @media (min-width: 1024px) {
          .al-content { padding: 2rem 2rem 3rem; }
        }
      `}</style>

      <div className="al-root">
        {/* Backdrop */}
        <div
          className={`al-backdrop${sidebarOpen ? " al-backdrop--open" : ""}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar */}
        <aside
          className={`al-sidebar${sidebarOpen ? " al-sidebar--open" : ""}`}
        >
          {/* Brand */}
          <div className="al-brand">
            <div className="al-brand__logo">
              <svg
                width="16"
                height="16"
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
            <div>
              <p className="al-brand__name">Sistema Alas</p>
              <p className="al-brand__role">Admin</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="al-nav" aria-label="Navegación principal">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`al-nav__item${isActive ? " al-nav__item--active" : ""}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.icon}
                  {item.name}
                </a>
              );
            })}
          </nav>

          {/* User */}
          <div className="al-user">
            <div className="al-user__info">
              <div className="al-user__avatar">{initials}</div>
              <div style={{ minWidth: 0 }}>
                <p className="al-user__name">
                  {session.user.firstName} {session.user.lastName}
                </p>
                <p className="al-user__label">Administrador</p>
              </div>
            </div>
            <button
              className="al-signout"
              onClick={() => signOut({ callbackUrl: "/login" })}
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
              Cerrar sesión
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="al-main">
          {/* Mobile topbar */}
          <div className="al-topbar">
            <p className="al-topbar__title">Sistema Alas</p>
            <button
              className="al-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                viewBox="0 0 24 24"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <main className="al-content">{children}</main>
        </div>
      </div>
    </>
  );
}
