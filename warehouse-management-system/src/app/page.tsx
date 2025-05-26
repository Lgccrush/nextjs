import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-100">
      <div className="bg-white p-10 rounded-lg shadow-xl text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Warehouse Management System</h1>
        <nav className="space-y-4">
          <div>
            <Link href="/products" legacyBehavior>
              <a className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-150 ease-in-out w-full md:w-auto block text-center">
                View Products
              </a>
            </Link>
          </div>
          <div>
            <Link href="/inventory" legacyBehavior>
              <a className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-150 ease-in-out w-full md:w-auto block text-center">
                View Inventory
              </a>
            </Link>
          </div>
          {/* Add more links here as new pages are created */}
        </nav>
      </div>
    </main>
  );
}
