import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Loader2, BookOpen, RotateCcw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PlanSummary {
  id: string;
  title: string;
  description: string;
  category: string;
  totalDays: number;
  isStarted: boolean;
  completedDays: number[];
  isCompleted: boolean;
  startedAt: string | null;
}

interface PlanDay {
  planId: string;
  planTitle: string;
  totalDays: number;
  day: number;
  reference: string;
  prompt: string;
  verseText: string;
}

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="w-full h-1.5 bg-[var(--app-border-soft)] overflow-hidden">
      <div className="h-full transition-all" style={{ width: `${pct}%`, background: "var(--app-green)" }} />
    </div>
  );
}

function PlanCard({ plan, onOpen }: { plan: PlanSummary; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="w-full text-left px-6 py-6 bg-[var(--app-white)] border-b border-[var(--app-border-soft)]"
      data-testid={`card-reading-plan-${plan.id}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--app-green)" }}>{plan.category}</span>
        {plan.isCompleted ? (
          <span className="flex items-center gap-1 text-[10px] font-semibold tracking-[0.1em] uppercase" style={{ color: "var(--app-green)" }}>
            <Check className="w-3 h-3" /> Completed
          </span>
        ) : plan.isStarted ? (
          <span className="text-[10px] font-semibold tracking-[0.1em] uppercase" style={{ color: "var(--app-gray-lt)" }}>
            {plan.completedDays.length}/{plan.totalDays} days
          </span>
        ) : (
          <span className="text-[10px] font-semibold tracking-[0.1em] uppercase" style={{ color: "var(--app-gray-lt)" }}>{plan.totalDays} days</span>
        )}
      </div>
      <p className="font-serif text-[20px] text-[var(--app-dark)] mb-1">{plan.title}</p>
      <p className="text-[13px] text-[var(--app-gray-lt)] leading-relaxed mb-3">{plan.description}</p>
      {plan.isStarted && !plan.isCompleted && <ProgressBar completed={plan.completedDays.length} total={plan.totalDays} />}
    </button>
  );
}

function PlanDetail({ plan, onBack }: { plan: PlanSummary; onBack: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const nextDay = (() => {
    for (let d = 1; d <= plan.totalDays; d++) {
      if (!plan.completedDays.includes(d)) return d;
    }
    return plan.totalDays;
  })();
  const [viewingDay, setViewingDay] = useState(nextDay);

  const { data: dayData, isLoading: dayLoading } = useQuery<PlanDay>({
    queryKey: ["/api/reading-plans", plan.id, "days", viewingDay],
    enabled: plan.isStarted,
  });

  const startMutation = useMutation({
    mutationFn: async () => apiRequest("POST", `/api/reading-plans/${plan.id}/start`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reading-plans"] });
      setViewingDay(1);
    },
    onError: () => toast({ variant: "destructive", title: "Couldn't start plan" }),
  });

  const completeMutation = useMutation({
    mutationFn: async (day: number) => apiRequest("POST", `/api/reading-plans/${plan.id}/days/${day}/complete`),
    onSuccess: (_res, day) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reading-plans"] });
      if (day < plan.totalDays) setViewingDay(day + 1);
    },
    onError: () => toast({ variant: "destructive", title: "Couldn't save progress" }),
  });

  const restartMutation = useMutation({
    mutationFn: async () => apiRequest("POST", `/api/reading-plans/${plan.id}/start`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reading-plans"] });
      setViewingDay(1);
      toast({ title: "Plan restarted" });
    },
  });

  const isDayCompleted = plan.completedDays.includes(viewingDay);

  return (
    <div>
      <div className="px-6 py-6 border-b border-[var(--app-border-soft)]">
        <span className="text-[10px] font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--app-green)" }}>{plan.category}</span>
        <p className="font-serif text-[24px] text-[var(--app-dark)] mt-1 mb-2">{plan.title}</p>
        <p className="text-[13px] text-[var(--app-gray-lt)] leading-relaxed">{plan.description}</p>
      </div>

      {!plan.isStarted ? (
        <div className="px-6 py-8 text-center">
          <BookOpen className="w-8 h-8 mx-auto mb-4" style={{ color: "var(--app-border)" }} />
          <p className="text-[14px] mb-6" style={{ color: "var(--app-gray-lt)" }}>{plan.totalDays} days, one short reading each.</p>
          <button
            onClick={() => startMutation.mutate()}
            disabled={startMutation.isPending}
            className="px-8 py-3 text-[12px] font-semibold tracking-[0.15em] uppercase"
            style={{ background: "var(--cta-bg)", color: "var(--cta-fg)" }}
            data-testid="button-start-plan"
          >
            {startMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Start Plan"}
          </button>
        </div>
      ) : (
        <>
          {/* Day picker */}
          <div className="flex gap-1.5 px-6 py-4 overflow-x-auto border-b border-[var(--app-border-soft)]">
            {Array.from({ length: plan.totalDays }, (_, i) => i + 1).map((d) => {
              const done = plan.completedDays.includes(d);
              const active = d === viewingDay;
              return (
                <button
                  key={d}
                  onClick={() => setViewingDay(d)}
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-[12px] font-semibold border"
                  style={{
                    borderColor: active ? "var(--app-green)" : "var(--app-border)",
                    background: done ? "var(--app-green)" : active ? "var(--app-bg-warm)" : "transparent",
                    color: done ? "#fff" : active ? "var(--app-green)" : "var(--app-gray-lt)",
                  }}
                  data-testid={`button-plan-day-${d}`}
                >
                  {done ? <Check className="w-3.5 h-3.5" /> : d}
                </button>
              );
            })}
          </div>

          {/* Day content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={viewingDay}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="px-6 py-8"
            >
              {dayLoading || !dayData ? (
                <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--app-green)" }} /></div>
              ) : (
                <>
                  <p className="text-[11px] font-semibold tracking-[0.15em] uppercase mb-3" style={{ color: "var(--app-gray-lt)" }}>Day {dayData.day}</p>
                  <button
                    onClick={() => {
                      const match = dayData.reference.match(/(.+)\s+(\d+):(\d+)/);
                      if (match) {
                        const [, bookName, chapter, verse] = match;
                        setLocation(`/bible?book=${encodeURIComponent(bookName)}&chapter=${chapter}&verse=${verse}`);
                      }
                    }}
                    className="text-[14px] font-semibold tracking-wide mb-4 underline underline-offset-4"
                    style={{ color: "var(--app-green)" }}
                    data-testid="button-open-day-reference"
                  >
                    {dayData.reference}
                  </button>
                  {dayData.verseText && (
                    <p className="font-serif italic leading-relaxed text-[var(--app-dark)] mb-6" style={{ fontSize: "calc(19px * var(--reading-scale, 1))" }}>
                      "{dayData.verseText}"
                    </p>
                  )}
                  <div className="border-l-2 pl-4 mb-8" style={{ borderColor: "var(--app-border)" }}>
                    <p className="text-[13px] leading-relaxed" style={{ color: "var(--app-gray)" }}>{dayData.prompt}</p>
                  </div>

                  {isDayCompleted ? (
                    <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide" style={{ color: "var(--app-green)" }}>
                      <Check className="w-4 h-4" /> Marked as read
                    </p>
                  ) : (
                    <button
                      onClick={() => completeMutation.mutate(viewingDay)}
                      disabled={completeMutation.isPending}
                      className="w-full py-3 text-[12px] font-semibold tracking-[0.15em] uppercase"
                      style={{ background: "var(--cta-bg)", color: "var(--cta-fg)" }}
                      data-testid="button-complete-day"
                    >
                      {completeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Mark as Read"}
                    </button>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {plan.isCompleted && (
            <div className="px-6 pb-8 text-center">
              <p className="font-serif text-[18px] text-[var(--app-dark)] mb-4">You've completed this plan.</p>
              <button
                onClick={() => restartMutation.mutate()}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-[11px] font-semibold tracking-[0.15em] uppercase border"
                style={{ borderColor: "var(--app-green)", color: "var(--app-green)" }}
                data-testid="button-restart-plan"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Start Again
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ReadingPlans() {
  const [, setLocation] = useLocation();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ plans: PlanSummary[] }>({
    queryKey: ["/api/reading-plans"],
  });

  const plans = data?.plans || [];
  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || null;

  return (
    <div className="min-h-screen pb-20" style={{ background: "var(--app-bg)" }}>
      <header className="sticky top-0 z-10 flex items-stretch bg-[var(--app-white)] border-b border-[var(--app-border)]">
        <button
          onClick={() => (selectedPlan ? setSelectedPlanId(null) : setLocation("/bible"))}
          className="py-5 px-5 border-r border-[var(--app-border)]"
          style={{ color: "var(--app-gray-lt)" }}
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="flex-1 flex items-center font-serif text-[18px] text-[var(--app-dark)] px-5">
          {selectedPlan ? selectedPlan.title : "Reading Plans"}
        </span>
      </header>

      <main className="max-w-lg mx-auto">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--app-green)" }} /></div>
        ) : selectedPlan ? (
          <PlanDetail plan={selectedPlan} onBack={() => setSelectedPlanId(null)} />
        ) : (
          plans.map((plan) => <PlanCard key={plan.id} plan={plan} onOpen={() => setSelectedPlanId(plan.id)} />)
        )}
      </main>
    </div>
  );
}
