import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const ICONS: Record<string, IoniconName> = {
  home: "home-outline",
  bolt: "flash-outline",
  cart: "cart-outline",
  car: "car-outline",
  shield: "shield-checkmark-outline",
  utensils: "restaurant-outline",
  film: "film-outline",
  bag: "bag-outline",
  "piggy-bank": "wallet-outline",
  "trending-up": "trending-up-outline",
};

export function categoryIconName(icon: string | undefined): IoniconName {
  return (icon && ICONS[icon]) || "shapes-outline";
}
