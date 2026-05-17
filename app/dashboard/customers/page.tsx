import CustomersTable from "@/app/ui/customers/table";
import { InvoicesTableSkeleton } from "@/app/ui/skeletons";
import { Suspense } from "react";

export default async function Page(props: {
  searchParams: Promise<{ query?: string; page?: number }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams.query || "";
  const currentPage = Number(searchParams.page) || 1;

  return (
    <div className="w-full">
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8"></div>
      <Suspense key={query + currentPage} fallback={<InvoicesTableSkeleton />}>
        <CustomersTable query={query} page={currentPage} />
      </Suspense>
    </div>
  );
}
