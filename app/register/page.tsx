import { Suspense } from "react";
import AcmeLogo from "../ui/acme-logo";
import RegisterForm from "../ui/register-form";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register",
};

export default async function Page() {
  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-23">
        <div className="flex h-20 w-full items-end rounded-lg bg-blue-600 p-3 md:h-30">
          <div className="w-32 text-white md:w-36">
            <AcmeLogo />
          </div>
        </div>
        <Suspense>
          <RegisterForm />
        </Suspense>
      </div>
    </main>
  );
}
