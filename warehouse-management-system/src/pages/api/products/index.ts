import type { NextApiRequest, NextApiResponse } from 'next';
import { getConnection } from '@/lib/db'; // Using the alias defined in tsconfig.json

// Define an interface for the product data for type safety
interface Product {
  id?: number; // Optional for new products
  name: string;
  description?: string;
  price: number;
  sku: string;
  supplier_id?: number; // Optional
}

// Define a type for the API response for better error handling and consistency
type ApiResponse<T = any> = 
  | { success: true; data: T; message?: string } 
  | { success: false; message: string; error?: any };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Product[] | Product>>
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
        const [rows] = await pool.query('SELECT id, name, description, price, sku, supplier_id, created_at, updated_at FROM products');
        res.status(200).json({ success: true, data: rows as Product[] });
      } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch products.', error });
      }
      break;

    case 'POST':
      try {
        const { name, description, price, sku, supplier_id } = req.body as Product;

        // Basic validation
        if (!name || !price || !sku) {
          return res.status(400).json({ success: false, message: 'Missing required fields: name, price, and sku.' });
        }

        const query = 'INSERT INTO products (name, description, price, sku, supplier_id) VALUES (?, ?, ?, ?, ?)';
        const [result] = await pool.execute(query, [
          name,
          description || null, // Handle optional description
          price,
          sku,
          supplier_id || null, // Handle optional supplier_id
        ]);
        
        // Type assertion for result
        const insertResult = result as any; // mysql2/promise types can be complex for insert results

        if (insertResult.affectedRows === 1) {
          const newProductId = insertResult.insertId;
          res.status(201).json({ 
            success: true, 
            message: 'Product added successfully.', 
            data: { id: newProductId, name, description, price, sku, supplier_id } 
          });
        } else {
          res.status(500).json({ success: false, message: 'Failed to add product.' });
        }
      } catch (error: any) {
        console.error('Error adding product:', error);
        // Check for unique constraint violation (e.g., duplicate SKU)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Failed to add product. SKU already exists.', error: error.message });
        }
        res.status(500).json({ success: false, message: 'Failed to add product.', error: error.message });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }
}
