import { NextRequest, NextResponse } from 'next/server';
import { migrateLegacyParts } from '@/lib/actions/parts';

export async function POST(request: NextRequest) {
  try {
    const result = await migrateLegacyParts();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        migratedCount: result.migratedCount,
        message: `Successfully migrated ${result.migratedCount} parts`
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Unknown error occurred'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}