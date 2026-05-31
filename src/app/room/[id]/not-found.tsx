import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-50">
      <h2 className="text-4xl font-bold mb-4">404 - Room Not Found</h2>
      <p className="text-slate-400 mb-8">
        The room you&apos;re looking for doesn&apos;t exist or has been closed.
      </p>
      <Link href="/">
        <Button variant="outline" className="border-slate-800 hover:bg-slate-900">
          Back to Home
        </Button>
      </Link>
    </div>
  );
}
