/**
 * WordPress XML-RPC Client
 * For WordPress.com free accounts that don't support REST API authentication
 */

import { WordPressConfigurationError, WordPressAuthenticationError, WordPressError } from './errors'

interface XMLRPCAuthContext {
  username: string
  password: string
}

interface XMLRPCPostData {
  title: string
  content: string
  excerpt?: string
  categories?: number[]
  tags?: number[] | string[]
  status?: 'draft' | 'publish'
}

/**
 * WordPress XML-RPC Client
 * Uses the legacy XML-RPC protocol which WordPress.com free accounts support
 */
export class WordPressXMLRPCClient {
  private siteUrl: string
  private username: string
  private password: string
  private xmlrpcUrl: string

  constructor(siteUrl: string, auth: XMLRPCAuthContext) {
    this.siteUrl = siteUrl.replace(/\/$/, '') // Remove trailing slash
    this.username = auth.username
    this.password = auth.password
    this.xmlrpcUrl = `${this.siteUrl}/xmlrpc.php`
  }

  /**
   * Create a new post via XML-RPC
   */
  async createPost(postData: XMLRPCPostData): Promise<any> {
    // Try blogger.newPost first (most basic, compatible with WordPress.com free)
    try {
      console.log('[XML-RPC] Trying blogger.newPost...')
      return await this.createPostBlogger(postData)
    } catch (error) {
      console.log('[XML-RPC] blogger.newPost failed, trying metaWeblog.newPost', error)
      try {
        return await this.createPostMetaWeblog(postData)
      } catch (error2) {
        console.log('[XML-RPC] metaWeblog.newPost failed, trying wp.newPost', error2)
        return await this.createPostWP(postData)
      }
    }
  }

  /**
   * Create post using blogger.newPost (most basic API)
   */
  private async createPostBlogger(postData: XMLRPCPostData): Promise<any> {
    console.log('[XML-RPC] Attempting blogger.newPost')
    
    const methodCall = this.buildMethodCall('blogger.newPost', [
      '1', // appkey (not used but required)
      '1', // blogid
      this.username,
      this.password,
      `<title>${this.escapeXML(postData.title)}</title>${postData.content}`,
      true, // publish
    ])

    return await this.executePostRequest(methodCall, postData)
  }

  /**
   * Create post using metaWeblog.newPost (more compatible)
   */
  private async createPostMetaWeblog(postData: XMLRPCPostData): Promise<any> {
    console.log('[XML-RPC] Attempting metaWeblog.newPost with credentials:', {
      username: this.username,
      siteUrl: this.siteUrl,
      xmlrpcUrl: this.xmlrpcUrl
    })
    
    // Try blog ID 0 first (some WordPress.com sites use this)
    try {
      const methodCall = this.buildMethodCall('metaWeblog.newPost', [
        0, // Blog ID (try 0 for WordPress.com)
        this.username,
        this.password,
        {
          title: postData.title,
          description: postData.content,
          mt_excerpt: postData.excerpt || '',
          post_status: postData.status || 'publish',
          ...(postData.categories && postData.categories.length > 0 && {
            categories: postData.categories.map(String),
          }),
          ...(postData.tags && postData.tags.length > 0 && {
            mt_keywords: Array.isArray(postData.tags) 
              ? postData.tags.map(String).join(', ')
              : String(postData.tags),
          }),
        },
        true, // publish
      ])

      return await this.executePostRequest(methodCall, postData)
    } catch (error) {
      console.log('[XML-RPC] Blog ID 0 failed, trying blog ID 1', error)
      
      // Fallback to blog ID 1
      const methodCall = this.buildMethodCall('metaWeblog.newPost', [
        1, // Blog ID (standard WordPress)
        this.username,
        this.password,
        {
          title: postData.title,
          description: postData.content,
          mt_excerpt: postData.excerpt || '',
          post_status: postData.status || 'publish',
          ...(postData.categories && postData.categories.length > 0 && {
            categories: postData.categories.map(String),
          }),
          ...(postData.tags && postData.tags.length > 0 && {
            mt_keywords: Array.isArray(postData.tags) 
              ? postData.tags.map(String).join(', ')
              : String(postData.tags),
          }),
        },
        true, // publish
      ])

      return await this.executePostRequest(methodCall, postData)
    }
  }

