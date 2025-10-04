import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { RouletteItem } from "@/types/roulette";
import { Button } from "@/components/ui/button";
import { Pie, PieChart } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { CASINO_COLORS } from "@/utils/roulette-utils";
import pointerTickSoundSrc from "@/assets/sounds/pointer-tick.mp3";
import winChimeSoundSrc from "@/assets/sounds/win-chime.mp3";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

const POINTER_SOUND_SRC = pointerTickSoundSrc;
const WIN_SOUND_SRC = winChimeSoundSrc;
const POINTER_OFFSET_DEGREES = 90;
const CONFETTI_PIECES = 80;
const CONFETTI_DURATION_MS = 1800;
const SPEED_MULTIPLIER = 4;
const BASE_ANGULAR_SPEED_DEG_PER_MS = (SPEED_MULTIPLIER * 360) / 1000;
const DEFAULT_MAX_WHEEL_BOUND = 720;

function getResponsiveWheelBound(): number {
  if (typeof window === "undefined") {
    return DEFAULT_MAX_WHEEL_BOUND;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const widthLimit = width < 1024 ? width * 0.92 : width * 0.6;
  const heightLimit = height * 0.78;
  const absoluteMax = 1150;
  const base = Math.min(widthLimit, heightLimit, absoluteMax);

  return Math.max(360, Math.round(base));
}

type ConfettiPiece = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotateStart: number;
  rotateEnd: number;
};

interface RouletteWheelProps {
  items: RouletteItem[];
  isSpinning: boolean;
  selectedItem: RouletteItem | null;
  hasSpins: boolean;
  lastWinner: RouletteItem | null;
  isEliminationMode: boolean;
  onSpin: () => void;
  onSpinComplete: (finalRotation: number) => void;
  onResetGame?: () => void;
  onAcknowledgeElimination?: () => void;
  spinDuration: number;
}

