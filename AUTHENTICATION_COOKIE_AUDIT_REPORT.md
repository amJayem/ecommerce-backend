# 🔍 Authentication Cookie Flow - Comprehensive Audit Report

**Date:** Generated on audit  
**Backend URL:** `https://ecommerce-backend-k4wn.onrender.com/api/v1`  
**Dashboard URL:** `https://ecommerce-dashboard-r.vercel.app`  
**Local Dashboard:** `http://localhost:5173`

---

## 📋 EXECUTIVE SUMMARY

### ✅ What is Working

1. **Backend Login Endpoint** - Correctly implemented at `POST /api/v1/auth/login`
2. **Token Generation** - JWT tokens are properly generated with correct expiration
3. **Cookie Setting Logic** - Cookies are being set with appropriate attributes
4. **CORS Configuration** - `credentials: true` is enabled
5. **JWT Strategy** - Correctly extracts tokens from cookies or Authorization header

### ❌ What is NOT Working

1. **Cross-Domain Cookie Configuration** - Missing `ALLOW_CROSS_DOMAIN_COOKIES=true` for production
2. **Cookie Domain Attribute** - Not explicitly set (may cause issues)
3. **Frontend Credentials** - Unknown if frontend uses `credentials: 'include'`
4. **Environment Variable Configuration** - Production environment may not have correct settings

### 🚨 Critical Issues

1. **SameSite Mismatch** - Production likely using `strict` instead of `none` for cross-domain
2. **Secure Flag** - May not be set correctly for cross-domain scenarios
3. **CORS Origin Validation** - Need to verify exact origin matching

---

## 1. BACKEND LOGIN CONTROLLER ANALYSIS

### ✅ Endpoint Confirmation

- **Route:** `POST /api/v1/auth/login`
- **Controller:** `AuthController.login()`
- **Location:** `src/auth/auth.controller.ts:87-132`
- **Status:** ✅ **CORRECT**

### ✅ Token Generation Flow

```typescript
// Flow in auth.service.ts:
1. User validation (email/password check)
2. Generate tokens via getTokens()
   - access_token: 15 minutes expiry
   - refresh_token: 7 days expiry
3. Store hashed refresh_token in database
4. Return tokens + user data
```

**Status:** ✅ **CORRECT**

### ✅ Cookie Setting Implementation

```typescript
// Lines 108-123 in auth.controller.ts
res.cookie('refresh_token', result.refresh_token, {
  httpOnly: true, // ✅ Prevents JS access
  secure: getSecureFlag(), // ✅ Environment-aware
  sameSite: getSameSite(), // ✅ Environment-aware
  path: '/', // ✅ Correct path
  maxAge: 7 * 24 * 60 * 60 * 1000, // ✅ 7 days
});

res.cookie('access_token', result.access_token, {
  httpOnly: true, // ✅ Prevents JS access
  secure: getSecureFlag(), // ✅ Environment-aware
  sameSite: getSameSite(), // ✅ Environment-aware
  path: '/', // ✅ Correct path
  maxAge: 15 * 60 * 1000, // ✅ 15 minutes
});
```

**Status:** ✅ **IMPLEMENTATION CORRECT**

### ⚠️ Cookie Attributes Analysis

#### SameSite Attribute

```typescript
const getSameSite = (): 'strict' | 'lax' | 'none' => {
  if (process.env.ALLOW_CROSS_DOMAIN_COOKIES === 'true') {
    return 'none'; // For cross-domain
  }
  return process.env.NODE_ENV === 'production' ? 'strict' : 'lax';
};
```

**Current Behavior:**

- **Development:** `lax` ✅ (works for different ports)
- **Production (without flag):** `strict` ❌ (blocks cross-domain cookies)
- **Production (with flag):** `none` ✅ (allows cross-domain)

**Issue:** If `ALLOW_CROSS_DOMAIN_COOKIES` is not set to `'true'` in production, cookies will use `strict` and **WILL NOT WORK** across different domains.

#### Secure Flag

```typescript
const getSecureFlag = (): boolean => {
  const sameSite = getSameSite();
  if (sameSite === 'none') {
    return true; // Required by browsers
  }
  return process.env.NODE_ENV === 'production';
};
```

