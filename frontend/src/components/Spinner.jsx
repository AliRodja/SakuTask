export default function Spinner({ label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-faint">
      <div className="app-spinner w-6 h-6" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}