export default function RouletteWheel({
  items,
  isSpinning,
  selectedItem,
  hasSpins,
  lastWinner: _lastWinner,
  isEliminationMode,
  onSpin,
  onSpinComplete,
  onResetGame,
  onAcknowledgeElimination,
  spinDuration,
}: RouletteWheelProps) {
  const wheelContainerRef = useRef<HTMLDivElement>(null);
  const [maxWheelBound, setMaxWheelBound] = useState<number>(() => getResponsiveWheelBound());
  const [wheelSize, setWheelSize] = useState(800);
  const [rotation, setRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const pointerSoundRef = useRef<HTMLAudioElement | null>(null);
  const winSoundRef = useRef<HTMLAudioElement | null>(null);
  const lastPointerAngleRef = useRef<number | null>(null);
  const lastCelebratedIdRef = useRef<string | null>(null);

  const { chartData, pointerBoundaries } = useMemo(() => {
    if (items.length === 0) {
      return {
        chartData: [],
        pointerBoundaries: [] as number[],
      };
    }

    const sanitizedWeights: number[] = [];
    const data = items.map((item, index) => {
      const weight = isNaN(item.weight) || item.weight <= 0 ? 1 : item.weight;
      sanitizedWeights.push(weight);
      return {
        name: item.name,
        value: weight,
        fill:
          item.color || CASINO_COLORS[index % CASINO_COLORS.length],
        price: item.price,
      };
    });

    const totalWeight = sanitizedWeights.reduce((total, value) => total + value, 0);
    const boundariesSet = new Set<string>();
    const boundaries: number[] = [];

    const addBoundary = (angle: number) => {
      const normalized = ((angle % 360) + 360) % 360;
      const key = normalized.toFixed(4);
      if (!boundariesSet.has(key)) {
        boundariesSet.add(key);
        boundaries.push(normalized);
      }
    };

    addBoundary(0);

    let cumulativeAngle = 0;
    if (totalWeight > 0) {
      sanitizedWeights.forEach((weight) => {
        const angle = (weight / totalWeight) * 360;
        cumulativeAngle += angle;
        addBoundary(cumulativeAngle);
      });
    }

    boundaries.sort((a, b) => a - b);

    return {
      chartData: data,
      pointerBoundaries: boundaries,
    };
  }, [items]);

  void _lastWinner;

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

  useEffect(() => {
    const node = wheelContainerRef.current;
    if (!node) {
      return;
    }

    const updateSize = () => {
      const { width, height } = node.getBoundingClientRect();
      const nextSize = Math.round(Math.min(width, height));
      if (nextSize > 0) {
        setWheelSize(nextSize);
      }
    };

    updateSize();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        updateSize();
      });
      observer.observe(node);
      return () => observer.disconnect();
    }

    const handleWindowResize = () => updateSize();
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateBounds = () => {
      setMaxWheelBound((prev) => {
        const next = getResponsiveWheelBound();
        return prev === next ? prev : next;
      });
    };

    updateBounds();
    window.addEventListener("resize", updateBounds);
    return () => window.removeEventListener("resize", updateBounds);
  }, []);

  const effectiveWheelSize = Math.max(240, wheelSize);
  const pointerBase = Math.max(28, effectiveWheelSize * 0.06);
  const pointerHeight = Math.max(48, effectiveWheelSize * 0.12);
  const pointerTranslateY = pointerHeight * 0.55;
  const outerMargin = Math.max(16, Math.min(0, effectiveWheelSize));
  const pieOuterRadius = Math.max(0, effectiveWheelSize / 1.9 - outerMargin);
  const labelFontSize = Math.max(24, Math.round(effectiveWheelSize * 0.061));
  const wheelBound = Number.isFinite(maxWheelBound)
    ? maxWheelBound
    : DEFAULT_MAX_WHEEL_BOUND;


  const primePointerSound = useCallback(() => {
    if (!pointerSoundRef.current && typeof Audio !== "undefined") {
      const audio = new Audio(POINTER_SOUND_SRC);
      audio.preload = "auto";
      audio.volume = 0.5;
      pointerSoundRef.current = audio;
    }
  }, []);

  const primeWinSound = useCallback(() => {
    if (!winSoundRef.current && typeof Audio !== "undefined") {
      const audio = new Audio(WIN_SOUND_SRC);
      audio.preload = "auto";
      audio.volume = 0.6;
      winSoundRef.current = audio;
    }
  }, []);

  const handlePointerTick = useCallback((rotationValue: number) => {
    const normalizedRotation = ((rotationValue % 360) + 360) % 360;
    const pointerAngle = (normalizedRotation + POINTER_OFFSET_DEGREES) % 360;

    primePointerSound();

    if (lastPointerAngleRef.current === null) {
      lastPointerAngleRef.current = pointerAngle;
      return;
    }

    if (pointerBoundaries.length === 0) {
      lastPointerAngleRef.current = pointerAngle;
      return;
    }

    const previousAngle = lastPointerAngleRef.current;
    const currentAngle = pointerAngle;

    const crossedBoundary = pointerBoundaries.some((boundary) => {
      if (previousAngle < currentAngle) {
        return boundary > previousAngle && boundary <= currentAngle;
      }
      return boundary > previousAngle || boundary <= currentAngle;
    });

    if (crossedBoundary) {
      const tickAudio = pointerSoundRef.current;
      if (tickAudio) {
        try {
          tickAudio.pause();
          tickAudio.currentTime = 0;
        } catch {
          /* browsers may block seek before metadata */
        }
        tickAudio.play().catch(() => {
          /* autoplay guard */
        });
      }
    }

    lastPointerAngleRef.current = pointerAngle;
  }, [pointerBoundaries, primePointerSound]);

  useEffect(() => {
    return () => {
      pointerSoundRef.current?.pause();
      pointerSoundRef.current = null;
      winSoundRef.current?.pause();
      winSoundRef.current = null;
    };
  }, []);

  useEffect(() => {
    lastPointerAngleRef.current = null;
    if (pointerSoundRef.current) {
      pointerSoundRef.current.pause();
      pointerSoundRef.current.currentTime = 0;
    }
  }, [pointerBoundaries]);

  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    const triggerConfetti = (id: string) => {
      if (id === lastCelebratedIdRef.current) {
        return;
      }

      lastCelebratedIdRef.current = id;
      primeWinSound();
      if (winSoundRef.current) {
        winSoundRef.current.currentTime = 0;
        winSoundRef.current.play().catch(() => {
          /* autoplay guard */
        });
      }

      const pieces: ConfettiPiece[] = Array.from({ length: CONFETTI_PIECES }, (_, index) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.4;
        const duration = CONFETTI_DURATION_MS + Math.random() * 600;
        const size = 6 + Math.random() * 6;
        const rotateStart = Math.random() * 180;
        const rotateEnd = rotateStart + 180 + Math.random() * 180;
        const colorPalette = [
          "#FFD700",
          "#C41E3A",
          "#0B3D2E",
          "#AF7A0F",
          "#1B5E20",
          "#F8F5EA"
        ];
        const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        return {
          id: index,
          left,
          delay,
          duration,
          color,
          size,
          rotateStart,
          rotateEnd,
        };
      });

      setConfettiPieces(pieces);
      setShowConfetti(true);

      const timeout = setTimeout(() => {
        setShowConfetti(false);
      }, CONFETTI_DURATION_MS + 400);

      return () => clearTimeout(timeout);
    };

    if (isEliminationMode) {
      if (items.length !== 1 || !hasSpins) {
        lastCelebratedIdRef.current = null;
        setShowConfetti(false);
        return;
      }

      const finalItem = items[0];
      if (!finalItem) {
        return;
      }

      const cleanup = triggerConfetti(finalItem.id);
      return cleanup;
    }

    if (!selectedItem) {
      lastCelebratedIdRef.current = null;
      setShowConfetti(false);
      return;
    }

    const cleanup = triggerConfetti(selectedItem.id);
    return cleanup;
  }, [items, hasSpins, isEliminationMode, selectedItem, primeWinSound]);

  const confettiOverlay = showConfetti ? (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {confettiPieces.map((piece) => (
        <span
          key={piece.id}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            width: `${piece.size}px`,
            height: `${piece.size * 2}px`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}ms`,
            '--confetti-rotate-start': `${piece.rotateStart}deg`,
            '--confetti-rotate-end': `${piece.rotateEnd}deg`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  ) : null;

  const spinWheel = useCallback(() => {
    if (items.length === 0 || isAnimating) return;

    if (pointerSoundRef.current) {
      pointerSoundRef.current.pause();
      pointerSoundRef.current.currentTime = 0;
    }
    primePointerSound();
    setIsAnimating(true);
    lastPointerAngleRef.current = null;
    const startRotation = rotation;
    const duration = spinDuration;
    const startTime = Date.now();
    const effectiveDuration = Math.max(duration, 16);
    const speedJitter = 0.9 + Math.random() * 0.2;
    const angularVelocity = BASE_ANGULAR_SPEED_DEG_PER_MS * speedJitter;
    const easeIntegral = 0.75; // ∫easeOutCubic from 0 to 1
    const randomOffset = Math.random() * 360;
    const totalRotation = angularVelocity * effectiveDuration * easeIntegral + randomOffset;
    const finalRotation = startRotation + totalRotation;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const clamped = Math.min(elapsed, effectiveDuration);
      const progress = effectiveDuration > 0 ? clamped / effectiveDuration : 1;
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const targetRotation = startRotation + totalRotation * easeOut;

      setRotation(targetRotation);
      handlePointerTick(targetRotation);

      if (progress < 1) {
        requestAnimationFrame(animate);
        return;
      }

      setIsAnimating(false);
      onSpinComplete(finalRotation);
    };

    requestAnimationFrame(animate);
  }, [items.length, isAnimating, rotation, onSpinComplete, handlePointerTick, primePointerSound, spinDuration]);

  useEffect(() => {
    if (isSpinning && !isAnimating) {
      spinWheel();
    }
  }, [isSpinning, isAnimating, spinWheel]);

  const handleSpinClick = () => {
    const minItems = isEliminationMode ? 2 : 1;
    if (!isAnimating && items.length >= minItems && !selectedItem) {
      primePointerSound();
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

  if (isEliminationMode && items.length === 1) {
    const winner = items[0];
    if (!hasSpins) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <div className="text-2xl mb-4">🎯</div>
          <div className="text-lg font-semibold mb-2">Додайте ще слоти</div>
          <div className="text-sm">Щоб визначити переможця, потрібно щонайменше два слоти</div>
        </div>
      );
    }

    return (
      <div className="relative text-center py-8 text-muted-foreground">
        {confettiOverlay}
        <div className="text-2xl mb-4">🏆</div>
        <div className="text-lg font-semibold mb-2">Переможець!</div>
        <div className="text-sm">Це останній залишився слот</div>
        <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded">
          <div className="text-lg font-bold text-primary">{winner.name}</div>
          <div className="text-sm text-muted-foreground">Вартість: {winner.price.toFixed(2)}</div>
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
    <div className="flex flex-col items-center space-y-6 w-full">
      {confettiOverlay}
      <div
        ref={wheelContainerRef}
        className="relative w-full aspect-square pointer-events-none"
        style={{
          maxWidth: `${wheelBound}px`,
          maxHeight: `${wheelBound}px`
        }}
      >
        <div
          className="w-full h-full rounded-full border-4 border-primary relative overflow-hidden"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isAnimating ? "none" : "transform 0.1s ease-out"
          }}
        >
          <ChartContainer
            config={chartConfig}
            className="[&_.recharts-text]:fill-foreground absolute inset-0 w-full h-full pointer-events-auto"
          >
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={pieOuterRadius}
                innerRadius={0}
                label={({ cx, cy, startAngle, endAngle, name }) => {
                  const RADIAN = Math.PI / 180;
                  const offsetAngle = startAngle + 3;
                  const rotation = -startAngle;
                  
                  // Розраховуємо кут сектора
                  let sectorAngle = endAngle - startAngle;
                  if (sectorAngle < 0) sectorAngle += 360;
                  
                  // Не показуємо текст для дуже маленьких секторів
                  const minAngleForText = 10;
                  if (sectorAngle < minAngleForText) {
                    return null;
                  }
                  
                  // Максимальна довжина тексту (радіальний простір)
                  const innerPadding = Math.max(30, pieOuterRadius * 0.15);
                  const maxTextLength = pieOuterRadius - 100 - innerPadding;
                  
                  // Доступна висота для тексту
                  const availableHeight = pieOuterRadius / 10;
                  
                  // Вимірюємо довжину тексту
                  const canvas = document.createElement('canvas');
                  const context = canvas.getContext('2d');
                  if (!context) return null;
                  
                  // Масштабуємо розмір шрифту залежно від кута сектора
                  const minAngleForFullSize = 60;
                  const sectorSizeMultiplier = sectorAngle >= minAngleForFullSize 
                    ? 1 
                    : Math.max(0.5, sectorAngle / minAngleForFullSize);
                  
                  // Починаємо з базового розміру шрифту
                  let fontSize = labelFontSize * sectorSizeMultiplier;
                  let displayText = name;
                  const minFontSize = 12;
                  let foundFit = false;
                  
                  // Підбираємо розмір шрифту, щоб текст вмістився
                  for (let size = fontSize; size >= minFontSize; size -= 2) {
                    context.font = `800 ${size}px sans-serif`;
                    const textWidth = context.measureText(name).width;
                    
                    if (textWidth <= maxTextLength) {
                      fontSize = size * 1.1;
                      displayText = name;
                      foundFit = true;
                      break;
                    }
                  }
                  
                  // Якщо навіть з мінімальним шрифтом не вміщується, обрізаємо
                  if (!foundFit) {
                    fontSize = minFontSize;
                    context.font = `800 ${fontSize}px sans-serif`;
                    let truncated = name;
                    
                    while (truncated.length > 0) {
                      const testText = truncated.length < name.length ? truncated + '...' : truncated;
                      const textWidth = context.measureText(testText).width;
                      
                      if (textWidth <= maxTextLength) {
                        displayText = testText;
                        break;
                      }
                      
                      truncated = truncated.slice(0, -1);
                    }
                    
                    // Якщо залишилось менше 2 символів (не рахуючи "..."), не показуємо текст
                    if (truncated.length < 2) {
                      return null;
                    }
                  }
                  
                  // Перевіряємо, чи текст вміщується по висоті
                  if (fontSize > availableHeight) {
                    fontSize = Math.max(12, Math.floor(availableHeight));
                  }
                  
                  // Кінець тексту з відступом всередині від краю
                  const textPadding = 20;
                  const radius = pieOuterRadius - textPadding;
                  const x = cx + radius * Math.cos(-offsetAngle * RADIAN);
                  const y = cy + radius * Math.sin(-offsetAngle * RADIAN);
                  
                  return (
                    <text
                      x={x}
                      y={y}
                      fill="white"
                      textAnchor="end"
                      dominantBaseline="middle"
                      fontSize={fontSize}
                      fontWeight="800"
                      transform={`rotate(${rotation}, ${x}, ${y})`}
                      style={{
                        textShadow: '0 0 3px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.8)',
                        paintOrder: 'stroke fill',
                      }}
                    >
                      {displayText}
                      {/* {fontSize.toFixed(2)} */}
                    </text>
                  );
                }}
              >
                {/* <LabelList
                  targetX={pieOuterRadius}
                  targetY={pieOuterRadius}
                  dataKey="name"
                  className="fill-foreground text-sm font-medium"
                  stroke="black"
                  fontSize={labelFontSize}
                  // strokeWidth={2}
                  fontWeight="500"
                  textAnchor="start"
                  dominantBaseline="middle"
                  formatter={(value: string) => value}
                /> */}
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>
        <div
          className="absolute top-0 left-1/2 !z-[99999] pointer-events-none"
          style={{
            transform: `translate(-50%, -${pointerTranslateY}px)`
          }}
        >
          <div className="relative">
            <div
              className="w-0 h-0 border-transparent absolute"
              style={{
                borderLeftWidth: pointerBase / 2 + 4,
                borderRightWidth: pointerBase / 2 + 4,
                borderTopWidth: pointerHeight + 4,
                borderTopColor: "#2C2C2C",
                transform: "translate(-4px, -2px)"
              }}
            />
            <div
              className="w-0 h-0 border-transparent relative z-10"
              style={{
                borderLeftWidth: pointerBase / 2,
                borderRightWidth: pointerBase / 2,
                borderTopWidth: pointerHeight,
                borderTopColor: "hsl(var(--primary))"
              }}
            />
          </div>
        </div>
      </div>
      
      <Button
        onClick={handleSpinClick}
        disabled={isAnimating || items.length < (isEliminationMode ? 2 : 1) || selectedItem !== null}
        size="lg"
        className="text-lg px-8 py-4 w-48 z-[99999]"
      >
        {isAnimating
          ? "Крутиться..."
          : items.length < (isEliminationMode ? 2 : 1)
          ? "Гра завершена"
          : selectedItem
          ? "Очікування..."
          : "Крутити рулетку!"}
      </Button>
      
      <AlertDialog open={selectedItem !== null && isEliminationMode} onOpenChange={(open) => {
        if (!open && onAcknowledgeElimination) {
          onAcknowledgeElimination();
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Результат</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-xl font-bold text-primary">{selectedItem?.name}</p>
                  <p className="text-muted-foreground">Вартість: {selectedItem?.price.toFixed(2)}</p>
                </div>
                <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm text-center">
                  Слот було видалено з рулетки!
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Ок</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedItem && !isEliminationMode && (
        <div className="text-center p-4 bg-card rounded-lg border w-full animate-in slide-in-from-bottom-2 duration-300">
          <h3 className="text-lg font-semibold mb-2">Результат:</h3>
          <p className="text-xl font-bold text-primary">{selectedItem.name}</p>
          <p className="text-muted-foreground">Вартість: {selectedItem.price.toFixed(2)}</p>
          <div className="mt-3 p-2 bg-accent/20 border border-accent/30 rounded text-accent-foreground text-sm">
            Слот залишається в грі!
          </div>
        </div>
      )}

    </div>
  );
}