**Current Behavior:**

- **Development:** `false` ✅ (HTTP allowed)
- **Production:** `true` ✅ (HTTPS required)
- **Cross-domain:** `true` ✅ (Required when sameSite='none')

**Status:** ✅ **CORRECT**

#### HttpOnly Flag

- **Status:** ✅ **ALWAYS TRUE** - Correctly prevents XSS attacks

#### Path Attribute

- **Status:** ✅ **SET TO '/'** - Cookies available for all paths

#### MaxAge Attribute

- **refresh_token:** ✅ 7 days (604,800,000 ms)
- **access_token:** ✅ 15 minutes (900,000 ms)

### ✅ Cookie Response Verification

Cookies are being set via `res.cookie()` which adds `Set-Cookie` headers to the response. The implementation is correct.

**Status:** ✅ **COOKIES ARE BEING SET IN RESPONSE**

---

## 2. CORS CONFIGURATION ANALYSIS

### ✅ CORS Setup Location

- **File:** `src/main.ts:64-78`
- **Status:** ✅ **CORRECTLY CONFIGURED**

### ✅ Credentials Configuration

```typescript
app.enableCors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true, // ✅ CORRECT - Required for cookies
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
});
```

**Status:** ✅ **CREDENTIALS: TRUE IS SET**

### ✅ Origin Configuration

```typescript
const corsOrigins = process.env.CORS_ORIGINS?.split(',').map((origin) =>
  origin.trim(),
) || [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://ecommerce-dashboard-r.vercel.app', // ✅ Dashboard URL included
];
```

**Current Origins:**

- ✅ `http://localhost:3000`
- ✅ `http://localhost:3001`
- ✅ `https://ecommerce-dashboard-r.vercel.app` (hardcoded fallback)

**Status:** ✅ **ORIGIN IS NOT '\*'** - Specific origins are whitelisted

### ✅ OPTIONS Preflight Handling

NestJS `enableCors()` automatically handles OPTIONS preflight requests. The configuration includes:

- ✅ `OPTIONS` method in allowed methods
- ✅ `credentials: true` in preflight response
- ✅ Origin validation in preflight

**Status:** ✅ **OPTIONS PREFLIGHT IS CORRECT**

### ⚠️ Potential CORS Issues

1. **Environment Variable Dependency**

   - If `CORS_ORIGINS` is not set in production, it falls back to hardcoded values
   - **Recommendation:** Ensure `CORS_ORIGINS` is set in production environment

2. **Origin Matching**
   - CORS requires exact origin match (protocol + domain + port)
   - `https://ecommerce-dashboard-r.vercel.app` must match exactly
   - **Status:** ✅ Should work if URL matches exactly

---

## 3. BROWSER NETWORK INSPECTION CHECKLIST

### Request Headers (What to Check)

#### ✅ Required Headers

1. **Origin Header**

   ```
   Origin: https://ecommerce-dashboard-r.vercel.app
   ```

   - Must match one of the CORS_ORIGINS
   - **Status:** ✅ Should be present

2. **Content-Type Header**
   ```
   Content-Type: application/json
   ```
   - **Status:** ✅ Should be present

#### ⚠️ Cookie Header (Incoming)

- **First Request:** Should be empty (no cookies yet)
- **Subsequent Requests:** Should contain `access_token` and `refresh_token`
- **Status:** ⚠️ **NEEDS VERIFICATION** - Check browser DevTools

### Response Headers (What to Check)

#### ✅ Set-Cookie Headers (Critical)

After successful login, you should see:

```
Set-Cookie: refresh_token=<token>; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=604800
Set-Cookie: access_token=<token>; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=900
```

**What to Verify:**

1. ✅ Both cookies are present
2. ✅ `HttpOnly` attribute is set
3. ✅ `Secure` attribute is set (for HTTPS)
4. ✅ `SameSite=None` (for cross-domain) or `SameSite=Lax` (for same-domain)
5. ✅ `Path=/` is set
6. ✅ `Max-Age` values are correct

**Status:** ⚠️ **NEEDS VERIFICATION** - Check Network tab in DevTools

#### ✅ CORS Headers

```
Access-Control-Allow-Origin: https://ecommerce-dashboard-r.vercel.app
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token
```

