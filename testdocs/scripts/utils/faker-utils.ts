import { faker } from '@faker-js/faker';
import { RoleEnumType, BusinessTypeEnum } from '../../../src/entities/user.entity';

export const generateFakeUser = (role: RoleEnumType) => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const baseUser = {
    name: `${firstName} ${lastName}`,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    password: faker.internet.password({ length: 12, prefix: 'Test@' }),
    phoneNumber: faker.phone.number('+91##########'),
    username: faker.internet.userName({ firstName, lastName }).toLowerCase(),
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    country: faker.location.country(),
    verified: true
  };

  if (role === RoleEnumType.VENDOR) {
    return {
      ...baseUser,
      role,
      businessName: faker.company.name(),
      businessType: faker.helpers.arrayElement(Object.values(BusinessTypeEnum)),
      registrationId: `REG${faker.string.alphanumeric(8).toUpperCase()}`,
      businessLicense: `LIC${faker.string.alphanumeric(8).toUpperCase()}`,
      isVendorApproved: true
    };
  }

  return {
    ...baseUser,
    role
  };
};

export const generateFakeProduct = () => {
  const materials = ['Wool', 'Silk', 'Cotton', 'Synthetic', 'Bamboo Silk', 'Jute', 'Hemp'];
  const patterns = ['Persian', 'Oriental', 'Modern', 'Geometric', 'Floral', 'Abstract', 'Traditional'];
  const shapes = ['Rectangle', 'Square', 'Circle', 'Oval', 'Runner'];
  const styles = ['Traditional', 'Contemporary', 'Transitional', 'Bohemian', 'Minimalist'];

  const width = faker.number.int({ min: 60, max: 400 });
  const height = faker.number.int({ min: 90, max: 600 });
  const pattern = faker.helpers.arrayElement(patterns);
  const material = faker.helpers.arrayElement(materials);
  const style = faker.helpers.arrayElement(styles);

  return {
    name: `${style} ${pattern} ${material} Carpet`,
    description: faker.lorem.paragraph(),
    price: faker.number.float({ min: 99, max: 9999, precision: 2 }),
    unit: 'piece',
    width,
    height,
    material,
    color: faker.color.human(),
    fabric: `${material} Blend`,
    weight: faker.number.float({ min: 2, max: 20, precision: 1 }),
    shape: faker.helpers.arrayElement(shapes),
    isApproved: faker.datatype.boolean(),
    stock: faker.number.int({ min: 1, max: 50 }),
    features: {
      pattern,
      style,
      origin: faker.location.country(),
      knotDensity: faker.number.int({ min: 25, max: 400 }) + ' knots per square inch',
      careInstructions: [
        'Professional cleaning recommended',
        'Vacuum regularly',
        'Avoid direct sunlight',
        'Rotate periodically'
      ],
      warranty: faker.number.int({ min: 1, max: 5 }) + ' years'
    }
  };
};
