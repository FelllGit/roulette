import {
  closeWindow,
  maximizeWindow,
  minimizeWindow,
} from "@/helpers/window_helpers";
import { isMacOS } from "@/utils/platform";
import React, { type ReactNode } from "react";
import ToggleTheme from "./ToggleTheme";
import { Button } from "@/components/ui/button";
import { SPIN_DURATION_OPTIONS, WeightMode } from "@/utils/roulette-utils";

interface DragWindowRegionProps {
  title?: ReactNode;
  weightMode?: WeightMode;
  isEliminationMode?: boolean;
  onToggleWeightMode?: () => void;
  onToggleEliminationMode?: () => void;
  spinDuration?: number;
  onSpinDurationChange?: (value: number) => void;
}

export default function DragWindowRegion({
  title,
  weightMode = "reversed",
  isEliminationMode = true,
  onToggleWeightMode,
  onToggleEliminationMode,
  spinDuration,
  onSpinDurationChange,
}: DragWindowRegionProps) {
  return (
    <div className="flex w-screen items-stretch justify-between">
      <div className="draglayer w-full">
        <div className="flex justify-between items-center p-4 border-b">
          <h1 className="text-2xl font-bold">{title}</h1>
          <div className="flex items-center gap-2 no-drag">
            {onSpinDurationChange && typeof spinDuration === "number" && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Тривалість
                </span>
                <div className="flex">
                  {SPIN_DURATION_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      size="sm"
                      className="rounded-none first:rounded-l-md last:rounded-r-md"
                      variant={spinDuration === option.value ? "default" : "outline"}
                      onClick={() => onSpinDurationChange(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {onToggleWeightMode && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onToggleWeightMode}
              >
                {weightMode === "reversed" ? "Зворотня вага" : "Нормальна вага"}
              </Button>
            )}
            {onToggleEliminationMode && (
              <Button
                type="button"
                size="sm"
                variant={isEliminationMode ? "default" : "outline"}
                onClick={onToggleEliminationMode}
              >
                {isEliminationMode ? "Режим вибування" : "Без вибування"}
              </Button>
            )}
            <ToggleTheme />
            {!isMacOS() && <WindowButtons />}
          </div>
        </div>
      </div>
        {isMacOS() && (
          <div className="flex flex-1 p-2">
            {/* Maintain the same height but do not display content */}
          </div>
        )}
    </div>
  );
}

function WindowButtons() {
  return (
    <div className="flex">
      <button
        title="Minimize"
        type="button"
        className="p-2 transition-colors hover:bg-accent/30"
        onClick={minimizeWindow}
      >
        <svg
          aria-hidden="true"
          role="img"
          width="12"
          height="12"
          viewBox="0 0 12 12"
        >
          <rect fill="currentColor" width="10" height="1" x="1" y="6"></rect>
        </svg>
      </button>
      <button
        title="Maximize"
        type="button"
        className="p-2 transition-colors hover:bg-accent/30"
        onClick={maximizeWindow}
      >
        <svg
          aria-hidden="true"
          role="img"
          width="12"
          height="12"
          viewBox="0 0 12 12"
        >
          <rect
            width="9"
            height="9"
            x="1.5"
            y="1.5"
            fill="none"
            stroke="currentColor"
          ></rect>
        </svg>
      </button>
      <button
        type="button"
        title="Close"
        className="p-2 transition-colors hover:bg-secondary/40"
        onClick={closeWindow}
      >
        <svg
          aria-hidden="true"
          role="img"
          width="12"
          height="12"
          viewBox="0 0 12 12"
        >
          <polygon
            fill="currentColor"
            fillRule="evenodd"
            points="11 1.576 6.583 6 11 10.424 10.424 11 6 6.583 1.576 11 1 10.424 5.417 6 1 1.576 1.576 1 6 5.417 10.424 1"
          ></polygon>
        </svg>
      </button>
    </div>
  );
}
