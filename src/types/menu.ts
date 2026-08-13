import type { Database } from "./database";

type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type MenuItemRow = Database["public"]["Tables"]["menu_items"]["Row"];

export type Category = Omit<CategoryRow, "created_at"> & { created_at?: string };

export type MenuOption = {
  id: string;
  name: string;
  price: number;
};

export type MenuItem = Omit<MenuItemRow, "created_at" | "updated_at"> & {
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
