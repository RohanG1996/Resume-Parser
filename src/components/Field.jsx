export default function Field({ label, value, onChange, placeholder, textarea, type = "text", half }) {
  const filled = !!value;
  const cls = "field" + (half ? " half" : "") + (filled ? " filled" : " empty");
  return (
    <label className={cls}>
      <span className="field-label">
        {label}
        {!filled && <span className="field-add">＋ add</span>}
      </span>
      {textarea ? (
        <textarea
          value={value}
          rows={4}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
