# Next Steps: Phase 2 Development - Database Query Layer

**Current Status**: Foundation layer complete with 67 tests passing ✅  
**Next Focus**: Database Query Layer (T015-T025)  
**Estimated Effort**: 2-3 days  
**Priority**: P0 - Blocking for API endpoints

---

## Phase 1 Complete Deliverables

✅ **lib/encryption.ts** - Encryption utilities (14 tests)  
✅ **lib/wordpress/types.ts** - TypeScript types  
✅ **lib/wordpress/errors.ts** - Error classes (32 tests)  
✅ **lib/wordpress/client.ts** - API client (21 tests)  

---

## Phase 2 Priority: Database Query Layer

Before building API endpoints (Phase 2), we need the database query layer:

### T015-T025: Database Functions

These functions will be the interface between API routes and the database:

```typescript
// Query functions (read-only)
- getWordPressConfig(): Promise<WordPressConfig>
- validateWordPressConnection(config): Promise<WordPressValidationResult>
- getPublishedArticles(filters): Promise<WordPressPublishedArticle[]>
- getPublishedArticleById(id): Promise<WordPressPublishedArticle>

// Mutation functions (write)
- saveWordPressConfig(config): Promise<WordPressConfig>
- publishArticle(article, wpPostId): Promise<WordPressPublishedArticle>
- updatePublishedArticle(article): Promise<WordPressPublishedArticle>
- softDeleteArticle(id): Promise<void>
- restoreArticle(id): Promise<void>
- addAuditLog(log): Promise<WordPressAuditLog>
```

### Development Approach

1. **Create test file first** (T029): `lib/db/wordpress.test.ts`
   - Mock Supabase client
   - Write tests for each function
   - Ensure error handling

2. **Implement functions** (T015-T025): `lib/db/wordpress.ts`
   - Use Supabase JS client (already configured in .env.local)
   - Execute SQL queries directly or use Supabase query builder
   - Handle transactions for multi-step operations

3. **Database Schema Ready**
   - `wordpress.config` table ✅
   - `wordpress.published_articles` table ✅
   - `wordpress.publish_audit_log` table ✅
   - All tables created in Supabase ✅

---

## Recommended Sequence

**1. T015 - getWordPressConfig() Test**
   - Mock one row from wordpress.config
   - Test decryption of credentials

**2. T015 Implementation**
   - Query wordpress.config table
   - Decrypt password_encrypted/api_token_encrypted
   - Return as WordPressAuthContext

**3. T017 - saveWordPressConfig() Test**
   - Mock Supabase insert/update
   - Test encryption before storage

**4. Continue pattern...**
   - Test → Implement → Verify

---

## Testing Strategy

```typescript
// Example test
import { getWordPressConfig } from './wordpress'
import { supabaseAdmin } from '@/lib/db/supabase'

jest.mock('@/lib/db/supabase')

describe('Database Queries', () => {
  it('should fetch and decrypt WordPress config', async () => {
    ;(supabaseAdmin.from as jest.Mock).mockReturnValue({
      select: () => ({
        single: () => ({
          data: {
            id: 'xxx',
            site_url: 'https://example.com',
            password_encrypted: 'encrypted-value',
            // ...
          },
        }),
      }),
    })

    const config = await getWordPressConfig()
    expect(config.site_url).toBe('https://example.com')
  })
})
```

---

## Files to Create

```
lib/
├── db/
│   ├── wordpress.ts           ← NEW: Database query functions
│   └── wordpress.test.ts      ← NEW: Database tests
```

---

## When Ready to Start Phase 2

Let me know and I'll:

1. ✅ Create `lib/db/wordpress.test.ts` with all test cases
2. ✅ Implement `lib/db/wordpress.ts` with actual queries
3. ✅ Verify all tests pass (expect ~15-20 new tests)
4. ✅ Then proceed to Phase 2 API endpoints

---

**Status**: Foundation solid, ready for database layer! 🚀

Just let me know when you're ready to begin Phase 2 database queries!
