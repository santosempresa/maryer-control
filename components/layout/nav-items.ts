import { BarChart3, Calendar, FileText, Home, Settings, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/hoje", label: "Hoje", shortLabel: "Hoje", icon: Home },
  { href: "/agenda", label: "Agenda", shortLabel: "Agenda", icon: Calendar },
  { href: "/pacientes", label: "Pacientes", shortLabel: "Pacientes", icon: Users },
  { href: "/faturamento", label: "Faturamento", shortLabel: "Faturam.", icon: BarChart3 },
  { href: "/relatorios", label: "Relatórios", shortLabel: "Relat.", icon: FileText },
  { href: "/configuracoes", label: "Configurações", shortLabel: "Config.", icon: Settings },
];
