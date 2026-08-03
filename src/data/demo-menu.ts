import type { Category, MenuItem } from "@/types/menu";

export const demoCategories: Category[] = [
  { id: "cat-pizza", name: "Пицца", slug: "pizza", sort_order: 1, is_active: true },
  { id: "cat-burgers", name: "Бургеры", slug: "burgers", sort_order: 2, is_active: true },
  { id: "cat-sushi", name: "Суши", slug: "sushi", sort_order: 3, is_active: true },
  { id: "cat-rolls", name: "Роллы", slug: "rolls", sort_order: 4, is_active: true },
  { id: "cat-salads", name: "Салаты", slug: "salads", sort_order: 5, is_active: true },
  { id: "cat-hot", name: "Горячие блюда", slug: "hot-dishes", sort_order: 6, is_active: true },
  { id: "cat-drinks", name: "Напитки", slug: "drinks", sort_order: 7, is_active: true },
  { id: "cat-desserts", name: "Десерты", slug: "desserts", sort_order: 8, is_active: true },
];

// Local placeholders keep the demo usable offline; upload real photos in /admin.
const photo = (id: string) => {
  void id;
  return "/menu-placeholder.svg";
};

export const demoMenuItems: MenuItem[] = [
  { id: "pizza-margherita", category_id: "cat-pizza", name: "Маргарита", slug: "margherita", description: "Томатный соус, моцарелла и базилик.", composition: "Тесто, томатный соус, моцарелла, базилик.", price: 490, weight: "420 г", image_url: photo("photo-1574071318508-1cdbab80d002"), is_available: true, is_popular: true, is_new: false, sort_order: 1 },
  { id: "pizza-pepperoni", category_id: "cat-pizza", name: "Пепперони", slug: "pepperoni", description: "Пикантная колбаса и двойная моцарелла.", composition: "Тесто, соус, моцарелла, пепперони.", price: 590, weight: "460 г", image_url: photo("photo-1628840042765-356cda07504e"), is_available: true, is_popular: true, is_new: false, sort_order: 2 },
  { id: "pizza-bbq", category_id: "cat-pizza", name: "BBQ с курицей", slug: "bbq-chicken", description: "Нежная курица, соус BBQ и красный лук.", composition: "Тесто, курица, соус BBQ, моцарелла, лук.", price: 620, weight: "470 г", image_url: photo("photo-1513104890138-7c749659a591"), is_available: true, is_popular: false, is_new: true, sort_order: 3 },
  { id: "burger-cheeseburger", category_id: "cat-burgers", name: "Чизбургер", slug: "cheeseburger", description: "Сочная говяжья котлета и сыр чеддер.", composition: "Булочка бриошь, говядина, чеддер, салат, томат, соус.", price: 350, weight: "280 г", image_url: photo("photo-1568901346375-23c9450c58cd"), is_available: true, is_popular: true, is_new: false, sort_order: 1, options: [{ id: "extra-cheese", name: "Дополнительный сыр", price: 60 }, { id: "jalapeno", name: "Халапеньо", price: 40 }] },
  { id: "burger-smoky", category_id: "cat-burgers", name: "Смоки Бургер", slug: "smoky-burger", description: "Говядина, бекон и фирменный дымный соус.", composition: "Булочка, говядина, бекон, чеддер, лук, соус.", price: 470, weight: "340 г", image_url: photo("photo-1550547660-d9450f859349"), is_available: true, is_popular: false, is_new: true, sort_order: 2, options: [{ id: "extra-patty", name: "Дополнительная котлета", price: 140 }] },
  { id: "sushi-salmon", category_id: "cat-sushi", name: "Суши с лососем", slug: "salmon-sushi", description: "Норвежский лосось на рисе.", composition: "Рис, лосось, рисовый уксус.", price: 290, weight: "90 г", image_url: photo("photo-1579584425555-c3ce17fd4351"), is_available: true, is_popular: false, is_new: false, sort_order: 1 },
  { id: "sushi-shrimp", category_id: "cat-sushi", name: "Суши с креветкой", slug: "shrimp-sushi", description: "Сладкая креветка и деликатный рис.", composition: "Рис, тигровая креветка, рисовый уксус.", price: 310, weight: "90 г", image_url: photo("photo-1617196034796-73dfa7b1fd56"), is_available: true, is_popular: false, is_new: true, sort_order: 2 },
  { id: "roll-philadelphia", category_id: "cat-rolls", name: "Филадельфия", slug: "philadelphia", description: "Лосось, сливочный сыр и огурец.", composition: "Рис, лосось, сливочный сыр, огурец, нори.", price: 690, weight: "260 г", image_url: photo("photo-1579871494447-9811cf80d66c"), is_available: true, is_popular: true, is_new: false, sort_order: 1 },
  { id: "roll-california", category_id: "cat-rolls", name: "Калифорния", slug: "california", description: "Краб, авокадо и икра масаго.", composition: "Рис, краб, авокадо, огурец, масаго.", price: 520, weight: "240 г", image_url: photo("photo-1553621042-f6e147245754"), is_available: true, is_popular: false, is_new: false, sort_order: 2 },
  { id: "salad-caesar", category_id: "cat-salads", name: "Цезарь с курицей", slug: "caesar-chicken", description: "Хрустящий салат, курица и пармезан.", composition: "Романо, куриное филе, пармезан, томаты, соус цезарь.", price: 390, weight: "250 г", image_url: photo("photo-1546793665-c74683f339c1"), is_available: true, is_popular: true, is_new: false, sort_order: 1 },
  { id: "salad-greek", category_id: "cat-salads", name: "Греческий салат", slug: "greek-salad", description: "Свежие овощи, фета и оливки.", composition: "Томаты, огурцы, перец, фета, оливки, масло.", price: 320, weight: "230 г", image_url: photo("photo-1540420773420-3366772f4999"), is_available: true, is_popular: false, is_new: false, sort_order: 2 },
  { id: "hot-chicken", category_id: "cat-hot", name: "Курица терияки", slug: "chicken-teriyaki", description: "Куриное филе с овощами и рисом.", composition: "Куриное филе, рис, брокколи, перец, соус терияки.", price: 440, weight: "360 г", image_url: photo("photo-1603894584373-5ac82b2ae398"), is_available: true, is_popular: false, is_new: true, sort_order: 1 },
  { id: "hot-pasta", category_id: "cat-hot", name: "Паста альфредо", slug: "pasta-alfredo", description: "Фетучини в сливочном соусе с курицей.", composition: "Фетучини, курица, сливки, пармезан, чеснок.", price: 460, weight: "330 г", image_url: photo("photo-1473093295043-cdd812d0e601"), is_available: true, is_popular: true, is_new: false, sort_order: 2 },
  { id: "drink-lemonade", category_id: "cat-drinks", name: "Цитрусовый лимонад", slug: "citrus-lemonade", description: "Освежающий лимон, апельсин и мята.", composition: "Лимон, апельсин, мята, сироп, газированная вода.", price: 190, weight: "400 мл", image_url: photo("photo-1523677011781-c91d1bbe2f9e"), is_available: true, is_popular: false, is_new: false, sort_order: 1 },
  { id: "drink-coffee", category_id: "cat-drinks", name: "Капучино", slug: "cappuccino", description: "Двойной эспрессо и нежная молочная пена.", composition: "Эспрессо, молоко.", price: 180, weight: "300 мл", image_url: photo("photo-1517256064527-09c73fc73e38"), is_available: true, is_popular: true, is_new: false, sort_order: 2 },
  { id: "dessert-cheesecake", category_id: "cat-desserts", name: "Сан-Себастьян", slug: "san-sebastian", description: "Кремовый чизкейк с карамельной корочкой.", composition: "Сливочный сыр, сливки, яйца, сахар.", price: 330, weight: "160 г", image_url: photo("photo-1565958011703-44f9829ba187"), is_available: true, is_popular: false, is_new: true, sort_order: 1 },
  { id: "dessert-brownie", category_id: "cat-desserts", name: "Шоколадный брауни", slug: "chocolate-brownie", description: "Насыщенный шоколадный десерт.", composition: "Тёмный шоколад, масло, яйца, какао.", price: 280, weight: "140 г", image_url: photo("photo-1606313564200-e75d5e30476c"), is_available: true, is_popular: false, is_new: false, sort_order: 2 },
];
