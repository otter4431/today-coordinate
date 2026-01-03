import { Suspense } from "react";
import ResultClient from "./result-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Record<string, string | string[] | undefined>;

function pickOne(v: string | string[] | undefined): string {
  if (!v) return "";
  return Array.isArray(v) ? v[0] ?? "" : v;
}

export default function ResultPage({ searchParams }: { searchParams: SearchParams }) {
  // URLが situation/taste でも occasion/style でも拾えるようにしておく
  const occasion = pickOne(searchParams.situation ?? searchParams.occasion);
  const style = pickOne(searchParams.taste ?? searchParams.style);

  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Loading...</div>}>
      <ResultClient
        temp={null}
        feels={null}
        occasion={occasion || null}
        style={style || null}
      />
    </Suspense>
  );
}
