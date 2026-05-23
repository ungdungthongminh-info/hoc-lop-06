// Auto-generated from local KHTN learning data. Do not edit counts by hand.
import { khtnLessonCards } from './khtnLessonCards';
import { khtnLessons } from './khtnLessons';
import { khtnQuestions } from './khtnQuestions';

export const khtnSeed = {
  subjectCode: 'khtn',
  subjectTitle: 'Khoa học tự nhiên',
  grade: 6,
  lessons: khtnLessons,
  cards: khtnLessonCards,
  questions: khtnQuestions,
};

export function getActiveKhtnLessons() {
  return khtnLessons
    .filter((lesson) => lesson.isActive === 1)
    .sort((first, second) => first.sortOrder - second.sortOrder);
}

export function getKhtnLessonById(lessonId: number) {
  return khtnLessons.find((lesson) => lesson.id === lessonId && lesson.isActive === 1);
}

export function getKhtnLessonCards(lessonId: number) {
  return khtnLessonCards
    .filter((card) => card.lessonId === lessonId && card.isActive === 1)
    .sort((first, second) => first.sortOrder - second.sortOrder);
}

export function getKhtnLessonQuestions(lessonId: number) {
  return khtnQuestions.filter((question) => question.lessonId === lessonId && question.isActive === 1);
}

export function getKhtnLessonPracticeQuestions(lessonId: number, count = 12) {
  const questions = getKhtnLessonQuestions(lessonId);
  return [...questions]
    .sort((first, second) => {
      const difficultyDiff = difficultyRank(first.difficulty) - difficultyRank(second.difficulty);
      if (difficultyDiff !== 0) return difficultyDiff;
      return first.id - second.id;
    })
    .slice(0, count);
}

function difficultyRank(difficulty: 'easy' | 'medium' | 'hard') {
  return {"easy":1,"medium":2,"hard":3}[difficulty] ?? 2;
}