**Status:** ✅ **SHOULD BE PRESENT** - Verify in Network tab

### ⚠️ Browser Console Warnings

**Common Cookie Errors to Look For:**

1. **SameSite Warning**

   ```
   ⚠️ This attempt to set a cookie via a Set-Cookie header was blocked
   because it had the SameSite=Strict attribute but came from a cross-site response
   ```

   **Cause:** `sameSite: 'strict'` with cross-domain request
   **Fix:** Set `ALLOW_CROSS_DOMAIN_COOKIES=true`

2. **Secure Cookie Warning**

   ```
   ⚠️ This attempt to set a cookie was blocked because it was marked Secure
   but was sent over an insecure connection
   ```

   **Cause:** `secure: true` with HTTP connection
   **Fix:** Use HTTPS or set `secure: false` in development

3. **Third-Party Cookie Warning**
   ```
   ⚠️ Cookies marked with SameSite=None must also be marked Secure
   ```
   **Cause:** `sameSite: 'none'` without `secure: true`
   **Fix:** Already handled in code (getSecureFlag returns true when sameSite='none')

**Status:** ⚠️ **CHECK BROWSER CONSOLE** - Look for these warnings

---

## 4. IDENTIFIED ISSUES & ROOT CAUSES

### 🚨 Issue #1: SameSite Mismatch for Cross-Domain

**Problem:**

- Production environment likely uses `sameSite: 'strict'` (default)
- Cross-domain requests (dashboard.vercel.app → backend.onrender.com) require `sameSite: 'none'`
- Cookies are blocked by browser

**Root Cause:**

```typescript
// Current logic in auth.controller.ts:39-45
const getSameSite = (): 'strict' | 'lax' | 'none' => {
  if (process.env.ALLOW_CROSS_DOMAIN_COOKIES === 'true') {
    return 'none';
  }
  return process.env.NODE_ENV === 'production' ? 'strict' : 'lax';
};
```

If `ALLOW_CROSS_DOMAIN_COOKIES` is not set to `'true'` in production:

- `NODE_ENV=production` → `sameSite: 'strict'`
- Cross-domain cookies are **BLOCKED**

**Impact:** 🔴 **CRITICAL** - Cookies will not be set in production

**Fix Required:**

```env
# In production .env file
ALLOW_CROSS_DOMAIN_COOKIES=true
NODE_ENV=production
```

---

### 🚨 Issue #2: Missing Domain Attribute

**Problem:**

- Cookies don't have explicit `domain` attribute
- Cookies are set on backend domain (`ecommerce-backend-k4wn.onrender.com`)
- This is actually **CORRECT** behavior, but may cause confusion

**Current Behavior:**

- Cookies are stored on: `ecommerce-backend-k4wn.onrender.com`
- Cookies are sent automatically to backend on subsequent requests
- This is the expected behavior for cross-domain cookies

**Status:** ✅ **NOT AN ISSUE** - This is correct behavior

**Note:** Setting `domain` attribute would actually break cross-domain cookies. The current implementation is correct.

---

### ⚠️ Issue #3: Frontend Credentials Configuration

**Problem:**

- Unknown if frontend uses `credentials: 'include'` or `withCredentials: true`
- Without this, cookies will not be sent with requests

**Required Frontend Configuration:**

#### Fetch API:

```typescript
fetch('https://ecommerce-backend-k4wn.onrender.com/api/v1/auth/login', {
  method: 'POST',
  credentials: 'include', // ← REQUIRED
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
```

#### Axios:

```typescript
const api = axios.create({
  baseURL: 'https://ecommerce-backend-k4wn.onrender.com/api/v1',
  withCredentials: true, // ← REQUIRED
});
```

**Status:** ⚠️ **NEEDS VERIFICATION** - Check frontend code

---

### ⚠️ Issue #4: Environment Variable Configuration

**Problem:**

- Production environment may not have correct `.env` variables
- Missing `ALLOW_CROSS_DOMAIN_COOKIES=true`
- `CORS_ORIGINS` may not include dashboard URL

**Required Production Environment Variables:**

