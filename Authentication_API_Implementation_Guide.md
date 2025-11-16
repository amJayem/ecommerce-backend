# Authentication API Implementation Guide

This comprehensive guide covers everything you need to know about implementing and using the Login and Register APIs in this eCommerce backend application.

## Table of Contents

1. [Login API](#login-api)
   - [API Endpoint Details](#api-endpoint-details)
   - [Required Input](#required-input)
   - [Security Concerns](#security-concerns)
   - [Example Requests & Responses](#example-requests--responses)
   - [Frontend Integration](#frontend-integration)
2. [Register API](#register-api)
   - [Register API Endpoint Details](#register-api-endpoint-details)
   - [Register Required Input](#register-required-input)
   - [Register Security Concerns](#register-security-concerns)
   - [Register Example Requests & Responses](#register-example-requests--responses)
   - [Register Frontend Integration](#register-frontend-integration)
3. [Frontend Authentication State Management](#frontend-authentication-state-management)
   - [The Problem: Cookie vs LocalStorage Scenario](#the-problem-cookie-vs-localstorage-scenario)
   - [Solution: Always Validate with Backend](#solution-always-validate-with-backend)
   - [Step-by-Step Implementation](#step-1-create-authentication-validation-function)
4. [Shared Implementation Instructions](#shared-implementation-instructions)
5. [Environment Variables](#environment-variables)
6. [Troubleshooting](#troubleshooting)
7. [Audit Logging Storage](#audit-logging-storage)

---

# Login API

---

## API Endpoint Details

**Endpoint:** `POST /api/v1/auth/login`

**Base URL:** `http://localhost:3456` (development) or your production URL

**Full URL:** `http://localhost:3456/api/v1/auth/login`

**Content-Type:** `application/json`

**Rate Limiting:** 10 requests per minute per IP address

---

## Required Input

### Request Body (JSON)

The login endpoint requires a JSON body with the following fields:

```json
{
  "email": "user@example.com",
  "password": "userPassword123"
}
```

### Field Specifications

| Field      | Type   | Required | Validation                   | Description                     |
| ---------- | ------ | -------- | ---------------------------- | ------------------------------- |
| `email`    | string | ✅ Yes   | Must be a valid email format | User's registered email address |
| `password` | string | ✅ Yes   | Minimum 6 characters         | User's password (plain text)    |

### Validation Rules

- **Email**: Must pass `@IsEmail()` validation (standard email format)
- **Password**: Must be at least 6 characters long (`@MinLength(6)`)

### Example Valid Inputs

```json
{
  "email": "jane.doe@example.com",
  "password": "P@ssw0rd!"
}
```

```json
{
  "email": "admin@ecommerce.com",
  "password": "SecurePass123"
}
```

---

## Security Concerns

### 🔒 Critical Security Features Implemented

#### 1. **Account Lockout Protection**

- **Maximum Attempts**: 5 failed login attempts
- **Lockout Duration**: 15 minutes
- **Behavior**: After 5 failed attempts, the account is locked for 15 minutes
- **Reset**: Lockout is cleared on successful login

#### 2. **Password Security**

- Passwords are hashed using **bcrypt** with salt rounds of 10
- Passwords are **never** returned in API responses
- Password comparison uses constant-time comparison to prevent timing attacks

#### 3. **JWT Token Security**

- **Access Token**: Expires in 15 minutes
- **Refresh Token**: Expires in 7 days
- Tokens are stored in **HttpOnly cookies** (prevents XSS attacks)
- Cookies use `sameSite: 'strict'` (prevents CSRF attacks)
- `secure` flag enabled in production (HTTPS only)

#### 4. **Rate Limiting**

- **10 requests per minute** per IP address
- Prevents brute force attacks
- Applied globally via `ThrottlerGuard`

#### 5. **Audit Logging**

- All login attempts (successful and failed) are logged
- Failed attempts include reason (user not found, invalid password)
- Helps detect suspicious activity
- **Current Storage**: Logs are written to **console/stdout** using NestJS Logger
- **Note**: Logs are NOT persisted to database or files (see implementation details below)

#### 6. **Input Validation**

- All inputs are validated using `class-validator`
- Prevents injection attacks
- Rejects malformed data before processing

### ⚠️ Security Best Practices to Follow

1. **Never store passwords in plain text** - Already implemented ✅
2. **Use HTTPS in production** - Ensure `NODE_ENV=production` sets secure cookies
3. **Implement CSRF protection** - Already done with `sameSite: 'strict'` ✅
4. **Monitor failed login attempts** - Audit service logs all attempts ✅
5. **Use strong JWT secrets** - Use long, random strings for `JWT_SECRET` and `JWT_REFRESH_SECRET`
6. **Regular token rotation** - Refresh tokens are rotated on each refresh ✅
7. **Sanitize user data** - Password and refreshToken are excluded from responses ✅

### 🚨 Security Concerns to Be Aware Of

1. **Account Lockout is In-Memory**

   - Current implementation uses `Map` (in-memory storage)
   - Lockouts are lost on server restart
   - **Recommendation**: Consider using Redis for production persistence

2. **Refresh Token Storage**

   - Refresh tokens are hashed and stored in database
   - However, refresh token validation requires scanning all users
   - **Recommendation**: Consider adding an index or using a token lookup table

3. **Error Message Information Disclosure**

   - Current implementation returns "User not found" vs "Invalid credentials"
   - This can help attackers identify valid email addresses
   - **Consideration**: You may want to return generic "Invalid credentials" for both cases

4. **CORS Configuration**

   - Ensure `CORS_ORIGINS` environment variable is properly configured
   - Only allow trusted frontend domains

5. **Environment Variables**
   - Never commit `.env` files to version control
   - Use strong, unique secrets for JWT tokens
   - Rotate secrets periodically

---

# Register API

---

## Register API Endpoint Details

**Endpoint:** `POST /api/v1/auth/register`

**Base URL:** `http://localhost:3456` (development) or your production URL

**Full URL:** `http://localhost:3456/api/v1/auth/register`

**Content-Type:** `application/json`

**Rate Limiting:** 10 requests per minute per IP address

---

## Register Required Input

### Request Body (JSON)

The register endpoint requires a JSON body with the following fields:

```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "address": "123 Main Street, City, Country",
  "password": "SecurePassword123",
  "phoneNumber": "+12025550173",
  "avatarUrl": "https://example.com/avatar.jpg",
  "isVerified": false,
  "role": "customer"
}
```

### Field Specifications

| Field         | Type    | Required | Validation                                            | Description                                |
| ------------- | ------- | -------- | ----------------------------------------------------- | ------------------------------------------ |
| `email`       | string  | ✅ Yes   | Must be a valid email format                          | User's email address (must be unique)      |
| `name`        | string  | ✅ Yes   | Non-empty string                                      | User's full name                           |
| `address`     | string  | ✅ Yes   | Non-empty string                                      | User's street address                      |
| `password`    | string  | ✅ Yes   | Minimum 6 characters                                  | User's password (will be hashed)           |
| `phoneNumber` | string  | ❌ No    | E.164 format recommended (e.g., +12025550173)         | User's phone number                        |
| `avatarUrl`   | string  | ❌ No    | Valid URL format                                      | URL to user's avatar image                 |
| `isVerified`  | boolean | ❌ No    | true/false                                            | Email verification status (default: false) |
| `role`        | string  | ❌ No    | One of: 'admin', 'moderator', 'inspector', 'customer' | User role (default: 'customer')            |

### Validation Rules

- **Email**: Must pass `@IsEmail()` validation (standard email format) and must be unique
- **Name**: Must be a non-empty string (`@IsString()`)
- **Address**: Must be a non-empty string (`@IsString()`)
- **Password**: Must be at least 6 characters long (`@MinLength(6)`)
- **Phone Number**: Optional, but if provided should follow E.164 format (e.g., `+12025550173`)
- **Role**: If provided, must be one of: `'admin'`, `'moderator'`, `'inspector'`, `'customer'` (default: `'customer'`)

### Minimum Required Fields

For a basic registration, you only need:

```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "address": "123 Main Street",
  "password": "SecurePassword123"
}
```

### Example Valid Inputs

**Basic Registration:**

```json
{
  "email": "jane.doe@example.com",
  "name": "Jane Doe",
  "address": "221B Baker Street, London",
  "password": "P@ssw0rd!"
}
```

**Full Registration:**

```json
{
  "email": "john.smith@example.com",
  "name": "John Smith",
  "address": "456 Oak Avenue, New York, NY 10001",
  "password": "SecurePass123!",
  "phoneNumber": "+12025550173",
  "avatarUrl": "https://example.com/avatars/john.jpg",
  "isVerified": false,
  "role": "customer"
}
```

---

## Register Security Concerns

### 🔒 Security Features Implemented

#### 1. **Password Security**

- Passwords are hashed using **bcrypt** with salt rounds of 10
- Passwords are **never** returned in API responses
- Plain text passwords are never stored in the database

#### 2. **Email Uniqueness**

- Database enforces unique constraint on email field
- Duplicate email registration will return an error
- Prevents account duplication

#### 3. **JWT Token Generation**

- Upon successful registration, access and refresh tokens are automatically generated
- Tokens are returned in the response body (unlike login which uses cookies)
- **Note**: Register endpoint does NOT set cookies automatically

#### 4. **Input Validation**

- All inputs are validated using `class-validator`
- Prevents injection attacks
- Rejects malformed data before processing

#### 5. **Rate Limiting**

- **10 requests per minute** per IP address
- Prevents automated account creation
- Applied globally via `ThrottlerGuard`

### ⚠️ Security Considerations

1. **Email Verification**

   - `isVerified` field defaults to `false`
   - Consider implementing email verification flow after registration
   - Users should verify their email before accessing sensitive features

2. **Role Assignment**

   - Default role is `'customer'`
   - Admin roles should NOT be assignable via public registration
   - Consider restricting role assignment to admin-only endpoints

3. **Token Storage**

   - Register returns tokens in response body (not cookies)
   - Frontend must manually store tokens if needed
   - Consider implementing cookie-based token storage similar to login

4. **Password Strength**

   - Current minimum is 6 characters
   - Consider enforcing stronger password requirements:
     - Minimum 8 characters
     - At least one uppercase letter
     - At least one lowercase letter
     - At least one number
     - At least one special character

---

## Register Example Requests & Responses

### ✅ Successful Registration Request

**Request:**

```http
POST /api/v1/auth/register HTTP/1.1
Host: localhost:3456
Content-Type: application/json

{
  "email": "jane.doe@example.com",
  "name": "Jane Doe",
  "address": "221B Baker Street, London",
  "password": "P@ssw0rd!"
}
```

**Response (201 Created):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "jane.doe@example.com",
    "name": "Jane Doe",
    "role": "customer",
    "address": "221B Baker Street, London",
    "avatarUrl": null,
    "isVerified": false,
    "phoneNumber": null,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Note:** Tokens are returned in the response body, NOT in cookies.

### ❌ Failed Registration - Duplicate Email

**Request:**

```http
POST /api/v1/auth/register HTTP/1.1
Host: localhost:3456
Content-Type: application/json

{
  "email": "existing@example.com",
  "name": "John Doe",
  "address": "123 Main St",
  "password": "Password123"
}
```

**Response (500 Internal Server Error or 400 Bad Request):**

```json
{
  "statusCode": 500,
  "message": "Unique constraint failed on the fields: (`email`)",
  "error": "Internal Server Error"
}
```

**Note:** The exact error format may vary. Consider implementing better error handling for duplicate emails.

### ❌ Failed Registration - Validation Error

**Request:**

```http
POST /api/v1/auth/register HTTP/1.1
Host: localhost:3456
Content-Type: application/json

{
  "email": "invalid-email",
  "name": "",
  "address": "123 Main St",
  "password": "123"
}
```

**Response (400 Bad Request):**

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "name must be a string",
    "password must be longer than or equal to 6 characters"
  ],
  "error": "Bad Request"
}
```

### ❌ Failed Registration - Invalid Role

**Request:**

```http
POST /api/v1/auth/register HTTP/1.1
Host: localhost:3456
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "address": "123 Main St",
  "password": "Password123",
  "role": "superadmin"
}
```

**Response (400 Bad Request):**

```json
{
  "statusCode": 400,
  "message": [
    "role must be one of the following values: admin, moderator, inspector, customer"
  ],
  "error": "Bad Request"
}
```

### ❌ Rate Limit Exceeded

**Response (429 Too Many Requests):**

```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests",
  "error": "Too Many Requests"
}
```

---

## Register Frontend Integration

### JavaScript/TypeScript (Fetch API)

```typescript
async function register(userData: {
  email: string;
  name: string;
  address: string;
  password: string;
  phoneNumber?: string;
  avatarUrl?: string;
  isVerified?: boolean;
  role?: string;
}) {
  try {
    const response = await fetch('http://localhost:3456/api/v1/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const data = await response.json();
    // Tokens are in response body, not cookies
    // You may want to store them manually or call login after registration
    return {
      user: data.user,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

// Usage
register({
  email: 'jane.doe@example.com',
  name: 'Jane Doe',
  address: '221B Baker Street, London',
  password: 'P@ssw0rd!',
})
  .then((result) => {
    console.log('Registered user:', result.user);
    // Optionally store tokens
    localStorage.setItem('access_token', result.accessToken);
    localStorage.setItem('refresh_token', result.refreshToken);
    // Or redirect to login page
  })
  .catch((error) => {
    console.error('Registration failed:', error.message);
    // Show error message to user
  });
```

### Axios Example

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3456/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

async function register(userData: {
  email: string;
  name: string;
  address: string;
  password: string;
  phoneNumber?: string;
  avatarUrl?: string;
  role?: string;
}) {
  try {
    const response = await api.post('/auth/register', userData);
    return {
      user: response.data.user,
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
    };
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}
```

### React Hook Example

```typescript
import { useState } from 'react';

interface RegisterData {
  email: string;
  name: string;
  address: string;
  password: string;
  phoneNumber?: string;
  avatarUrl?: string;
  role?: string;
}

function useRegister() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async (data: RegisterData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        'http://localhost:3456/api/v1/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = Array.isArray(errorData.message)
          ? errorData.message.join(', ')
          : errorData.message || 'Registration failed';
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return {
        user: result.user,
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { register, loading, error };
}

// Usage in component
function RegisterForm() {
  const { register, loading, error } = useRegister();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    try {
      const result = await register({
        email: formData.get('email') as string,
        name: formData.get('name') as string,
        address: formData.get('address') as string,
        password: formData.get('password') as string,
        phoneNumber: (formData.get('phoneNumber') as string) || undefined,
      });

      console.log('Registered:', result.user);
      // Store tokens or redirect to login
      if (result.accessToken) {
        localStorage.setItem('access_token', result.accessToken);
        localStorage.setItem('refresh_token', result.refreshToken);
      }
      // Redirect to dashboard or login page
    } catch (err) {
      // Error is already set in hook
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <input name="email" type="email" required />
      <input name="name" type="text" required />
      <input name="address" type="text" required />
      <input name="password" type="password" required minLength={6} />
      <input name="phoneNumber" type="tel" />
      <button type="submit" disabled={loading}>
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}
```

### Important Frontend Considerations

1. **Token Storage**: Register returns tokens in response body (not cookies like login)

   - Option 1: Store tokens manually (localStorage, sessionStorage, or state)
   - Option 2: After registration, automatically call login endpoint to get cookies
   - Option 3: Implement cookie-based registration (modify backend)

2. **Error Handling**: Handle duplicate email errors gracefully

   ```typescript
   if (
     error.message.includes('Unique constraint') ||
     error.message.includes('email')
   ) {
     // Show "Email already exists" message
   }
   ```

3. **Form Validation**: Validate on frontend before submitting

   - Email format
   - Password strength
   - Required fields

4. **User Experience**: Consider redirecting to login page after successful registration, or automatically logging in the user

5. **Email Verification**: If implementing email verification, show appropriate message after registration

### Recommended Flow

**Option 1: Auto-Login After Registration**

```typescript
async function registerAndLogin(userData) {
  // Register
  const registerResult = await register(userData);

  // Automatically login to get cookies
  await login(userData.email, userData.password);

  return registerResult.user;
}
```

**Option 2: Redirect to Login**

```typescript
async function handleRegister(userData) {
  try {
    await register(userData);
    // Show success message
    alert('Registration successful! Please login.');
    // Redirect to login page
    window.location.href = '/login';
  } catch (error) {
    // Show error
  }
}
```

---

## Shared Implementation Instructions

### Step 1: Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ecommerce_db"

# JWT Secrets (USE STRONG, RANDOM STRINGS)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"

# Server Configuration
PORT=3456
NODE_ENV=development

# CORS (comma-separated list of allowed origins)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Swagger (optional)
SWAGGER_ENABLED=true
```

**⚠️ Important**: Generate strong secrets using:

```bash
# Generate random secret (Linux/Mac)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Step 2: Database Setup

Ensure your database is set up and migrations are run:

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed database with test users
npx prisma db seed
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Start the Server

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

The server will start on `http://localhost:3456` (or your configured PORT).

### Step 5: Verify API is Running

1. **Check Swagger Documentation** (if enabled):

   - Visit: `http://localhost:3456/docs`
   - Navigate to the `Auth` section
   - You should see the `/auth/login` endpoint

2. **Test with cURL**:
   ```bash
   curl -X POST http://localhost:3456/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}'
   ```

---

## Example Requests & Responses

### ✅ Successful Login Request

**Request:**

```http
POST /api/v1/auth/login HTTP/1.1
Host: localhost:3456
Content-Type: application/json

{
  "email": "jane.doe@example.com",
  "password": "P@ssw0rd!"
}
```

**Response (200 OK):**

```json
{
  "user": {
    "id": 1,
    "email": "jane.doe@example.com",
    "name": "Jane Doe",
    "role": "customer",
    "address": "221B Baker Street, London",
    "avatarUrl": null,
    "isVerified": false,
    "phoneNumber": "+12025550173",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Cookies Set:**

- `access_token`: JWT access token (HttpOnly, 15 minutes)
- `refresh_token`: JWT refresh token (HttpOnly, 7 days)

### ❌ Failed Login - Invalid Credentials

**Request:**

```http
POST /api/v1/auth/login HTTP/1.1
Host: localhost:3456
Content-Type: application/json

{
  "email": "jane.doe@example.com",
  "password": "wrongpassword"
}
```

**Response (403 Forbidden):**

```json
{
  "statusCode": 403,
  "message": "Invalid credentials",
  "error": "Forbidden"
}
```

### ❌ Failed Login - User Not Found

**Request:**

```http
POST /api/v1/auth/login HTTP/1.1
Host: localhost:3456
Content-Type: application/json

{
  "email": "nonexistent@example.com",
  "password": "anypassword"
}
```

**Response (403 Forbidden):**

```json
{
  "statusCode": 403,
  "message": "User not found",
  "error": "Forbidden"
}
```

### ❌ Failed Login - Account Locked

**Request:**

```http
POST /api/v1/auth/login HTTP/1.1
Host: localhost:3456
Content-Type: application/json

{
  "email": "locked@example.com",
  "password": "anypassword"
}
```

**Response (403 Forbidden):**

```json
{
  "statusCode": 403,
  "message": "Account locked. Try again in 15 minutes.",
  "error": "Forbidden"
}
```

### ❌ Failed Login - Validation Error

**Request:**

```http
POST /api/v1/auth/login HTTP/1.1
Host: localhost:3456
Content-Type: application/json

{
  "email": "invalid-email",
  "password": "123"
}
```

**Response (400 Bad Request):**

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 6 characters"
  ],
  "error": "Bad Request"
}
```

### ❌ Rate Limit Exceeded

**Response (429 Too Many Requests):**

```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests",
  "error": "Too Many Requests"
}
```

---

## Frontend Integration

### JavaScript/TypeScript (Fetch API)

```typescript
async function login(email: string, password: string) {
  try {
    const response = await fetch('http://localhost:3456/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // IMPORTANT: Required for cookies
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    // Tokens are automatically stored in HttpOnly cookies
    // User data is in data.user
    return data.user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// Usage
login('jane.doe@example.com', 'P@ssw0rd!')
  .then((user) => {
    console.log('Logged in as:', user);
    // Redirect to dashboard or update UI
  })
  .catch((error) => {
    console.error('Login failed:', error.message);
    // Show error message to user
  });
```

### Axios Example

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3456/api/v1',
  withCredentials: true, // IMPORTANT: Required for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

async function login(email: string, password: string) {
  try {
    const response = await response.post('/auth/login', {
      email,
      password,
    });
    return response.data.user;
  } catch (error) {
    if (error.response) {
      // Server responded with error
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}
```

### React Hook Example

```typescript
import { useState } from 'react';

function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3456/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Login failed');
      }

      const data = await response.json();
      return data.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
}

// Usage in component
function LoginForm() {
  const { login, loading, error } = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    try {
      const user = await login(
        formData.get('email') as string,
        formData.get('password') as string
      );
      console.log('Logged in:', user);
      // Redirect or update state
    } catch (err) {
      // Error is already set in hook
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <input name="email" type="email" required />
      <input name="password" type="password" required minLength={6} />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### Important Frontend Considerations

1. **Cookies are HttpOnly**: You cannot access tokens via JavaScript. They are automatically sent with requests.

2. **Include Credentials**: Always use `credentials: 'include'` (Fetch) or `withCredentials: true` (Axios).

3. **CORS Configuration**: Ensure your frontend URL is in the `CORS_ORIGINS` environment variable.

4. **Token Refresh**: Use the `/auth/refresh` endpoint to get new access tokens when they expire.

5. **Logout**: Call `/auth/logout` to clear cookies and invalidate refresh tokens.

---

## Environment Variables

### Required Variables

| Variable             | Description                       | Example                                    |
| -------------------- | --------------------------------- | ------------------------------------------ |
| `DATABASE_URL`       | PostgreSQL connection string      | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET`         | Secret for signing access tokens  | `your-secret-key-here`                     |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | `your-refresh-secret-here`                 |

### Optional Variables

| Variable          | Description                          | Default                                       |
| ----------------- | ------------------------------------ | --------------------------------------------- |
| `PORT`            | Server port                          | `3456`                                        |
| `NODE_ENV`        | Environment (development/production) | `development`                                 |
| `CORS_ORIGINS`    | Comma-separated allowed origins      | `http://localhost:3000,http://localhost:3001` |
| `SWAGGER_ENABLED` | Enable Swagger documentation         | `true` (if not production)                    |

---

## Troubleshooting

### Issue: "User not found" but user exists

**Possible Causes:**

- Email case sensitivity (check exact email match)
- User not created in database
- Database connection issue

**Solution:**

```bash
# Check database
npx prisma studio
# Or query directly
npx prisma db execute --stdin
```

### Issue: Cookies not being set

**Possible Causes:**

- CORS not configured properly
- `credentials: 'include'` not set in frontend
- Frontend origin not in `CORS_ORIGINS`

**Solution:**

1. Check `CORS_ORIGINS` includes your frontend URL
2. Ensure frontend uses `credentials: 'include'`
3. Check browser console for CORS errors

### Issue: "Account locked" immediately

**Possible Causes:**

- Previous failed attempts (in-memory lockout persists until server restart)
- Multiple login attempts from same IP

**Solution:**

- Wait 15 minutes for lockout to expire
- Restart server (clears in-memory lockouts)
- Consider implementing Redis for persistent lockouts

### Issue: Rate limit errors

**Possible Causes:**

- Too many requests from same IP
- Testing multiple times quickly

**Solution:**

- Wait 1 minute between test batches
- Adjust rate limit in `app.module.ts` if needed for development

### Issue: JWT token validation fails

**Possible Causes:**

- `JWT_SECRET` or `JWT_REFRESH_SECRET` changed
- Token expired
- Token not in cookies

**Solution:**

1. Verify environment variables are set correctly
2. Check token expiration times
3. Ensure cookies are being sent with requests

### Issue: Database connection errors

**Possible Causes:**

- `DATABASE_URL` incorrect
- Database not running
- Network issues

**Solution:**

```bash
# Test database connection
npx prisma db pull

# Check DATABASE_URL format
echo $DATABASE_URL
```

### Issue: Register - Duplicate email error

**Possible Causes:**

- Email already exists in database
- User trying to register with existing email

**Solution:**

1. Check if email exists: Query database or try login
2. Show user-friendly error message: "Email already registered. Please login instead."
3. Consider implementing email check endpoint before registration
4. Handle Prisma unique constraint error gracefully:

```typescript
try {
  await register(userData);
} catch (error) {
  if (
    error.message?.includes('Unique constraint') ||
    error.message?.includes('email')
  ) {
    // Show "Email already exists" message
    setError('This email is already registered. Please login.');
  }
}
```

### Issue: Register - Tokens not working after registration

**Possible Causes:**

- Tokens returned in response body (not cookies)
- Frontend not storing tokens properly
- Tokens not being sent with subsequent requests

**Solution:**

1. **Option 1**: Store tokens manually after registration:

   ```typescript
   const result = await register(userData);
   localStorage.setItem('access_token', result.accessToken);
   localStorage.setItem('refresh_token', result.refreshToken);
   ```

2. **Option 2**: Auto-login after registration:

   ```typescript
   await register(userData);
   await login(userData.email, userData.password); // Gets cookies
   ```

3. **Option 3**: Modify backend to set cookies on registration (similar to login)

### Issue: Register - Role assignment not working

**Possible Causes:**

- Invalid role value
- Role validation failing
- Default role not being set

**Solution:**

1. Ensure role is one of: `'admin'`, `'moderator'`, `'inspector'`, `'customer'`
2. If role not provided, defaults to `'customer'`
3. Admin roles should NOT be assignable via public registration
4. Check validation error messages for specific role issues

---

## Testing the APIs

### Testing Login API

#### Using cURL

```bash
# Successful login
curl -X POST http://localhost:3456/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' \
  -c cookies.txt \
  -v

# Check cookies saved
cat cookies.txt
```

#### Using Postman

1. Create new POST request to `http://localhost:3456/api/v1/auth/login`
2. Set Headers: `Content-Type: application/json`
3. Set Body (raw JSON):
   ```json
   {
     "email": "test@example.com",
     "password": "test123"
   }
   ```
4. Send request
5. Check Cookies tab to see `access_token` and `refresh_token`

#### Using Swagger UI

1. Navigate to `http://localhost:3456/docs`
2. Find `POST /auth/login` endpoint
3. Click "Try it out"
4. Enter email and password
5. Click "Execute"
6. View response and cookies

### Testing Register API

#### Using cURL

```bash
# Successful registration
curl -X POST http://localhost:3456/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "name": "New User",
    "address": "123 Main Street",
    "password": "SecurePass123"
  }' \
  -v

# Save response to file
curl -X POST http://localhost:3456/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "name": "New User",
    "address": "123 Main Street",
    "password": "SecurePass123"
  }' \
  -o register_response.json
```

#### Using Postman

1. Create new POST request to `http://localhost:3456/api/v1/auth/register`
2. Set Headers: `Content-Type: application/json`
3. Set Body (raw JSON):
   ```json
   {
     "email": "newuser@example.com",
     "name": "New User",
     "address": "123 Main Street, City, Country",
     "password": "SecurePass123",
     "phoneNumber": "+12025550173"
   }
   ```
4. Send request
5. Check response body for `access_token`, `refresh_token`, and `user` data
6. **Note**: Tokens are in response body, NOT in cookies

#### Using Swagger UI

1. Navigate to `http://localhost:3456/docs`
2. Find `POST /auth/register` endpoint
3. Click "Try it out"
4. Enter required fields (email, name, address, password)
5. Optionally add optional fields (phoneNumber, avatarUrl, role)
6. Click "Execute"
7. View response body with tokens and user data

---

## Next Steps After Authentication

### After Successful Login

1. **Store User Data**: Save user information in your frontend state/context
2. **Handle Token Refresh**: Implement automatic token refresh before expiration
3. **Protected Routes**: Use tokens to authenticate API requests
4. **Logout Implementation**: Call `/auth/logout` when user logs out

### After Successful Registration

1. **Token Management**: Choose one of these approaches:

   - **Option A**: Store tokens manually (localStorage/sessionStorage)
   - **Option B**: Auto-login after registration (call login endpoint to get cookies)
   - **Option C**: Redirect to login page

2. **User Onboarding**: Guide new users through:

   - Email verification (if implemented)
   - Profile completion
   - Welcome tutorial

3. **Immediate Authentication**: If using auto-login, user is immediately authenticated

### Example: Making Authenticated Requests

**After Login (Cookies):**

```typescript
// Tokens are in HttpOnly cookies, automatically sent
async function getProtectedData() {
  const response = await fetch(
    'http://localhost:3456/api/v1/orders/my-orders',
    {
      credentials: 'include', // Sends cookies automatically
    },
  );
  return response.json();
}
```

**After Register (Manual Token Storage):**

```typescript
// If you stored tokens manually after registration
async function getProtectedData() {
  const token = localStorage.getItem('access_token');
  const response = await fetch(
    'http://localhost:3456/api/v1/orders/my-orders',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    },
  );
  return response.json();
}
```

---

## Frontend Authentication State Management

### The Problem: Cookie vs LocalStorage Scenario

**Common Issue:**

- User logs in → tokens stored in HttpOnly cookies, user info stored in localStorage
- User clears cookies → tokens are gone, but localStorage still has user info
- Frontend shows logged-in UI (checking localStorage only)
- Backend API calls fail → no valid token = 401 Unauthorized

**What Happens:**

- ✅ **Frontend UI**: Still shows logged-in state (if only checking localStorage)
- ❌ **Backend API**: All requests fail (401 Unauthorized)
- ❌ **Result**: User appears logged in but can't access any data or perform actions

---

### Solution: Always Validate with Backend

**Key Principle:** Never rely solely on localStorage to determine authentication status. Always validate with the backend.

---

### Step 1: Create Authentication Validation Function

Create a function that checks authentication status by calling the backend:

**Option A: Use Refresh Endpoint (Recommended)**

```typescript
async function checkAuthStatus(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:3456/api/v1/auth/refresh', {
      method: 'POST',
      credentials: 'include', // Sends cookies automatically
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      // Token is valid
      return true;
    } else {
      // Token invalid or expired
      localStorage.removeItem('user');
      return false;
    }
  } catch (error) {
    // Network error or server down
    console.error('Auth check failed:', error);
    localStorage.removeItem('user');
    return false;
  }
}
```

**Option B: Use Protected Endpoint (If Available)**

```typescript
async function checkAuthStatus(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:3456/api/v1/auth/me', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const user = await response.json();
      // Update localStorage with fresh user data
      localStorage.setItem('user', JSON.stringify(user));
      return true;
    } else {
      localStorage.removeItem('user');
      return false;
    }
  } catch (error) {
    localStorage.removeItem('user');
    return false;
  }
}
```

---

### Step 2: Validate on App Initialization

Always validate authentication when your app loads:

**React Example:**

```typescript
import { useState, useEffect } from 'react';

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const validateAuth = async () => {
      setIsLoading(true);

      // First, try to get user from localStorage (for quick UI render)
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      // Then validate with backend
      const isValid = await checkAuthStatus();
      setIsAuthenticated(isValid);

      if (isValid) {
        // User is authenticated - keep user data
        // Optionally fetch fresh user data from backend
      } else {
        // Clear user if invalid
        setUser(null);
        localStorage.removeItem('user');
      }

      setIsLoading(false);
    };

    validateAuth();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {isAuthenticated ? (
        <Dashboard user={user} />
      ) : (
        <LoginPage />
      )}
    </div>
  );
}
```

---

### Step 3: Update Authentication Check Logic

**❌ Wrong Approach (Only Checking LocalStorage):**

```typescript
// DON'T DO THIS
const user = localStorage.getItem('user');
if (user) {
  // Show protected content - WRONG!
  // This doesn't verify if token is still valid
}
```

**✅ Correct Approach (Validate with Backend):**

```typescript
// DO THIS
const isAuth = await checkAuthStatus(); // Validates with backend
if (isAuth) {
  // Show protected content - CORRECT!
  // Token is verified to be valid
}
```

---

### Step 4: Handle API Errors

If any API call returns 401 Unauthorized, clear authentication:

```typescript
async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // If unauthorized, clear auth and redirect
  if (response.status === 401) {
    localStorage.removeItem('user');
    // Clear user state
    // Redirect to login
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  return response;
}
```

---

### Step 5: Implement Protected Route Guard

Create a component that validates authentication before rendering protected content:

```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validate = async () => {
      const isValid = await checkAuthStatus();
      setIsAuthenticated(isValid);
      setIsLoading(false);
    };
    validate();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    // Redirect to login
    window.location.href = '/login';
    return null;
  }

  return <>{children}</>;
}

// Usage
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

---

### Step 6: Complete React Hook Implementation

Here's a complete authentication hook you can use:

```typescript
import { useState, useEffect } from 'react';

function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const validateAuth = async () => {
      setIsLoading(true);

      // Get user from localStorage for quick UI render
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      // Validate with backend
      const isValid = await checkAuthStatus();
      setIsAuthenticated(isValid);

      if (!isValid) {
        setUser(null);
        localStorage.removeItem('user');
      }

      setIsLoading(false);
    };

    validateAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('http://localhost:3456/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      setIsAuthenticated(true);
      return data.user;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch('http://localhost:3456/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
}
```

---

### Implementation Checklist

- [ ] Create `checkAuthStatus()` function that validates with backend
- [ ] Call `checkAuthStatus()` on app initialization
- [ ] Don't rely solely on localStorage for authentication state
- [ ] Clear localStorage when backend says user is not authenticated
- [ ] Handle 401 errors by clearing auth state and redirecting
- [ ] Implement protected route guard component
- [ ] Show loading state while validating authentication
- [ ] Update user state only after successful backend validation

---

### Key Takeaways

1. **Never trust localStorage alone** - Always validate with backend
2. **Validate on app load** - Check authentication status when app starts
3. **Handle 401 errors** - Clear auth state when API returns unauthorized
4. **Use loading states** - Show loading while validating authentication
5. **Clear invalid state** - Remove localStorage when backend says user is not authenticated

---

## Audit Logging Storage

### Current Implementation

**Where logs are stored:**

- **Console/Stdout**: All audit logs are written to the console using NestJS Logger
- **No Database Storage**: Logs are NOT saved to the database
- **No File Storage**: Logs are NOT written to log files
- **In-Memory Only**: Logs exist only in the console output while the server is running

### How to View Audit Logs

#### 1. **Development Mode (Console Output)**

When running `npm run dev`, you'll see logs in your terminal:

```
[AuditService] Auth Event: LOGIN - User: jane.doe@example.com - IP: ::1
[AuditService] {
  type: 'AUTH_AUDIT',
  userId: 1,
  email: 'jane.doe@example.com',
  action: 'LOGIN',
  timestamp: 2024-01-15T10:30:00.000Z
}
```

#### 2. **Production Mode**

In production, logs are still written to stdout/stderr. You can:

- **Redirect to file**: `npm start > app.log 2>&1`
- **Use process managers**: PM2, systemd, or Docker logs will capture stdout
- **Use logging services**: Send stdout to services like:
  - CloudWatch (AWS)
  - Google Cloud Logging
  - Azure Monitor
  - Datadog
  - LogRocket
  - Winston (with file transport)

### Log Format

Each audit log entry contains:

```typescript
{
  type: 'AUTH_AUDIT',
  userId?: number,           // User ID (if available)
  email?: string,           // User email
  action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'REFRESH_TOKEN' | 'REFRESH_FAILED',
  ipAddress?: string,       // Client IP address
  userAgent?: string,       // Browser/client information
  timestamp: Date,          // When the event occurred
  details?: {               // Additional context (e.g., failure reason)
    reason?: string
  }
}
```

### Example Log Outputs

**Successful Login:**

```
[AuditService] Auth Event: LOGIN - User: jane.doe@example.com - IP: 192.168.1.1
[AuditService] {
  type: 'AUTH_AUDIT',
  userId: 1,
  email: 'jane.doe@example.com',
  action: 'LOGIN',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  timestamp: 2024-01-15T10:30:00.000Z
}
```

**Failed Login:**

```
[AuditService] {
  type: 'AUTH_AUDIT',
  email: 'jane.doe@example.com',
  action: 'LOGIN_FAILED',
  ipAddress: '192.168.1.1',
  timestamp: 2024-01-15T10:30:00.000Z,
  details: { reason: 'Invalid password' }
}
```

### Limitations of Current Implementation

⚠️ **Important Notes:**

1. **No Persistence**: Logs are lost when the server restarts
2. **No Search/Query**: Cannot query historical logs
3. **No Retention**: No automatic log rotation or cleanup
4. **No Alerting**: No automatic alerts for suspicious activity
5. **Console Only**: Relies on process manager or logging service to capture output

### Recommended Improvements

For production use, consider implementing:

1. **Database Storage** (Recommended):

   ```prisma
   model AuditLog {
     id        Int      @id @default(autoincrement())
     userId    Int?
     email     String?
     action    String
     ipAddress String?
     userAgent String?
     details   Json?
     createdAt DateTime @default(now())

     @@index([userId])
     @@index([email])
     @@index([action])
     @@index([createdAt])
   }
   ```

2. **File-Based Logging** (Winston):

   ```typescript
   import * as winston from 'winston';

   const logger = winston.createLogger({
     transports: [
       new winston.transports.File({ filename: 'audit.log' }),
       new winston.transports.Console(),
     ],
   });
   ```

3. **External Logging Service**:

   - Send logs to Datadog, LogRocket, or similar services
   - Better for distributed systems and long-term retention

4. **Log Rotation**:
   - Use tools like `logrotate` or Winston's file rotation
   - Prevents log files from growing too large

### Accessing Logs in Different Environments

#### Local Development

- View directly in terminal where `npm run dev` is running

#### Docker

```bash
docker logs <container-name>
docker logs -f <container-name>  # Follow logs
```

#### PM2

```bash
pm2 logs
pm2 logs <app-name>
```

#### Systemd

```bash
journalctl -u your-app-service -f
```

#### Production (Redirect to File)

```bash
npm start >> /var/log/app/audit.log 2>&1
```

---

## Summary

✅ **Authentication APIs are fully implemented and secure**

### Login API

- ✅ Endpoint: `POST /api/v1/auth/login`
- ✅ Input: `{ email: string, password: string }`
- ✅ Output: User data (tokens in HttpOnly cookies)
- ✅ Account lockout protection (5 attempts, 15 min lockout)
- ✅ Password hashing with bcrypt
- ✅ JWT tokens in HttpOnly cookies
- ✅ Rate limiting (10 req/min)
- ✅ Audit logging
- ✅ Input validation
- ✅ CSRF protection (sameSite: strict)

### Register API

- ✅ Endpoint: `POST /api/v1/auth/register`
- ✅ Input: `{ email, name, address, password, ...optional fields }`
- ✅ Output: User data + tokens in response body
- ✅ Password hashing with bcrypt
- ✅ Email uniqueness enforcement
- ✅ JWT token generation on registration
- ✅ Rate limiting (10 req/min)
- ✅ Input validation
- ✅ Role validation

### Key Differences

| Feature             | Login API           | Register API                  |
| ------------------- | ------------------- | ----------------------------- |
| Token Storage       | HttpOnly cookies    | Response body                 |
| Auto-Authentication | Yes (via cookies)   | No (manual token handling)    |
| Account Lockout     | Yes                 | No                            |
| Audit Logging       | Yes                 | No                            |
| Minimum Fields      | 2 (email, password) | 4 (email, name, address, pwd) |

### Frontend Integration Tips

**Login:**

- Use `credentials: 'include'` for cookies
- Tokens are automatically sent with requests
- No manual token management needed

**Register:**

- Tokens returned in response body
- Option 1: Store tokens manually (localStorage/sessionStorage)
- Option 2: Auto-login after registration (call login endpoint)
- Option 3: Redirect to login page after registration

For questions or issues, refer to the troubleshooting section or check the Swagger documentation at `/docs`.
