import { Suspense } from "react";
import { Workspace } from "@/features/workspace/Workspace";
export default function Page() {
  return (
    <Suspense>
      <Workspace />
    </Suspense>
  );
}
