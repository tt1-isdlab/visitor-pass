import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const STEPS = ["Visitor Details", "Organization", "Authorization", "Confirmation"];

export function Stepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {STEPS.map((label, i) => {
          const stepIndex = i + 1;
          const isDone = stepIndex < currentStep;
          const isActive = stepIndex === currentStep;
          return (
            <div key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold transition-all",
                    isDone && "border-primary bg-primary text-primary-foreground",
                    isActive &&
                      "border-primary text-primary shadow-[0_0_16px_-2px_rgba(34,211,238,0.6)]",
                    !isDone && !isActive && "border-border text-muted-foreground"
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" /> : stepIndex}
                </div>
                <span
                  className={cn(
                    "hidden text-[11px] font-medium sm:block",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </div>
              {stepIndex !== STEPS.length && (
                <div
                  className={cn(
                    "mx-2 h-px flex-1 transition-colors",
                    isDone ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
