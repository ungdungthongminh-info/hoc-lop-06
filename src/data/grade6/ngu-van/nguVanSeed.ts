// Auto-generated from local Ngữ văn learning data. Do not edit counts by hand.
import { nguVanLessonCards } from './nguVanLessonCards';
import { nguVanLessons } from './nguVanLessons';
import { nguVanQuestions } from './nguVanQuestions';

export const nguVanSeed = { subjectCode: 'ngu-van', subjectTitle: 'Ngữ văn', grade: 6, lessons: nguVanLessons, cards: nguVanLessonCards, questions: nguVanQuestions };
export function getActiveNguVanLessons() { return nguVanLessons.filter((lesson) => lesson.isActive === 1).sort((a, b) => a.sortOrder - b.sortOrder); }
export function getNguVanLessonById(lessonId: number) { return nguVanLessons.find((lesson) => lesson.id === lessonId && lesson.isActive === 1); }
export function getNguVanLessonCards(lessonId: number) { return nguVanLessonCards.filter((card) => card.lessonId === lessonId && card.isActive === 1).sort((a, b) => a.sortOrder - b.sortOrder); }
export function getNguVanLessonQuestions(lessonId: number) { return nguVanQuestions.filter((question) => question.lessonId === lessonId && question.isActive === 1); }
export function getNguVanLessonPracticeQuestions(lessonId: number, count = 12) {
  return [...getNguVanLessonQuestions(lessonId)].sort((a, b) => {
    const difficultyDiff = difficultyRank(a.difficulty) - difficultyRank(b.difficulty);
    if (difficultyDiff !== 0) return difficultyDiff;
    return a.id - b.id;
  }).slice(0, count);
}
function difficultyRank(difficulty: 'easy' | 'medium' | 'hard') { return {"easy":1,"medium":2,"hard":3}[difficulty] ?? 2; }
