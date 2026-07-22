import {
  Car,
  Film,
  Home,
  PiggyBank,
  Shapes,
  Shield,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Utensils,
  Zap,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  home: Home,
  bolt: Zap,
  cart: ShoppingCart,
  car: Car,
  shield: Shield,
  utensils: Utensils,
  film: Film,
  bag: ShoppingBag,
  "piggy-bank": PiggyBank,
  "trending-up": TrendingUp,
};

export function categoryIcon(icon: string | undefined): LucideIcon {
  return (icon && ICONS[icon]) || Shapes;
}
