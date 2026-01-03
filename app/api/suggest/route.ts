import { NextResponse } from 'next/server';

type Input = {
  temp: number | null;
  feels: number | null;
  occasion: string;
  style: string;
};

type Suggestion = {
  title: string;
  description: string;
  points: string[];
};

function fallbackSuggestions(): { suggestions: Suggestion[] } {
  return {
    suggestions: [
      {
        title: '上品きれいめコーデ',
        description: 'きちんと感を軸に、温度調整もしやすい組み合わせ。',
        points: ['コートはベージュ系で品よく', 'ニットは薄手でレイヤード', '足元はきれいめスニーカー'],
      },
      {
        title: '程よく華やぐコーデ',
        description: 'シンプルをベースに、小物で“きれいめ”のムードを足す。',
        points: ['トレンチやジャケットで締める', 'ボトムはストレートで大人っぽく', 'バッグはレザー調で格上げ'],
      },
      {
        title: 'こなれモードコーデ',
        description: '色数を絞って、シルエットと素材感で差をつける。',
        points: ['モノトーンで統一', 'ロング丈で縦ライン', 'アクセはミニマルに'],
      },
    ],
  };
}

function extractJson(text: string) {
  // ```json ... ``` を剥がす
  const cleaned = text
    .replace(/```json/gi, '```')
    .replace(/```/g, '')
    .trim();

  // まずそのまま
  try {
    return JSON.parse(cleaned);
  } catch {}

  // 最初の { から最後の } までを抜く（雑だけど強い）
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first >= 0 && last > first) {
    const sliced = cleaned.slice(first, last + 1);
    return JSON.parse(sliced);
  }

  throw new Error('JSON parse failed');
}

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not set' }, { status: 500 });
  }

  let body: Input;
  try {
    body = (await req.json()) as Input;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const prompt = `
  あなたは日本の女性ファッション誌の編集者兼スタイリストです。
  読者が「結局今日はこれを着ればいい」と迷わず決められることを最優先してください。
  
  【条件】
  - 気温: ${body.temp ?? "不明"}℃
  - 体感温度: ${body.feels ?? "不明"}℃
  - シチュエーション: ${body.occasion}
  - テイスト: ${body.style}
  
  【出力ルール（最重要）】
  - 必ずJSONのみを返す（説明文、前置き、コードフェンスは禁止）
  - 返すJSONの形は必ずこれ：
  {
    "suggestions": [
      { "title": "...", "description": "...", "points": ["...", "...", "..."] },
      { "title": "...", "description": "...", "points": ["...", "...", "..."] },
      { "title": "...", "description": "...", "points": ["...", "...", "..."] }
    ]
  }
  
  【内容ルール（精度を上げるための縛り）】
  - 1案＝1コーデ（同じ案の中で「または」「別案」など分岐させない）
  - 抽象的な表現は禁止（例：洗練、こなれ感、大人っぽい、上品、今っぽい、垢抜け 等）
    → 必ず「アイテム名（名詞）」で書く
  - アイテムは日本の一般的なクローゼットで成立するものにする（奇抜な造語ブランド/入手困難は避ける）
  - 気温・体感に合わせた防寒を必ず入れる（首・手首・足首のどれかをカバー）
  - シチュエーションに合わない要素は避ける（例：デートなのに完全スポーツ/仕事なのに露出強すぎ 等）
  
  【各フィールドの書き方】
  - title：短く（12文字目安）。「結論の型」にする（例：黒ロングコート×ブーツ）
  - description：2〜3文。1文目は必ず「今日はこれを着る」レベルで言い切り、2〜3文目で理由（温度・場面・テイスト適合）を書く
    ※ description の中には必ず outer / top / bottom(or onepiece) / shoes / bag を含める（文字として入っていればOK）
  - points：必ず3つ。内容は次の役割で固定する
    1つ目：主役アイテム（outer など）を具体化（色・丈・素材のどれかを含める）
    2つ目：防寒 or 快適性の工夫（インナー、タイツ、靴下、手袋、マフラー等）
    3つ目：代替案（同じ方向性で置き換え可能なアイテムを1つ提示：例「レザーがなければ黒のサテン/スラックス」）
  
  【出力のバリエーション】
  - 3案は“方向性”が被らないようにする
    - 1案目：迷ったらこれ（失敗しにくい）
    - 2案目：雰囲気重視（写真映え/デート映え）
    - 3案目：少し冒険（テイストを効かせるが成立はさせる）
  `;
  

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
          },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: 'Gemini API error', status: res.status, detail: errText },
        { status: 500 }
      );
    }

    const json = await res.json();
    const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json(fallbackSuggestions());
    }

    const parsed = extractJson(text);

    // 形を軽くチェックして整形（壊れてても落とさない）
    const suggestions = parsed?.suggestions;
    if (!Array.isArray(suggestions) || suggestions.length < 3) {
      return NextResponse.json(fallbackSuggestions());
    }

    const normalized: Suggestion[] = suggestions.slice(0, 3).map((s: any, idx: number) => ({
      title: typeof s?.title === 'string' ? s.title : `コーデ案${idx + 1}`,
      description: typeof s?.description === 'string' ? s.description : '',
      points: Array.isArray(s?.points) ? s.points.slice(0, 3).map(String) : [],
    }));

    return NextResponse.json({ suggestions: normalized });
  } catch {
    return NextResponse.json(fallbackSuggestions());
  }
}
