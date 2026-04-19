import { Role } from "@prisma/client";

export type NavigationItem = {
  label: string;
  href?: string;
};

export function getNavigationItems(role: Role | null | undefined): NavigationItem[] {
  const items: NavigationItem[] = [
    { label: "シフトカレンダー", href: "/" },
    { label: "シフト希望提出" },
    { label: "過去のシフト確認", href: "/shifts/history" },
  ];

  if (role === Role.ADMIN || role === Role.OWNER) {
    items.push(
      { label: "店舗設定", href: "/store-settings" },
      { label: "スタッフ管理", href: "/staff" },
      { label: "シフト作成", href: "/shifts/new" }
    );
  }

  if (role === Role.OWNER) {
    items.push({ label: "店舗管理", href: "/stores" });
  }

  return items;
}
