import React, { useState, useEffect, useCallback } from "react";
import { RouletteItem } from "@/types/roulette";
import { useTranslation } from "react-i18next";

interface RouletteProps {
  items: RouletteItem[];
  isSpinning: boolean;
  selectedItem: RouletteItem | null;
}

export default function Roulette({ items, isSpinning, selectedItem }: RouletteProps) {
  const { t } = useTranslation();
  const [rotation, setRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const spinWheel = useCallback(() => {
    if (items.length === 0 || isAnimating) return;
    
    setIsAnimating(true);
    const spins = 5 + Math.random() * 5;
    const duration = 3000 + Math.random() * 2000;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress < 1) {
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setRotation(prev => prev + spins * 360 * easeOut);
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };
    
    requestAnimationFrame(animate);
  }, [items.length, isAnimating]);

  useEffect(() => {
    if (isSpinning && !isAnimating) {
      spinWheel();
    }
  }, [isSpinning, isAnimating, spinWheel]);

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t("roulette.addItemsToStart")}
      </div>
    );
  }

  const segments = items.map((item, index) => {
    const angle = (360 / items.length) * index;
    const segmentAngle = (360 / items.length);
    
    return (
      <div
        key={item.id}
        className="absolute w-full h-full"
        style={{
          transform: `rotate(${angle}deg)`,
          transformOrigin: "center"
        }}
      >
        <div
          className="w-0 h-0 border-l-[100px] border-r-[100px] border-b-[200px] border-transparent"
          style={{
            borderBottomColor: `hsl(${(index * 137.5) % 360}, 70%, 60%)`,
            transform: `rotate(${segmentAngle / 2}deg)`,
            transformOrigin: "0 0"
          }}
        />
        <div
          className="absolute text-xs font-medium text-white"
          style={{
            left: "50%",
            top: "30%",
            transform: `translate(-50%, -50%) rotate(${segmentAngle / 2}deg)`,
            writingMode: "vertical-rl",
            textOrientation: "mixed"
          }}
        >
          {item.name}
        </div>
      </div>
    );
  });

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="relative w-64 h-64">
        <div
          className="w-full h-full rounded-full border-4 border-primary relative overflow-hidden"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isAnimating ? "none" : "transform 0.1s ease-out"
          }}
        >
          {segments}
        </div>
        <div className="absolute top-0 left-1/2 w-4 h-8 bg-red-500 transform -translate-x-1/2 -translate-y-1/2 z-10" />
      </div>
      

      
      {selectedItem && (
        <div className="text-center p-4 bg-card rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">{t("roulette.result")}</h3>
          <p className="text-xl font-bold text-primary">{selectedItem.name}</p>
          <p className="text-muted-foreground">{t("roulette.price")}: {selectedItem.price.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
}
