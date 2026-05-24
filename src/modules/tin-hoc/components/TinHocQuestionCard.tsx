import { CheckCircle2, Eye, XCircle } from 'lucide-react';
import type { TinHocQuestion } from '../../../data/grade6/tin-hoc';

type Props = {
  question: TinHocQuestion;
  selectedAnswer?: string;
  questionIndex: number;
  totalQuestions: number;
  onAnswer: (answer: string) => void;
};

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '').replace(/[.?!]+$/g, '');
}

function isCorrect(question: TinHocQuestion, answer: string) {
  if (question.questionType === 'fill_text' || question.questionType === 'order_steps') return true;
  return normalize(answer) === normalize(question.correctAnswer) || normalize(answer) === normalize(question.answerText);
}

function difficultyLabel(difficulty: TinHocQuestion['difficulty']) {
  if (difficulty === 'easy') return 'Cơ bản';
  if (difficulty === 'medium') return 'Vừa sức';
  return 'Thử thách';
}

export function TinHocQuestionCard({ question, selectedAnswer, questionIndex, totalQuestions, onAnswer }: Props) {
  const answered = Boolean(selectedAnswer);
  const correct = selectedAnswer ? isCorrect(question, selectedAnswer) : false;
  const isOpenAnswer = question.questionType === 'fill_text' || question.questionType === 'order_steps';

  return (
    <article className="w-full max-w-full min-w-0 rounded-3xl border border-cyan-100 bg-white p-5 shadow-sm">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-700">Câu {questionIndex + 1}/{totalQuestions}</p>
          <h2 className="mt-2 text-xl font-black leading-snug text-slate-950 [overflow-wrap:anywhere]">{question.questionText}</h2>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{difficultyLabel(question.difficulty)}</span>
      </div>

      {question.options?.length ? (
        <div className="mt-5 grid min-w-0 gap-3">
          {question.options.map((option) => {
            const selected = selectedAnswer === option.key;
            const right = question.correctAnswer === option.key;
            const showRight = answered && right;
            const showWrong = answered && selected && !right;

            return (
              <button
                key={option.key}
                type="button"
                disabled={answered}
                onClick={() => onAnswer(option.key)}
                className={`flex w-full min-w-0 items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                  showRight
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : showWrong
                      ? 'border-rose-300 bg-rose-50 text-rose-800'
                      : selected
                        ? 'border-cyan-300 bg-cyan-50 text-cyan-800'
                        : 'border-slate-200 text-slate-700 hover:border-cyan-200 hover:bg-cyan-50'
                } ${answered ? 'cursor-default' : ''}`}
              >
                <span className="min-w-0 flex-1 [overflow-wrap:anywhere]"><strong>{option.key}.</strong> {option.text}</span>
                {showRight ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : null}
                {showWrong ? <XCircle className="h-5 w-5 shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-5">
          <button
            type="button"
            disabled={answered}
            onClick={() => onAnswer(question.answerText)}
            className="inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 sm:w-auto"
          >
            <Eye className="h-4 w-4" />
            {isOpenAnswer ? 'Xem gợi ý' : 'Trả lời'}
          </button>
        </div>
      )}

      {answered ? (
        <div className={`mt-5 min-w-0 rounded-2xl p-4 text-sm [overflow-wrap:anywhere] ${correct ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
          <p className="flex min-w-0 items-center gap-2 font-black">
            {correct ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <XCircle className="h-5 w-5 shrink-0" />}
            {isOpenAnswer ? 'Gợi ý tham khảo' : correct ? 'Chính xác!' : 'Chưa đúng rồi.'}
          </p>
          <p className="mt-2 font-semibold">Đáp án/gợi ý: {question.answerText}</p>
          <p className="mt-2 leading-6">{question.explanationSimple}</p>
        </div>
      ) : null}
    </article>
  );
}
