import React, { useState, useEffect, useCallback } from "react";
import { RouletteItem } from "@/types/roulette";
import { Button } from "@/components/ui/button";
import { LabelList, Pie, PieChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface RouletteWheelProps {
  items: RouletteItem[];
  isSpinning: boolean;
  selectedItem: RouletteItem | null;
  onSpin: () => void;
  onSpinComplete: (finalRotation: number) => void;
  onResetGame?: () => void;
}

export default function RouletteWheel({ items, isSpinning, selectedItem, onSpin, onSpinComplete, onResetGame }: RouletteWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const chartData = items.map((item, index) => {
    const weight = isNaN(item.weight) || item.weight <= 0 ? 1 : item.weight;
    console.log(`Item ${item.name}: weight=${item.weight}, finalWeight=${weight}, price=${item.price}`);
    return {
      name: item.name,
      value: weight,
      fill: item.color || `hsl(${(index * 137.5) % 360}, 70%, 60%)`,
      price: item.price
    };
  });

  const chartConfig = {
    name: {
      label: "Name",
    },
    value: {
      label: "Weight",
    },
    price: {
      label: "Price",
    }
  };

  const spinWheel = useCallback(() => {
    if (items.length === 0 || isAnimating) return;
    
    setIsAnimating(true);
    const startRotation = rotation;
    const spins = 5 + Math.random() * 5;
    const duration = 3000 + Math.random() * 2000;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress < 1) {
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const newRotation = startRotation + spins * 360 * easeOut;
        setRotation(newRotation);
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        const finalRotation = startRotation + spins * 360;
        onSpinComplete(finalRotation);
      }
    };
    
    requestAnimationFrame(animate);
  }, [items.length, isAnimating, rotation, onSpinComplete]);

  useEffect(() => {
    if (isSpinning && !isAnimating) {
      spinWheel();
    }
  }, [isSpinning, isAnimating, spinWheel]);

  const handleSpinClick = () => {
    if (!isAnimating && items.length > 1 && !selectedItem) {
      onSpin();
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="text-2xl mb-4">🎯</div>
        <div className="text-lg font-semibold mb-2">Гра завершена!</div>
        <div className="text-sm">Всі слоти було видалено з рулетки</div>
        <div className="mt-4 text-xs">Додайте слоти для початку гри</div>
      </div>
    );
  }

  if (items.length === 1) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="text-2xl mb-4">🏆</div>
        <div className="text-lg font-semibold mb-2">Переможець!</div>
        <div className="text-sm">Це останній залишився слот</div>
        <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded">
          <div className="text-lg font-bold text-primary">{items[0].name}</div>
          <div className="text-sm text-muted-foreground">Вартість: {items[0].price.toFixed(2)}</div>
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          Додайте більше слотів для продовження гри
        </div>
        {onResetGame && (
          <div className="mt-4">
            <Button
              onClick={onResetGame}
              variant="outline"
              size="sm"
            >
              Скинути гру
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="relative w-80 h-80">
        <div
          className="w-full h-full rounded-full border-4 border-primary relative overflow-hidden"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isAnimating ? "none" : "transform 0.1s ease-out"
          }}
        >
          <ChartContainer
            config={chartConfig}
            className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[320px]"
          >
            <PieChart>
              <ChartTooltip
                content={<ChartTooltipContent nameKey="value" hideLabel />}
              />
              <Pie 
                data={chartData} 
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={150}
                innerRadius={0}
              >
                <LabelList
                  dataKey="name"
                  className="fill-background text-xs font-medium"
                  stroke="none"
                  fontSize={8}
                  formatter={(value: string) => value}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>
        <div className="absolute top-0 left-1/2 w-4 h-8 bg-red-500 transform -translate-x-1/2 -translate-y-1/2 z-10" />
      </div>
      
      <Button
        onClick={handleSpinClick}
        disabled={isAnimating || items.length <= 1 || selectedItem !== null}
        size="lg"
        className="text-lg px-8 py-4 w-48"
      >
        {isAnimating ? "Крутиться..." : items.length <= 1 ? "Гра завершена" : selectedItem ? "Очікування видалення..." : "Крутити рулетку!"}
      </Button>
      
      {selectedItem && (
        <div className="text-center p-4 bg-card rounded-lg border w-full animate-in slide-in-from-bottom-2 duration-300">
          <h3 className="text-lg font-semibold mb-2">Результат:</h3>
          <p className="text-xl font-bold text-primary">{selectedItem.name}</p>
          <p className="text-muted-foreground">Вартість: {selectedItem.price.toFixed(2)}</p>
          <div className="mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
            Слот було видалено з рулетки!
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Видалення через 2s...
          </div>
          {items.length === 1 && (
            <div className="mt-3 p-2 bg-primary/10 border border-primary/20 rounded text-primary text-sm">
              Це буде останній слот!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
