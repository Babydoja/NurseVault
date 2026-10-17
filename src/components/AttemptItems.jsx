const letter = i => String.fromCharCode(65 + i)
export default function AttemptItems({ items }) {
  return (
    <div className="grid gap-4">
      {items.map((x, k) => {
        const mine = x.options.findIndex(o => o.id === x.selected_option_id), right = x.options.findIndex(o => o.id === x.correct_option_id)
        return (
          <div key={x.question_id} className="paper p-5">
            <p className="text-sm font-semibold">{x.is_correct ? 'Correct' : mine < 0 ? 'Not answered' : 'Incorrect'}</p>
            <p className="q-text mt-1"><span className="text-slate">{k + 1}.</span> {x.body}</p>
            <p className="mt-3 text-sm">Your answer: {mine < 0 ? 'None' : `${letter(mine)}. ${x.options[mine].body}`}</p>
            {!x.is_correct && right >= 0 && <p className="text-sm">Correct answer: {letter(right)}. {x.options[right].body}</p>}
            {x.explanation && <p className="mt-2 text-sm text-slate">{x.explanation}</p>}
          </div>
        )
      })}
    </div>
  )
}
