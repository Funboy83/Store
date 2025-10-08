import { initializeWalkInCustomer } from '@/lib/actions/init-walk-in-customer';
import { addCustomer } from '@/lib/actions/customers';

export default async function SetupPage() {
  
  const handleInitializeDatabase = async () => {
    try {
      // Initialize walk-in customer
      const walkInResult = await initializeWalkInCustomer();
      console.log('Walk-in customer:', walkInResult.message);

      // Add some sample customers
      const sampleCustomers = [
        {
          name: 'John Doe',
          phone: '555-123-4567',
          email: 'john@example.com',
          notes: 'Regular customer'
        },
        {
          name: 'Jane Smith', 
          phone: '555-987-6543',
          email: 'jane@example.com',
          notes: 'VIP customer'
        },
        {
          name: 'Mike Johnson',
          phone: '555-456-7890', 
          email: 'mike@example.com',
          notes: 'Business customer'
        }
      ];

      for (const customer of sampleCustomers) {
        const formData = new FormData();
        formData.append('name', customer.name);
        formData.append('phone', customer.phone);
        formData.append('email', customer.email);
        formData.append('notes', customer.notes);
        
        const result = await addCustomer({}, formData);
        console.log(`Customer ${customer.name}:`, result.success ? 'Created' : 'Failed');
      }
      
      alert('Database initialized with sample customers!');
    } catch (error) {
      console.error('Error initializing database:', error);
      alert('Error initializing database');
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Database Setup</h1>
      <div className="space-y-4">
        <p className="text-gray-600">
          Click the button below to initialize your customer database with sample data.
        </p>
        <button
          onClick={handleInitializeDatabase}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Initialize Customer Database
        </button>
      </div>
    </div>
  );
}