import React, { useState } from "react";
import { Search, Plus } from "lucide-react";

interface ItemSearchProps {
  onSearch: (query: string) => void;
  onAddClick: () => void;
}

export default function ItemSearch({ onSearch, onAddClick }: ItemSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-4">
      <div className="flex gap-3">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            placeholder="Пошук айтемів..."
            className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
          />
        </form>
        <button
          type="button"
          onClick={onAddClick}
          className="p-2 border border-input rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          title="Додати новий слот"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
