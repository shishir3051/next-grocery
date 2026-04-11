const mongoose = require('mongoose');

// Mock models to avoid complexity of importing TS files
const CategorySchema = new mongoose.Schema({
  name: String,
  slug: String,
});
const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

const ProductSchema = new mongoose.Schema({
  name: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  stock: Number,
});
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function check() {
  try {
    // Assuming the URI is in the environment or we can guess it. 
    // Usually it's in .env.local as MONGODB_URI
    // Let's try to find it first.
    console.log('Connecting to DB...');
    await mongoose.connect('mongodb://localhost:27017/next-grocery'); 
    
    const products = await Product.find().populate('category');
    console.log('Total Products:', products.length);
    products.forEach(p => {
      console.log(`- ${p.name} | Category: ${p.category ? p.category.name : 'NULL'} | Stock: ${p.stock}`);
    });
    
    const categories = await Category.find();
    console.log('\nTotal Categories:', categories.length);
    categories.forEach(c => {
      console.log(`- ${c.name} (${c.slug})`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

check();
