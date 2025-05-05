# Carpet Market Backend Test Documentation

This directory contains test documentation and scripts for the Carpet Market Backend application.

## Directory Structure
```
testdocs/
├── README.md                 # This file
├── FAKER_TESTING.md         # Faker-based testing documentation
├── scripts/                 # Test scripts
│   ├── utils/              # Utility functions
│   ├── seed-users.ts       # Basic user seeding
│   ├── seed-products.ts    # Basic product seeding
│   ├── seed-users-faker.ts # Advanced user seeding with faker
│   └── seed-products-faker.ts # Advanced product seeding with faker
└── curl-tests/             # CURL test commands
    ├── auth-tests.md       # Authentication related tests
    └── product-tests.md    # Product related tests
```

## Test Types

1. **Basic Tests** (Fixed Data)
   - Use `seed-users.ts` and `seed-products.ts`
   - Creates predefined set of users and products
   - Good for initial testing and debugging

2. **Advanced Tests** (Random Data)
   - Use `seed-users-faker.ts` and `seed-products-faker.ts`
   - Creates larger dataset with realistic information
   - Refer to `FAKER_TESTING.md` for detailed documentation

## Running the Tests

### Prerequisites
- Node.js and yarn installed
- PostgreSQL database running
- Backend service running on port 7000

### 1. Install Dependencies
```bash
cd testdocs/scripts
yarn install
```

### 2. Choose Test Type

#### Basic Testing (Fixed Data)
```bash
# Seed users first
yarn seed:users

# Then seed products
yarn seed:products
```

#### Advanced Testing (Random Data)
```bash
# Seed everything at once
yarn seed:all

# Or seed individually
yarn seed:users:faker
yarn seed:products:faker
```

### 3. API Testing
Use the curl commands in the `curl-tests` directory for API testing:
- `auth-tests.md`: User registration, verification, and login tests
- `product-tests.md`: Product CRUD operation tests

## Test Users (Basic Testing)

### Admin User
```json
{
  "email": "admin@carpetmarket.com",
  "password": "Admin123!",
  "role": "admin"
}
```

### Vendor Users
```json
[
  {
    "email": "vendor1@carpetmarket.com",
    "password": "Vendor123!",
    "role": "vendor"
  },
  {
    "email": "vendor2@carpetmarket.com",
    "password": "Vendor123!"
  },
  {
    "email": "vendor3@carpetmarket.com",
    "password": "Vendor123!"
  }
]
```

### Regular Users
```json
[
  {
    "email": "user1@example.com",
    "password": "User123!"
  },
  {
    "email": "user2@example.com",
    "password": "User123!"
  }
]
```

## Error Cases to Test

1. Authentication
   - Registration with existing email
   - Login with unverified account
   - Login with incorrect password
   - Registration with invalid role

2. Products
   - Create product without vendor rights
   - Update product without ownership
   - Delete product without permission
   - Access product details without proper role

## Additional Documentation
For detailed information about faker-based testing, refer to [FAKER_TESTING.md](./FAKER_TESTING.md)
