import type { NextApiRequest, NextApiResponse } from 'next';
import { getConnection } from '@/lib/db'; // Using the alias defined in tsconfig.json

// Define an interface for the inventory item for type safety
interface InventoryItem {
  id: number;
  product_id: number;
  product_name: string; // For easier display
  sku: string; // For easier display
  quantity: number;
  location?: string;
  last_stocked_at: string; // Assuming TIMESTAMP is returned as string
}

// Define a type for the API response
type ApiResponse<T = any> = 
  | { success: true; data: T; message?: string } 
  | { success: false; message: string; error?: any };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<InventoryItem[]>>
) {
  let pool;
  try {
    pool = await getConnection();
  } catch (error) {
    console.error('Failed to get database connection:', error);
    return res.status(500).json({ success: false, message: 'Database connection error.' });
  }

  switch (req.method) {
    case 'GET':
      try {
        // Query to join inventory with products table to get product name and SKU
        const query = `
          SELECT 
            i.id, 
            i.product_id, 
            p.name as product_name, 
            p.sku,
            i.quantity, 
            i.location, 
            i.last_stocked_at
          FROM inventory i
          JOIN products p ON i.product_id = p.id
          ORDER BY p.name ASC;
        `;
        const [rows] = await pool.query(query);
        res.status(200).json({ success: true, data: rows as InventoryItem[] });
      } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch inventory.', error });
      }
      break;

    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }
}
