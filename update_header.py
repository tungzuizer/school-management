
with open('src/components/layout/Header.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(
    'interface HeaderProps {
  notificationCount?: number;
}',
    'interface HeaderProps {
  notificationCount?: number;
  onMobileMenuToggle?: () => void;
}'
)

text = text.replace(
    'export default function Header({ notificationCount = 0 }: HeaderProps) {',
    'export default function Header({ notificationCount = 0, onMobileMenuToggle }: HeaderProps) {'
)

text = text.replace(
    'import { Bell, Lightbulb, Search, LogOut, ChevronDown, ShieldCheck } from "lucide-react";',
    'import { Bell, Lightbulb, Search, LogOut, ChevronDown, ShieldCheck, Menu } from "lucide-react";'
)

old_left = '<div className="flex items-center gap-3.5">
          <img src="/logo.png"'
new_left = '<div className="flex items-center gap-2.5 sm:gap-3.5">
          {onMobileMenuToggle && (
            <button
              onClick={onMobileMenuToggle}
              className="lg:hidden p-2 rounded-xl bg-indigo-50/80 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 transition-all active-press cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Mở mục lục menu"
            >
              <Menu className="w-4 h-4 text-indigo-600" />
              <span className="text-[11px] font-extrabold hidden xs:inline">Mục lục</span>
            </button>
          )}
          <img src="/logo.png"'

text = text.replace(old_left, new_left)

with open('src/components/layout/Header.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Header updated successfully!')
