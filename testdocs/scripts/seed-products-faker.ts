import { AppDataSource } from '../../src/utils/data-source';
import { Product } from '../../src/entities/product.entity';
import { User } from '../../src/entities/user.entity';
import { RoleEnumType } from '../../src/entities/user.entity';
import { generateFakeProduct } from './utils/faker-utils';

async function seedProducts() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    const productRepository = AppDataSource.getRepository(Product);
    const userRepository = AppDataSource.getRepository(User);

    // Clear existing products
    await productRepository.clear();

    // Find vendor users
    const vendors = await userRepository.find({
      where: { role: RoleEnumType.VENDOR }
    });

    if (vendors.length === 0) {
      throw new Error('No vendors found. Please run seed-users-faker.ts first.');
    }

    // Generate random number of products for each vendor
    const productsPerVendor = { min: 5, max: 15 };
    let totalProducts = 0;

    for (const vendor of vendors) {
      const numProducts = Math.floor(
        Math.random() * (productsPerVendor.max - productsPerVendor.min + 1) + productsPerVendor.min
      );

      console.log(`\nCreating ${numProducts} products for vendor: ${vendor.email}`);

      for (let i = 0; i < numProducts; i++) {
        const productData = generateFakeProduct();
        const product = productRepository.create({
          ...productData,
          vendorId: vendor
        });
        await productRepository.save(product);
        console.log(`Created product: ${productData.name}`);
        totalProducts++;
      }
    }

    console.log('\nProduct seeding summary:');
    console.log('------------------------');
    console.log(`Created ${totalProducts} products across ${vendors.length} vendors`);
    console.log(`Average products per vendor: ${(totalProducts / vendors.length).toFixed(1)}`);

    // Print some sample queries
    console.log('\nSample SQL queries for verification:');
    console.log('--------------------------------');
    console.log('1. Count products by vendor:');
    console.log(`
    SELECT u.email as vendor_email, COUNT(p.id) as product_count 
    FROM product p 
    JOIN "user" u ON p."vendorIdId" = u.id 
    GROUP BY u.email;
    `);

    console.log('2. Get approved products count:');
    console.log(`
    SELECT COUNT(*) as approved_count 
    FROM product 
    WHERE "isApproved" = true;
    `);

  } catch (error) {
    console.error('Error seeding products:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

// Run the seeding
seedProducts();
