"use client";

import { useCallback, useEffect, useState } from "react";
import { useApp } from "./store";
import { subjectIdByName } from "./curriculum";
import { listSubjectChapters, type SubjectChapter } from "./tests/build";

// The subject the student is looking at. If a screen was opened with the name
// but not the id (a card tapped before the subject list loaded), the id is
// looked up from the name and saved back into the store.
export function useSelectedSubject(): {
  subjectId: string | null;
  subjectName: string;
  lookupFailed: boolean;
  retryLookup: () => void;
} {
  const { s, patch } = useApp();
  const { selectedSubjectId, selectedSubjectName } = s;
  const [lookupFailed, setLookupFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (selectedSubjectId || !selectedSubjectName) return;
    let active = true;
    setLookupFailed(false);
    subjectIdByName(selectedSubjectName).then((id) => {
      if (!active) return;
      if (id) patch({ selectedSubjectId: id });
      else setLookupFailed(true);
    });
    return () => {
      active = false;
    };
  }, [selectedSubjectId, selectedSubjectName, patch, attempt]);

  const retryLookup = useCallback(() => setAttempt((n) => n + 1), []);
  return {
    subjectId: selectedSubjectId,
    subjectName: selectedSubjectName ?? "Subject",
    lookupFailed: lookupFailed && !selectedSubjectId,
    retryLookup,
  };
}

export type ChaptersStatus = "loading" | "ready" | "error";

// A subject's chapters with their question counts, plus whether they are
// still loading or failed — so the picker never shows a false "0 questions".
// Every offered subject has chapters, so an empty answer is treated as a
// failed load and offered a retry.
export function useSubjectChapters(subjectId: string | null): {
  chapters: SubjectChapter[];
  status: ChaptersStatus;
  retry: () => void;
} {
  const [chapters, setChapters] = useState<SubjectChapter[]>([]);
  const [status, setStatus] = useState<ChaptersStatus>("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!subjectId) {
      setStatus("loading");
      return;
    }
    let active = true;
    setStatus("loading");
    listSubjectChapters(subjectId)
      .then((rows) => {
        if (!active) return;
        setChapters(rows);
        setStatus(rows.length > 0 ? "ready" : "error");
      })
      .catch(() => active && setStatus("error"));
    return () => {
      active = false;
    };
  }, [subjectId, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { chapters, status, retry };
}
