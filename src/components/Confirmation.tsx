import { useEffect, useRef } from "react";
export default function Confirmation({
  text,
  onConfirm,
  onClose,
}: {
  text: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog ref={ref} onCancel={onClose} aria-labelledby="confirmation-title">
      <h2 id="confirmation-title">确认这次操作</h2>
      <p style={{ fontSize: 14, lineHeight: 1.9, marginTop: 18 }}>{text}</p>
      <div className="form-actions">
        <button className="secondary" onClick={onClose} autoFocus>
          取消操作
        </button>
        <button
          className="primary"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          确认操作
        </button>
      </div>
    </dialog>
  );
}
