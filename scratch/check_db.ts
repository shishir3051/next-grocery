import dbConnect from './src/lib/mongodb';
import { Product, Category } from './src/models/Product';

async function check() {
  await dbConnect();
  const products = await Product.find().populate('category');
  console.log('--- PRODUCTS ---');
  products.forEach(p => {
    console.log(`Name: ${p.name}, Category: ${p.category?.name} (${p.category?.slug}), ID: ${p._id}`);
  });

  const categories = await Category.find();
  console.log('\n--- CATEGORIES ---');
  categories.forEach(c => {
    console.log(`Name: ${c.name}, Slug: ${c.slug}, ID: ${c._id}`);
  });
  process.exit(0);
}

check();
