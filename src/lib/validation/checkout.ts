import { z } from "zod";
import { russianPhoneSchema } from "./phone";

export const checkoutSchema = z
  .object({
    name: z.string().trim().min(2, "Укажите имя (минимум 2 символа)").max(80),
    phone: russianPhoneSchema,
    fulfillment: z.enum(["delivery", "pickup"]),
    payment: z.enum(["cash", "transfer"]),
    address: z.string().trim().max(220),
    deliveryZoneId: z.string().uuid().or(z.literal("")),
    promoCode: z.string().trim().max(40),
  })
  .superRefine((data, context) => {
    if (data.fulfillment === "delivery" && data.address.length < 5) {
      context.addIssue({
        code: "custom",
        message: "Укажите адрес доставки",
        path: ["address"],
      });
    }
    if (data.fulfillment === "delivery" && !data.deliveryZoneId) {
      context.addIssue({
        code: "custom",
        message: "Выберите зону доставки",
        path: ["deliveryZoneId"],
      });
    }
  });

export type CheckoutValues = z.infer<typeof checkoutSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Минимум 2 символа").max(80),
  slug: z.string().trim().min(2, "Укажите URL-ярлык").max(100),
  sort_order: z.coerce.number().int().min(0).max(9999),
  is_active: z.boolean(),
});

export const menuItemSchema = z.object({
  category_id: z.string().uuid().nullable(),
  name: z.string().trim().min(2, "Минимум 2 символа").max(120),
  slug: z.string().trim().min(2, "Укажите URL-ярлык").max(130),
  description: z.string().trim().max(500).nullable(),
  composition: z.string().trim().max(1000).nullable(),
  price: z.coerce.number().int().positive("Цена должна быть больше нуля").max(100000),
  weight: z.string().trim().max(50).nullable(),
  image_url: z.string().url("Нужна корректная ссылка на изображение").nullable(),
  is_available: z.boolean(),
  is_popular: z.boolean(),
  is_new: z.boolean(),
  sort_order: z.coerce.number().int().min(0).max(9999),
});
