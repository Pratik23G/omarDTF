import { ApiError } from "@/lib/api";

/** Friendly message for failed admin API calls; 403 means signed in but not on the allow-list. */
export default function ApiErrorNotice({ error }: { error: unknown }) {
  const forbidden = error instanceof ApiError && error.status === 403;
  return (
    <main className="mx-auto max-w-xl px-6 py-24 text-center">
      <h1 className="text-xl font-bold">{forbidden ? "Not authorized" : "Couldn't load data"}</h1>
      <p className="mt-2 text-sm text-neutral-600">
        {forbidden
          ? "This account isn't on the admin list. Sign in with the owner's email."
          : error instanceof Error
            ? error.message
            : "Unknown error"}
      </p>
    </main>
  );
}
