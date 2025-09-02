import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { RouletteItem } from "@/types/roulette";
import { generateId } from "@/utils/roulette-utils";
import { useTranslation } from "react-i18next";
import { HexColorPicker } from "react-colorful";

interface ItemFormProps {
  onAddItem: (item: RouletteItem) => void;
}

export default function ItemForm({ onAddItem }: ItemFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [color, setColor] = useState("#3b82f6");
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
    setColor("#3b82f6");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-card rounded-lg border">
      <div>
        <label htmlFor="itemName" className="block text-sm font-medium mb-2">
          {t("roulette.itemName")}
        </label>
        <input
          id="itemName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder={t("roulette.itemName")}
        />
      </div>
      <div>
        <label htmlFor="itemPrice" className="block text-sm font-medium mb-2">
          {t("roulette.itemPrice")}
        </label>
        <input
          id="itemPrice"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder={t("roulette.itemPrice")}
          min="0"
          step="0.01"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">
          {t("roulette.itemColor") || "Колір"}
        </label>
        <div className="relative">
          <div
            className="w-8 h-8 rounded border cursor-pointer"
            style={{ backgroundColor: color }}
            onClick={() => setShowColorPicker(!showColorPicker)}
          />
          {showColorPicker && (
            <div ref={colorPickerRef} className="absolute z-50 mt-2 left-0">
              <HexColorPicker color={color} onChange={setColor} />
            </div>
          )}
        </div>
      </div>
      <Button type="submit" className="w-full">
        {t("roulette.addItemButton")}
      </Button>
    </form>
  );
}
