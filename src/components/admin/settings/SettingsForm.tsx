"use client";

import { useState, useEffect } from "react";

interface Settings {
  payment_due_day: number;
  late_fee_percentage: number;
  total_recalculation_percentage: number;
}

const DEFAULTS: Settings = {
  payment_due_day: 15,
  late_fee_percentage: 10,
  total_recalculation_percentage: 0,
};

export default function SettingsForm() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        const data = await res.json();
        if (data.success) {
          // Defensive: handle data.settings, data.data, or data directly
          const s = data.settings ?? data.data ?? data;
          setSettings({
            payment_due_day: s?.payment_due_day ?? DEFAULTS.payment_due_day,
            late_fee_percentage:
              s?.late_fee_percentage ?? DEFAULTS.late_fee_percentage,
            total_recalculation_percentage:
              s?.total_recalculation_percentage ??
              DEFAULTS.total_recalculation_percentage,
          });
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const set = (patch: Partial<Settings>) =>
    setSettings((prev) => ({ ...prev, ...patch }));

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        showNotification("success", "Configuración guardada exitosamente");
      } else {
        showNotification("error", data.error || "Error al guardar");
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      showNotification("error", "Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "400px",
        }}
      >
        <style>{`
          .sf-spinner {
            width: 2.5rem; height: 2.5rem;
            border: 3px solid rgba(0,97,142,0.15);
            border-top-color: #00618e;
            border-radius: 50%;
            animation: sf-spin 0.7s linear infinite;
          }
          @keyframes sf-spin { to { transform: rotate(360deg); } }
        `}</style>
        <div className="sf-spinner" />
      </div>
    );
  }

  return (
    <>
      <style>{`
        .sf-root {
          --font-display: 'Plus Jakarta Sans', sans-serif;
          --font-body:    'DM Sans', sans-serif;
          --surface:      #ffffff;
          --surface-2:    #f4f4f5;
          --surface-3:    #e4e4e7;
          --primary:      #00618e;
          --primary-mid:  #0089c6;
          --primary-tint: rgba(0,97,142,0.08);
          --primary-tint-s: rgba(0,97,142,0.14);
          --primary-focus: rgba(0,97,142,0.15);
          --text-1:       #18181b;
          --text-2:       #52525b;
          --text-3:       #a1a1aa;
          --success:      #0f7b55;
          --success-bg:   rgba(15,123,85,0.08);
          --success-border: rgba(15,123,85,0.2);
          --danger:       #b91c1c;
          --danger-bg:    rgba(185,28,28,0.08);
          --danger-border: rgba(185,28,28,0.2);
          --r-md:  0.875rem;
          --r-lg:  1.25rem;
          --r-xl:  1.75rem;
          --r-full: 9999px;
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);

          font-family: var(--font-body);
          display: flex; flex-direction: column; gap: 1.25rem;
          max-width: 640px;
          -webkit-font-smoothing: antialiased;
        }
        .sf-root *, .sf-root *::before, .sf-root *::after {
          box-sizing: border-box; margin: 0; padding: 0;
        }

        /* Page header */
        .sf-title {
          font-family: var(--font-display);
          font-size: clamp(1.375rem, 3vw, 1.875rem);
          font-weight: 800; color: var(--text-1); letter-spacing: -0.02em;
        }
        .sf-sub { font-size: 0.875rem; color: var(--text-3); margin-top: 0.2rem; }

        /* Notification */
        .sf-notification {
          border-radius: var(--r-lg); padding: 0.875rem 1rem;
          display: flex; align-items: center; gap: 0.625rem;
          font-size: 0.875rem; font-weight: 600;
          animation: sf-fadein 0.25s ease;
        }
        @keyframes sf-fadein { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
        .sf-notification--success { background: var(--success-bg); border: 1px solid var(--success-border); color: var(--success); }
        .sf-notification--error   { background: var(--danger-bg);  border: 1px solid var(--danger-border);  color: var(--danger); }

        /* Card */
        .sf-card {
          background: var(--surface);
          border-radius: var(--r-xl);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
        }

        /* Setting rows */
        .sf-row {
          padding: 1.375rem 1.5rem;
          border-bottom: 1px solid var(--surface-2);
          display: flex; flex-direction: column; gap: 0.875rem;
        }
        .sf-row:last-child { border-bottom: none; }
        .sf-row__header {}
        .sf-row__label {
          font-family: var(--font-display);
          font-size: 0.9375rem; font-weight: 700; color: var(--text-1);
          margin-bottom: 0.25rem;
        }
        .sf-row__desc { font-size: 0.8125rem; color: var(--text-3); line-height: 1.4; }
        .sf-row__control {
          display: flex; align-items: center; gap: 0.875rem; flex-wrap: wrap;
        }
        .sf-input-wrap { position: relative; flex-shrink: 0; }
        .sf-input {
          padding: 0.6875rem 2.5rem 0.6875rem 0.875rem;
          border-radius: var(--r-md);
          border: 1.5px solid var(--surface-3);
          background: var(--surface-2);
          font-family: var(--font-display);
          font-size: 1.0625rem; font-weight: 700; color: var(--text-1);
          outline: none; width: 7rem;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
          -webkit-appearance: none; text-align: center;
        }
        .sf-input:focus { border-color: var(--primary); background: white; box-shadow: 0 0 0 3px var(--primary-focus); }
        .sf-input-suffix {
          position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%);
          font-size: 0.8125rem; font-weight: 600; color: var(--text-3); pointer-events: none;
        }
        .sf-preview {
          font-size: 0.8125rem; font-weight: 600; color: var(--primary);
          background: var(--primary-tint);
          border-radius: var(--r-full);
          padding: 0.35rem 0.75rem;
          white-space: nowrap;
        }
        .sf-hint {
          font-size: 0.75rem; color: var(--text-3); line-height: 1.4;
        }

        /* Footer */
        .sf-footer {
          padding: 1rem 1.5rem;
          background: var(--surface-2);
          border-top: 1px solid var(--surface-3);
          display: flex; align-items: center; justify-content: space-between; gap: 1rem;
          flex-wrap: wrap;
        }
        .sf-footer__note { font-size: 0.8125rem; color: var(--text-3); }
        .sf-save-btn {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.6875rem 1.375rem;
          border-radius: var(--r-full);
          font-family: var(--font-display); font-size: 0.9375rem; font-weight: 700;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-mid) 100%);
          color: white; border: none; cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,97,142,0.3);
          transition: transform 0.12s, box-shadow 0.12s, opacity 0.12s;
        }
        .sf-save-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,97,142,0.38); }
        .sf-save-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .sf-spinner {
          width: 1rem; height: 1rem;
          border: 2px solid rgba(255,255,255,0.3); border-top-color: white;
          border-radius: 50%; animation: sf-spin 0.7s linear infinite;
        }
        @keyframes sf-spin { to { transform: rotate(360deg); } }

        /* Info banner */
        .sf-info {
          background: var(--primary-tint);
          border: 1px solid rgba(0,97,142,0.14);
          border-radius: var(--r-lg);
          padding: 1rem 1.125rem;
          display: flex; gap: 0.75rem; align-items: flex-start;
        }
        .sf-info__icon {
          width: 1.75rem; height: 1.75rem; border-radius: var(--r-md);
          background: var(--primary-tint-s);
          display: flex; align-items: center; justify-content: center;
          color: var(--primary); flex-shrink: 0;
        }
        .sf-info__title { font-size: 0.8125rem; font-weight: 700; color: var(--primary); margin-bottom: 0.375rem; }
        .sf-info__list {
          list-style: none; display: flex; flex-direction: column; gap: 0.3rem;
        }
        .sf-info__list li {
          font-size: 0.8125rem; color: #004e73; line-height: 1.4;
          display: flex; align-items: baseline; gap: 0.5rem;
        }
        .sf-info__list li::before { content: '·'; font-weight: 700; color: var(--primary); flex-shrink: 0; }
      `}</style>

      <div className="sf-root">
        {/* Header */}
        <div>
          <h1 className="sf-title">Configuración</h1>
          <p className="sf-sub">Parámetros de cobro y vencimientos de cuotas</p>
        </div>

        {/* Notification */}
        {notification && (
          <div
            className={`sf-notification sf-notification--${notification.type}`}
          >
            {notification.type === "success" ? (
              <svg
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {notification.message}
          </div>
        )}

        {/* Form card */}
        <div className="sf-card">
          {/* Día de vencimiento */}
          <div className="sf-row">
            <div className="sf-row__header">
              <p className="sf-row__label">Día de vencimiento</p>
              <p className="sf-row__desc">
                Las cuotas vencen este día de cada mes
              </p>
            </div>
            <div className="sf-row__control">
              <div className="sf-input-wrap">
                <input
                  type="number"
                  id="payment_due_day"
                  min="1"
                  max="31"
                  value={settings.payment_due_day}
                  onChange={(e) =>
                    set({ payment_due_day: parseInt(e.target.value) || 1 })
                  }
                  className="sf-input"
                />
              </div>
              <span className="sf-preview">
                Vence el día {settings.payment_due_day}
              </span>
            </div>
            <p className="sf-hint">Valor típico: 15</p>
          </div>

          {/* Recargo por cuota vencida */}
          <div className="sf-row">
            <div className="sf-row__header">
              <p className="sf-row__label">Recargo por cuota vencida</p>
              <p className="sf-row__desc">
                Porcentaje que se suma al monto de cada cuota no pagada después
                del vencimiento
              </p>
            </div>
            <div className="sf-row__control">
              <div className="sf-input-wrap">
                <input
                  type="number"
                  id="late_fee_percentage"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settings.late_fee_percentage}
                  onChange={(e) =>
                    set({
                      late_fee_percentage: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="sf-input"
                />
                <span className="sf-input-suffix">%</span>
              </div>
              <span className="sf-preview">
                +{settings.late_fee_percentage}% por cuota
              </span>
            </div>
            <p className="sf-hint">Valor típico: 10%</p>
          </div>

          {/* Recargo total */}
          <div className="sf-row">
            <div className="sf-row__header">
              <p className="sf-row__label">
                Recargo total (2+ cuotas vencidas)
              </p>
              <p className="sf-row__desc">
                Porcentaje adicional que se aplica sobre el monto total cuando
                el estudiante acumula 2 o más cuotas vencidas
              </p>
            </div>
            <div className="sf-row__control">
              <div className="sf-input-wrap">
                <input
                  type="number"
                  id="total_recalculation_percentage"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settings.total_recalculation_percentage}
                  onChange={(e) =>
                    set({
                      total_recalculation_percentage:
                        parseFloat(e.target.value) || 0,
                    })
                  }
                  className="sf-input"
                />
                <span className="sf-input-suffix">%</span>
              </div>
              {settings.total_recalculation_percentage > 0 ? (
                <span className="sf-preview">
                  +{settings.total_recalculation_percentage}% sobre el total
                </span>
              ) : (
                <span className="sf-hint">Sin recargo adicional</span>
              )}
            </div>
            <p className="sf-hint">Dejá en 0% para no aplicar este recargo</p>
          </div>

          {/* Footer */}
          <div className="sf-footer">
            <p className="sf-footer__note">
              Los cambios aplican en el próximo ciclo (1 AM diario)
            </p>
            <button
              className="sf-save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="sf-spinner" /> Guardando...
                </>
              ) : (
                <>
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
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Guardar configuración
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info banner */}
        <div className="sf-info">
          <div className="sf-info__icon">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <p className="sf-info__title">
              ¿Cómo funciona el sistema de recargos?
            </p>
            <ul className="sf-info__list">
              <li>Cada día a la 1 AM el sistema verifica cuotas vencidas</li>
              <li>
                Si una cuota no fue pagada antes del vencimiento, se aplica el
                recargo configurado
              </li>
              <li>
                Con 2 o más cuotas vencidas, se aplica un recargo adicional
                sobre el total
              </li>
              <li>Los estudiantes ven el monto actualizado en su balance</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
