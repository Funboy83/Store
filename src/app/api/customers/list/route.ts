import { NextRequest, NextResponse } from 'next/server';
import { getCustomers } from '@/lib/actions/customers';

export async function GET(request: NextRequest) {
  try {
    // Get customers using existing Studio app logic
    const customers = await getCustomers();
    
    // Filter out sensitive information for POS
    const safeCustomers = customers.map(customer => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      // Don't send debt, totalSpent, etc. to POS for security
    }));

    return NextResponse.json({
      success: true,
      customers: safeCustomers
    });

  } catch (error) {
    console.error('API Error - Get Customers:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OPTIONS method for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}