  /**
   * Create post using wp.newPost
   */
  private async createPostWP(postData: XMLRPCPostData): Promise<any> {
    const methodCall = this.buildMethodCall('wp.newPost', [
      1, // Blog ID (always 1 for WordPress.com)
      this.username,
      this.password,
      {
        post_type: 'post',
        post_status: postData.status || 'publish',
        post_title: postData.title,
        post_content: postData.content,
        post_excerpt: postData.excerpt || '',
        ...(postData.categories && postData.categories.length > 0 && {
          terms: {
            category: postData.categories,
          },
        }),
        ...(postData.tags && postData.tags.length > 0 && {
          terms_names: {
            post_tag: postData.tags,
          },
        }),
      },
    ])

    return await this.executePostRequest(methodCall, postData)
  }

  /**
   * Execute the XML-RPC post request
   */
  private async executePostRequest(methodCall: string, postData: XMLRPCPostData): Promise<any> {
    try {
      const response = await fetch(this.xmlrpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml',
        },
        body: methodCall,
      })

      if (!response.ok) {
        throw new WordPressError(
          `XML-RPC request failed: ${response.status} ${response.statusText}`,
          'XMLRPC_REQUEST_FAILED'
        )
      }

      const responseText = await response.text()
      const result = this.parseXMLRPCResponse(responseText)

      console.log('[XML-RPC createPost response]', { result, responseText: responseText.substring(0, 500) })

      if (result.fault) {
        if (result.fault.faultString.includes('Incorrect username or password')) {
          throw new WordPressAuthenticationError('Invalid WordPress credentials')
        }
        throw new WordPressError(result.fault.faultString, 'XMLRPC_FAULT')
      }

      // The response should be the post ID
      const postId = result.value
      console.log('[XML-RPC Post ID]', postId)

      // Fetch the post URL by making another XML-RPC call
      let postUrl: string
      try {
        postUrl = await this.getPostUrl(postId)
        console.log('[XML-RPC Post URL]', postUrl)
      } catch (urlError) {
        console.error('[XML-RPC Get URL Error]', urlError)
        // Fallback URL if we can't get the actual URL
        postUrl = `${this.siteUrl}/?p=${postId}`
        console.log('[XML-RPC Fallback URL]', postUrl)
      }

      const finalResponse = {
        id: postId,
        link: postUrl,
        status: postData.status || 'publish',
      }
      
      console.log('[XML-RPC Final Response]', finalResponse)
      
