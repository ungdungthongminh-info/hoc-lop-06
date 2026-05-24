// Auto-generated from local Lịch sử & Địa lí learning data. Do not edit counts by hand.
import { lichSuDiaLiLessonCards } from './lichSuDiaLiLessonCards';
import { lichSuDiaLiLessons } from './lichSuDiaLiLessons';
import { lichSuDiaLiQuestions } from './lichSuDiaLiQuestions';
export const lichSuDiaLiSeed = { subjectCode: 'lich-su-dia-li', subjectTitle: 'Lịch sử & Địa lí', grade: 6, lessons: lichSuDiaLiLessons, cards: lichSuDiaLiLessonCards, questions: lichSuDiaLiQuestions };
export function getActiveLichSuDiaLiLessons() { return lichSuDiaLiLessons.filter((lesson) => lesson.isActive === 1).sort((a,b) => a.sortOrder - b.sortOrder); }
export function getLichSuDiaLiLessonById(lessonId: number) { return lichSuDiaLiLessons.find((lesson) => lesson.id === lessonId && lesson.isActive === 1); }
export function getLichSuDiaLiLessonCards(lessonId: number) { return lichSuDiaLiLessonCards.filter((card) => card.lessonId === lessonId && card.isActive === 1).sort((a,b) => a.sortOrder - b.sortOrder); }
export function getLichSuDiaLiLessonQuestions(lessonId: number) { return lichSuDiaLiQuestions.filter((question) => question.lessonId === lessonId && question.isActive === 1); }
export function getLichSuDiaLiLessonPracticeQuestions(lessonId: number, count = 12) { return [...getLichSuDiaLiLessonQuestions(lessonId)].sort((a,b) => { const diff = rank(a.difficulty) - rank(b.difficulty); return diff || a.id - b.id; }).slice(0, count); }
function rank(difficulty: 'easy'|'medium'|'hard') { return ({ easy: 1, medium: 2, hard: 3 })[difficulty] ?? 2; }
