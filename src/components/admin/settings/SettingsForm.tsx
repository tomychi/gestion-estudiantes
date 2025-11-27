"use client";

import { useState, useEffect } from "react";

interface Settings {
  payment_due_day: number;
  late_fee_percentage: number;
  total_recalculation_percentage: number;
}

export default function SettingsForm() {
  const [settings, setSettings] = useState<Settings>({
    payment_due_day: 15,
    late_fee_percentage: 10,
    total_recalculation_percentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{
    show: boolean;
    type: "success" | "error";
    message: string;
  }>({ show: false, type: "success", message: "" });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        const data = await res.json();

        if (data.success) {
          setSettings({
            payment_due_day: data.settings.payment_due_day || 15,
            late_fee_percentage: data.settings.late_fee_percentage || 10,
            total_recalculation_percentage:
              data.settings.total_recalculation_percentage || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (data.success) {
        showNotification("success", "Configuración guardada exitosamente");
      } else {
        showNotification("error", data.error || "Error al guardar");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      showNotification("error", "Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: "success", message: "" });
    }, 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Configuración del Sistema
        </h1>
        <p className="text-gray-600 mt-1">
          Gestiona los parámetros de cobro y vencimientos de cuotas
        </p>
      </div>

      {/* Notification */}
      {notification.show && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            notification.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {notification.type === "success" ? (
            <svg
              className="w-5 h-5 shrink-0"
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
              className="w-5 h-5 shrink-0"
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
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="p-6 space-y-6">
          {/* Payment Due Day */}
          <div>
            <label
              htmlFor="payment_due_day"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              Día de vencimiento de cuotas
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                id="payment_due_day"
                min="1"
                max="31"
                value={settings.payment_due_day}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    payment_due_day: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full px-4 py-2 pr-10 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-600">
                Las cuotas vencen el día {settings.payment_due_day} de cada mes
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              💡 Valor típico: 15 (las cuotas vencen el día 15 de cada mes)
            </p>
          </div>

          <hr className="border-gray-200" />

          {/* Late Fee Percentage */}
          <div>
            <label
              htmlFor="late_fee_percentage"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              Porcentaje de recargo por cuota vencida
            </label>
            <div className="flex items-center gap-4">
              <div className="relative w-32">
                <input
                  type="number"
                  id="late_fee_percentage"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settings.late_fee_percentage}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      late_fee_percentage: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 pr-10 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  %
                </span>
              </div>
              <span className="text-sm text-gray-600">
                Se aplicará un {settings.late_fee_percentage}% de recargo por
                cada cuota no pagada después del vencimiento
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              💡 Valor típico: 10% (se agrega 10% al monto de la cuota vencida)
            </p>
          </div>

          <hr className="border-gray-200" />

          {/* Total Recalculation Percentage */}
          <div>
            <label
              htmlFor="total_recalculation_percentage"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              Porcentaje de recargo sobre el total (2+ cuotas vencidas)
            </label>
            <div className="flex items-center gap-4">
              <div className="relative w-32">
                <input
                  type="number"
                  id="total_recalculation_percentage"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settings.total_recalculation_percentage}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      total_recalculation_percentage:
                        parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 pr-10 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  %
                </span>
              </div>
              <span className="text-sm text-gray-600">
                Cuando un estudiante tiene 2 o más cuotas vencidas, se aplicará
                un {settings.total_recalculation_percentage}% adicional sobre el
                monto total
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              💡 Opcional: Deja en 0% si no deseas aplicar este recargo
              adicional
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200 rounded-b-lg">
          <div className="text-sm text-gray-600">
            Los cambios se aplicarán en el próximo ciclo de procesamiento (1 AM
            diario)
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Guardando...
              </>
            ) : (
              <>
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Guardar Configuración
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg
            className="w-5 h-5 text-blue-600 shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">
              ¿Cómo funciona el sistema de recargos?
            </p>
            <ul className="space-y-1 list-disc list-inside text-blue-700">
              <li>Cada día a la 1 AM, el sistema verifica cuotas vencidas</li>
              <li>
                Si una cuota no fue pagada antes del día de vencimiento, se
                aplica el recargo configurado
              </li>
              <li>
                Si un estudiante acumula 2 o más cuotas vencidas, se aplica un
                recargo adicional sobre el total
              </li>
              <li>
                Los estudiantes verán el monto actualizado reflejado en su
                balance
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
