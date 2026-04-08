import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { News } from '@/models/News';

const articles = [
  {
    title: "FreshBasket Expands Delivery to 10 New Areas in Dhaka",
    slug: "delivery-expansion-dhaka",
    category: "Company News",
    readTime: "3 min read",
    image: "",
    excerpt: "We are thrilled to announce that our express grocery delivery service is now available in Uttara, Mirpur, and Bashundhara R/A. This expansion is part of our commitment to bringing farm-fresh quality to every doorstep in the city.",
    content: "We are thrilled to announce that our express grocery delivery service is now available in Uttara, Mirpur, and Bashundhara R/A. This expansion is part of our commitment to bringing farm-fresh quality to every doorstep in the city.\n\nOur operations team has been working tirelessly to establish new hubs in these key residential areas. With more delivery riders on the road and localized distribution centers, we can now guarantee 60-minute delivery to thousands of new customers.\n\nWhy did we choose these areas? Uttara and Mirpur have seen a massive surge in demand for quality groceries. We heard your requests on social media and made it our top priority for Q2 2026. Stay tuned for more expansion news as we look towards Chittagong and Sylhet later this year!"
  },
  {
    title: "The Health Benefits of Sourcing Organic Vegetables",
    slug: "organic-health-benefits",
    category: "Healthy Living",
    readTime: "5 min read",
    image: "",
    excerpt: "Eating organic isn't just a trend; it's a lifestyle. Discover why farm-fresh, pesticide-free vegetables are crucial for your long-term health and the environment.",
    content: "Eating organic isn't just a trend; it's a lifestyle. Discover why farm-fresh, pesticide-free vegetables are crucial for your long-term health and the environment.\n\nOrganic farming avoids the use of synthetic pesticides and fertilizers, which means the vegetables you eat are as close to nature as possible. Studies show that organic produce can have higher levels of antioxidants and certain nutrients compared to conventionally grown crops.\n\nBeyond personal health, choosing organic supports sustainable farming practices that protect soil quality and biodiversity. At FreshBasket, we partner directly with certified organic farmers across Bangladesh to ensure you get the best quality without the chemical residue. Transitioning to an organic diet can improve your digestion, energy levels, and overall well-being."
  },
  {
    title: "5 Tips for Keeping Your Groceries Fresh Longer",
    slug: "groceries-fresh-tips",
    category: "Tips & Tricks",
    readTime: "4 min read",
    image: "",
    excerpt: "Learn the professional secrets of food storage. From humidity settings to proper container usage, keep your greens crisp for days with our expert guide.",
    content: "Learn the professional secrets of food storage. From humidity settings to proper container usage, keep your greens crisp for days with our expert guide.\n\n1. Use the Crisper Drawer Correctly: Did you know that different vegetables need different humidity levels? Greens like lettuce and spinach love high humidity, while fruits like apples should be kept in a lower-humidity environment.\n\n2. Don't Wash Before Storing: Moisture is the enemy of shelf-life. Only wash your produce right before you're ready to eat it.\n\n3. Breathable Containers: For berries and soft fruits, use containers that allow for some airflow to prevent mold growth.\n\n4. Keep Ethylene Producers Apart: Some fruits like bananas release ethylene gas, which can cause other vegetables to ripen and rot faster. Keep them in separate bowls!\n\n5. Refrigerate Onions and Potatoes Carefully: Potatoes should be kept in a cool, dark place but not necessarily the fridge, as it can turn their starches to sugar."
  }
];

export async function GET() {
  await dbConnect();
  try {
    // Clear Mongoose model cache to pick up schema changes
    if (mongoose.models.News) {
      delete mongoose.models.News;
    }
    
    // Dynamically re-import or use the model after cache wipe
    const { News } = require('@/models/News');
    
    await News.deleteMany({});
    for (const article of articles) {
      await News.create(article);
    }
    return NextResponse.json({ message: 'Success! Old news restored without images.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
