import { AppDataSource } from '../../src/utils/data-source';
import { Product } from '../../src/entities/product.entity';
import { User } from '../../src/entities/user.entity';
import { RoleEnumType } from '../../src/entities/user.entity';

const products = [
  {
    name: 'Luxury Persian Carpet',
    description: 'Hand-woven luxury Persian carpet with intricate designs',
    price: 999.99,
    unit: 'piece',
    width: 200,
    height: 300,
    material: 'Silk',
    color: 'Red',
    fabric: 'Silk',
    weight: 5.5,
    shape: 'Rectangle',
    isApproved: true,
    stock: 10
  },
  {
    name: 'Modern Abstract Carpet',
    description: 'Contemporary carpet with abstract geometric patterns',
    price: 599.99,
    unit: 'piece',
    width: 150,
    height: 250,
    material: 'Wool',
    color: 'Blue',
    fabric: 'Wool Blend',
    weight: 4.0,
    shape: 'Rectangle',
    isApproved: true,
    stock: 15
  },
  {
    name: 'Traditional Oriental Rug',
    description: 'Classic oriental rug with traditional patterns',
    price: 799.99,
    unit: 'piece',
    width: 180,
    height: 270,
    material: 'Cotton',
    color: 'Beige',
    fabric: 'Cotton Blend',
    weight: 4.5,
    shape: 'Rectangle',
    isApproved: false,
    stock: 8
  },
  {
    name: 'Circular Mandala Carpet',
    description: 'Beautiful circular carpet with mandala design',
    price: 449.99,
    unit: 'piece',
    width: 200,
    height: 200,
    material: 'Synthetic',
    color: 'Multicolor',
    fabric: 'Synthetic Blend',
    weight: 3.5,
    shape: 'Circle',
    isApproved: true,
    stock: 12
  }
];

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
      throw new Error('No vendors found. Please run seed-users.ts first.');
    }

    // Distribute products among vendors
    for (let i = 0; i < products.length; i++) {
      const vendor = vendors[i % vendors.length];
      const product = productRepository.create({
        ...products[i],
        vendorId: vendor
      });
      await productRepository.save(product);
      console.log(`Created product: ${products[i].name} for vendor: ${vendor.email}`);
    }

    console.log('Product seeding completed successfully');
  } catch (error) {
    console.error('Error seeding products:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

// Run the seeding
seedProducts();
