import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 scanline">
      <Shield size={48} className="text-accent mb-6" />
      <h1 className="text-5xl font-extrabold tracking-tight mb-2">
        4<span className="text-accent">0</span>4
      </h1>
      <p className="text-text-muted text-sm mb-8">
        This page doesn&apos;t exist. Maybe it was revoked.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 bg-accent text-white rounded-lg text-sm font-semibold hover:bg-accent/90 transition-colors"
      >
        Back to Safety
      </Link>
    </div>
  );
}
