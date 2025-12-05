import type { ScrapedArticle, ValidationResult } from '@/lib/types/database';

export interface ExpectedArticleData {
  title: string;
  content: string;
  author?: string;
  category?: string;
  publishedDate: string;
  images?: string[];
}

export class ScraperValidator {
  /**
   * Validate scraped data against expected data
   */
  static validate(
    expected: ExpectedArticleData,
    actual: ScrapedArticle | undefined
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    if (!actual) {
      return [
        {
          field: 'all',
          expected: 'Valid scraped data',
          actual: 'No data scraped',
          match: false,
        },
      ];
    }

    // Validate title
    results.push({
      field: 'title',
      expected: expected.title,
      actual: actual.title,
      match: this.fuzzyMatch(expected.title, actual.title),
    });

    // Validate content (first 100 chars for preview)
    const expectedContentPreview = expected.content.substring(0, 100);
    const actualContentPreview = actual.content.substring(0, 100);
    results.push({
      field: 'content',
      expected: expectedContentPreview + '...',
      actual: actualContentPreview + '...',
      match: this.fuzzyMatch(expected.content, actual.content, 0.8),
    });

    // Validate author (if provided)
    if (expected.author) {
      results.push({
        field: 'author',
        expected: expected.author,
        actual: actual.author || '',
        match: this.fuzzyMatch(expected.author, actual.author || ''),
      });
    }

    // Validate category (if provided)
    if (expected.category) {
      results.push({
        field: 'category',
        expected: expected.category,
        actual: actual.category || '',
        match: this.fuzzyMatch(expected.category, actual.category || ''),
      });
    }

    // Validate published date
    results.push({
      field: 'publishedDate',
      expected: expected.publishedDate,
      actual: actual.publishedDate,
      match: this.fuzzyMatch(expected.publishedDate, actual.publishedDate),
    });

    // Validate images count
    if (expected.images && expected.images.length > 0) {
      results.push({
        field: 'images',
        expected: `${expected.images.length} images`,
        actual: `${actual.images?.length || 0} images`,
        match: (actual.images?.length || 0) >= expected.images.length,
      });
    }

    return results;
  }

  /**
   * Fuzzy string matching with similarity threshold
   */
  private static fuzzyMatch(
    str1: string,
    str2: string,
    threshold: number = 0.9
  ): boolean {
    if (!str1 || !str2) return false;

    // Normalize strings
    const normalize = (s: string) =>
      s.toLowerCase().replace(/\s+/g, ' ').trim();

    const normalized1 = normalize(str1);
    const normalized2 = normalize(str2);

    // Exact match
    if (normalized1 === normalized2) return true;

    // Calculate similarity score using Levenshtein distance
    const similarity = this.calculateSimilarity(normalized1, normalized2);
    return similarity >= threshold;
  }

  /**
   * Calculate string similarity (0 to 1)
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Levenshtein distance calculation
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get overall validation status
   */
  static getOverallStatus(results: ValidationResult[]): {
    passed: number;
    failed: number;
    total: number;
    success: boolean;
  } {
    const passed = results.filter((r) => r.match).length;
    const failed = results.filter((r) => !r.match).length;
    const total = results.length;

    return {
      passed,
      failed,
      total,
      success: failed === 0,
    };
  }
}
