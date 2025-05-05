# Faker-Based Testing Documentation

This document describes how to use the Faker-based testing scripts to generate realistic test data for the Carpet Market Backend.

## Overview

The Faker scripts generate realistic test data for:
- Users (Admin, Vendors, Regular Users)
- Products (Carpets with detailed specifications)
- Business Information (For vendors)

## Directory Structure
```
testdocs/
├── scripts/
│   ├── utils/
│   │   └── faker-utils.ts       # Utility functions for generating fake data
│   ├── seed-users-faker.ts      # Script to seed random users
│   ├── seed-products-faker.ts   # Script to seed random products
│   └── package.json            # Dependencies and scripts
└── FAKER_TESTING.md            # This documentation
```

## Setup

1. Navigate to the scripts directory:
```bash
cd testdocs/scripts
```

2. Install dependencies:
```bash
yarn install
```

## Available Scripts

```bash
# Seed everything using faker (recommended)
yarn seed:all

# Seed only users with faker
yarn seed:users:faker

# Seed only products with faker
yarn seed:products:faker

# Use original seeding scripts (fixed data)
yarn seed:users
yarn seed:products
```

## Generated Data Overview

### Users

1. **Admin User** (Fixed credentials for testing)
   ```
   Email: admin@carpetmarket.com
   Password: Admin123!
   ```

2. **Vendor Users** (10 random vendors)
   - Realistic business names
   - Valid registration IDs
   - Business licenses
   - Various business types
   - All pre-approved for testing

3. **Regular Users** (20 random users)
   - Realistic names and emails
   - Valid phone numbers
   - Real addresses

### Products

Each vendor gets 5-15 random products with:

1. **Basic Details**
   - Name combining style, pattern, and material
   - Detailed descriptions
   - Realistic prices ($99 - $9,999)
   - Random approval status

2. **Physical Specifications**
   - Width: 60-400 cm
   - Height: 90-600 cm
   - Weight: 2-20 kg
   - Various shapes (Rectangle, Square, Circle, Oval, Runner)

3. **Material Information**
   - Various materials (Wool, Silk, Cotton, Synthetic, etc.)
   - Different patterns (Persian, Oriental, Modern, etc.)
   - Multiple styles (Traditional, Contemporary, etc.)
   - Color variations

4. **Additional Features**
   - Knot density
   - Origin country
   - Care instructions
   - Warranty information

## Verification Queries

After seeding data, you can verify the results using these SQL queries:

1. Count products by vendor:
```sql
SELECT u.email as vendor_email, COUNT(p.id) as product_count 
FROM product p 
JOIN "user" u ON p."vendorIdId" = u.id 
GROUP BY u.email;
```

2. Check approved products:
```sql
SELECT COUNT(*) as approved_count 
FROM product 
WHERE "isApproved" = true;
```

## Best Practices

1. **Clean Database**
   - Scripts automatically clear existing data
   - Run in development/testing environment only

2. **Testing Order**
   - Always run user seeding before product seeding
   - Use `yarn seed:all` for complete setup

3. **Verification**
   - Check logs for created users and their passwords
   - Use the provided SQL queries to verify data
   - Test login with different user roles

## Data Ranges

### Users
- Vendors: 10 random vendors
- Regular Users: 20 random users
- Admin: 1 fixed admin

### Products
- Per Vendor: 5-15 products
- Total: 50-150 products
- Price Range: $99 - $9,999
- Size Range: 
  - Width: 60-400 cm
  - Height: 90-600 cm
  - Weight: 2-20 kg

## Error Handling

The scripts include error handling for common issues:
- Database connection errors
- Missing vendors when seeding products
- Duplicate email addresses

## Adding Custom Test Data

To modify the generated data ranges or add new types:

1. Edit `faker-utils.ts`:
   - Adjust the arrays of materials, patterns, shapes
   - Modify the price ranges
   - Add new product features

2. Edit seeding scripts:
   - Change the number of users/vendors in `seed-users-faker.ts`
   - Adjust products per vendor in `seed-products-faker.ts`
