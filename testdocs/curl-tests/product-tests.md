# Product API Tests

## Prerequisites
- Login with appropriate user roles and save the access tokens
- Replace `[ACCESS_TOKEN]` in the commands with actual tokens

## Product Creation Tests

### 1. Create Product as Vendor
```bash
curl -X POST http://localhost:7000/api/products/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [ACCESS_TOKEN]" \
  -d '{
    "name": "Luxury Persian Carpet",
    "description": "Hand-woven luxury Persian carpet with intricate designs",
    "price": 999.99,
    "unit": "piece",
    "width": 200,
    "height": 300,
    "material": "Silk",
    "color": "Red",
    "fabric": "Silk",
    "weight": 5.5,
    "shape": "Rectangle"
  }'
```

### 2. Create Product as Regular User (Should Fail)
```bash
curl -X POST http://localhost:7000/api/products/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [USER_ACCESS_TOKEN]" \
  -d '{
    "name": "Test Carpet",
    "description": "This should fail",
    "price": 100,
    "unit": "piece"
  }'
```

## Product Listing Tests

### 1. Get Products as Admin
```bash
curl -X GET http://localhost:7000/api/products/listing \
  -H "Authorization: Bearer [ADMIN_ACCESS_TOKEN]"
```

### 2. Get Products as Vendor
```bash
curl -X GET http://localhost:7000/api/products/listing \
  -H "Authorization: Bearer [VENDOR_ACCESS_TOKEN]"
```

### 3. Get Products as Regular User
```bash
curl -X GET http://localhost:7000/api/products/listing \
  -H "Authorization: Bearer [USER_ACCESS_TOKEN]"
```

## Product Update Tests

### 1. Update Product as Owner (Vendor)
```bash
curl -X PUT http://localhost:7000/api/products/[PRODUCT_ID] \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [VENDOR_ACCESS_TOKEN]" \
  -d '{
    "price": 1099.99,
    "description": "Updated description for luxury Persian carpet"
  }'
```

### 2. Update Product as Admin
```bash
curl -X PUT http://localhost:7000/api/products/[PRODUCT_ID] \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [ADMIN_ACCESS_TOKEN]" \
  -d '{
    "isApproved": true
  }'
```

### 3. Update Product as Non-Owner (Should Fail)
```bash
curl -X PUT http://localhost:7000/api/products/[PRODUCT_ID] \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [OTHER_VENDOR_TOKEN]" \
  -d '{
    "price": 899.99
  }'
```

## Product Deletion Tests

### 1. Delete Product as Owner
```bash
curl -X DELETE http://localhost:7000/api/products/[PRODUCT_ID] \
  -H "Authorization: Bearer [VENDOR_ACCESS_TOKEN]"
```

### 2. Delete Product as Admin
```bash
curl -X DELETE http://localhost:7000/api/products/[PRODUCT_ID] \
  -H "Authorization: Bearer [ADMIN_ACCESS_TOKEN]"
```

### 3. Delete Product as Non-Owner (Should Fail)
```bash
curl -X DELETE http://localhost:7000/api/products/[PRODUCT_ID] \
  -H "Authorization: Bearer [OTHER_VENDOR_TOKEN]"
```

## Expected Results

### Product Creation
- Success Response (201):
```json
{
  "status": "success",
  "message": "Product created successfully",
  "data": {
    "id": "...",
    "name": "Luxury Persian Carpet",
    "price": 999.99,
    ...
  }
}
```

### Product Listing
- Admin sees all products
- Vendor sees only their products
- Regular users see only approved products

### Product Update
- Success Response (200):
```json
{
  "status": "success",
  "message": "Product updated successfully",
  "data": {
    "id": "...",
    "name": "Luxury Persian Carpet",
    "price": 1099.99,
    ...
  }
}
```

### Product Deletion
- Success Response (200):
```json
{
  "status": "success",
  "message": "Product deleted successfully"
}
```

## Error Cases to Test

1. Create product without authentication
2. Create product as regular user
3. Update product without ownership
4. Delete product without ownership
5. Access product details without proper role
6. Create product with invalid data
7. Update non-existent product
8. Delete non-existent product
