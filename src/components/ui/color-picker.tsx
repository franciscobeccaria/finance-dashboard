import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface ColorPickerProps {
  selectedColor?: string;
  onColorChange: (color: string) => void;
  className?: string;
}

// Backend allowed colors - exactly matching ALLOWED_COLORS from backend
const allowedColors = [
  { name: "Azul", class: "text-blue-500", bg: "bg-blue-500" },
  { name: "Verde", class: "text-green-500", bg: "bg-green-500" },
  { name: "Púrpura", class: "text-purple-500", bg: "bg-purple-500" },
  { name: "Rojo", class: "text-red-500", bg: "bg-red-500" },
  { name: "Amarillo", class: "text-yellow-500", bg: "bg-yellow-500" },
  { name: "Índigo", class: "text-indigo-500", bg: "bg-indigo-500" },
  { name: "Rosa", class: "text-pink-500", bg: "bg-pink-500" },
  { name: "Gris", class: "text-gray-500", bg: "bg-gray-500" },
  { name: "Sky", class: "text-sky-600", bg: "bg-sky-600" },
  { name: "Azul 600", class: "text-blue-600", bg: "bg-blue-600" },
  { name: "Púrpura 600", class: "text-purple-600", bg: "bg-purple-600" },
  { name: "Esmeralda", class: "text-emerald-500", bg: "bg-emerald-500" },
  { name: "Naranja", class: "text-orange-500", bg: "bg-orange-500" },
  { name: "Teal", class: "text-teal-500", bg: "bg-teal-500" },
  { name: "Cian", class: "text-cyan-500", bg: "bg-cyan-500" },
  { name: "Lima", class: "text-lime-500", bg: "bg-lime-500" },
  { name: "Ámbar", class: "text-amber-500", bg: "bg-amber-500" },
  { name: "Rose", class: "text-rose-500", bg: "bg-rose-500" },
];

export function ColorPicker({ selectedColor, onColorChange, className }: ColorPickerProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <label className="text-sm font-medium text-gray-700">
        Seleccionar Color
      </label>
      
      {/* Color Preview */}
      {selectedColor && (
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
          <div className={`h-4 w-4 rounded-full ${selectedColor.replace('text-', 'bg-')}`} />
          <span className="text-sm text-gray-600">
            {allowedColors.find(c => c.class === selectedColor)?.name || "Color personalizado"}
          </span>
        </div>
      )}
      
      {/* Color Grid */}
      <div className="grid grid-cols-4 gap-2">
        {allowedColors.map((color) => (
          <Button
            key={color.class}
            variant="outline"
            size="sm"
            onClick={() => onColorChange(color.class)}
            className={`h-10 w-full p-2 border-2 transition-all ${
              selectedColor === color.class 
                ? "border-blue-500 bg-blue-50" 
                : "border-gray-200 hover:border-gray-300"
            }`}
            title={color.name}
          >
            <div className="flex items-center justify-center w-full h-full relative">
              <div className={`h-6 w-6 rounded-full ${color.bg}`} />
              {selectedColor === color.class && (
                <Check className="h-3 w-3 text-white absolute" />
              )}
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}