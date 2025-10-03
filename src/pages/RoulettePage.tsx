import React, { useState } from "react";
import { RouletteItem, RouletteState } from "@/types/roulette";
import { calculateItemWeight, selectItemByPosition, SPIN_DURATION_OPTIONS, WeightMode } from "@/utils/roulette-utils";
import RouletteWheel from "@/components/roulette/RouletteWheel";
import ItemManager from "@/components/roulette/ItemManager";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
  } from "@/components/ui/resizable"
import DragWindowRegion from "@/components/DragWindowRegion";


export default function RoulettePage() {
  const [weightMode, setWeightMode] = useState<WeightMode>("reversed");
  const [isEliminationMode, setIsEliminationMode] = useState(true);
  const [spinDuration, setSpinDuration] = useState<number>(SPIN_DURATION_OPTIONS[0].value);
  const [state, setState] = useState<RouletteState>({
    items: [],
    isSpinning: false,
    selectedItem: null,
    spinHistory: [],
    lastWinner: null
  });

  const applyWeightMode = (items: RouletteItem[], mode: WeightMode): RouletteItem[] => {
    if (items.length === 0) return items;
    
    const maxPrice = Math.max(...items.map(item => item.price));
    if (maxPrice <= 0) return items.map(item => ({ ...item, weight: 1 }));
    
    return items.map(item => ({
      ...item,
      weight: calculateItemWeight(item.price, maxPrice, mode)
    }));
  };

  const handleAddItem = (newItem: RouletteItem) => {
    setState(prev => {
      const updatedItems = [...prev.items, newItem];
      const itemsWithWeights = applyWeightMode(updatedItems, weightMode);

      return {
        ...prev,
        items: itemsWithWeights
      };
    });
  };

  const handleRemoveItem = (id: string) => {
    setState(prev => {
      const updatedItems = prev.items.filter(item => item.id !== id);
      const itemsWithWeights = applyWeightMode(updatedItems, weightMode);

      return {
        ...prev,
        items: itemsWithWeights,
        selectedItem: prev.selectedItem?.id === id ? null : prev.selectedItem
      };
    });
  };

  const handleUpdateItem = (id: string, updatedItem: Partial<RouletteItem>) => {
    setState(prev => {
      const updatedItems = prev.items.map(item =>
        item.id === id ? { ...item, ...updatedItem } : item
      );
      const itemsWithWeights = applyWeightMode(updatedItems, weightMode);

      return {
        ...prev,
        items: itemsWithWeights
      };
    });
  };

  const handleResetGame = () => {
    setState(prev => ({
      ...prev,
      items: [],
      selectedItem: null,
      spinHistory: [],
      lastWinner: null
    }));
  };

  const handleSpin = () => {
    if (isEliminationMode) {
      if (state.items.length <= 1) return;
    } else if (state.items.length === 0) {
      return;
    }

    setState(prev => ({
      ...prev,
      isSpinning: true
    }));
  };

  const handleSpinComplete = (finalRotation: number) => {
    const selectedItem = selectItemByPosition(state.items, finalRotation);
    
    if (selectedItem) {
      const eliminationMode = isEliminationMode;
      setState(prev => ({
        ...prev,
        isSpinning: false,
        selectedItem,
        lastWinner: selectedItem
      }));
      
      setTimeout(() => {
        setState(prev => {
          const updatedItems = eliminationMode
            ? prev.items.filter(item => item.id !== selectedItem.id)
            : prev.items;
          const itemsWithWeights = applyWeightMode(updatedItems, weightMode);

          return {
            ...prev,
            items: itemsWithWeights,
            spinHistory: [selectedItem, ...prev.spinHistory.slice(0, 9)]
          };
        });
        
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

  const handleToggleWeightMode = () => {
    setWeightMode(prevMode => {
      const nextMode: WeightMode = prevMode === "reversed" ? "normal" : "reversed";
      setState(prev => ({
        ...prev,
        items: applyWeightMode(prev.items, nextMode)
      }));
      return nextMode;
    });
  };

  const handleToggleEliminationMode = () => {
    setIsEliminationMode(prev => !prev);
  };

  return (
    <div className="flex h-full flex-col">
      <DragWindowRegion
        title="Рулетка"
        weightMode={weightMode}
        isEliminationMode={isEliminationMode}
        onToggleWeightMode={handleToggleWeightMode}
        onToggleEliminationMode={handleToggleEliminationMode}
        spinDuration={spinDuration}
        onSpinDurationChange={setSpinDuration}
      />
      
      <ResizablePanelGroup direction="horizontal" className="flex-1 flex">
        <ResizablePanel className="w-2/3 p-6 flex flex-col items-center justify-center">
          <RouletteWheel
            items={state.items}
            isSpinning={state.isSpinning}
            selectedItem={state.selectedItem}
            lastWinner={state.lastWinner}
            hasSpins={state.spinHistory.length > 0}
            isEliminationMode={isEliminationMode}
            onSpin={handleSpin}
            onSpinComplete={handleSpinComplete}
            onResetGame={handleResetGame}
            spinDuration={spinDuration}
          />
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
