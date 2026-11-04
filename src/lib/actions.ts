import dbConnect from '@/lib/mongodb';
import { Product, Category } from '@/models/Product';
import { escapeRegex } from '@/lib/validation';

export async function getCategories() {
  await dbConnect();
  try {
    const categories = await Category.find({ parentId: null }).lean();
    const categoriesWithSubs = await Promise.all(
      categories.map(async (cat: any) => {
        const subcategories = await Category.find({ parentId: cat._id }).lean();
        return { ...cat, subcategories };
      })
    );
    return JSON.parse(JSON.stringify(categoriesWithSubs));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export async function getProducts(categorySlug?: string) {
  await dbConnect();
  try {
    let query = {};
    if (categorySlug) {
      const category = await Category.findOne({ slug: categorySlug });
      if (category) {
        // Find if it's a parent or subcategory
        const subcategories = await Category.find({ parentId: category._id });
        if (subcategories.length > 0) {
          const catIds = [category._id, ...subcategories.map(s => s._id)];
          query = { category: { $in: catIds } };
        } else {
          query = { category: category._id };
        }
      }
    }
    const products = await Product.find(query).populate('category').lean();
    return JSON.parse(JSON.stringify(products));
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

const MAX_SEARCH_LENGTH = 64;

export async function searchProducts(searchTerm: string) {
  // Treat the search text literally: an unescaped $regex lets anyone send patterns
  // like (a+)+$ that make MongoDB backtrack for a long time (ReDoS).
  const term = typeof searchTerm === 'string' ? searchTerm.trim().slice(0, MAX_SEARCH_LENGTH) : '';
  if (!term) return [];
  const pattern = escapeRegex(term);

  await dbConnect();
  try {
    const products = await Product.find({
      $or: [
        { name: { $regex: pattern, $options: 'i' } },
        { description: { $regex: pattern, $options: 'i' } }
      ]
    }).populate('category').lean();
    return JSON.parse(JSON.stringify(products));
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}
