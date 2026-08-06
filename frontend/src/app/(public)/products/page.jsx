"use client";

import React, { Suspense } from "react";
import ProductsPage from "@/app/components/ProductsPage";

// Loading component
const ProductsLoading = () => (
  <div className="products-page container-fluid py-5">
    <div className="row mb-4">
      <div className="col-12">
        <h1 className="mb-2">All Products</h1>
        <p className="lead mb-0">Loading products...</p>
      </div>
    </div>
    <div className="products-loading">
      <div className="spinner-gold"></div>
      <p className="loading-text">Loading products…</p>
    </div>
  </div>
);

const ProductsPageWrapper = () => {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsPage />
    </Suspense>
  );
};

export default ProductsPageWrapper;
