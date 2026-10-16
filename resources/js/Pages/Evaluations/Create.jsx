import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

export default function CreateEvaluation({ criteria = [], scale = {}, existing = {} }) {
    const { data, setData, post, processing, errors } = useForm({
        scores: Object.fromEntries(criteria.map(c => [c.key, existing[c.key]?.score ?? ''])),
        comments: Object.fromEntries(criteria.map(c => [c.key, existing[c.key]?.comment ?? ''])),
    });

    const levels = [5, 4, 3, 2, 1];
    const isUpdate = Object.keys(existing).length > 0;

    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-foreground">Evaluate ReliefNet</h1>}>
            <Head title="Evaluate System" />

            <form onSubmit={e => { e.preventDefault(); post('/evaluations'); }} className="max-w-3xl mx-auto space-y-4">
                <div className="bg-card rounded-xl border border-border p-5 text-sm text-muted-foreground">
                    Rate how strongly you agree with each statement, from <strong>5 – Strongly Agree</strong> to <strong>1 – Strongly Disagree</strong>.
                    Your answers are used for the system evaluation and are reported anonymously.
                    {isUpdate && <span className="block mt-1 text-primary">You have already responded; submitting again updates your answers.</span>}
                </div>

                {criteria.map((c, index) => (
                    <fieldset key={c.key} className="bg-card rounded-xl border border-border p-5 space-y-3">
                        <legend className="sr-only">{c.label}</legend>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{index + 1}. {c.label}</p>
                            <p className="text-sm text-foreground mt-1">{c.statement}</p>
                        </div>
                        <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label={`${c.label} rating`}>
                            {levels.map(level => (
                                <label key={level}
                                    className={`flex flex-col items-center gap-1 border rounded-lg px-1 py-2 cursor-pointer text-center transition-colors
                                        ${String(data.scores[c.key]) === String(level) ? 'border-primary bg-primary/10' : 'border-border hover:border-input'}`}>
                                    <input type="radio" name={`score-${c.key}`} value={level}
                                        checked={String(data.scores[c.key]) === String(level)}
                                        onChange={() => setData('scores', { ...data.scores, [c.key]: level })}
                                        className="text-primary focus:ring-primary" />
                                    <span className="text-base font-bold text-foreground">{level}</span>
                                    <span className="text-[11px] leading-tight text-muted-foreground">{scale[level]}</span>
                                </label>
                            ))}
                        </div>
                        <InputError message={errors[`scores.${c.key}`]} />
                        <div>
                            <label htmlFor={`comment-${c.key}`} className="text-xs text-muted-foreground">Comment (optional)</label>
                            <textarea id={`comment-${c.key}`} rows={2} value={data.comments[c.key]}
                                onChange={e => setData('comments', { ...data.comments, [c.key]: e.target.value })}
                                className="mt-1 block w-full border-input rounded-md shadow-sm text-sm" />
                        </div>
                    </fieldset>
                ))}

                <div className="flex justify-end">
                    <PrimaryButton disabled={processing}>{processing ? 'Submitting…' : isUpdate ? 'Update Evaluation' : 'Submit Evaluation'}</PrimaryButton>
                </div>
            </form>
        </AppLayout>
    );
}
