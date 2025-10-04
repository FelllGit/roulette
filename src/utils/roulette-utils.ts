import { RouletteItem } from "@/types/roulette";
import Decimal from 'decimal.js';
export type WeightMode = "reversed" | "normal";

export const CASINO_COLORS = [
  "#C41E3A", // roulette red
  "#101820", // roulette black
  "#FFD700", // casino gold
  "#0B3D2E", // table green
  "#AF7A0F", // warm brass
  "#1B5E20"  // vivid green
];

export const SPIN_DURATION_OPTIONS = [
  { label: "10s", value: 10_000 },
  { label: "30s", value: 30_000 },
  { label: "60s", value: 60_000 },
] as const;

let casinoColorIndex = 0;

export function calculateItemWeight(
  itemsNumber: number,
  price: number,
  totalSum: number,
  mode: WeightMode = "reversed"
): Decimal {
  if (totalSum === 0) return new Decimal(1);
  if (itemsNumber === 1) return new Decimal(100);
  
  const priceDecimal = new Decimal(price);
  const totalDecimal = new Decimal(totalSum);
  const itemsDecimal = new Decimal(itemsNumber);
  
  const ratio = mode === "reversed"
    ? new Decimal(100)
        .minus(priceDecimal.div(totalDecimal).times(100))
        .div(itemsDecimal.minus(1))
    : priceDecimal.div(totalDecimal).times(100);
  
  return ratio;
}

export function calculateTotalWeight(items: RouletteItem[]): number {
  return items.reduce((total, item) => total + item.weight, 0);
}

export function selectRandomItem(items: RouletteItem[]): RouletteItem {
  const totalWeight = calculateTotalWeight(items);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item;
    }
  }
  return items[items.length - 1];
}

export function selectItemByPosition(items: RouletteItem[], finalRotation: number): RouletteItem {
  if (items.length === 0) return items[0];
  
  // Нормалізуємо обертання (0-360 градусів)
  const normalizedRotation = ((finalRotation % 360) + 360) % 360;
  
  // Стрілка знаходиться вгорі (270 градусів від початкової позиції PieChart)
  // PieChart починає з правої сторони (0 градусів), тому стрілка на 270 градусах
  const pointerOffset = 90;
  const adjustedRotation = (normalizedRotation + pointerOffset) % 360;
  
  // Обчислюємо загальну вагу
  const totalWeight = calculateTotalWeight(items);
  
  // Обчислюємо кумулятивні кути на основі ваги
  let currentAngle = 0;
  
  for (const item of items) {
    // Обчислюємо розмір сектора на основі ваги
    const weight = isNaN(item.weight) || item.weight <= 0 ? 1 : item.weight;
    const segmentAngle = (weight / totalWeight) * 360;
    const segmentEnd = currentAngle + segmentAngle;
    
    // Перевіряємо, чи потрапляє скорегований кут у цей сектор
    if (adjustedRotation >= currentAngle && adjustedRotation < segmentEnd) {
      return item;
    }
    
    currentAngle = segmentEnd;
  }
  
  // Повертаємо останній елемент, якщо нічого не знайдено
  return items[items.length - 1];
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

casinoColorIndex = Math.floor(Math.random() * CASINO_COLORS.length);

export function generateCasinoColor(): string {
  const color = CASINO_COLORS[casinoColorIndex];
  casinoColorIndex = (casinoColorIndex + 1) % CASINO_COLORS.length;
  return color;
}

export function generatePastelColor(): string {
  // Preserve existing API while reusing the casino palette generator
  return generateCasinoColor();
}
