import { useApp } from '../../context/AppContext';
import './Toast.css';

function Toast() {
  const { toast } = useApp();

  if (!toast) return null;

  return (
    <div className={`toast toast-${toast.type}`}>
      {toast.message}
    </div>
  );
}

export default Toast;
