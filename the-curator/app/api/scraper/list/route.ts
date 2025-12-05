import { NextResponse } from 'next/server';
import { getEnabledScraperCategories } from '@/lib/repositories/scraperCategories';

export async function GET() {
  try {
    const categories = await getEnabledScraperCategories();
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error('[Scraper List] Unable to load categories', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load scraper categories.' },
      { status: 500 }
    );
  }
}
