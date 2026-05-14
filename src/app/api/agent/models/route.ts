import { NextResponse } from 'next/server';
import { getAllowedModels } from '@/app/lib/providers/commercialPricing';
import { getCustomerModels } from '@/app/lib/providers/modelCatalog';

export async function GET() {
  return NextResponse.json({
    success: true,
    models: getCustomerModels(getAllowedModels()),
  });
}
