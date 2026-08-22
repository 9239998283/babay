import { z } from "zod";

export function normalizeRussianPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const national = digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))
    ? digits.slice(1)
    : digits.length === 10
      ? digits
      : "";

  if (!/^[3-9]\d{9}$/.test(national)) return null;
  return `+7${national}`;
}

export function formatRussianPhoneInput(value: string) {
  const digits = value.replace(/\D/g, "");
  const national = (digits.startsWith("7") || digits.startsWith("8") ? digits.slice(1) : digits).slice(0, 10);
  if (!national) return value.startsWith("+") ? "+7" : "";

  const parts = [
    national.slice(0, 3),
    national.slice(3, 6),
    national.slice(6, 8),
    national.slice(8, 10),
  ];
  let formatted = `+7 (${parts[0]}`;
  if (parts[0].length === 3) formatted += ")";
  if (parts[1]) formatted += ` ${parts[1]}`;
  if (parts[2]) formatted += `-${parts[2]}`;
  if (parts[3]) formatted += `-${parts[3]}`;
  return formatted;
}

export const russianPhoneSchema = z.string().superRefine((value, context) => {
  if (!normalizeRussianPhone(value)) {
    context.addIssue({ code: "custom", message: "Введите российский номер в формате +7 999 000-00-00" });
  }
}).transform((value) => normalizeRussianPhone(value) as string);

