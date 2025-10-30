"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  SchoolDivision,
  SchoolFormData,
  ProductFormData,
  CreateStudentPayload,
} from "@/types";

interface Props {
  schools: SchoolFormData[];
  products: ProductFormData[];
}

export default function CreateStudentForm({ schools, products }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form mode: 'existing' or 'new'
  const [schoolMode, setSchoolMode] = useState<"existing" | "new">("existing");
  const [divisionMode, setDivisionMode] = useState<"existing" | "new">(
    "existing",
  );

  // Divisions for selected school
  const [divisions, setDivisions] = useState<SchoolDivision[]>([]);
  const [loadingDivisions, setLoadingDivisions] = useState(false);

  // Track previous product to detect changes
  const prevProductIdRef = useRef<string | undefined>(undefined);

  // Form data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dni: "",
    email: "",
    phone: "",
    size: "",

    // Existing school/division
    schoolId: "",
    divisionId: "",

    // New school
    schoolName: "",
    schoolAddress: "",

    // New division
    divisionName: "",
    divisionYear: new Date().getFullYear() + 1, // Default to next year

    // Product and payment
    productId: "",
    totalAmount: "",
    installments: 3,
    paidAmount: "",

    notes: "",
  });

  // Load divisions when school is selected
  useEffect(() => {
    if (schoolMode === "existing" && formData.schoolId) {
      loadDivisions(formData.schoolId);
    } else {
      setDivisions([]);
      setFormData((prev) => ({ ...prev, divisionId: "" }));
    }
  }, [formData.schoolId, schoolMode]);

  useEffect(() => {
    const productChanged = prevProductIdRef.current !== formData.productId;

    if (formData.productId && productChanged) {
      const product = products.find((p) => p.id === formData.productId);

      // Extraer currentPrice en una variable
      const currentPrice = product?.currentPrice;

      // Ahora TypeScript sabe que currentPrice existe dentro de este if
      if (currentPrice && (!formData.totalAmount || productChanged)) {
        setFormData((prev) => ({
          ...prev,
          totalAmount: currentPrice.toString(),
        }));
      }
    }

    prevProductIdRef.current = formData.productId;
  }, [formData.productId, formData.totalAmount, products]);

  const loadDivisions = async (schoolId: string) => {
    setLoadingDivisions(true);
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );

      const { data, error } = await supabase
        .from("SchoolDivision")
        .select("id, division, year")
        .eq("schoolId", schoolId)
        .order("year", { ascending: false })
        .order("division", { ascending: true });

      if (!error && data) {
        setDivisions(data as SchoolDivision[]);
      }
    } catch (err) {
      console.error("Error loading divisions:", err);
    } finally {
      setLoadingDivisions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, andAddAnother = false) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsSubmitting(true);

    try {
      // Build request payload with proper typing
      const payload: Partial<CreateStudentPayload> & {
        schoolId?: string;
        schoolName?: string;
        schoolAddress?: string;
        divisionId?: string;
        divisionName?: string;
        divisionYear?: number;
      } = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        dni: formData.dni.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        size: formData.size.trim() || undefined,

        productId: formData.productId,
        totalAmount: parseFloat(formData.totalAmount),
        installments: formData.installments,
        paidAmount: formData.paidAmount
          ? parseFloat(formData.paidAmount)
          : undefined,

        notes: formData.notes.trim() || undefined,
      };

      // School data
      if (schoolMode === "existing") {
        payload.schoolId = formData.schoolId;
      } else {
        payload.schoolName = formData.schoolName.trim();
        payload.schoolAddress = formData.schoolAddress.trim() || undefined;
      }

      // Division data
      if (divisionMode === "existing" && schoolMode === "existing") {
        payload.divisionId = formData.divisionId;
        const selectedDivision = divisions.find(
          (d) => d.id === formData.divisionId,
        );
        if (selectedDivision) {
          payload.divisionName = selectedDivision.division;
          payload.divisionYear = selectedDivision.year;
        }
      } else {
        payload.divisionName = formData.divisionName.trim();
        payload.divisionYear = formData.divisionYear;
      }

      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!result.success) {
        setError(result.error || "Error al crear el estudiante");
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);

      if (andAddAnother) {
        setFormData((prev) => ({
          ...prev,
          firstName: "",
          lastName: "",
          dni: "",
          email: "",
          phone: "",
          size: "",
          paidAmount: "",
          notes: "",
        }));
        setSuccess(false);
        setIsSubmitting(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setTimeout(() => {
          router.push("/admin/students?created=true");
        }, 1500);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage || "Error al crear el estudiante");
      setIsSubmitting(false);
    }
  };

  return (
    <form className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>¡Estudiante creado exitosamente!</span>
        </div>
      )}

      {/* Personal Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Información Personal
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              disabled={isSubmitting}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apellido *
            </label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              disabled={isSubmitting}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              DNI * (será su contraseña inicial)
            </label>
            <input
              type="text"
              required
              maxLength={8}
              pattern="\d{7,8}"
              value={formData.dni}
              onChange={(e) =>
                setFormData({ ...formData, dni: e.target.value })
              }
              disabled={isSubmitting}
              placeholder="12345678"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Talle
            </label>
            <input
              type="text"
              value={formData.size}
              onChange={(e) =>
                setFormData({ ...formData, size: e.target.value })
              }
              disabled={isSubmitting}
              placeholder="S, M, L, XL..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              disabled={isSubmitting}
              placeholder="correo@ejemplo.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              disabled={isSubmitting}
              placeholder="351XXXXXXX"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* School Information */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Colegio y División
        </h3>

        {/* School Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setSchoolMode("existing")}
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              schoolMode === "existing"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Colegio existente
          </button>
          <button
            type="button"
            onClick={() => setSchoolMode("new")}
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              schoolMode === "new"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Crear colegio nuevo
          </button>
        </div>

        {/* Existing School */}
        {schoolMode === "existing" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seleccionar Colegio *
              </label>
              <select
                required
                value={formData.schoolId}
                onChange={(e) =>
                  setFormData({ ...formData, schoolId: e.target.value })
                }
                disabled={isSubmitting}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 disabled:opacity-50"
              >
                <option value="">Seleccionar...</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Division Mode Toggle (only show if school selected) */}
            {formData.schoolId && (
              <>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDivisionMode("existing")}
                    disabled={isSubmitting}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      divisionMode === "existing"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    División existente
                  </button>
                  <button
                    type="button"
                    onClick={() => setDivisionMode("new")}
                    disabled={isSubmitting}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      divisionMode === "new"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Crear división nueva
                  </button>
                </div>

                {divisionMode === "existing" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Seleccionar División *
                    </label>
                    {loadingDivisions ? (
                      <div className="flex items-center gap-2 text-gray-500">
                        <svg
                          className="animate-spin h-5 w-5"
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
                        Cargando divisiones...
                      </div>
                    ) : divisions.length > 0 ? (
                      <select
                        required
                        value={formData.divisionId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            divisionId: e.target.value,
                          })
                        }
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 disabled:opacity-50"
                      >
                        <option value="">Seleccionar...</option>
                        {divisions.map((division) => (
                          <option key={division.id} value={division.id}>
                            {division.division} - {division.year}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-sm text-gray-500 italic">
                        Este colegio no tiene divisiones. Creá una nueva.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre de División * (ej: 5to A)
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.divisionName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            divisionName: e.target.value,
                          })
                        }
                        disabled={isSubmitting}
                        placeholder="5to A"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Año de Egreso *
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.divisionYear}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            divisionYear: parseInt(e.target.value) || 2025,
                          })
                        }
                        disabled={isSubmitting}
                        min={2020}
                        max={2050}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 disabled:opacity-50"
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* New School */
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Colegio *
              </label>
              <input
                type="text"
                required
                value={formData.schoolName}
                onChange={(e) =>
                  setFormData({ ...formData, schoolName: e.target.value })
                }
                disabled={isSubmitting}
                placeholder="Ej: Colegio Nacional de Buenos Aires"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección del Colegio
              </label>
              <input
                type="text"
                value={formData.schoolAddress}
                onChange={(e) =>
                  setFormData({ ...formData, schoolAddress: e.target.value })
                }
                disabled={isSubmitting}
                placeholder="Ej: Bolívar 263, CABA"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 disabled:opacity-50"
              />
            </div>

            {/* Division for new school */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  División * (ej: 5to A)
                </label>
                <input
                  type="text"
                  required
                  value={formData.divisionName}
                  onChange={(e) =>
                    setFormData({ ...formData, divisionName: e.target.value })
                  }
                  disabled={isSubmitting}
                  placeholder="5to A"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Año de Egreso *
                </label>
                <input
                  type="number"
                  required
                  value={formData.divisionYear}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      divisionYear: parseInt(e.target.value) || 2025,
                    })
                  }
                  disabled={isSubmitting}
                  min={2020}
                  max={2050}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product and Payment Information */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Producto y Pago
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Producto *
            </label>
            <select
              required
              value={formData.productId}
              onChange={(e) =>
                setFormData({ ...formData, productId: e.target.value })
              }
              disabled={isSubmitting}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 disabled:opacity-50"
            >
              <option value="">Seleccionar producto...</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - $
                  {(product.currentPrice ?? 0).toLocaleString("es-AR")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total a Pagar *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.totalAmount}
              onChange={(e) =>
                setFormData({ ...formData, totalAmount: e.target.value })
              }
              disabled={isSubmitting}
              placeholder="50000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cuotas *
            </label>
            <input
              type="number"
              required
              min="1"
              max="12"
              value={formData.installments}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  installments: parseInt(e.target.value) || 1,
                })
              }
              disabled={isSubmitting}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ya Pagó (opcional)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.paidAmount}
              onChange={(e) =>
                setFormData({ ...formData, paidAmount: e.target.value })
              }
              disabled={isSubmitting}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="border-t pt-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notas adicionales
        </label>
        <textarea
          rows={3}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          disabled={isSubmitting}
          placeholder="Información adicional sobre el estudiante..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 disabled:opacity-50"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-6 border-t">
        <button
          type="button"
          onClick={() => router.push("/admin/students")}
          disabled={isSubmitting}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={(e) => handleSubmit(e, true)}
          disabled={isSubmitting || success}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
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
              Guardar y Crear Otro
            </>
          )}
        </button>
        <button
          type="submit"
          onClick={(e) => handleSubmit(e, false)}
          disabled={isSubmitting || success}
          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
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
          ) : success ? (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Guardado - Redirigiendo...
            </>
          ) : (
            "Guardar Estudiante"
          )}
        </button>
      </div>
    </form>
  );
}
