export type Category = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
};

export type MenuOption = {
  id: string;
  name: string;
  price: number;
};

export type MenuItem = {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  composition: string | null;
  price: number;
  weight: string | null;
  image_url: string | null;
  is_available: boolean;
  is_popular: boolean;
  is_new: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  options?: MenuOption[];
};

export type CartLine = {
  key: string;
  item: MenuItem;
  quantity: number;
  selectedOptions: MenuOption[];
  comment: string;
};

export type CartItemInput = Omit<CartLine, "key">;

export type MenuPayload = {
  categories: Category[];
  items: MenuItem[];
  source: "supabase" | "demo";
};
