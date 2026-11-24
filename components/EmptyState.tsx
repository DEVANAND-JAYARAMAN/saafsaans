import Link from "next/link";
import { Card } from "./ui";

export function EmptyState({
  title = "Set up your household first",
  body = "This page tailors every number to your family, location and lifestyle. It takes about a minute and stays on your device.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <Card className="mx-auto max-w-lg text-center">
      <div className="text-4xl" aria-hidden>
        🌬️
      </div>
      <h1 className="mt-3 text-xl font-bold">{title}</h1>
      <p className="mt-2 text-white/60">{body}</p>
      <Link href="/setup" className="btn-primary mt-5">
        Set up my household →
      </Link>
    </Card>
  );
}
