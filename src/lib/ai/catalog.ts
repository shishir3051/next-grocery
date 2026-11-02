import dbConnect from "@/lib/mongodb";
import { Product } from "@/models/Product";

/**
 * A compact view of the catalog for the AI features: the model chooses from real
 * products instead of guessing keywords, and the keyword fallback searches the same list.
 */
export interface CatalogItem {
  id: string;
  name: string;
  unit: string;
  category: string;
  inStock: boolean;
}

const CACHE_MS = 5 * 60 * 1000;
let cache: { items: CatalogItem[]; at: number } | null = null;

export async function getCatalog(): Promise<CatalogItem[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.items;

  await dbConnect();
  const products = await Product.find({})
    .select("name unit stock category") // never load imageData here
    .populate("category", "name")
    .lean<{ _id: unknown; name: string; unit: string; stock: number; category?: { name?: string } | null }[]>();

  const items = products.map(p => ({
    id: String(p._id),
    name: p.name,
    unit: p.unit,
    category: p.category?.name ?? "",
    inStock: p.stock > 0,
  }));
  cache = { items, at: Date.now() };
  return items;
}

/** One line per product, numbered, so the model can answer with small integers. */
export function formatCatalogForPrompt(items: CatalogItem[]): string {
  return items.map((p, i) => `${i}|${p.name}|${p.unit}|${p.category}${p.inStock ? "" : "|out of stock"}`).join("\n");
}

/** Full product documents (for the storefront cards), in the given order. */
export async function getProductsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  await dbConnect();
  const docs = await Product.find({ _id: { $in: ids } }).populate("category").lean();
  const byId = new Map(docs.map(d => [String(d._id), d]));
  const ordered = ids.map(id => byId.get(id)).filter(Boolean);
  return JSON.parse(JSON.stringify(ordered));
}

// --- Keyword fallback (works without AI) ------------------------------------------------

const STOPWORDS = new Set([
  "a", "an", "and", "the", "for", "of", "to", "in", "on", "with", "some", "i", "me", "my", "we", "our",
  "want", "need", "buy", "get", "make", "making", "cook", "cooking", "show", "find", "looking", "please",
  "ingredients", "ingredient", "items", "item", "food", "foods", "something", "tonight", "today", "people",
]);

/** Common Bangla (romanised) grocery words → English, so "alu" finds potatoes. */
const SYNONYMS: Record<string, string[]> = {
  alu: ["potato"], aloo: ["potato"], peyaj: ["onion"], piyaj: ["onion"], dim: ["egg"], murgi: ["chicken"],
  doodh: ["milk"], dudh: ["milk"], chal: ["rice"], mach: ["fish"], maach: ["fish"], dal: ["lentil", "dal"],
  morich: ["chilli"], roshun: ["garlic"], ada: ["ginger"], tel: ["oil"], chini: ["sugar"], lobon: ["salt"],
  kola: ["banana"], pepe: ["papaya"], begun: ["brinjal", "eggplant"], tomato: ["tomato"],
  breakfast: ["egg", "bread", "milk", "butter", "tea", "banana"], salad: ["cucumber", "tomato", "lettuce", "carrot"],
  biryani: ["rice", "chicken", "onion", "yogurt", "spice"], protein: ["egg", "chicken", "fish", "dal", "milk"],
  // Bangla script
  "আলু": ["potato"], "পেঁয়াজ": ["onion"], "পেয়াজ": ["onion"], "ডিম": ["egg"], "মুরগি": ["chicken"], "দুধ": ["milk"],
  "চাল": ["rice"], "মাছ": ["fish"], "ডাল": ["lentil", "dal"], "মরিচ": ["chilli"], "রসুন": ["garlic"], "আদা": ["ginger"],
  "তেল": ["oil"], "চিনি": ["sugar"], "লবণ": ["salt"], "কলা": ["banana"], "টমেটো": ["tomato"], "বেগুন": ["brinjal", "eggplant"],
};

function tokenize(text: string): string[] {
  // Unicode-aware: keeps Bangla script words (NFC so equivalent spellings compare equal).
  return text
    .normalize("NFC")
    .toLowerCase()
    .split(/[^\p{L}\p{M}\p{N}]+/u)
    .filter(t => t.length > 1 && !STOPWORDS.has(t));
}

/** Singular form for simple English plurals (eggs → egg, tomatoes → tomato). */
function singular(word: string): string {
  if (word.length > 4 && word.endsWith("es")) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s")) return word.slice(0, -1);
  return word;
}

/** Whole words of a name, in singular form, ignoring "(…)" notes like "(Alu)" for head detection. */
function wordsOf(text: string): string[] {
  return tokenize(text).map(singular);
}

/**
 * The head noun of a product name: its last word outside brackets.
 * "Broiler Chicken (Cut)" → "chicken", "Chicken Eggs (Layer)" → "egg".
 * Lets "chicken" prefer actual chicken over eggs that merely mention it.
 */
export function headNoun(name: string): string {
  const words = wordsOf(name.replace(/\([^)]*\)/g, " ")).filter(w => !DESCRIPTORS.has(w));
  return words[words.length - 1] ?? "";
}

/** Grade/origin words that follow the product noun in some names ("Potato Regular", "Garlic Imported"). */
const DESCRIPTORS = new Set(["regular", "premium", "imported", "deshi", "local", "fresh", "organic", "large", "small", "medium", "big", "loose", "pack", "cut", "whole"]);

/**
 * Ranks catalog items for a query (and its synonyms) by whole-word matches:
 * a match on the product's head noun counts most, then any word in the name, then the
 * category. Category-only matches are used only when nothing matches by name.
 */
export function keywordSearch(query: string, items: CatalogItem[], limit = 24): CatalogItem[] {
  const terms = new Set<string>();
  for (const token of tokenize(query)) {
    terms.add(singular(token));
    for (const synonym of SYNONYMS[token] ?? []) terms.add(singular(synonym));
  }
  if (terms.size === 0) return [];

  const scored = items.map(item => {
    // Include bracketed notes too, so "(Alu)" and "(Peyaj)" are searchable.
    const nameWords = new Set(wordsOf(item.name));
    const head = headNoun(item.name);
    const categoryWords = new Set(wordsOf(item.category));
    let nameScore = 0;
    let categoryScore = 0;
    for (const term of terms) {
      if (term === head) nameScore += 5;
      else if (nameWords.has(term)) nameScore += 2;
      else if (categoryWords.has(term)) categoryScore += 1;
    }
    return { item, nameScore, categoryScore };
  });

  const byName = scored.filter(r => r.nameScore > 0);
  const pool = byName.length > 0 ? byName : scored.filter(r => r.categoryScore > 0);

  return pool
    .map(r => ({ item: r.item, score: r.nameScore + r.categoryScore + (r.item.inStock ? 0.5 : 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(r => r.item);
}
