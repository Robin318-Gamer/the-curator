import {
  getNextScraperCategory,
  getScraperCategoryBySlug,
  updateScraperCategoryLastRun,
} from '@/lib/repositories/scraperCategories';
import type { ScraperCategory } from '@/lib/types/database';

export class CategoryScheduler {
  static async selectCategory(slug?: string): Promise<ScraperCategory | null> {
    if (slug) {
      const category = await getScraperCategoryBySlug(slug);
      if (category && category.is_enabled) {
        return category;
      }
    }
    return await getNextScraperCategory();
  }

  static async refreshLastRun(categoryId: string, timestamp?: string): Promise<void> {
    await updateScraperCategoryLastRun(categoryId, timestamp ?? new Date().toISOString());
  }
}