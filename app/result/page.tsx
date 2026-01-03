// app/result/page.tsx
import ResultClient from "./result-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Record<string, string | string[] | undefined>;

function pickOne(v: string | string[] | undefined): string {
  if (!v) return "";
  return Array.isArray(v) ? v[0] ?? "" : v;
}

function toNumber(v: string | string[] | undefined): number | null {
  const s = pickOne(v);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export default async function ResultPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const temp = toNumber(sp.temp);
  const feels = toNumber(sp.feels);

  const occasionRaw = pickOne(sp.occasion ?? sp.situation);
  const styleRaw = pickOne(sp.style ?? sp.taste);

  const occasion = occasionRaw.trim() ? occasionRaw : null;
  const style = styleRaw.trim() ? styleRaw : null;

  return <ResultClient temp={temp} feels={feels} occasion={occasion} style={style} />;
}
