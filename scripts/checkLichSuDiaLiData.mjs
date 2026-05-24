import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const dataDir = path.join(root, 'src/data/grade6/lich-su-dia-li');
function readArray(fileName, exportName) { const content = fs.readFileSync(path.join(dataDir, fileName), 'utf8'); const match = content.match(new RegExp(`export const ${exportName}: [^=]+ = ([\\s\\S]*);\\s*$`)); if (!match) throw new Error(`Cannot read ${exportName}`); return JSON.parse(match[1]); }
const lessons = readArray('lichSuDiaLiLessons.ts', 'lichSuDiaLiLessons');
const cards = readArray('lichSuDiaLiLessonCards.ts', 'lichSuDiaLiLessonCards');
const questions = readArray('lichSuDiaLiQuestions.ts', 'lichSuDiaLiQuestions');
const lessonIds = new Set(lessons.map((lesson) => lesson.id));
const errors = [];
const internal = /dot-02|dot2|app-ready|app_ready|demo|demon|MVP|bundle|chunk|preset/i;
const dupIds = lessons.map((l) => l.id).filter((id, i, ids) => ids.indexOf(id) !== i);
const dupSlugs = lessons.map((l) => l.slug).filter((slug, i, slugs) => slugs.indexOf(slug) !== i);
if (dupIds.length) errors.push(`Duplicate lesson ids: ${dupIds.join(', ')}`);
if (dupSlugs.length) errors.push(`Duplicate slugs: ${dupSlugs.join(', ')}`);
for (const lesson of lessons) { if (!['lich_su','dia_li'].includes(lesson.subjectPart)) errors.push(`Lesson ${lesson.id} invalid subjectPart ${lesson.subjectPart}`); if (!String(lesson.title || '').trim()) errors.push(`Lesson ${lesson.id} empty title`); if (internal.test(JSON.stringify(lesson))) errors.push(`Internal text found in lesson ${lesson.id}`); }
for (const card of cards) { if (!lessonIds.has(card.lessonId)) errors.push(`Card ${card.id} missing lesson ${card.lessonId}`); if (!String(card.content || '').trim()) errors.push(`Card ${card.id} empty content`); if (internal.test(JSON.stringify(card))) errors.push(`Internal text found in card ${card.id}`); }
for (const question of questions) { if (!lessonIds.has(question.lessonId)) errors.push(`Question ${question.id} missing lesson ${question.lessonId}`); if (!String(question.correctAnswer || '').trim()) errors.push(`Question ${question.id} empty correctAnswer`); if (!String(question.answerText || '').trim()) errors.push(`Question ${question.id} empty answerText`); if (!String(question.explanationSimple || '').trim()) errors.push(`Question ${question.id} empty explanation`); if (question.options?.length && !question.options.some((option) => option.key === question.correctAnswer)) errors.push(`Question ${question.id} correctAnswer mismatch`); if (internal.test(JSON.stringify(question))) errors.push(`Internal text found in question ${question.id}`); }
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(JSON.stringify({ lessons: lessons.length, cards: cards.length, questions: questions.length, ok: true }, null, 2));
