// Helper function to generate a unique 8-digit order number
export const generateUniqueNumber = (): string => {
  // Generate a random 8-digit number
  const orderNumber = Math.floor(10000000 + Math.random() * 90000000).toString();

  return orderNumber;
};
