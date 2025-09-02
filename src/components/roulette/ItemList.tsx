import React from "react";
import { RouletteItem } from "@/types/roulette";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface ItemListProps {
  items: RouletteItem[];
  onRemoveItem: (id: string) => void;
}

export default function ItemList({ items, onRemoveItem }: ItemListProps) {
  const { t } = useTranslation();
  
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t("roulette.noItems")}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold mb-4">{t("roulette.addedItems")}</h3>
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-3 bg-card rounded-lg border"
        >
          <div className="flex-1">
            <div className="font-medium">{item.name}</div>
            <div className="text-sm text-muted-foreground">
              {t("roulette.price")}: {item.price.toFixed(2)} | {t("roulette.weight")}: {item.weight}
            </div>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onRemoveItem(item.id)}
          >
            {t("roulette.removeButton")}
          </Button>
        </div>
      ))}
    </div>
  );
}
