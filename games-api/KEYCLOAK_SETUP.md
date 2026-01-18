# Keycloak Configuration Guide

## Current Issue
The application is trying to connect to Keycloak at `http://localhost:9000`, but Keycloak is not running there.

## Solution: Configure Your Keycloak Server URL

You have **3 options** to configure the Keycloak server URL:

### Option 1: Update config.js directly (Quick Fix)

Edit `/var/www/asharq-app/asharq-backend/config/config.js` and update:

```javascript
keycloak: {
    baseURL: "http://YOUR_KEYCLOAK_SERVER:PORT",  // Replace with your actual Keycloak URL
    realm: "YOUR_REALM_NAME",  // Replace with your actual realm name
    // ... rest stays the same
}
```

**Examples:**
- If Keycloak is on the same machine: `"http://localhost:8080"` (if not conflicting with frontend)
- If Keycloak is on a different port: `"http://localhost:8443"`
- If Keycloak is on a different server: `"https://keycloak.yourdomain.com"`

### Option 2: Use Environment Variables (Recommended)

Create or update `/var/www/asharq-app/asharq-backend/apps/devapi/.env`:

```bash
KEYCLOAK_BASE_URL=http://your-keycloak-server:port
KEYCLOAK_REALM=your-realm-name
KEYCLOAK_CLIENT_ID=asharq-gameshub
KEYCLOAK_CLIENT_SECRET=AoDoGJEaqLxiy0KWuDQEjRkCCoOL7fCU
KEYCLOAK_CALLBACK_URL=http://localhost:5002/v1/auth/keycloak/callback
```

Then restart your backend server.

### Option 3: Set Environment Variables Before Starting Server

```bash
export KEYCLOAK_BASE_URL="http://your-keycloak-server:port"
export KEYCLOAK_REALM="your-realm-name"
# Then start your server
```

## How to Find Your Keycloak Server URL

1. **Check Keycloak Admin Console:**
   - If you can access Keycloak admin, the URL in your browser is the base URL
   - Example: If admin is at `http://localhost:8080/admin`, then baseURL is `http://localhost:8080`

2. **Check Docker/Container Setup:**
   - If using Docker: `docker ps | grep keycloak`
   - Check the port mapping

3. **Check Keycloak Installation:**
   - Default Keycloak runs on port 8080
   - But if your frontend uses 8080, Keycloak might be on a different port

4. **Test the URL:**
   - Try accessing: `http://YOUR_KEYCLOAK_URL/realms/YOUR_REALM/.well-known/openid-configuration`
   - This should return JSON (not 404)

## Required Keycloak Client Configuration

Make sure your Keycloak client `asharq-gameshub` has:
- **Valid Redirect URI:** `http://localhost:5002/v1/auth/keycloak/callback`
- **Web Origins:** `http://localhost:5002` (or your backend URL)
- **Access Type:** `confidential` (since we're using client secret)

## After Configuration

1. Restart your backend server
2. Test the login button
3. Check backend logs for any Keycloak connection errors

