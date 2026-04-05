import './BottomSheet.css';

function BottomSheet({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="sheet-overlay" onClick={onClose} role="presentation">
      <div
        className="bottom-sheet"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <button className="sheet-handle" onClick={onClose} aria-label="Close" />
        {title && <h2 className="sheet-title">{title}</h2>}
        <div className="sheet-content">{children}</div>
      </div>
    </div>
  );
}

export default BottomSheet;
