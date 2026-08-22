export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

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
      restaurant_settings: {
        Row: {
          id: boolean;
          establishment_name: string;
          address: string;
          phone: string;
          whatsapp_phone: string;
          orders_open: boolean;
          opening_hours: Json;
          minimum_order: number;
          preparation_minutes: number;
          delivery_minutes: number;
          payment_methods: string[];
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: boolean;
          establishment_name?: string;
          address?: string;
          phone?: string;
          whatsapp_phone?: string;
          orders_open?: boolean;
          opening_hours?: Json;
          minimum_order?: number;
          preparation_minutes?: number;
          delivery_minutes?: number;
          payment_methods?: string[];
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: boolean;
          establishment_name?: string;
          address?: string;
          phone?: string;
          whatsapp_phone?: string;
          orders_open?: boolean;
          opening_hours?: Json;
          minimum_order?: number;
          preparation_minutes?: number;
          delivery_minutes?: number;
          payment_methods?: string[];
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      delivery_zones: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          fee: number;
          minimum_order: number;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          fee?: number;
          minimum_order?: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          fee?: number;
          minimum_order?: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      promo_codes: {
        Row: {
          code: string;
          discount_type: string;
          discount_value: number;
          minimum_order: number;
          maximum_discount: number | null;
          starts_at: string | null;
          ends_at: string | null;
          usage_limit: number | null;
          usage_count: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          discount_type: string;
          discount_value: number;
          minimum_order?: number;
          maximum_discount?: number | null;
          starts_at?: string | null;
          ends_at?: string | null;
          usage_limit?: number | null;
          usage_count?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          discount_type?: string;
          discount_value?: number;
          minimum_order?: number;
          maximum_discount?: number | null;
          starts_at?: string | null;
          ends_at?: string | null;
          usage_limit?: number | null;
          usage_count?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      menu_item_modifiers: {
        Row: {
          id: string;
          menu_item_id: string;
          name: string;
          price_delta: number;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          menu_item_id: string;
          name: string;
          price_delta?: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          menu_item_id?: string;
          name?: string;
          price_delta?: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "menu_item_modifiers_menu_item_id_fkey";
            columns: ["menu_item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          idempotency_key: string;
          public_token_hash: string;
          created_at: string;
          updated_at: string;
          status_updated_at: string;
          customer_name: string;
          customer_phone: string;
          fulfillment_method: string;
          delivery_address: string | null;
          delivery_zone_id: string | null;
          delivery_zone_name: string | null;
          payment_method: string;
          promo_code: string | null;
          subtotal: number;
          discount_amount: number;
          delivery_fee: number;
          total: number;
          order_comment: string | null;
          status: string;
          cancelled_reason: string | null;
          source: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          idempotency_key: string;
          public_token_hash: string;
          created_at?: string;
          updated_at?: string;
          status_updated_at?: string;
          customer_name: string;
          customer_phone: string;
          fulfillment_method: string;
          delivery_address?: string | null;
          delivery_zone_id?: string | null;
          delivery_zone_name?: string | null;
          payment_method: string;
          promo_code?: string | null;
          subtotal: number;
          discount_amount?: number;
          delivery_fee?: number;
          total: number;
          order_comment?: string | null;
          status?: string;
          cancelled_reason?: string | null;
          source?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          idempotency_key?: string;
          public_token_hash?: string;
          created_at?: string;
          updated_at?: string;
          status_updated_at?: string;
          customer_name?: string;
          customer_phone?: string;
          fulfillment_method?: string;
          delivery_address?: string | null;
          delivery_zone_id?: string | null;
          delivery_zone_name?: string | null;
          payment_method?: string;
          promo_code?: string | null;
          subtotal?: number;
          discount_amount?: number;
          delivery_fee?: number;
          total?: number;
          order_comment?: string | null;
          status?: string;
          cancelled_reason?: string | null;
          source?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_delivery_zone_id_fkey";
            columns: ["delivery_zone_id"];
            isOneToOne: false;
            referencedRelation: "delivery_zones";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string | null;
          item_name: string;
          unit_price: number;
          quantity: number;
          modifiers: Json;
          modifiers_total: number;
          item_comment: string | null;
          line_total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          menu_item_id?: string | null;
          item_name: string;
          unit_price: number;
          quantity: number;
          modifiers?: Json;
          modifiers_total?: number;
          item_comment?: string | null;
          line_total: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          menu_item_id?: string | null;
          item_name?: string;
          unit_price?: number;
          quantity?: number;
          modifiers?: Json;
          modifiers_total?: number;
          item_comment?: string | null;
          line_total?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      order_status_events: {
        Row: { id: number; order_id: string; status: string; changed_by: string | null; created_at: string };
        Insert: { id?: number; order_id: string; status: string; changed_by?: string | null; created_at?: string };
        Update: { id?: number; order_id?: string; status?: string; changed_by?: string | null; created_at?: string };
        Relationships: [];
      };
      admin_audit_log: {
        Row: {
          id: number;
          admin_user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          before_data: Json | null;
          after_data: Json | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: number;
          admin_user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          before_data?: Json | null;
          after_data?: Json | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      quote_order: {
        Args: { p_items: Json; p_fulfillment_method: string; p_delivery_zone_id: string | null; p_promo_code?: string | null };
        Returns: Json;
      };
      place_order: {
        Args: {
          p_idempotency_key: string;
          p_public_token_hash: string;
          p_customer_name: string;
          p_customer_phone: string;
          p_fulfillment_method: string;
          p_delivery_address: string | null;
          p_delivery_zone_id: string | null;
          p_payment_method: string;
          p_promo_code: string | null;
          p_order_comment: string | null;
          p_items: Json;
        };
        Returns: Json;
      };
      get_order_status: { Args: { p_order_number: string; p_public_token_hash: string }; Returns: Json };
      is_login_rate_limited: { Args: { p_key_hash: string }; Returns: boolean };
      record_login_attempt: { Args: { p_key_hash: string; p_success: boolean }; Returns: undefined };
      consume_order_rate_limit: { Args: { p_key_hash: string }; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