      return finalResponse
    } catch (error) {
      if (error instanceof WordPressError) {
        throw error
      }
      throw new WordPressError(
        error instanceof Error ? error.message : 'XML-RPC request failed',
        'XMLRPC_ERROR'
      )
    }
  }

  /**
   * Get post URL via XML-RPC
   */
  private async getPostUrl(postId: number): Promise<string> {
    const methodCall = this.buildMethodCall('wp.getPost', [
      1, // Blog ID
      this.username,
      this.password,
      postId,
      ['link'],
    ])

    try {
      const response = await fetch(this.xmlrpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml',
        },
        body: methodCall,
      })

      if (!response.ok) {
        console.warn('[XML-RPC getPost failed, using fallback URL]')
        return `${this.siteUrl}/?p=${postId}`
      }

      const responseText = await response.text()
      const result = this.parseXMLRPCResponse(responseText)

      if (result.fault) {
        console.warn('[XML-RPC getPost fault, using fallback URL]', result.fault)
        return `${this.siteUrl}/?p=${postId}`
      }

      if (result.value && result.value.link) {
        return result.value.link
      }

      // Fallback URL
      return `${this.siteUrl}/?p=${postId}`
    } catch (error) {
      console.warn('[XML-RPC getPost exception, using fallback URL]', error)
      return `${this.siteUrl}/?p=${postId}` // Fallback URL
    }
  }

  /**
   * Build XML-RPC method call
   */
  private buildMethodCall(methodName: string, params: any[]): string {
    const paramsXML = params.map((param) => this.valueToXML(param)).join('\n')

    return `<?xml version="1.0" encoding="UTF-8"?>
<methodCall>
  <methodName>${methodName}</methodName>
  <params>
${paramsXML}
  </params>
</methodCall>`
  }

  /**
   * Convert JavaScript value to XML-RPC format
   */
  private valueToXML(value: any, indent: string = '    '): string {
    if (typeof value === 'string') {
      return `${indent}<param><value><string>${this.escapeXML(value)}</string></value></param>`
    }

    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        return `${indent}<param><value><int>${value}</int></value></param>`
      }
      return `${indent}<param><value><double>${value}</double></value></param>`
    }

    if (typeof value === 'boolean') {
      return `${indent}<param><value><boolean>${value ? '1' : '0'}</boolean></value></param>`
    }

    if (Array.isArray(value)) {
      const arrayData = value.map((item) => this.valueToXML(item, indent + '  ')).join('\n')
      return `${indent}<param><value><array><data>\n${arrayData}\n${indent}</data></array></value></param>`
    }

    if (typeof value === 'object' && value !== null) {
      const members = Object.entries(value)
        .map(([key, val]) => {
          const valXML = this.toXMLValue(val, indent + '    ')
          return `${indent}  <member>
${indent}    <name>${this.escapeXML(key)}</name>
${valXML}
${indent}  </member>`
        })
        .join('\n')

      return `${indent}<param><value><struct>\n${members}\n${indent}</struct></value></param>`
    }

    return `${indent}<param><value><string></string></value></param>`
  }

  /**
   * Convert value to XML (for struct members)
   */
  private toXMLValue(value: any, indent: string): string {
    if (typeof value === 'string') {
      return `${indent}<value><string>${this.escapeXML(value)}</string></value>`
    }

    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        return `${indent}<value><int>${value}</int></value>`
      }
      return `${indent}<value><double>${value}</double></value>`
    }

    if (typeof value === 'boolean') {
      return `${indent}<value><boolean>${value ? '1' : '0'}</boolean></value>`
    }

    if (Array.isArray(value)) {
      const arrayData = value
        .map((item) => this.toXMLValue(item, indent + '  '))
        .join('\n')
      return `${indent}<value><array><data>\n${arrayData}\n${indent}</data></array></value>`
    }

    if (typeof value === 'object' && value !== null) {
      const members = Object.entries(value)
        .map(([key, val]) => {
          const valXML = this.toXMLValue(val, indent + '    ')
          return `${indent}  <member>
${indent}    <name>${this.escapeXML(key)}</name>
${valXML}
${indent}  </member>`
        })
        .join('\n')

      return `${indent}<value><struct>\n${members}\n${indent}</struct></value>`
    }

    return `${indent}<value><string></string></value>`
  }

  /**
   * Parse XML-RPC response
   */
  private parseXMLRPCResponse(xml: string): any {
    // Check for fault
    if (xml.includes('<fault>')) {
      const faultCodeMatch = xml.match(/<name>faultCode<\/name>\s*<value><int>(\d+)<\/int><\/value>/)
      const faultStringMatch = xml.match(/<name>faultString<\/name>\s*<value><string>(.*?)<\/string><\/value>/)

      return {
        fault: {
          faultCode: faultCodeMatch ? parseInt(faultCodeMatch[1]) : 0,
          faultString: faultStringMatch ? faultStringMatch[1] : 'Unknown error',
        },
      }
    }

    // Extract the value - for simple types
    const intMatch = xml.match(/<int>(\d+)<\/int>/)
    if (intMatch) {
      return { value: parseInt(intMatch[1]) }
    }

    const stringMatch = xml.match(/<string>(.*?)<\/string>/)
    if (stringMatch) {
      return { value: stringMatch[1] }
    }

    // For struct responses (like getPost)
    const linkMatch = xml.match(/<name>link<\/name>\s*<value><string>(.*?)<\/string><\/value>/)
    if (linkMatch) {
      return {
        value: {
          link: linkMatch[1],
        },
      }
    }

    return { value: null }
  }

  /**
   * Escape XML special characters
   */
  private escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }
}
