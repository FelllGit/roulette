import React, { useState } from "react";
import { RouletteItem } from "@/types/roulette";
import { generateId, generatePastelColor } from "@/utils/roulette-utils";
import { Button } from "@/components/ui/button";
import { HexColorPicker } from "react-colorful";

interface NewItemFormProps {
  onAddItem: (item: RouletteItem) => void;
  onCancel: () => void;
}

export default function NewItemForm({ onAddItem, onCancel }: NewItemFormProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [color, setColor] = useState(generatePastelColor());
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = React.useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price.trim()) return;

    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) return;

    const newItem: RouletteItem = {
      id: generateId(),
      name: name.trim(),
      price: priceValue,
      weight: 0,
      color: color
    };

    onAddItem(newItem);
    setName("");
    setPrice("");
  };

  const handleRandomColor = () => {
    setColor(generatePastelColor());
  };

  return (
    <div className="p-3 bg-card rounded-lg border space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">
          Назва
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Введіть назву"
          autoFocus
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          Вартість
        </label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Введіть вартість"
          min="0"
          step="0.01"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          Колір
        </label>
        <div className="relative flex items-center gap-2">
          <div
            className="w-8 h-8 rounded border cursor-pointer"
            style={{ backgroundColor: color }}
            onClick={() => setShowColorPicker(!showColorPicker)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRandomColor}
            className="px-2 py-1 text-xs"
          >
            Випадковий
          </Button>
          {showColorPicker && (
            <div ref={colorPickerRef} className="absolute -top-[13.3rem] z-50 mt-2 left-0">
              <HexColorPicker color={color} onChange={setColor} />
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSubmit} size="sm" className="flex-1">
          Додати
        </Button>
        <Button onClick={onCancel} variant="outline" size="sm" className="flex-1">
          Скасувати
        </Button>
      </div>
    </div>
  );
}
