export function EventPlanner({ onBack }: { onBack: () => void }) {
  return (
    <div className="page">
      <header className="page-head">
        <button className="back" onClick={onBack}>
          ‹ Menu
        </button>
        <h1>In arrivo</h1>
      </header>
    </div>
  );
}
