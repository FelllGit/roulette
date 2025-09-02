export interface RouletteItem {
  id: string;
  name: string;
  price: number;
  weight: number;
  color: string;
}

export interface RouletteState {
  items: RouletteItem[];
  isSpinning: boolean;
  selectedItem: RouletteItem | null;
  spinHistory: RouletteItem[];
}
