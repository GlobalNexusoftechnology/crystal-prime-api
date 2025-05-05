import { AppDataSource } from '../../src/utils/data-source';
import { User } from '../../src/entities/user.entity';
import { RoleEnumType } from '../../src/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { generateFakeUser } from './utils/faker-utils';

async function seedUsers() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    const userRepository = AppDataSource.getRepository(User);

    // Clear existing users
    await userRepository.clear();

    // Create one admin with fixed credentials for testing
    const adminPassword = await bcrypt.hash('Admin123!', 12);
    const admin = userRepository.create({
      name: 'Admin User',
      email: 'admin@carpetmarket.com',
      password: adminPassword,
      phoneNumber: '+1234567890',
      role: RoleEnumType.ADMIN,
      username: 'adminuser',
      address: '123 Admin St',
      city: 'Admin City',
      country: 'Admin Country',
      verified: true
    });
    await userRepository.save(admin);
    console.log('Created admin user');

    // Generate random vendors
    const vendorCount = 10;
    for (let i = 0; i < vendorCount; i++) {
      const vendorData = generateFakeUser(RoleEnumType.VENDOR);
      const hashedPassword = await bcrypt.hash(vendorData.password, 12);
      const vendor = userRepository.create({
        ...vendorData,
        password: hashedPassword
      });
      await userRepository.save(vendor);
      console.log(`Created vendor: ${vendorData.email} (Password: ${vendorData.password})`);
    }

    // Generate random regular users
    const userCount = 20;
    for (let i = 0; i < userCount; i++) {
      const userData = generateFakeUser(RoleEnumType.USER);
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = userRepository.create({
        ...userData,
        password: hashedPassword
      });
      await userRepository.save(user);
      console.log(`Created user: ${userData.email} (Password: ${userData.password})`);
    }

    console.log('\nUser seeding summary:');
    console.log('----------------------');
    console.log(`Created 1 admin user`);
    console.log(`Created ${vendorCount} vendor users`);
    console.log(`Created ${userCount} regular users`);
    console.log('\nAdmin credentials:');
    console.log('Email: admin@carpetmarket.com');
    console.log('Password: Admin123!');

  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

// Run the seeding
seedUsers();
