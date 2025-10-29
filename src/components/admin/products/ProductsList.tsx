"use client";

import { useState } from "react";
import CreateProductModal from "./CreateProductModal";
import EditProductModal from "./EditProductModal";
import DeleteProductModal from "./DeleteProductModal";
import { ProductWithStats } from "@/types";

interface Props {
  products: ProductWithStats[];
}

export default function ProductsList({ products: initialProducts }: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithStats | null>(
    null,
  );
  const [deletingProduct, setDeletingProduct] =
    useState<ProductWithStats | null>(null);

  const handleProductCreated = (newProduct: ProductWithStats) => {
    setProducts([...products, { ...newProduct, studentCount: 0 }]);
    setIsCreateModalOpen(false);
  };

  const handleProductUpdated = (updatedProduct: ProductWithStats) => {
    setProducts(
      products.map((p) =>
        p.id === updatedProduct.id
          ? { ...updatedProduct, studentCount: p.studentCount }
          : p,
      ),
    );
    setEditingProduct(null);
  };

  const handleProductDeleted = (productId: string) => {
    setProducts(products.filter((p) => p.id !== productId));
    setDeletingProduct(null);
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
          Agregar Producto
        </button>
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-6">
                {/* ProductWithStats Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {product.name}
                      </h3>
                    </div>
                    {product.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Prices */}
                <div className="bg-linear-to-br from-indigo-50 to-purple-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Precio Base</p>
                      <p className="text-lg font-bold text-gray-700">
                        ${Number(product.basePrice).toLocaleString("es-AR")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">
                        Precio Actual
                      </p>
                      <p className="text-lg font-bold text-indigo-600">
                        ${Number(product.currentPrice).toLocaleString("es-AR")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="bg-blue-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-blue-600"
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
                    <p className="text-sm text-blue-900">
                      <span className="font-bold">{product.studentCount}</span>{" "}
                      estudiante
                      {product.studentCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingProduct(product)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setDeletingProduct(product)}
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
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay productos registrados
          </h3>
          <p className="text-gray-600 mb-6">
            Agregá el primer producto para comenzar
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
            Agregar Primer Producto
          </button>
        </div>
      )}

      {/* Modals */}
      <CreateProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProductCreated={handleProductCreated}
      />

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          isOpen={!!editingProduct}
          onClose={() => setEditingProduct(null)}
          onProductUpdated={handleProductUpdated}
        />
      )}

      {deletingProduct && (
        <DeleteProductModal
          product={deletingProduct}
          isOpen={!!deletingProduct}
          onClose={() => setDeletingProduct(null)}
          onProductDeleted={handleProductDeleted}
        />
      )}
    </>
  );
}
