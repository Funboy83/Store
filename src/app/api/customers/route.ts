import { NextRequest, NextResponse } from 'next/server';
import { addCustomer } from '@/lib/actions/customers';

export async function POST(request: NextRequest) {
  try {
    // Parse the JSON body from POS request
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.phone) {
      return NextResponse.json(
        { success: false, error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    // Create FormData to work with existing addCustomer function
    const formData = new FormData();
    formData.append('name', body.name);
    formData.append('phone', body.phone);
    formData.append('email', body.email || '');
    formData.append('notes', body.notes || 'Created from POS system');

    // Use existing Studio app logic to create customer
    const result = await addCustomer({}, formData);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Customer created successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to create customer - validation error'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('API Error - Create Customer:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OPTIONS method for CORS (if needed for development)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}