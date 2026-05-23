import { ArrowLeft, Calculator, Layers3 } from 'lucide-react';
import { useState } from 'react';

import {
  getActiveMathLessons,
  getMathLessonById,
  getMathLessonQuestions,
  mathSeed,
} from '../../../data/grade6/toan';
import { MathLessonCard } from '../components/MathLessonCard';
import { MathLessonDetailPage } from './MathLessonDetailPage';
import { MathPracticePage } from './MathPracticePage';

type MathPageView = 'home' | 'detail' | 'practice';

type MathHomePageProps = {
  onBackToDashboard: () => void;
};

export function MathHomePage({ onBackToDashboard }: MathHomePageProps) {
  const lessons = getActiveMathLessons();
  const [view, setView] = useState<MathPageView>('home');
  const [selectedLessonId, setSelectedLessonId] = useState(lessons[0]?.id ?? 1);
  const selectedLesson = getMathLessonById(selectedLessonId) ?? lessons[0];

  if (view === 'detail' && selectedLesson) {
    return (
      <MathLessonDetailPage
        lesson={selectedLesson}
        onBack={() => setView('home')}
        onPractice={(lessonId) => {
          setSelectedLessonId(lessonId);
          setView('practice');
        }}
      />
    );
  }

  if (view === 'practice' && selectedLesson) {
    return (
      <MathPracticePage
        lesson={selectedLesson}
        onBackToLesson={(lessonId) => {
          setSelectedLessonId(lessonId);
          setView('detail');
        }}
      />
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl min-w-0 px-4 py-8 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onBackToDashboard}
        className="mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </button>

      <div className="w-full max-w-full min-w-0 rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-emerald-50 p-5">
        <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <Calculator className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-blue-700">Môn học đã mở</p>
              <h1 className="mt-1 text-3xl font-black text-slate-950 [overflow-wrap:anywhere]">{mathSeed.subjectTitle}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
                Hệ thống bài toán chuẩn có bài học, thẻ nội dung và kho câu hỏi lớn. Mỗi lượt luyện tập chọn ngẫu nhiên một nhóm câu ngắn để em học vừa sức.
              </p>
            </div>
          </div>
          <div className="max-w-full min-w-0 rounded-2xl bg-white/80 px-4 py-3 text-sm font-bold text-slate-700 ring-1 ring-blue-100 [overflow-wrap:anywhere]">
            {lessons.length} bài - {mathSeed.questions.length} câu hỏi
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-4 flex items-center gap-2">
          <Layers3 className="h-5 w-5 text-blue-700" />
          <h2 className="text-xl font-black text-slate-950 [overflow-wrap:anywhere]">Lộ trình: {mathSeed.subjectTitle}</h2>
        </div>
        <div className="grid min-w-0 gap-4 md:grid-cols-[repeat(2,minmax(0,1fr))]">
          {lessons.map((lesson) => (
            <MathLessonCard
              key={lesson.id}
              lesson={lesson}
              questionCount={getMathLessonQuestions(lesson.id).length}
              onSelect={(lessonId) => {
                setSelectedLessonId(lessonId);
                setView('detail');
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
