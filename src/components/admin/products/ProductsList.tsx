"use client";

import { useState } from "react";
import CreateProductModal from "./CreateProductModal";
import EditProductModal from "./EditProductModal";
import DeleteProductModal from "./DeleteProductModal";
import { ProductWithStats } from "@/types";

interface Props {
  products: ProductWithStats[];
}

function formatARS(n: number) {
  return n.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
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
      <style>{`
        .pl-root {
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
          --danger:       #b91c1c;
          --danger-bg:    rgba(185,28,28,0.08);
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
        .pl-root *, .pl-root *::before, .pl-root *::after {
          box-sizing: border-box; margin: 0; padding: 0;
        }

        /* Page header */
        .pl-page-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 1rem; flex-wrap: wrap;
        }
        .pl-title {
          font-family: var(--font-display);
          font-size: clamp(1.375rem, 3vw, 1.875rem);
          font-weight: 800; color: var(--text-1); letter-spacing: -0.02em;
        }
        .pl-sub { font-size: 0.875rem; color: var(--text-3); margin-top: 0.2rem; }

        /* Button */
        .btn-primary {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.625rem 1.125rem;
          border-radius: var(--r-full);
          font-family: var(--font-display);
          font-size: 0.875rem; font-weight: 700;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-mid) 100%);
          color: white; border: none; cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,97,142,0.3);
          transition: transform 0.15s, box-shadow 0.15s;
          white-space: nowrap;
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,97,142,0.38); }

        /* Grid */
        .pl-grid {
          display: grid; grid-template-columns: 1fr; gap: 0.875rem;
        }
        @media (min-width: 640px)  { .pl-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1280px) { .pl-grid { grid-template-columns: repeat(3, 1fr); } }

        /* Card */
        .pl-card {
          background: var(--surface);
          border-radius: var(--r-xl);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
          display: flex; flex-direction: column;
          transition: box-shadow 0.15s, transform 0.15s;
        }
        .pl-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }

        .pl-card__body { padding: 1.25rem 1.25rem 1rem; flex: 1; display: flex; flex-direction: column; gap: 0.875rem; }

        .pl-card__name {
          font-family: var(--font-display);
          font-size: 1rem; font-weight: 700; color: var(--text-1);
          margin-bottom: 0.2rem;
        }
        .pl-card__desc {
          font-size: 0.8125rem; color: var(--text-3); line-height: 1.4;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
        }

        /* Price block */
        .pl-prices {
          display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;
        }
        .pl-price {
          border-radius: var(--r-md);
          padding: 0.625rem 0.75rem;
        }
        .pl-price--base    { background: var(--surface-2); }
        .pl-price--current { background: var(--primary-tint); }
        .pl-price__label {
          font-size: 0.6875rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.25rem;
        }
        .pl-price--base .pl-price__label    { color: var(--text-3); }
        .pl-price--current .pl-price__label { color: var(--primary); }
        .pl-price__value {
          font-family: var(--font-display);
          font-size: 1.0625rem; font-weight: 800; line-height: 1;
        }
        .pl-price--base .pl-price__value    { color: var(--text-2); }
        .pl-price--current .pl-price__value { color: var(--primary); }

        /* Student count */
        .pl-students {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.8125rem; color: var(--text-2);
          background: var(--surface-2);
          border-radius: var(--r-md);
          padding: 0.5rem 0.75rem;
        }
        .pl-students strong { font-weight: 700; color: var(--text-1); }

        /* Card actions */
        .pl-card__actions {
          display: flex; gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border-top: 1px solid var(--surface-2);
          background: var(--surface-2);
        }
        .pl-act-btn {
          flex: 1; padding: 0.5rem;
          border-radius: var(--r-md);
          font-size: 0.8125rem; font-weight: 600;
          border: none; cursor: pointer;
          transition: background 0.12s;
        }
        .pl-act-btn--edit  { background: var(--primary-tint); color: var(--primary); }
        .pl-act-btn--edit:hover  { background: var(--primary-tint-s); }
        .pl-act-btn--delete { background: var(--danger-bg); color: var(--danger); }
        .pl-act-btn--delete:hover { background: rgba(185,28,28,0.14); }

        /* Empty */
        .pl-empty {
          background: var(--surface); border-radius: var(--r-xl);
          box-shadow: var(--shadow-sm);
          padding: 3rem 1.5rem; text-align: center;
        }
        .pl-empty__icon { width: 3.5rem; height: 3.5rem; margin: 0 auto 1rem; color: var(--text-3); }
        .pl-empty__title {
          font-family: var(--font-display);
          font-size: 1.0625rem; font-weight: 700; color: var(--text-1); margin-bottom: 0.375rem;
        }
        .pl-empty__sub { font-size: 0.875rem; color: var(--text-3); margin-bottom: 1.5rem; }
      `}</style>

      <div className="pl-root">
        {/* Header */}
        <div className="pl-page-header">
          <div>
            <h1 className="pl-title">Productos</h1>
            <p className="pl-sub">
              Gestioná los productos disponibles para los estudiantes
            </p>
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
            Agregar producto
          </button>
        </div>

        {/* Grid or empty */}
        {products.length > 0 ? (
          <div className="pl-grid">
            {products.map((product) => (
              <div key={product.id} className="pl-card">
                <div className="pl-card__body">
                  <div>
                    <p className="pl-card__name">{product.name}</p>
                    {product.description && (
                      <p className="pl-card__desc">{product.description}</p>
                    )}
                  </div>

                  <div className="pl-prices">
                    <div className="pl-price pl-price--base">
                      <p className="pl-price__label">Precio base</p>
                      <p className="pl-price__value">
                        {formatARS(Number(product.basePrice))}
                      </p>
                    </div>
                    <div className="pl-price pl-price--current">
                      <p className="pl-price__label">Precio actual</p>
                      <p className="pl-price__value">
                        {formatARS(Number(product.currentPrice))}
                      </p>
                    </div>
                  </div>

                  <div className="pl-students">
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
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                    </svg>
                    <span>
                      <strong>{product.studentCount}</strong> estudiante
                      {product.studentCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <div className="pl-card__actions">
                  <button
                    className="pl-act-btn pl-act-btn--edit"
                    onClick={() => setEditingProduct(product)}
                  >
                    Editar
                  </button>
                  <button
                    className="pl-act-btn pl-act-btn--delete"
                    onClick={() => setDeletingProduct(product)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="pl-empty">
            <svg
              className="pl-empty__icon"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"
              />
            </svg>
            <p className="pl-empty__title">No hay productos registrados</p>
            <p className="pl-empty__sub">
              Agregá el primer producto para comenzar
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
              Agregar primer producto
            </button>
          </div>
        )}
      </div>

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
