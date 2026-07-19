import { Loader2 } from 'lucide-react';

export default function Spinner({ label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-400">
      <Loader2 className="w-6 h-6 animate-spin" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}