/**
 * WordPress Delete API
 * DELETE: Soft delete article (mark as deleted, keep in DB)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPublishedArticleById, softDeleteArticle, addAuditLog } from '@/lib/db/wordpress'

/**
 * DELETE /api/admin/wordpress/delete
 * Soft delete article (does not remove from WordPress, only marks as deleted locally)
 * 
 * Query params:
 * - article_id: string
 * - deleted_by: string
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const articleId = searchParams.get('article_id')
    const deletedBy = searchParams.get('deleted_by')

    // Validation
    if (!articleId || !deletedBy) {
      return NextResponse.json(
        { error: 'Missing required parameters: article_id, deleted_by' },
        { status: 400 }
      )
    }

    // Fetch article
    const article = await getPublishedArticleById(articleId)

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    if (article.is_deleted) {
      return NextResponse.json(
        { error: 'Article is already deleted' },
        { status: 400 }
      )
    }

    // Soft delete
    await softDeleteArticle(articleId, deletedBy)

    // Add audit log
    await addAuditLog({
      article_id: articleId,
      action: 'delete',
      admin_user_id: deletedBy,
      old_data: {
        title: article.title,
        wp_post_id: article.wp_post_id,
      },
      status: 'success',
      environment: process.env.NODE_ENV as 'development' | 'production',
    })

    return NextResponse.json({
      success: true,
      message: 'Article marked as deleted',
      article_id: articleId,
    })
  } catch (error) {
    console.error('[WordPress Delete Error]', error)

    // Add failed audit log
    try {
      const { searchParams } = new URL(request.url)
      const articleId = searchParams.get('article_id')
      const deletedBy = searchParams.get('deleted_by')

      if (articleId && deletedBy) {
        await addAuditLog({
          article_id: articleId,
          action: 'delete',
          admin_user_id: deletedBy,
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          environment: process.env.NODE_ENV as 'development' | 'production',
        })
      }
    } catch (logError) {
      console.error('[Audit Log Error]', logError)
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete article',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
