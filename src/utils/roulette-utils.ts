import { RouletteItem } from "@/types/roulette";

export function calculateItemWeight(price: number, maxPrice: number): number {
  if (maxPrice === 0) return 1;
  return Math.max(1, Math.floor((maxPrice - price + 1) / maxPrice * 100));
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

export function generatePastelColor(): string {
  const hue = Math.floor(Math.random() * 360);
  const saturation = Math.floor(Math.random() * 30) + 20;
  const lightness = Math.floor(Math.random() * 20) + 70;
  
  const h = hue / 360;
  const s = saturation / 100;
  const l = lightness / 100;
  
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h * 6) % 2 - 1));
  const m = l - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (h < 1/6) {
    r = c; g = x; b = 0;
  } else if (h < 2/6) {
    r = x; g = c; b = 0;
  } else if (h < 3/6) {
    r = 0; g = c; b = x;
  } else if (h < 4/6) {
    r = 0; g = x; b = c;
  } else if (h < 5/6) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }
  
  const toHex = (c: number) => {
    const hex = Math.round((c + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}