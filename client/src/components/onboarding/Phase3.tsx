import { useState } from "react";
import { motion } from "framer-motion";
import { useOnboarding } from "@/context/OnboardingContext";
import { OptionCard } from "./OptionCard";
import { ContinueButton } from "./ContinueButton";
import { BackButton } from "./BackButton";

interface Phase3Props {
  onNext: () => void;
  onBack: () => void;
}

const dailyRhythmOptions = [
  { id: "mornings_chaos", text: "Mornings are chaos, rushing from the moment I wake up" },
  { id: "quiet_time_unused", text: "I have pockets of quiet time but don't know how to use them" },
  { id: "mind_races_night", text: "My mind races at night when things finally slow down" },
  { id: "constantly_interrupted", text: "I'm constantly interrupted, kids, work, notifications" },
  { id: "exhausted", text: "I have time but feel too exhausted to focus on anything deep" },
  { id: "unpredictable", text: "My schedule is completely unpredictable week to week" },
  { id: "guilty", text: "I feel guilty for not making time even when I have it" },
];

const pastConnectionOptions = [
  { id: "nature", text: "I was in nature, walking, hiking, or just outside" },
  { id: "music", text: "I was listening to worship music or singing" },
  { id: "reading", text: "I was reading the Bible or a devotional that spoke to me" },
  { id: "group", text: "I was in a group, small group, church, or with friends" },
  { id: "serving", text: "I was serving others or helping someone" },
  { id: "quiet_alone", text: "I was in a quiet moment alone, journaling, praying, reflecting" },
  { id: "difficult_season", text: "It was during a difficult season when I had to lean on God" },
  { id: "church_event", text: "I was in church during a service or special event" },
  { id: "cant_remember", text: "I can't remember a time I felt that way" },
];

const recencyOptions = [
  { id: "past_month", text: "Within the past month" },
  { id: "few_months", text: "A few months ago" },
  { id: "year_ago", text: "About a year ago" },
  { id: "several_years", text: "Several years ago" },
  { id: "lifetime_ago", text: "It feels like a lifetime ago" },
];

const energyTimeOptions = [
  { id: "early_morning", text: "Early morning before the day starts" },
  { id: "mid_morning", text: "Mid-morning after I've settled into the day" },
  { id: "lunch", text: "Lunch break or midday pause" },
  { id: "late_afternoon", text: "Late afternoon when things wind down" },
  { id: "evening", text: "Evening after dinner" },
  { id: "late_night", text: "Late night when everyone else is asleep" },
  { id: "weekends", text: "Weekends only" },
  { id: "no_good_time", text: "Honestly, I don't really have any good time" },
];

const obstaclesOptions = [
  { id: "lose_momentum", text: "I start strong but lose momentum after a week or two" },
  { id: "doing_wrong", text: "I feel like I'm doing it 'wrong' and give up" },
  { id: "busy", text: "Life gets busy and faith becomes last priority" },
  { id: "overwhelmed_shoulds", text: "I get overwhelmed by all the things I 'should' be doing" },
  { id: "too_broken", text: "I feel too broken, unworthy, or behind to even try" },
  { id: "no_one_talk", text: "I don't have anyone to talk to about it or check in with" },
  { id: "compare_others", text: "I compare myself to others and feel like I'll never measure up" },
  { id: "no_results", text: "I don't see results quickly enough and lose motivation" },
  { id: "forget", text: "I forget or just don't prioritize it" },
];

