import { useState } from "react";

export default function ChipsInput({ values, onChange, placeholder }) {
  const [draft, setDraft] = useState("");

  function commit() {
    const v = draft.trim().replace(/,+$/, "");
    if (v && !values.some((x) => x.toLowerCase() === v.toLowerCase())) {
      onChange([...values, v]);
    }
    setDraft("");
  }

  return (
    <div className="chips">
      {values.map((v, i) => (
        <span className="chip" key={v + i}>
          {v}
          <button
            className="chip-x"
            aria-label={`Remove ${v}`}
            onClick={() => onChange(values.filter((_, j) => j !== i))}
          >
            ×
          </button>
        </span>
      ))}
      <input
        className="chip-input"
        value={draft}
        placeholder={values.length ? "Add more…" : placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit();
          } else if (e.key === "Backspace" && !draft && values.length) {
            onChange(values.slice(0, -1));
          }
        }}
        onBlur={() => draft.trim() && commit()}
      />
    </div>
  );
}
