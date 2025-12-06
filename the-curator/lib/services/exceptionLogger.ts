import { SupabaseClient } from '@supabase/supabase-js';

export interface ExceptionLogInput {
  errorType: string;
  errorMessage: string;
  errorStack?: string;
  endpoint?: string;
  functionName?: string;
  operation?: string;
  requestMethod?: string;
  requestUrl?: string;
  requestBody?: Record<string, unknown>;
  categorySlug?: string;
  sourceKey?: string;
  articleId?: string;
  articleUrl?: string;
  severity?: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  environment?: string;
  appVersion?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log an exception to the exception_logs table
 * Handles errors gracefully - logs to console if database logging fails
 */
export async function logException(
  client: SupabaseClient,
  input: ExceptionLogInput
): Promise<void> {
  try {
    const {
      errorType,
      errorMessage,
      errorStack,
      endpoint,
      functionName,
      operation,
      requestMethod,
      requestUrl,
      requestBody,
      categorySlug,
      sourceKey,
      articleId,
      articleUrl,
      severity = 'error',
      environment = process.env.NODE_ENV || 'unknown',
      appVersion = process.env.npm_package_version || 'unknown',
      metadata,
    } = input;

    // Truncate request body if too large (limit to 10KB as text)
    let truncatedRequestBody = requestBody;
    if (requestBody && JSON.stringify(requestBody).length > 10000) {
      truncatedRequestBody = {
        ...requestBody,
        _truncated: true,
        _note: 'Request body was too large and was truncated',
      };
    }

    const { error } = await client.from('exception_logs').insert({
      error_type: errorType.substring(0, 100),
      error_message: errorMessage.substring(0, 5000),
      error_stack: errorStack ? errorStack.substring(0, 10000) : null,
      endpoint: endpoint ? endpoint.substring(0, 255) : null,
      function_name: functionName ? functionName.substring(0, 100) : null,
      operation: operation ? operation.substring(0, 100) : null,
      request_method: requestMethod ? requestMethod.substring(0, 10) : null,
      request_url: requestUrl ? requestUrl.substring(0, 2000) : null,
      request_body: truncatedRequestBody,
      category_slug: categorySlug ? categorySlug.substring(0, 150) : null,
      source_key: sourceKey ? sourceKey.substring(0, 50) : null,
      article_id: articleId ? articleId.substring(0, 100) : null,
      article_url: articleUrl ? articleUrl.substring(0, 2000) : null,
      severity,
      environment: environment.substring(0, 50),
      app_version: appVersion.substring(0, 20),
      metadata,
    });

    if (error) {
      console.error('[logException] Failed to log exception to database:', error);
    }
  } catch (err) {
    // Failsafe: log to console if database logging completely fails
    console.error('[logException] Exception logging failed:', err);
  }
}

/**
 * Utility to extract error details from an Error object
 */
export function extractErrorDetails(error: unknown): {
  type: string;
  message: string;
  stack: string;
} {
  if (error instanceof Error) {
    return {
      type: error.constructor.name,
      message: error.message,
      stack: error.stack || '',
    };
  }

  if (typeof error === 'string') {
    return {
      type: 'StringError',
      message: error,
      stack: '',
    };
  }

  if (typeof error === 'object' && error !== null) {
    return {
      type: 'UnknownError',
      message: JSON.stringify(error),
      stack: '',
    };
  }

  return {
    type: 'UnknownError',
    message: String(error),
    stack: '',
  };
}
