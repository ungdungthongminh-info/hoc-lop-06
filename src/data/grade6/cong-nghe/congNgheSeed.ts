import { congNgheLessonCards } from './congNgheLessonCards';
import { congNgheLessons } from './congNgheLessons';
import { congNgheQuestions } from './congNgheQuestions';
import type { CongNgheDifficulty, CongNghePracticeQuestionCountChoice, CongNghePracticeQuestionCountOption } from './congNgheTypes';

export const DEFAULT_CONG_NGHE_PRACTICE_QUESTION_COUNT: CongNghePracticeQuestionCountOption = 12;

export const CONG_NGHE_PRACTICE_QUESTION_COUNT_OPTIONS: CongNghePracticeQuestionCountChoice[] = [
  { value: 10, title: 'Luy?n nhanh', label: '10 c?u', description: '?n nhanh kh?i ni?m, an to?n v? thao t?c ch?nh.' },
  { value: 12, title: 'Ti?u chu?n', label: '12 c?u', description: 'C?n b?ng gi?a ki?n th?c, t?nh hu?ng v? v?n d?ng.' },
  { value: 20, title: 'Luy?n s?u', label: '20 c?u', description: 'Luy?n nhi?u c?u h?n ?? ch?c b?i v? nh? quy tr?nh.' },
  { value: 40, title: 'Th? th?ch ?? b?i', label: '40 c?u', description: 'L?m to?n b? ng?n h?ng c?u h?i c?a b?i n?y.' },
];

const samplingPolicy: Record<Exclude<CongNghePracticeQuestionCountOption, 40>, Record<CongNgheDifficulty, number>> = {
  10: { easy: 4, medium: 4, hard: 2 },
  12: { easy: 5, medium: 5, hard: 2 },
  20: { easy: 6, medium: 10, hard: 4 },
};

export const congNgheSeed = {
  subjectCode: 'cong-nghe',
  subjectTitle: 'C?ng ngh?',
  grade: 6,
  lessons: congNgheLessons,
  cards: congNgheLessonCards,
  questions: congNgheQuestions,
};

export function getActiveCongNgheLessons() {
  return congNgheLessons
    .filter((lesson) => lesson.isActive === 1)
    .sort((first, second) => first.sortOrder - second.sortOrder);
}

export function getCongNgheLessonById(lessonId: number) {
  return congNgheLessons.find((lesson) => lesson.id === lessonId && lesson.isActive === 1);
}

export function getCongNgheLessonCards(lessonId: number) {
  return congNgheLessonCards
    .filter((card) => card.lessonId === lessonId && card.isActive === 1)
    .sort((first, second) => first.sortOrder - second.sortOrder);
}

export function getCongNgheLessonQuestions(lessonId: number) {
  return congNgheQuestions.filter((question) => question.lessonId === lessonId && question.isActive === 1);
}

export function isCongNghePracticeQuestionCountOption(value: number): value is CongNghePracticeQuestionCountOption {
  return CONG_NGHE_PRACTICE_QUESTION_COUNT_OPTIONS.some((option) => option.value === value);
}

function shuffleItems<T>(items: T[]) {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const current = next[index];
    next[index] = next[randomIndex];
    next[randomIndex] = current;
  }

  return next;
}

export function getCongNgheLessonPracticeQuestions(
  lessonId: number,
  targetCount: CongNghePracticeQuestionCountOption = DEFAULT_CONG_NGHE_PRACTICE_QUESTION_COUNT,
) {
  const questions = getCongNgheLessonQuestions(lessonId);

  if (targetCount === 40) {
    return shuffleItems(questions);
  }

  const policy = samplingPolicy[targetCount];
  const selected = (['hard', 'easy', 'medium'] as const).flatMap((difficulty) => {
    return shuffleItems(questions.filter((question) => question.difficulty === difficulty)).slice(0, policy[difficulty]);
  });
  const selectedIds = new Set(selected.map((question) => question.id));
  const fallback = shuffleItems(questions.filter((question) => !selectedIds.has(question.id))).slice(
    0,
    Math.max(0, targetCount - selected.length),
  );

  return shuffleItems([...selected, ...fallback]).slice(0, targetCount);
}
