import colors from 'colors';
import mongoose from 'mongoose';
import { Category } from '../app/modules/category/category.model';
import { connectToDatabase } from '../DB/db';
import { logger } from '../shared/logger';

// Matches "Zyara's Categories" on the Home screen, in display order.
const categories = [
  { name: 'Groceries', slug: 'groceries', icon: 'groceries', order: 1 },
  {
    name: 'Balance Refill',
    slug: 'balance-refill',
    icon: 'balance-refill',
    order: 2,
  },
  { name: 'Flowers', slug: 'flowers', icon: 'flowers', order: 3 },
  { name: 'Food', slug: 'food', icon: 'food', order: 4 },
  { name: 'Furniture', slug: 'furniture', icon: 'furniture', order: 5 },
  { name: 'Clothes', slug: 'clothes', icon: 'clothes', order: 6 },
  { name: 'Gifts', slug: 'gifts', icon: 'gifts', order: 7 },
];

const seedCategories = async () => {
  for (const category of categories) {
    const existing = await Category.findOne({ slug: category.slug });
    if (existing) {
      continue;
    }
    await Category.create(category);
    logger.info(colors.green(`✨ Category created: ${category.name}`));
  }
};

const run = async () => {
  try {
    await connectToDatabase();
    logger.info(colors.cyan('🎨 Category seeding started 🎨'));
    await seedCategories();
    logger.info(colors.green('🎉 Category seeding completed successfully! 🎉'));
  } catch (error) {
    logger.error(colors.red('🔥 Error in category seeding: 🔥'), error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

run();
// npm run seed:categories
