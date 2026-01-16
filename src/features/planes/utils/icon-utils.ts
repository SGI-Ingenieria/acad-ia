// src/features/planes/utils/icon-utils.ts
import * as Icons from "lucide-react";
import { BookOpen } from "lucide-react";

export const getIconByName = (iconName: string | null) => {
  if (!iconName) return BookOpen;
  // "as any" es necesario aquí porque el string es dinámico
  const Icon = (Icons as any)[iconName];
  return Icon || BookOpen;
};