export function Phase3({ onNext, onBack }: Phase3Props) {
  const { updateOnboarding } = useOnboarding();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    dailyRhythm: [] as string[],
    pastConnectionMoment: null as string | null,
    connectionRecency: null as string | null,
    peakEnergyTime: null as string | null,
    obstacles: [] as string[],
  });

  const handleMultiSelect = (field: "dailyRhythm" | "obstacles", optionId: string, maxSelections = 3) => {
    setAnswers((prev) => ({
      ...prev,
      [field]: prev[field].includes(optionId)
        ? prev[field].filter((id) => id !== optionId)
        : prev[field].length < maxSelections
        ? [...prev[field], optionId]
        : prev[field],
    }));
  };

  const handleSingleSelect = (field: "pastConnectionMoment" | "connectionRecency" | "peakEnergyTime", optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [field]: optionId,
    }));
  };

  const handleNext = () => {
    if (step === 1 && answers.dailyRhythm.length > 0) {
      setStep(2);
    } else if (step === 2 && answers.pastConnectionMoment) {
      if (answers.pastConnectionMoment === "cant_remember") {
        setStep(4);
      } else {
        setStep(3);
      }
    } else if (step === 3 && answers.connectionRecency) {
      setStep(4);
    } else if (step === 4 && answers.peakEnergyTime) {
      setStep(5);
    } else if (step === 5 && answers.obstacles.length > 0) {
      updateOnboarding({
        behavioralReality: {
          dailyRhythm: answers.dailyRhythm,
          pastConnectionMoment: answers.pastConnectionMoment,
          connectionRecency: answers.connectionRecency,
          peakEnergyTime: answers.peakEnergyTime,
          obstacles: answers.obstacles,
        },
      });
      onNext();
    }
  };

  const handleBack = () => {
    if (step === 1) {
      onBack();
    } else if (step === 4 && answers.pastConnectionMoment === "cant_remember") {
      setStep(2);
    } else {
      setStep(step - 1);
    }
  };

  const canContinue =
    (step === 1 && answers.dailyRhythm.length > 0) ||
    (step === 2 && answers.pastConnectionMoment) ||
    (step === 3 && answers.connectionRecency) ||
    (step === 4 && answers.peakEnergyTime) ||
    (step === 5 && answers.obstacles.length > 0);

  const stepContent = [
    {
      title: "Let's talk about your daily rhythm. What does a typical day look like?",
      subtitle: "Select all that apply",
    },
    {
      title: "Think back to a time when you felt closest to God or most at peace. What was happening?",
      subtitle: null,
    },
    {
      title: "How long ago was that?",
      subtitle: null,
    },
    {
      title: "When do you have the most mental space or energy for something meaningful?",
      subtitle: null,
    },
    {
      title: "What usually stops you from sticking with spiritual practices?",
      subtitle: "Pick your top 2-3",
    },
  ];

  const currentContent = stepContent[step - 1];

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <BackButton onClick={handleBack} />

      <motion.div 
        className="space-y-3"
        key={step}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground leading-tight">
          {currentContent.title}
        </h1>
        {currentContent.subtitle && (
          <p className="text-muted-foreground">{currentContent.subtitle}</p>
        )}
      </motion.div>

      <div className="space-y-3">
        {step === 1 && dailyRhythmOptions.map((option, index) => (
          <OptionCard
            key={option.id}
            id={option.id}
            text={option.text}
            selected={answers.dailyRhythm.includes(option.id)}
            onClick={() => handleMultiSelect("dailyRhythm", option.id, 7)}
            index={index}
          />
        ))}

        {step === 2 && pastConnectionOptions.map((option, index) => (
          <OptionCard
            key={option.id}
            id={option.id}
            text={option.text}
            selected={answers.pastConnectionMoment === option.id}
            onClick={() => handleSingleSelect("pastConnectionMoment", option.id)}
            index={index}
          />
        ))}

        {step === 3 && recencyOptions.map((option, index) => (
          <OptionCard
            key={option.id}
            id={option.id}
            text={option.text}
            selected={answers.connectionRecency === option.id}
            onClick={() => handleSingleSelect("connectionRecency", option.id)}
            index={index}
          />
        ))}

        {step === 4 && energyTimeOptions.map((option, index) => (
          <OptionCard
            key={option.id}
            id={option.id}
            text={option.text}
            selected={answers.peakEnergyTime === option.id}
            onClick={() => handleSingleSelect("peakEnergyTime", option.id)}
            index={index}
          />
        ))}

        {step === 5 && obstaclesOptions.map((option, index) => (
          <OptionCard
            key={option.id}
            id={option.id}
            text={option.text}
            selected={answers.obstacles.includes(option.id)}
            onClick={() => handleMultiSelect("obstacles", option.id, 3)}
            index={index}
          />
        ))}
      </div>

      <ContinueButton onClick={handleNext} disabled={!canContinue} />
    </motion.div>
  );
}