```env
NODE_ENV=production
ALLOW_CROSS_DOMAIN_COOKIES=true
CORS_ORIGINS=https://ecommerce-dashboard-r.vercel.app
JWT_SECRET=<your-secret>
JWT_REFRESH_SECRET=<your-refresh-secret>
DATABASE_URL=<your-database-url>
```

**Status:** ⚠️ **NEEDS VERIFICATION** - Check production environment

---

### ⚠️ Issue #5: Cookie Path Consistency

**Current Implementation:**

- All cookies use `path: '/'`
- This is correct and ensures cookies are available for all API paths

**Status:** ✅ **CORRECT** - No issue

---

## 5. PROFESSIONAL SOLUTION & RECOMMENDATIONS

### ✅ Recommended Cookie Settings

#### For Production (Cross-Domain):

```typescript
{
  httpOnly: true,        // ✅ Prevents XSS
  secure: true,          // ✅ Required for HTTPS + SameSite=None
  sameSite: 'none',      // ✅ Allows cross-domain
  path: '/',             // ✅ Available for all paths
  maxAge: <appropriate>  // ✅ Based on token expiry
}
```

#### For Development (Local):

```typescript
{
  httpOnly: true,        // ✅ Prevents XSS
  secure: false,         // ✅ Allows HTTP
  sameSite: 'lax',       // ✅ Allows different ports
  path: '/',             // ✅ Available for all paths
  maxAge: <appropriate>  // ✅ Based on token expiry
}
```

**Current Implementation:** ✅ **ALREADY CORRECT** - Uses environment-aware functions

---

### ✅ Correct Axios Setup

```typescript
// api.ts or axios.config.ts
import axios from 'axios';

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    'https://ecommerce-backend-k4wn.onrender.com/api/v1',
  withCredentials: true, // ← CRITICAL: Required for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (optional - for logging)
api.interceptors.request.use(
  (config) => {
    // Cookies are automatically included via withCredentials
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Refresh token is automatically sent via cookie
        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
```

---

### ✅ Correct Backend CORS Setup

**Current Implementation:** ✅ **ALREADY CORRECT**

```typescript
// src/main.ts
app.enableCors({
  origin: corsOrigins, // ✅ Specific origins, not '*'
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true, // ✅ Required for cookies
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
});
```

**Recommendation:** Add explicit `exposedHeaders` if needed:

```typescript
app.enableCors({
  // ... existing config
  exposedHeaders: ['Set-Cookie'], // Optional: explicitly expose Set-Cookie
});
```

---

### ✅ How to Persist Auth on Refresh

**Current Implementation:** ✅ **ALREADY HANDLED**

1. **Cookies are HttpOnly** - Automatically sent with requests
2. **Refresh Token Flow** - `/auth/refresh` endpoint exists
3. **JWT Strategy** - Extracts token from cookies automatically

**Frontend Implementation:**

```typescript
// On app initialization (e.g., _app.tsx, App.tsx)
useEffect(() => {
  const checkAuth = async () => {
    try {
      // This request automatically includes cookies
      const response = await api.get('/auth/me');
      // User is authenticated
      setUser(response.data.user);
    } catch (error) {
      // Not authenticated or token expired
      // Try to refresh token
      try {
        await api.post('/auth/refresh');
        // Token refreshed, retry /auth/me
        const response = await api.get('/auth/me');
        setUser(response.data.user);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        router.push('/login');
      }
    }
  };

  checkAuth();
}, []);
```

---

### ✅ How to Avoid Infinite Refresh Loops

**Current Implementation:** ✅ **ALREADY HANDLED**

The refresh endpoint (`/auth/refresh`) only uses the refresh token from cookies. If refresh fails, it throws an error, preventing infinite loops.

**Additional Safeguards (Recommended):**

```typescript
// Enhanced axios interceptor with loop prevention
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        processQueue(null, response.data.access_token);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
```

---

## 6. EXACT FIXES REQUIRED

### 🔴 Fix #1: Set Environment Variable in Production

**Action Required:**

1. Go to your production hosting (Render.com)
2. Navigate to Environment Variables
3. Add/Update:
   ```
   ALLOW_CROSS_DOMAIN_COOKIES=true
   ```
4. Ensure `CORS_ORIGINS` includes:
   ```
   CORS_ORIGINS=https://ecommerce-dashboard-r.vercel.app
   ```
