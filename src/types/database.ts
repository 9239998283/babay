export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          slug: string;
          sort_order: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      menu_items: {
        Row: {
          category_id: string | null;
          composition: string | null;
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          is_available: boolean;
          is_new: boolean;
          is_popular: boolean;
          name: string;
          price: number;
          slug: string;
          sort_order: number;
          updated_at: string;
          weight: string | null;
        };
        Insert: {
          category_id?: string | null;
          composition?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_available?: boolean;
          is_new?: boolean;
          is_popular?: boolean;
          name: string;
          price: number;
          slug: string;
          sort_order?: number;
          updated_at?: string;
          weight?: string | null;
        };
        Update: {
          category_id?: string | null;
          composition?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_available?: boolean;
          is_new?: boolean;
          is_popular?: boolean;
          name?: string;
          price?: number;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
          weight?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
