import BottomSheet from './BottomSheet';
import './ConfirmSheet.css';

function ConfirmSheet({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  tone = 'danger',
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <p className="confirm-description">{description}</p>
      <div className="confirm-actions">
        <button className={`confirm-btn confirm-btn-${tone}`} onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button className="confirm-btn confirm-btn-secondary" onClick={onClose}>
          {cancelLabel}
        </button>
      </div>
    </BottomSheet>
  );
}

export default ConfirmSheet;