5. Restart the backend service

**Expected Result:**

- Cookies will use `sameSite: 'none'`
- Cookies will work across domains

---

### 🔴 Fix #2: Verify Frontend Credentials

**Action Required:**

1. Check frontend API client configuration
2. Ensure `credentials: 'include'` (Fetch) or `withCredentials: true` (Axios)
3. Test login request in browser DevTools
4. Verify `Set-Cookie` headers in response

**Expected Result:**

- Cookies are sent with requests
- Cookies are received in responses

---

### 🔴 Fix #3: Test Cookie Flow

**Action Required:**

1. Open browser DevTools → Network tab
2. Perform login
3. Check Response Headers for `Set-Cookie`
4. Check Application → Cookies → verify cookies exist
5. Check Console for cookie warnings

**Expected Result:**

- No cookie warnings in console
- Cookies visible in Application tab
- Subsequent requests include cookies

---

### ⚠️ Fix #4: Add Cookie Domain Logging (Optional)

**Action Required:**
Add debug logging to verify cookie settings:

```typescript
// In auth.controller.ts login method (already partially implemented)
console.log('🍪 Cookie settings:', {
  sameSite,
  secure,
  allowCrossDomain: process.env.ALLOW_CROSS_DOMAIN_COOKIES,
  nodeEnv: process.env.NODE_ENV,
  corsOrigins: process.env.CORS_ORIGINS,
});
```

**Expected Result:**

- Server logs show correct cookie configuration
- Easy to debug production issues

---

## 7. TESTING CHECKLIST

### ✅ Backend Tests

- [ ] Login endpoint returns 200 with user data
- [ ] Response includes `Set-Cookie` headers
- [ ] Cookies have correct attributes (HttpOnly, Secure, SameSite)
- [ ] CORS headers are present in response
- [ ] Refresh endpoint works with cookies
- [ ] Logout endpoint clears cookies

### ✅ Frontend Tests

- [ ] Login request includes `credentials: 'include'`
- [ ] Cookies are set after successful login
- [ ] Cookies are sent with subsequent requests
- [ ] Token refresh works automatically
- [ ] Logout clears cookies
- [ ] Auth persists on page refresh

### ✅ Cross-Domain Tests

- [ ] Login from dashboard.vercel.app works
- [ ] Cookies are set correctly
- [ ] No console warnings about cookies
- [ ] Subsequent API calls include cookies
- [ ] Token refresh works across domains

---

## 8. SUMMARY

### ✅ What is Working

1. Backend login endpoint implementation
2. Token generation and storage
3. Cookie setting logic
4. CORS configuration
5. JWT strategy and guards
6. Environment-aware cookie attributes

### ❌ What is NOT Working (Likely Issues)

1. **Production environment variable** - `ALLOW_CROSS_DOMAIN_COOKIES` may not be set
2. **Frontend credentials** - Unknown if `credentials: 'include'` is used
3. **Cookie SameSite** - May be `strict` instead of `none` in production

### 🚨 Why It Fails

1. **SameSite=Strict** blocks cross-domain cookies
2. **Missing environment variable** prevents `sameSite: 'none'`
3. **Frontend may not send credentials** preventing cookie transmission

### 🔧 Exact Fixes Required

1. **Set `ALLOW_CROSS_DOMAIN_COOKIES=true` in production**
2. **Verify frontend uses `credentials: 'include'`**
3. **Test cookie flow in browser DevTools**
4. **Verify CORS_ORIGINS includes dashboard URL**

---

## 9. QUICK REFERENCE

### Production Environment Variables

```env
NODE_ENV=production
ALLOW_CROSS_DOMAIN_COOKIES=true
CORS_ORIGINS=https://ecommerce-dashboard-r.vercel.app
```

### Frontend API Configuration

```typescript
// Fetch
credentials: 'include';

// Axios
withCredentials: true;
```

### Expected Cookie Attributes (Production)

```
Set-Cookie: refresh_token=...; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=604800
Set-Cookie: access_token=...; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=900
```

---

**Report Generated:** Comprehensive audit of authentication cookie flow  
**Next Steps:** Implement fixes #1-3 and verify in production environment
