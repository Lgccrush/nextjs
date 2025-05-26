'use client'; // This directive indicates that this is a Client Component

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  sku: string;
  supplier_id?: number;
  created_at: string; // Assuming date strings for simplicity
}

interface ApiResponse {
  success: boolean;
  data?: Product[];
  message?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/products');
        const data: ApiResponse = await res.json();
        if (data.success && data.data) {
          setProducts(data.data);
        } else {
          setError(data.message || 'Failed to load products.');
        }
      } catch (err) {
        setError('An error occurred while fetching products.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Products</h1>
        <Link href="/products/new" legacyBehavior>
          <a className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-150">
            Add New Product
          </a>
        </Link>
      </div>

      {loading && <p className="text-center text-gray-600">Loading products...</p>}
      {error && <p className="text-center text-red-500 bg-red-100 p-4 rounded-md">{error}</p>}
      
      {!loading && !error && products.length === 0 && (
        <p className="text-center text-gray-600">No products found.</p>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-200 text-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Created At</th>
              </tr>
            </thead>
            <tbody className="text-gray-600">
              {products.map((product) => (
                <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{product.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">${product.price.toFixed(2)}</td>
                  <td className="px-6 py-4">{product.description || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(product.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
