import { AppDataSource } from '../../src/utils/data-source';
import { User } from '../../src/entities/user.entity';
import { RoleEnumType, BusinessTypeEnum } from '../../src/entities/user.entity';
import * as bcrypt from 'bcryptjs';

const users = [
  // Admin
  {
    name: 'Admin User',
    email: 'admin@carpetmarket.com',
    password: 'Admin123!',
    phoneNumber: '+1234567890',
    role: RoleEnumType.ADMIN,
    username: 'adminuser',
    address: '123 Admin St',
    city: 'Admin City',
    country: 'Admin Country',
    verified: true
  },
  // Vendors
  {
    name: 'Vendor One',
    email: 'vendor1@carpetmarket.com',
    password: 'Vendor123!',
    phoneNumber: '+1234567891',
    role: RoleEnumType.VENDOR,
    username: 'vendor1',
    address: '123 Vendor St',
    city: 'Vendor City',
    country: 'Vendor Country',
    businessName: 'Luxury Carpets',
    businessType: BusinessTypeEnum.WHOLESALE,
    registrationId: 'REG123456',
    businessLicense: 'LIC789012',
    verified: true,
    isVendorApproved: true
  },
  {
    name: 'Vendor Two',
    email: 'vendor2@carpetmarket.com',
    password: 'Vendor123!',
    phoneNumber: '+1234567892',
    role: RoleEnumType.VENDOR,
    username: 'vendor2',
    address: '456 Vendor St',
    city: 'Vendor City',
    country: 'Vendor Country',
    businessName: 'Modern Carpets',
    businessType: BusinessTypeEnum.RETAIL,
    registrationId: 'REG789012',
    businessLicense: 'LIC345678',
    verified: true,
    isVendorApproved: true
  },
  {
    name: 'Vendor Three',
    email: 'vendor3@carpetmarket.com',
    password: 'Vendor123!',
    phoneNumber: '+1234567893',
    role: RoleEnumType.VENDOR,
    username: 'vendor3',
    address: '789 Vendor St',
    city: 'Vendor City',
    country: 'Vendor Country',
    businessName: 'Classic Carpets',
    businessType: BusinessTypeEnum.MANUFACTURER,
    registrationId: 'REG345678',
    businessLicense: 'LIC901234',
    verified: true,
    isVendorApproved: true
  },
  // Regular Users
  {
    name: 'User One',
    email: 'user1@example.com',
    password: 'User123!',
    phoneNumber: '+1234567894',
    role: RoleEnumType.USER,
    username: 'user1',
    address: '123 User St',
    city: 'User City',
    country: 'User Country',
    verified: true
  },
  {
    name: 'User Two',
    email: 'user2@example.com',
    password: 'User123!',
    phoneNumber: '+1234567895',
    role: RoleEnumType.USER,
    username: 'user2',
    address: '456 User St',
    city: 'User City',
    country: 'User Country',
    verified: true
  }
];

async function seedUsers() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    const userRepository = AppDataSource.getRepository(User);

    // Clear existing users
    await userRepository.clear();

    // Hash passwords and create users
    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = userRepository.create({
        ...userData,
        password: hashedPassword
      });
      await userRepository.save(user);
      console.log(`Created user: ${userData.email}`);
    }

    console.log('User seeding completed successfully');
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

// Run the seeding
seedUsers();
