import { Suspense } from "react";

import { BookConfirmContent } from "./confirm-content";

export default function BookConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
        </div>
      }
    >
      <BookConfirmContent />
    </Suspense>
  );
}
