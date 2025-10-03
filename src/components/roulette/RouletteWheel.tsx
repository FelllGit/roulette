import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { RouletteItem } from "@/types/roulette";
import { Button } from "@/components/ui/button";
import { LabelList, Pie, PieChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { CASINO_COLORS } from "@/utils/roulette-utils";
import pointerTickSoundSrc from "@/assets/sounds/pointer-tick.mp3";
import winChimeSoundSrc from "@/assets/sounds/win-chime.mp3";

const POINTER_SOUND_SRC = pointerTickSoundSrc;
const WIN_SOUND_SRC = winChimeSoundSrc;
const POINTER_OFFSET_DEGREES = 90;
const CONFETTI_PIECES = 80;
const CONFETTI_DURATION_MS = 1800;
const SPEED_MULTIPLIER = 4;
const BASE_ANGULAR_SPEED_DEG_PER_MS = (SPEED_MULTIPLIER * 360) / 1000;

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

  const effectiveWheelSize = Math.max(240, wheelSize);
  const pointerBase = Math.max(28, effectiveWheelSize * 0.06);
  const pointerHeight = Math.max(48, effectiveWheelSize * 0.12);
  const pointerTranslateY = pointerHeight * 0.55;
  const pieOuterRadius = Math.max(0, effectiveWheelSize / 2 - 16);
  const labelFontSize = Math.max(12, Math.round(effectiveWheelSize * 0.024));


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
        className="relative w-full max-w-[680px] aspect-square"
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
            className="[&_.recharts-text]:fill-foreground absolute inset-0 w-full h-full"
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
                outerRadius={pieOuterRadius}
                innerRadius={0}
              >
                <LabelList
                  dataKey="name"
                  className="fill-foreground text-sm font-medium"
                  stroke="none"
                  fontSize={labelFontSize}
                  formatter={(value: string) => value}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>
        <div
          className="absolute top-0 left-1/2 z-50"
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
        className="text-lg px-8 py-4 w-48"
      >
        {isAnimating
          ? "Крутиться..."
          : items.length < (isEliminationMode ? 2 : 1)
          ? "Гра завершена"
          : selectedItem
          ? "Очікування..."
          : "Крутити рулетку!"}
      </Button>
      
      {selectedItem && (
        <div className="text-center p-4 bg-card rounded-lg border w-full animate-in slide-in-from-bottom-2 duration-300">
          <h3 className="text-lg font-semibold mb-2">Результат:</h3>
          <p className="text-xl font-bold text-primary">{selectedItem.name}</p>
          <p className="text-muted-foreground">Вартість: {selectedItem.price.toFixed(2)}</p>
          {isEliminationMode ? (
            <>
              <div className="mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
                Слот було видалено з рулетки!
              </div>
              {isEliminationMode && items.length === 1 && (
                <div className="mt-3 p-2 bg-primary/10 border border-primary/20 rounded text-primary text-sm">
                  Це буде останній слот!
                </div>
              )}
              {onAcknowledgeElimination && (
                <Button
                  onClick={onAcknowledgeElimination}
                  className="mt-4"
                  size="default"
                >
                  Ок
                </Button>
              )}
            </>
          ) : (
            <div className="mt-3 p-2 bg-accent/20 border border-accent/30 rounded text-accent-foreground text-sm">
              Слот залишається в грі!
            </div>
          )}
        </div>
      )}

    </div>
  );
}
