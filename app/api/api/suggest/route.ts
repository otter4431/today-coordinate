import { NextResponse } from 'next/server';

type Input = {
  temp: number | null;
  feels: number | null;
  occasion: string;
  style: string;
};

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not set' },
      { status: 500 }
    );
  }

  const body = (await req.json()) as Input;

  const prompt = `
あなたはファッション誌のスタイリストです。
以下の条件に合わせて、女性向けのコーデ提案を3つ作ってください。

【条件】
- 気温: ${body.temp ?? '不明'}℃
- 体感温度: ${body.feels ?? '不明'}℃
- シチュエーション: ${body.occasion}
- テイスト: ${body.style}

【出力ルール】
- 必ずJSONのみを返す
- 配列 suggestions に3件入れる
- 各要素は以下の形

{
  "title": "コーデ名",
  "description": "2〜3文の説明",
  "points": ["ポイント1", "ポイント2", "ポイント3"]
}
`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  const json = await res.json();

  try {
    const text = json.candidates[0].content.parts[0].text;
    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch {
    // フォールバック（壊れても落ちない）
    return NextResponse.json({
      suggestions: [
        {
          title: 'ベーシックきれいめコーデ',
          description: 'シンプルで使いやすい王道スタイル。',
          points: ['落ち着いた色味', 'きれいなシルエット', '万能アイテム'],
        },
        {
          title: '程よく華やぐコーデ',
          description: '女性らしさをプラスしたバランスコーデ。',
          points: ['小物でアクセント', '抜け感を意識', '季節感をプラス'],
        },
        {
          title: 'こなれ感カジュアル',
          description: '動きやすさとおしゃれを両立。',
          points: ['レイヤード', '素材感ミックス', '足元で調整'],
        },
      ],
    });
  }
}
