import React, { useState } from "react";
import { RouletteItem, RouletteState } from "@/types/roulette";
import { selectItemByPosition } from "@/utils/roulette-utils";
import RouletteWheel from "@/components/roulette/RouletteWheel";
import ItemManager from "@/components/roulette/ItemManager";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
  } from "@/components/ui/resizable"
import DragWindowRegion from "@/components/DragWindowRegion";


export default function RoulettePage() {
  const [state, setState] = useState<RouletteState>({
    items: [],
    isSpinning: false,
    selectedItem: null,
    spinHistory: []
  });



  const updateItemWeights = (items: RouletteItem[]) => {
    if (items.length === 0) return items;
    
    const maxPrice = Math.max(...items.map(item => item.price));
    if (maxPrice <= 0) return items.map(item => ({ ...item, weight: 1 }));
    
    return items.map(item => ({
      ...item,
      weight: Math.max(1, Math.floor((maxPrice - item.price + 1) / maxPrice * 100))
    }));
  };

  const handleAddItem = (newItem: RouletteItem) => {
    const updatedItems = [...state.items, newItem];
    const itemsWithWeights = updateItemWeights(updatedItems);
    
    setState(prev => ({
      ...prev,
      items: itemsWithWeights
    }));
  };

  const handleRemoveItem = (id: string) => {
    const updatedItems = state.items.filter(item => item.id !== id);
    const itemsWithWeights = updateItemWeights(updatedItems);
    
    setState(prev => ({
      ...prev,
      items: itemsWithWeights,
      selectedItem: prev.selectedItem?.id === id ? null : prev.selectedItem
    }));
  };

  const handleUpdateItem = (id: string, updatedItem: Partial<RouletteItem>) => {
    const updatedItems = state.items.map(item => 
      item.id === id ? { ...item, ...updatedItem } : item
    );
    const itemsWithWeights = updateItemWeights(updatedItems);
    
    setState(prev => ({
      ...prev,
      items: itemsWithWeights
    }));
  };

  const handleResetGame = () => {
    setState(prev => ({
      ...prev,
      items: [],
      selectedItem: null,
      spinHistory: []
    }));
  };

  const handleSpin = () => {
    if (state.items.length <= 1) return;
    
    setState(prev => ({
      ...prev,
      isSpinning: true
    }));
  };

  const handleSpinComplete = (finalRotation: number) => {
    const selectedItem = selectItemByPosition(state.items, finalRotation);
    
    if (selectedItem) {
      setState(prev => ({
        ...prev,
        isSpinning: false,
        selectedItem
      }));
      
      setTimeout(() => {
        const updatedItems = state.items.filter(item => item.id !== selectedItem.id);
        const itemsWithWeights = updateItemWeights(updatedItems);
        
        setState(prev => ({
          ...prev,
          items: itemsWithWeights,
          spinHistory: [selectedItem, ...prev.spinHistory.slice(0, 9)]
        }));
        
        setTimeout(() => {
          setState(prev => ({
            ...prev,
            selectedItem: null
          }));
        }, 2000);
      }, 1000);
    } else {
      setState(prev => ({
        ...prev,
        isSpinning: false,
        selectedItem: null
      }));
    }
  };

  return (
    <div className="flex h-full flex-col">
      <DragWindowRegion title="Рулетка" />
      
      <ResizablePanelGroup direction="horizontal" className="flex-1 flex">
        <ResizablePanel className="w-2/3 p-6 flex flex-col items-center justify-center">
          <RouletteWheel
            items={state.items}
            isSpinning={state.isSpinning}
            selectedItem={state.selectedItem}
            onSpin={handleSpin}
            onSpinComplete={handleSpinComplete}
            onResetGame={handleResetGame}
          />
          
          {state.spinHistory.length > 0 && (
            <div className="mt-8 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4 text-center">Історія випадінь</h3>
              <div className="space-y-2">
                {state.spinHistory.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="flex justify-between items-center p-2 bg-muted rounded"
                  >
                    <span>{item.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ResizablePanel>

        <ResizableHandle withHandle />
        
        <ResizablePanel className="w-1/3 border-l">
          <ItemManager
            items={state.items}
            onUpdateItem={handleUpdateItem}
            onRemoveItem={handleRemoveItem}
            onAddItem={handleAddItem}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
