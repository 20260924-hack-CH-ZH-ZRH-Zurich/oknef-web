import { Suspense } from "react";
import { Auth } from "@/features/auth/Auth";
export default function Page() {
  return (
    <Suspense>
      <Auth />
    </Suspense>
  );
}
