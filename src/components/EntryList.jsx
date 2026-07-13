// Generic editable list of structured entries (jobs, degrees, projects…).
// `fields` describes each entry's inputs: [{ key, label, half?, textarea? }]

export default function EntryList({ entries, onChange, fields, addLabel, titleOf }) {
  function update(i, key, value) {
    onChange(entries.map((e, j) => (j === i ? { ...e, [key]: value } : e)));
  }

  function add() {
    const blank = Object.fromEntries(fields.map((f) => [f.key, ""]));
    onChange([...entries, blank]);
  }

  return (
    <div className="entry-list">
      {entries.map((entry, i) => (
        <div className="entry" key={i}>
          <div className="entry-head">
            <span className="entry-title">{titleOf(entry) || "New entry"}</span>
            <button
              className="text-btn danger"
              onClick={() => onChange(entries.filter((_, j) => j !== i))}
            >
              Remove
            </button>
          </div>
          <div className="entry-grid">
            {fields.map((f) => (
              <label className={"field mini" + (f.half ? " half" : "")} key={f.key}>
                <span className="field-label">{f.label}</span>
                {f.textarea ? (
                  <textarea
                    rows={3}
                    value={entry[f.key] || ""}
                    onChange={(e) => update(i, f.key, e.target.value)}
                  />
                ) : (
                  <input
                    value={entry[f.key] || ""}
                    onChange={(e) => update(i, f.key, e.target.value)}
                  />
                )}
              </label>
            ))}
          </div>
        </div>
      ))}
      <button className="btn dashed" onClick={add}>
        ＋ {addLabel}
      </button>
    </div>
  );
}
