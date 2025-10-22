"use client";

// components/admin/students/ImportStudentsForm.tsx
import { useState, useTransition } from "react";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";

interface School {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  currentPrice: number;
}

interface Props {
  schools: School[];
  products: Product[];
  adminId: string;
}

interface ParsedStudent {
  firstName: string;
  lastName: string;
  dni: string;
  size?: string;
  email?: string;
  phone?: string;
}

interface ImportData {
  school: string;
  division: string;
  year: number;
  students: ParsedStudent[];
}

export default function ImportStudentsForm({
  schools,
  products,
  adminId,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [importData, setImportData] = useState<ImportData | null>(null);
  const [editableStudents, setEditableStudents] = useState<ParsedStudent[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>("");

  // Form fields
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [installments, setInstallments] = useState<number>(3);

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    const data = [
      ["COLEGIO:", "Colegio Nacional Buenos Aires"],
      ["DIVISIÓN:", "5to A"],
      ["AÑO:", "2025"],
      [],
      [],
      ["Nombre", "Apellido", "DNI"],
      ["Juan", "Pérez", "12345678"],
      ["María", "García", "23456789"],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws["!cols"] = [{ wch: 15 }, { wch: 30 }, { wch: 12 }];

    XLSX.utils.book_append_sheet(wb, ws, "Estudiantes");
    XLSX.writeFile(wb, "plantilla_estudiantes.xlsx");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError("");
    setImportData(null);
    setEditableStudents([]);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // Parse metadata - valores en columna B (sin validar)
      const school = worksheet["B1"]?.v?.toString().trim() || "";
      const division = worksheet["B2"]?.v?.toString().trim() || "";
      const yearValue = worksheet["B3"]?.v;
      const year = yearValue
        ? parseInt(yearValue.toString())
        : new Date().getFullYear();

      // Parse students (starting from row 6, index 5)
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        range: 5,
        defval: "",
      });

      const students: ParsedStudent[] = jsonData
        .map((row: any) => ({
          firstName: row["Nombre"]?.toString().trim() || "",
          lastName: row["Apellido"]?.toString().trim() || "",
          dni: row["DNI"]?.toString().trim() || "",
          size: "",
          email: "",
          phone: "",
        }))
        .filter((s) => s.firstName && s.lastName && s.dni);

      if (students.length === 0) {
        setError("No se encontraron estudiantes válidos en el archivo.");
        return;
      }

      // Solo validar DNIs duplicados
      const dnis = students.map((s) => s.dni);
      const duplicateDnis = dnis.filter(
        (dni, index) => dnis.indexOf(dni) !== index,
      );
      if (duplicateDnis.length > 0) {
        setError(`DNIs duplicados: ${duplicateDnis.join(", ")}`);
        return;
      }

      setImportData({
        school,
        division,
        year,
        students,
      });
      setEditableStudents(students);
    } catch (err) {
      setError("Error al leer el archivo.");
    }
  };

  const handleStudentChange = (
    index: number,
    field: keyof ParsedStudent,
    value: string,
  ) => {
    const updated = [...editableStudents];
    updated[index] = { ...updated[index], [field]: value };
    setEditableStudents(updated);
  };

  const handleProductChange = (productId: string) => {
    setSelectedProduct(productId);
    const product = products.find((p) => p.id === productId);
    if (product) {
      setTotalAmount(product.currentPrice.toString());
    }
  };

  const handleImport = () => {
    if (!importData) {
      setError("Faltan datos de importación");
      return;
    }

    if (
      !selectedSchool ||
      !importData.division ||
      !selectedProduct ||
      !totalAmount
    ) {
      setError("Completá todos los campos obligatorios");
      return;
    }

    // Validate all students have required fields
    const invalidStudents = editableStudents.filter(
      (s) => !s.firstName || !s.lastName || !s.dni,
    );
    if (invalidStudents.length > 0) {
      setError("Todos los estudiantes deben tener nombre, apellido y DNI");
      return;
    }

    setError("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/students/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            schoolId: selectedSchool,
            division: importData.division,
            year: importData.year,
            students: editableStudents,
            productId: selectedProduct,
            totalAmount: parseFloat(totalAmount),
            installments,
            adminId,
          }),
        });

        const result = await res.json();

        if (!result.success) {
          setError(result.error || "Error al importar estudiantes");
          return;
        }

        router.push("/admin/students?imported=true");
      } catch (err) {
        setError("Ocurrió un error. Intentá nuevamente.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Download Template */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          1. Descargá la plantilla
        </h3>
        <p className="text-gray-600 mb-4">
          Descargá la plantilla de Excel y completala solo con: Nombre, Apellido
          y DNI
        </p>
        <button
          onClick={downloadTemplate}
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
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Descargar Plantilla Excel
        </button>
      </div>

      {/* Upload File */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          2. Subí el archivo completado
        </h3>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          disabled={isPending}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
        />
        {file && (
          <p className="mt-2 text-sm text-gray-600">
            Archivo: <span className="font-medium">{file.name}</span>
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Preview & Edit */}
      {importData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">
            3. Configurá y revisá los datos
          </h3>

          {/* Metadata - editable */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Colegio *{" "}
                {importData.school && (
                  <span className="text-xs text-gray-800">
                    (Detectado: {importData.school})
                  </span>
                )}
              </label>
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 placeholder-gray-400"
              >
                <option value="">Seleccionar colegio...</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  División *
                </label>
                <input
                  type="text"
                  value={importData.division}
                  onChange={(e) =>
                    setImportData({ ...importData, division: e.target.value })
                  }
                  placeholder="Ej: 5to A"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Año *
                </label>
                <input
                  type="number"
                  value={importData.year}
                  onChange={(e) =>
                    setImportData({
                      ...importData,
                      year: parseInt(e.target.value) || 2025,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Configuration Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Producto *
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => handleProductChange(e.target.value)}
                disabled={isPending}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 placeholder-gray-400"
              >
                <option value="">Seleccionar...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total $*
              </label>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                disabled={isPending}
                placeholder="50000"
                className="w-full px-4 py-2 border border-gray-300  focus:ring-2 focus:ring-indigo-500 rounded-lg bg-white text-gray-900 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cuotas *
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={installments}
                onChange={(e) => setInstallments(parseInt(e.target.value) || 1)}
                disabled={isPending}
                className="w-full px-4 py-2 border border-gray-300  focus:ring-2 focus:ring-indigo-500 rounded-lg bg-white text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Editable Students Table */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">
              Estudiantes:{" "}
              <span className="text-indigo-600">{editableStudents.length}</span>
              <span className="text-gray-500 text-xs ml-2">
                (Podés editar cada fila)
              </span>
            </p>
            <div className="max-h-96 overflow-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                      #
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                      Nombre *
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                      Apellido *
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                      DNI *
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                      Talle
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                      Email
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                      Teléfono
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {editableStudents.map((student, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={student.firstName}
                          onChange={(e) =>
                            handleStudentChange(
                              index,
                              "firstName",
                              e.target.value,
                            )
                          }
                          className="w-full px-4 py-2 text-sm  border border-gray-300  focus:ring-2 focus:ring-indigo-500 rounded-lg bg-white text-gray-900 placeholder-gray-400"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={student.lastName}
                          onChange={(e) =>
                            handleStudentChange(
                              index,
                              "lastName",
                              e.target.value,
                            )
                          }
                          className="w-full px-4 py-2 text-sm  border border-gray-300  focus:ring-2 focus:ring-indigo-500 rounded-lg bg-white text-gray-900 placeholder-gray-400"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={student.dni}
                          onChange={(e) =>
                            handleStudentChange(index, "dni", e.target.value)
                          }
                          className="w-full px-4 py-2 text-sm  border border-gray-300  focus:ring-2 focus:ring-indigo-500 rounded-lg bg-white text-gray-900 placeholder-gray-400"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={student.size || ""}
                          onChange={(e) =>
                            handleStudentChange(index, "size", e.target.value)
                          }
                          placeholder="S, M, L..."
                          className="w-full px-4 py-2 text-sm  border border-gray-300  focus:ring-2 focus:ring-indigo-500 rounded-lg bg-white text-gray-900 placeholder-gray-400"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="email"
                          value={student.email || ""}
                          onChange={(e) =>
                            handleStudentChange(index, "email", e.target.value)
                          }
                          placeholder="opcional"
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={student.phone || ""}
                          onChange={(e) =>
                            handleStudentChange(index, "phone", e.target.value)
                          }
                          placeholder="opcional"
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Import button */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setImportData(null);
                setFile(null);
                setEditableStudents([]);
              }}
              disabled={isPending}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={isPending || !selectedProduct || !totalAmount}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {isPending ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
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
                  Importando...
                </>
              ) : (
                `Importar ${editableStudents.length} Estudiantes`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
