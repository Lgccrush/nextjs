'use client'; // This directive indicates that this is a Client Component

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation'; // Corrected import for App Router
import Link from 'next/link';

interface NewProduct {
  name: string;
  description?: string;
  price: string; // Keep as string for form input
  sku: string;
  supplier_id?: string; // Keep as string for form input
}

interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [product, setProduct] = useState<NewProduct>({
    name: '',
    description: '',
    price: '',
    sku: '',
    supplier_id: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    // Basic client-side validation
    if (!product.name || !product.price || !product.sku) {
      setError('Name, Price, and SKU are required fields.');
      setSubmitting(false);
      return;
    }
    if (isNaN(parseFloat(product.price))) {
        setError('Price must be a valid number.');
        setSubmitting(false);
        return;
    }

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...product,
            price: parseFloat(product.price), // Convert price to number before sending
            supplier_id: product.supplier_id ? parseInt(product.supplier_id) : null, // Convert supplier_id
        }),
      });

      const data: ApiResponse = await res.json();

      if (data.success) {
        setSuccessMessage(data.message || 'Product added successfully!');
        // Clear form
        setProduct({ name: '', description: '', price: '', sku: '', supplier_id: '' });
        // Optionally redirect after a delay or on user action
        // router.push('/products'); 
      } else {
        setError(data.message || 'Failed to add product.');
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Add New Product</h1>
        <Link href="/products" legacyBehavior>
          <a className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition duration-150">
            Back to Products
          </a>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-6">
        {error && <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
        {successMessage && <p className="text-green-500 bg-green-100 p-3 rounded-md">{successMessage}</p>}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
          <input
            type="text"
            name="name"
            id="name"
            value={product.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">SKU (Stock Keeping Unit)</label>
          <input
            type="text"
            name="sku"
            id="sku"
            value={product.sku}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Price</label>
          <input
            type="number" // Use number type for better UX, but handle as string for state
            name="price"
            id="price"
            value={product.price}
            onChange={handleChange}
            required
            step="0.01" // For currency
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
          <textarea
            name="description"
            id="description"
            value={product.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="supplier_id" className="block text-sm font-medium text-gray-700 mb-1">Supplier ID (Optional)</label>
          <input
            type="number"
            name="supplier_id"
            id="supplier_id"
            value={product.supplier_id}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 transition duration-150"
        >
          {submitting ? 'Adding Product...' : 'Add Product'}
        </button>
      </form>
    </div>
  );
}
