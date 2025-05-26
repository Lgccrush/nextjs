'use client'; // This directive indicates that this is a Client Component

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface InventoryItem {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  quantity: number;
  location?: string;
  last_stocked_at: string; 
}

interface ApiResponse {
  success: boolean;
  data?: InventoryItem[];
  message?: string;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInventory() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/inventory');
        const data: ApiResponse = await res.json();
        if (data.success && data.data) {
          setInventory(data.data);
        } else {
          setError(data.message || 'Failed to load inventory.');
        }
      } catch (err) {
        setError('An error occurred while fetching inventory.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchInventory();
  }, []);

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Inventory</h1>
        <Link href="/" legacyBehavior>
          <a className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition duration-150">
            Back to Dashboard
          </a>
        </Link>
      </div>

      {loading && <p className="text-center text-gray-600">Loading inventory...</p>}
      {error && <p className="text-center text-red-500 bg-red-100 p-4 rounded-md">{error}</p>}
      
      {!loading && !error && inventory.length === 0 && (
        <p className="text-center text-gray-600">No inventory items found.</p>
      )}

      {!loading && !error && inventory.length > 0 && (
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-200 text-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Product Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Last Stocked</th>
              </tr>
            </thead>
            <tbody className="text-gray-600">
              {inventory.map((item) => (
                <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{item.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.product_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.location || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(item.last_stocked_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
