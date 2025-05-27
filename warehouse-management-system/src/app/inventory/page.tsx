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
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof InventoryItem; direction: 'ascending' | 'descending' } | null>(null);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);

  // Effect for fetching initial data
  useEffect(() => {
    async function fetchInventory() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/inventory');
        const data: ApiResponse = await res.json();
        if (data.success && data.data) {
          setInventory(data.data);
          // Initialize filteredInventory with all items
          setFilteredInventory(data.data); 
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

  // Effect for filtering and sorting
  useEffect(() => {
    let processedInventory = [...inventory];

    // Apply filtering
    if (searchTerm) {
      processedInventory = processedInventory.filter(item =>
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    if (sortConfig !== null) {
      processedInventory.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === undefined || aValue === null) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (bValue === undefined || bValue === null) return sortConfig.direction === 'ascending' ? 1 : -1;
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ascending' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'ascending' 
            ? aValue - bValue 
            : bValue - aValue;
        } else if (sortConfig.key === 'last_stocked_at') { // Date comparison
            return sortConfig.direction === 'ascending'
                ? new Date(aValue).getTime() - new Date(bValue).getTime()
                : new Date(bValue).getTime() - new Date(aValue).getTime();
        }
        return 0;
      });
    }
    setFilteredInventory(processedInventory);
  }, [inventory, searchTerm, sortConfig]);


  const requestSort = (key: keyof InventoryItem) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: keyof InventoryItem) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null; // No indicator or a default subtle one
    }
    return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  };

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Inventory</h1>
        <Link href="/dashboard" legacyBehavior>
          <a className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition duration-150">
            Back to Dashboard
          </a>
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by SKU or Product Name..."
          className="w-full p-2 border border-gray-300 rounded-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading && <p className="text-center text-gray-600">Loading inventory...</p>}
      {error && <p className="text-center text-red-500 bg-red-100 p-4 rounded-md">{error}</p>}
      
      {!loading && !error && filteredInventory.length === 0 && (
        <p className="text-center text-gray-600">No inventory items found matching your criteria.</p>
      )}

      {!loading && !error && filteredInventory.length > 0 && (
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-300 text-gray-700 font-bold">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-400"
                  onClick={() => requestSort('sku')}
                >
                  SKU{getSortIndicator('sku')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-400"
                  onClick={() => requestSort('product_name')}
                >
                  Product Name{getSortIndicator('product_name')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-400" // Keep quantity aligned right in cells below
                  onClick={() => requestSort('quantity')}
                >
                  Quantity{getSortIndicator('quantity')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-400"
                  onClick={() => requestSort('location')}
                >
                  Location{getSortIndicator('location')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-400"
                  onClick={() => requestSort('last_stocked_at')}
                >
                  Last Stocked{getSortIndicator('last_stocked_at')}
                </th>
              </tr>
            </thead>
            <tbody className="text-gray-600">
              {filteredInventory.map((item, index) => (
                <tr 
                  key={item.id} 
                  className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`} // Added row striping and hover
                >
                  <td className="px-6 py-4 whitespace-nowrap">{item.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.product_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">{item.quantity}</td> {/* Align quantity to right */}
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
