import HomeExperience from "@/components/HomeExperience";
import { getHomeCategories, getHomeProducts } from "@/lib/store-api";

export default async function Home() {
  const [categories, products] = await Promise.all([getHomeCategories(), getHomeProducts()]);
  return <HomeExperience categories={categories} products={products} />;
}
