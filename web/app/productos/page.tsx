import { Suspense } from "react";
import ProductsPage from "@/src/screens/ProductsPage";

export default function Page() {
  return (
    <Suspense>
      <ProductsPage />
    </Suspense>
  );
}
