import { createMocks, RequestMethod } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import productHandler from '../index'; // Adjust path as necessary
import { getConnection } from '@/lib/db'; // Import the original getConnection

// Mock the database connection
jest.mock('@/lib/db'); 

// Define a type for the mocked pool functions for clarity
type MockPool = {
  query: jest.Mock;
  execute: jest.Mock;
  // Add other methods if your handler uses them e.g. getConnection().end(), etc.
};

// Define a type for the API response data for products
interface Product {
  id?: number;
  name: string;
  description?: string;
  price: number;
  sku: string;
  supplier_id?: number;
}

describe('/api/products API Endpoint', () => {
  let mockPool: MockPool;

  beforeEach(()_ => {
    // Reset mocks before each test
    mockPool = {
      query: jest.fn(),
      execute: jest.fn(),
    };
    (getConnection as jest.Mock).mockResolvedValue(mockPool);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should return a list of products and status 200', async () => {
      const mockProducts: Product[] = [
        { id: 1, name: 'Test Product 1', sku: 'TP001', price: 10.99, description: 'Desc 1' },
        { id: 2, name: 'Test Product 2', sku: 'TP002', price: 20.50, description: 'Desc 2' },
      ];
      mockPool.query.mockResolvedValueOnce([mockProducts]); // [rows, fields]

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      });

      await productHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseJson = JSON.parse(res._getData());
      expect(responseJson.success).toBe(true);
      expect(responseJson.data).toEqual(mockProducts);
      expect(mockPool.query).toHaveBeenCalledWith('SELECT id, name, description, price, sku, supplier_id, created_at, updated_at FROM products');
    });

    it('should return status 500 if database query fails', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Database error'));

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      });

      await productHandler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const responseJson = JSON.parse(res._getData());
      expect(responseJson.success).toBe(false);
      expect(responseJson.message).toBe('Failed to fetch products.');
    });
  });

  describe('POST /api/products', () => {
    const newProductData: Omit<Product, 'id'> = {
      name: 'New Product',
      sku: 'NP001',
      price: 99.99,
      description: 'A brand new product',
      supplier_id: 1,
    };

    it('should add a new product and return status 201', async () => {
      mockPool.execute.mockResolvedValueOnce([{ affectedRows: 1, insertId: 100 } as any]); // Mock insert result

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: newProductData,
      });

      await productHandler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const responseJson = JSON.parse(res._getData());
      expect(responseJson.success).toBe(true);
      expect(responseJson.message).toBe('Product added successfully.');
      expect(responseJson.data).toEqual(expect.objectContaining({ ...newProductData, id: 100 }));
      expect(mockPool.execute).toHaveBeenCalledWith(
        'INSERT INTO products (name, description, price, sku, supplier_id) VALUES (?, ?, ?, ?, ?)',
        [newProductData.name, newProductData.description, newProductData.price, newProductData.sku, newProductData.supplier_id]
      );
    });

    it('should return status 400 if required fields are missing', async () => {
      const { name, ...incompleteProductData } = newProductData; // remove name
      
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: { ...incompleteProductData, price: 99.99, sku: 'NP001' }, // Ensure price and sku are present
      });
      

      await productHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const responseJson = JSON.parse(res._getData());
      expect(responseJson.success).toBe(false);
      expect(responseJson.message).toBe('Missing required fields: name, price, and sku.');
    });
    
    it('should return status 409 if SKU already exists (ER_DUP_ENTRY)', async () => {
      const duplicateSkuError = new Error('Duplicate SKU') as any;
      duplicateSkuError.code = 'ER_DUP_ENTRY';
      mockPool.execute.mockRejectedValueOnce(duplicateSkuError);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: newProductData,
      });

      await productHandler(req, res);
      
      expect(res._getStatusCode()).toBe(409);
      const responseJson = JSON.parse(res._getData());
      expect(responseJson.success).toBe(false);
      expect(responseJson.message).toContain('SKU already exists');
    });

    it('should return status 500 if database execute fails for other reasons', async () => {
      mockPool.execute.mockRejectedValueOnce(new Error('Database insert error'));

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: newProductData,
      });

      await productHandler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const responseJson = JSON.parse(res._getData());
      expect(responseJson.success).toBe(false);
      expect(responseJson.message).toBe('Failed to add product.');
    });
  });
  
  describe('Unsupported HTTP methods', () => {
    it('should return 405 for PUT request', async () => {
        const { req, res } = createMocks({ method: 'PUT' });
        await productHandler(req, res);
        expect(res._getStatusCode()).toBe(405);
        expect(JSON.parse(res._getData()).message).toBe('Method PUT Not Allowed');
    });

    it('should return 405 for DELETE request', async () => {
        const { req, res } = createMocks({ method: 'DELETE' });
        await productHandler(req, res);
        expect(res._getStatusCode()).toBe(405);
        expect(JSON.parse(res._getData()).message).toBe('Method DELETE Not Allowed');
    });
  });
});
