"use client"

import { useRouter } from "next/navigation"
import { LayoutDashboard, LogOut, ChevronDown } from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNav, type User } from "@/lib/nav-store"
import { ROUTES } from "@/lib/routes"
import { cn } from "@/lib/utils"

/** Signed-in identity chip — replaces the "Log in" button wherever a page's
 *  header needs to reflect auth state instead of always assuming a visitor. */
export function UserNavMenu({ user, className }: { user: User; className?: string }) {
  const router = useRouter()
  const logout = useNav((s) => s.logout)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-2 border border-transparent px-2 py-1.5 text-sm font-semibold outline-none transition-colors hover:border-brand-border-light",
          className,
        )}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-ink-black to-ink-deep text-xs font-bold text-brand-primary">
          {user.initials}
        </span>
        <span className="hidden max-w-[9rem] truncate sm:block">{user.name.split(" ")[0]}</span>
        <ChevronDown className="hidden h-3.5 w-3.5 shrink-0 opacity-60 sm:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="truncate font-bold">{user.name}</div>
          <div className="truncate text-xs font-normal text-brand-muted-foreground">{user.tierName}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push(ROUTES.dashboard)}>
          <LayoutDashboard className="h-4 w-4" /> Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            logout()
            router.push(ROUTES.home)
          }}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
