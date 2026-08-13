"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { cartTotal } from "@/lib/whatsapp";
import type { CartItemInput, CartLine } from "@/types/menu";

const STORAGE_KEY = "b-bay-cart-v1";
const MAX_QUANTITY = 99;
const MAX_LINES = 100;

type CartState = {
  lines: CartLine[];
  orderComment: string;
};

type CartAction =
  | { type: "hydrate"; payload: CartState }
  | { type: "add"; payload: CartItemInput }
  | { type: "quantity"; key: string; quantity: number }
  | { type: "remove"; key: string }
  | { type: "comment"; comment: string }
  | { type: "clear" };

const initialState: CartState = { lines: [], orderComment: "" };

function makeLineKey(input: CartItemInput) {
  return [
    input.item.id,
    input.selectedOptions.map((option) => option.id).sort().join("."),
    input.comment.trim().toLowerCase(),
  ].join(":");
}

function clampQuantity(quantity: number) {
  return Math.min(MAX_QUANTITY, Math.max(0, Math.floor(quantity)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sanitizeStoredLine(value: unknown): CartLine | null {
  if (!isRecord(value) || !isRecord(value.item)) return null;
  const item = value.item;
  const quantity = typeof value.quantity === "number" ? clampQuantity(value.quantity) : 0;
  if (
    typeof value.key !== "string" || !value.key || quantity < 1 ||
    typeof item.id !== "string" || typeof item.name !== "string" || typeof item.slug !== "string" ||
    typeof item.price !== "number" || !Number.isFinite(item.price) || item.price < 0 ||
    typeof item.is_available !== "boolean" || typeof item.is_popular !== "boolean" ||
    typeof item.is_new !== "boolean" || typeof item.sort_order !== "number" ||
    !Array.isArray(value.selectedOptions)
  ) return null;

  const selectedOptions = value.selectedOptions.filter((option): option is CartLine["selectedOptions"][number] =>
    isRecord(option) && typeof option.id === "string" && typeof option.name === "string" &&
    typeof option.price === "number" && Number.isFinite(option.price) && option.price >= 0,
  );

  return {
    key: value.key,
    quantity,
    comment: typeof value.comment === "string" ? value.comment.slice(0, 250) : "",
    selectedOptions,
    item: {
      id: item.id,
      category_id: typeof item.category_id === "string" ? item.category_id : null,
      name: item.name,
      slug: item.slug,
      description: typeof item.description === "string" ? item.description : null,
      composition: typeof item.composition === "string" ? item.composition : null,
      price: item.price,
      weight: typeof item.weight === "string" ? item.weight : null,
      image_url: typeof item.image_url === "string" ? item.image_url : null,
      is_available: item.is_available,
      is_popular: item.is_popular,
      is_new: item.is_new,
      sort_order: Number.isFinite(item.sort_order) ? item.sort_order : 0,
      options: selectedOptions,
    },
  };
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "hydrate":
      return action.payload;
    case "add": {
      const key = makeLineKey(action.payload);
      const existing = state.lines.find((line) => line.key === key);
      if (existing) {
        return {
          ...state,
          lines: state.lines.map((line) =>
            line.key === key ? { ...line, quantity: clampQuantity(line.quantity + action.payload.quantity) } : line,
          ),
        };
      }
      if (state.lines.length >= MAX_LINES) return state;
      return { ...state, lines: [...state.lines, { ...action.payload, quantity: Math.max(1, clampQuantity(action.payload.quantity)), key }] };
    }
    case "quantity":
      return {
        ...state,
        lines: state.lines
          .map((line) => (line.key === action.key ? { ...line, quantity: clampQuantity(action.quantity) } : line))
          .filter((line) => line.quantity > 0),
      };
    case "remove":
      return { ...state, lines: state.lines.filter((line) => line.key !== action.key) };
    case "comment":
      return { ...state, orderComment: action.comment };
    case "clear":
      return initialState;
    default:
      return state;
  }
}

type CartContextValue = CartState & {
  count: number;
  total: number;
  addItem: (input: CartItemInput) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  setOrderComment: (comment: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function readStoredCart(): CartState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed) || !Array.isArray(parsed.lines)) return initialState;
    return {
      lines: parsed.lines.slice(0, MAX_LINES).map(sanitizeStoredLine).filter((line): line is CartLine => line !== null),
      orderComment: typeof parsed.orderComment === "string" ? parsed.orderComment.slice(0, 500) : "",
    };
  } catch {
    return initialState;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const hasHydrated = useRef(false);
  const wasChangedBeforeHydration = useRef(false);
  const skipInitialPersistence = useRef(true);

  useEffect(() => {
    if (!wasChangedBeforeHydration.current) {
      dispatch({ type: "hydrate", payload: readStoredCart() });
    }
    hasHydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hasHydrated.current || skipInitialPersistence.current) {
      skipInitialPersistence.current = false;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Cart remains usable for the current session when storage is unavailable.
    }
  }, [state]);

  const markChanged = useCallback(() => { wasChangedBeforeHydration.current = true; hasHydrated.current = true; }, []);
  const addItem = useCallback((input: CartItemInput) => { markChanged(); dispatch({ type: "add", payload: input }); }, [markChanged]);
  const updateQuantity = useCallback((key: string, quantity: number) => { markChanged(); dispatch({ type: "quantity", key, quantity }); }, [markChanged]);
  const removeItem = useCallback((key: string) => { markChanged(); dispatch({ type: "remove", key }); }, [markChanged]);
  const setOrderComment = useCallback((comment: string) => { markChanged(); dispatch({ type: "comment", comment: comment.slice(0, 500) }); }, [markChanged]);
  const clearCart = useCallback(() => { markChanged(); dispatch({ type: "clear" }); }, [markChanged]);

  const value = useMemo<CartContextValue>(
    () => ({
      ...state,
      count: state.lines.reduce((sum, line) => sum + line.quantity, 0),
      total: cartTotal(state.lines),
      addItem,
      updateQuantity,
      removeItem,
      setOrderComment,
      clearCart,
    }),
    [state, addItem, updateQuantity, removeItem, setOrderComment, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
