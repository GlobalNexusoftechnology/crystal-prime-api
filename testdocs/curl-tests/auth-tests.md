# Authentication API Tests

## User Registration Tests

### 1. Register Admin User
```bash
curl -X POST http://localhost:7000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@carpetmarket.com",
    "password": "Admin123!",
    "phoneNumber": "+1234567890",
    "role": "admin",
    "username": "adminuser",
    "address": "123 Admin St",
    "city": "Admin City",
    "country": "Admin Country"
  }'
```

### 2. Register Vendor User
```bash
curl -X POST http://localhost:7000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Vendor One",
    "email": "vendor1@carpetmarket.com",
    "password": "Vendor123!",
    "phoneNumber": "+1234567891",
    "role": "vendor",
    "username": "vendor1",
    "address": "123 Vendor St",
    "city": "Vendor City",
    "country": "Vendor Country",
    "businessName": "Luxury Carpets",
    "businessType": "Wholesale",
    "registrationId": "REG123456",
    "businessLicense": "LIC789012"
  }'
```

### 3. Register Regular User
```bash
curl -X POST http://localhost:7000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "User One",
    "email": "user1@example.com",
    "password": "User123!",
    "phoneNumber": "+1234567894",
    "role": "user",
    "username": "user1",
    "address": "123 User St",
    "city": "User City",
    "country": "User Country"
  }'
```

## User Verification Tests

### 1. Verify Admin User
```bash
curl -X POST http://localhost:7000/api/auth/verify-by-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@carpetmarket.com"
  }'
```

### 2. Verify Vendor User
```bash
curl -X POST http://localhost:7000/api/auth/verify-by-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vendor1@carpetmarket.com"
  }'
```

### 3. Verify Regular User
```bash
curl -X POST http://localhost:7000/api/auth/verify-by-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@example.com"
  }'
```

## Login Tests

### 1. Admin Login
```bash
curl -X POST http://localhost:7000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@carpetmarket.com",
    "password": "Admin123!"
  }'
```

### 2. Vendor Login
```bash
curl -X POST http://localhost:7000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vendor1@carpetmarket.com",
    "password": "Vendor123!"
  }'
```

### 3. User Login
```bash
curl -X POST http://localhost:7000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@example.com",
    "password": "User123!"
  }'
```

## Expected Results

### Registration
- Success Response (201):
```json
{
  "status": "success",
  "message": "An email with a verification code has been sent to your email"
}
```

### Verification
- Success Response (200):
```json
{
  "status": "success",
  "message": "User verified successfully"
}
```

### Login
- Success Response (200):
```json
{
  "status": "success",
  "access_token": "eyJhbG...",
  "refresh_token": "eyJhbG..."
}
```

## Error Cases to Test

1. Registration with existing email
2. Login with unverified account
3. Login with incorrect password
4. Registration with invalid role
5. Vendor registration without business details
