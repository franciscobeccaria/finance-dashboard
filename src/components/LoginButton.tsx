"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { User, LogOut, Settings } from "lucide-react";

interface LoginButtonProps {
  isAppLoading?: boolean;
}

export function LoginButton({ isAppLoading = false }: LoginButtonProps) {
  const { data: session, status } = useSession();
  
  /*
   * WORKAROUND for Radix UI Bug: "Maximum update depth exceeded"
   * 
   * Issue: Radix UI DropdownMenu components have a known bug that causes infinite 
   * re-render loops when the dropdown is opened during certain loading states.
   * This is due to problematic ref composition in FocusScope and PopperAnchor components.
   * 
   * References:
   * - https://github.com/radix-ui/primitives/issues/2152
   * - https://github.com/radix-ui/primitives/issues/2717
   * - https://github.com/radix-ui/primitives/issues/3385
   * 
   * Solution: Prevent dropdown interaction during app loading states by showing
   * a disabled avatar instead of the interactive dropdown.
   * 
   * TODO: Remove this workaround once Radix UI publishes a fix for the ref composition bug.
   */
  const isDropdownDisabled = isAppLoading;

  if (status === "loading") {
    return (
      <Button disabled className="bg-blue-800">
        <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-md animate-spin mr-2" />
        <span>Cargando</span>
      </Button>
    );
  }

  if (session) {
    const userEmail = session.user?.email || '';
    const userInitials = userEmail.substring(0, 2).toUpperCase();
    const userName = session.user?.name || userEmail.split('@')[0];
    
    // If app is loading, show disabled avatar (prevents Radix UI bug)
    if (isDropdownDisabled) {
      return (
        <Button 
          variant="ghost" 
          className="p-0 h-10 w-10 rounded-full opacity-60 cursor-not-allowed"
          disabled
        >
          <Avatar className="h-9 w-9 border border-gray-200">
            <AvatarImage src={session.user?.image || ''} alt={userName} />
            <AvatarFallback className="bg-blue-700 text-white font-medium">{userInitials}</AvatarFallback>
          </Avatar>
          <span className="sr-only">Menú de usuario (cargando...)</span>
        </Button>
      );
    }
    
    // Normal state: show full Radix UI dropdown
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="p-0 h-10 w-10 rounded-full">
            <Avatar className="h-9 w-9 border border-gray-200">
              <AvatarImage src={session.user?.image || ''} alt={userName} />
              <AvatarFallback className="bg-blue-700 text-white font-medium">{userInitials}</AvatarFallback>
            </Avatar>
            <span className="sr-only">Menú de usuario</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{userName}</p>
              <p className="text-xs leading-none text-gray-500">{userEmail}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Perfil</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Ajustes</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-red-500 focus:text-red-500">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Cerrar Sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button onClick={() => signIn("google")}>
      Iniciar Sesión con Google
    </Button>
  );
}