import React, { useState, useMemo } from "react";
import { RouletteItem } from "@/types/roulette";
import ItemSearch from "./ItemSearch";
import EditableItem from "./EditableItem";
import NewItemForm from "./NewItemForm";

interface ItemManagerProps {
  items: RouletteItem[];
  onUpdateItem: (id: string, updatedItem: Partial<RouletteItem>) => void;
  onRemoveItem: (id: string) => void;
  onAddItem: (item: RouletteItem) => void;
}

export default function ItemManager({ 
  items, 
  onUpdateItem, 
  onRemoveItem, 
  onAddItem 
}: ItemManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.price.toString().includes(query)
    );
  }, [items, searchQuery]);

  const formatPrice = (price: number) => {
    return price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="h-full flex flex-col">
      <ItemSearch onSearch={handleSearch} onAddClick={() => setShowAddForm(true)} />
      
      <div className="flex flex-col gap-4 flex-1 overflow-y-auto p-4">
        {filteredItems.length === 0 && searchQuery.trim() ? (
          <div className="text-center py-8 text-muted-foreground">
            Немає айтемів, що відповідають пошуку
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Немає доданих айтемів
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2 flex-1 overflow-y-scroll">
              <h3 className="text-lg font-semibold mb-4">Додані айтеми</h3>
              {filteredItems.map((item) => (
                <EditableItem
                  key={item.id}
                  item={item}
                  onUpdate={onUpdateItem}
                  onRemove={onRemoveItem}
                />
              ))}
            </div>
          </>
        )}
        
        {showAddForm && (
          <div className="pt-4">
            <NewItemForm 
              onAddItem={(item) => {
                onAddItem(item);
                setShowAddForm(false);
              }} 
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
