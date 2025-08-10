import { Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onAddTransaction: () => void;
}

export function Header({ onAddTransaction }: HeaderProps) {
  return (
    <header className="flex justify-between items-center w-full py-4 px-1">
      <h1 className="text-2xl font-bold text-blue-800">Mis Finanzas</h1>
      <div className="flex gap-2">
        <Button variant="outline" size="icon">
          <Settings className="h-5 w-5 text-green-700" />
          <span className="sr-only">Settings</span>
        </Button>
        <Button onClick={onAddTransaction}>
          <Plus className="h-5 w-5 mr-2" />
          Añadir Transacción
        </Button>
      </div>
    </header>
  );
}
