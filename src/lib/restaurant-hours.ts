import type { RestaurantSettings } from "@/types/restaurant";

const weekdayNumbers: Record<string, string> = { Mon: "1", Tue: "2", Wed: "3", Thu: "4", Fri: "5", Sat: "6", Sun: "7" };

export function isRestaurantAcceptingOrders(settings: RestaurantSettings, now = new Date()) {
  if (!settings.orders_open) return false;
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Moscow", weekday: "short" }).format(now);
  const day = Number(weekdayNumbers[weekday]);
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Moscow", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now);
  const today = settings.opening_hours[String(day)];
  const previous = settings.opening_hours[String(day === 1 ? 7 : day - 1)];
  const todayOpen = Boolean(today?.enabled && (
    today.open === today.close
    || (today.open < today.close && time >= today.open && time < today.close)
    || (today.open > today.close && time >= today.open)
  ));
  const previousStillOpen = Boolean(previous?.enabled && previous.open > previous.close && time < previous.close);
  return todayOpen || previousStillOpen;
}
