import { getProducts, getCategories } from "@/lib/actions";
import HomeClient from "@/components/layout/HomeClient";

export default async function HomePage() {
  const [initialProducts, initialCategories] = await Promise.all([
    getProducts(),
    getCategories()
  ]);

  return (
    <HomeClient 
      initialProducts={initialProducts} 
      initialCategories={initialCategories} 
    />
  );
}
