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
            line.key === key ? { ...line, quantity: line.quantity + action.payload.quantity } : line,
          ),
        };
      }
      return { ...state, lines: [...state.lines, { ...action.payload, key }] };
    }
    case "quantity":
      return {
        ...state,
        lines: state.lines
          .map((line) => (line.key === action.key ? { ...line, quantity: action.quantity } : line))
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
    const parsed = JSON.parse(raw) as Partial<CartState>;
    if (!Array.isArray(parsed.lines)) return initialState;
    return {
      lines: parsed.lines.filter(
        (line): line is CartLine =>
          Boolean(line?.key && line.item?.id && Number.isFinite(line.quantity) && line.quantity > 0),
      ),
      orderComment: typeof parsed.orderComment === "string" ? parsed.orderComment : "",
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
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const markChanged = useCallback(() => { wasChangedBeforeHydration.current = true; hasHydrated.current = true; }, []);
  const addItem = useCallback((input: CartItemInput) => { markChanged(); dispatch({ type: "add", payload: input }); }, [markChanged]);
  const updateQuantity = useCallback((key: string, quantity: number) => { markChanged(); dispatch({ type: "quantity", key, quantity }); }, [markChanged]);
  const removeItem = useCallback((key: string) => { markChanged(); dispatch({ type: "remove", key }); }, [markChanged]);
  const setOrderComment = useCallback((comment: string) => { markChanged(); dispatch({ type: "comment", comment }); }, [markChanged]);
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
