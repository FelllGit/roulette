import React, { useState, useRef, useEffect } from "react";
import { RouletteItem } from "@/types/roulette";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { HexColorPicker } from "react-colorful";

interface EditableItemProps {
  item: RouletteItem;
  onUpdate: (id: string, updatedItem: Partial<RouletteItem>) => void;
  onRemove: (id: string) => void;
}

export default function EditableItem({ item, onUpdate, onRemove }: EditableItemProps) {
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(item.price.toString());
  const [color, setColor] = useState(item.color);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSave = () => {
    const priceValue = parseFloat(price);
    if (!name.trim() || isNaN(priceValue) || priceValue <= 0) return;

    onUpdate(item.id, {
      name: name.trim(),
      price: priceValue
    });
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    onUpdate(item.id, { color: newColor });
  };


  return (
    <div className="bg-card rounded-lg border-[1px] p-2 px-4 space-y-3">
      <div className="flex items-center justify-center gap-2">
        <div className="relative">
            <div
              className="w-8 h-8 rounded border cursor-pointer"
              style={{ backgroundColor: color }}
              onClick={() => setShowColorPicker(!showColorPicker)}
            />
            {showColorPicker && (
              <div ref={colorPickerRef} className="absolute z-50 mt-2 left-0">
                <HexColorPicker color={color} onChange={handleColorChange} />
              </div>
            )}
        </div>
        <Label className="block text-sm font-medium">
          Назва:
        </Label>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          className="w-full h-4 px-3 py-2 border-0 rounded-none border-b-gray-500 focus:ring-0 hover:border-b-[1px] hover:border-b-gray-500 transition-all duration-75 focus:outline-none focus:border-b-[1px] focus:border-b-gray-300"
        />
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onRemove(item.id)}
          className="p-2 h-8 w-8"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Label className="block text-sm font-medium mb-1">
          Вартість:
        </Label>
        <Input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          className="flex-1 h-4 px-3 py-2 border-0 rounded-none border-b-gray-500 focus:ring-0 hover:border-b-[1px] hover:border-b-gray-500 transition-all duration-75 focus:outline-none focus:border-b-[1px] focus:border-b-gray-300"
          min="0"
          step="0.01"
        />
        <div className="flex w-fit ">
          <div className="text-sm text-muted-foreground">
            Вага: {item.weight}
          </div>
        </div>
      </div>
    </div>
  );
}
