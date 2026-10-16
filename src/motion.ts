import { useEffect, useRef, useState } from "react";
import { levelStepSeconds, studentLevel } from "../shared/student-levels";
import type { Classroom } from "./types";

// Input modality changes without a React render, including during a transition.
export function installMotionInput() {
  document.documentElement.dataset.motionInput = "keyboard";
  document.addEventListener(
    "pointerdown",
    () => {
      document.documentElement.dataset.motionInput = "pointer";
    },
    true,
  );
  document.addEventListener(
    "keydown",
    () => {
      document.documentElement.dataset.motionInput = "keyboard";
    },
    true,
  );
}

type Progress = { seconds: number; step: number; level: number };

// Keep the baseline above the study screen: returning to a chapter must not
// replay a celebration. A teacher changing thresholds is not earned progress.
export function useChapterLevelUps(owner: string, classes: Classroom[]) {
  const previous = useRef({ owner, chapters: new Map<string, Progress>() });
  const [celebrating, setCelebrating] = useState<Set<string>>(new Set());
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (previous.current.owner !== owner) {
      previous.current = { owner, chapters: new Map() };
      clearTimeout(timer.current);
      setCelebrating(new Set());
    }
    const next = new Map<string, Progress>();
    const gained = new Set<string>();
    if (owner)
      for (const classroom of classes)
        for (const chapter of classroom.chapters) {
          const key = `${classroom.id}/${chapter.id}`;
          const stage = studentLevel(chapter.seconds, chapter.levelMinutes);
          const current = {
            seconds: stage.seconds,
            level: stage.level,
            step: levelStepSeconds(chapter.levelMinutes),
          };
          const old = previous.current.chapters.get(key);
          if (
            old &&
            current.step === old.step &&
            current.seconds > old.seconds &&
            current.level > old.level
          )
            gained.add(key);
          next.set(key, current);
        }
    previous.current.chapters = next;
    if (gained.size) {
      clearTimeout(timer.current);
      setCelebrating(gained);
      timer.current = setTimeout(() => setCelebrating(new Set()), 280);
    }
  }, [owner, classes]);
  useEffect(() => () => clearTimeout(timer.current), []);
  return celebrating;
}
