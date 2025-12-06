# WordPress.com REST API Setup Guide

## Problem
WordPress.com sites don't support basic username/password authentication for the REST API. They require **Application Passwords**.

## Solution: Create an Application Password

### Step 1: Generate Application Password

1. Go to your WordPress.com account settings:
   https://wordpress.com/me/security/application-passwords

2. Click **"Add New Application Password"**

3. Give it a name like: `The Curator App`

4. Click **"Create Password"**

5. **IMPORTANT**: Copy the generated password immediately (it looks like: `xxxx xxxx xxxx xxxx xxxx xxxx`)

### Step 2: Update Your Configuration

1. Go to: http://localhost:3000/admin/wordpress-config

2. Keep your username: `bob3185e06de9976`

3. Replace the password field with the **Application Password** you just created

4. Click **"Test Connection"** - it should now work!

5. Click **"Save Configuration"**

### Step 3: Try Publishing Again

Now when you go to `/admin/wordpress-publisher` and try to publish an article, it should work!

## Alternative: Use WordPress.com REST API Directly

If Application Passwords don't work, WordPress.com also supports OAuth2, but that requires a more complex setup with client ID/secret registration.

## Note About WordPress.com URLs

WordPress.com uses a slightly different API structure:
- Self-hosted: `https://yoursite.com/wp-json/wp/v2/posts`
- WordPress.com: `https://public-api.wordpress.com/wp/v2/sites/yoursite.wordpress.com/posts`

Our client currently uses the self-hosted structure. If Application Passwords don't work, we may need to update the client to use the WordPress.com API structure.
