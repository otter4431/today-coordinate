'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';


// コーデ提案の型定義
type CoordinateProposal = {
  title: string;
  description: string;
  points: string[];
};

// ダミーのコーデ提案データ
const COORDINATE_PROPOSALS: CoordinateProposal[] = [
  {
    title: 'コーデ案1',
    description:
      '今日の天気にぴったりの、上品でエレガントなコーデです。気温に合わせた素材選びで、快適に過ごせます。',
    points: [
      'ベージュのコートで上品な印象に',
      'インナーは薄手のニットで温度調節しやすく',
      'スニーカーでカジュアル感をプラス',
    ],
  },
  {
    title: 'コーデ案2',
    description:
      'カジュアルながらもきれいめな印象を与える、バランスの良いスタイルです。デートにも仕事にも使えます。',
    points: [
      'トレンチコートでスタイリッシュに',
      'パンツはストレートシルエットで脚長効果',
      'バッグはトートで実用的に',
    ],
  },
  {
    title: 'コーデ案3',
    description:
      'モードで個性的なコーデです。シンプルなアイテムを組み合わせて、洗練された大人のスタイルを実現します。',
    points: [
      'モノトーンで統一感を演出',
      'ロングコートで存在感をアップ',
      'アクセサリーで差をつける',
    ],
  },
];

// カードコンポーネント（ホーム画面と同じスタイル）
function Card(props: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-[#FFF5EB] p-5 shadow-sm ring-1 ring-[#E8DED3]">
      {props.children}
    </div>
  );
}

export default function ResultPage() {
  // URLクエリパラメータを取得
  const searchParams = useSearchParams();
  
  // クエリパラメータから値を取得（デコードも行う）
  const temp = searchParams.get('temp');
  const feels = searchParams.get('feels');
  const occasion = searchParams.get('occasion') 
    ? decodeURIComponent(searchParams.get('occasion')!)
    : null;
  const style = searchParams.get('style')
    ? decodeURIComponent(searchParams.get('style')!)
    : null;
  // ===== Gemini提案の取得（AIが来たらAI、ダメならダミー） =====
  const [aiSuggestions, setAiSuggestions] = useState<CoordinateProposal[] | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  async function fetchAiSuggestions() {
    try {
      setAiError(null);
      setLoadingAi(true);

      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temp: temp ? Number(temp) : null,
          feels: feels ? Number(feels) : null,
          occasion: occasion ?? '未選択',
          style: style ?? '未選択',
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();

      // data.suggestions の形を想定
      const suggestions = data?.suggestions;
      if (!Array.isArray(suggestions) || suggestions.length < 3) {
        throw new Error('Invalid suggestions format');
      }

      // points が3つない等でも落ちないように整形
      const normalized: CoordinateProposal[] = suggestions.slice(0, 3).map((s: any, idx: number) => ({
        title: typeof s?.title === 'string' ? s.title : `コーデ案${idx + 1}`,
        description: typeof s?.description === 'string' ? s.description : '',
        points: Array.isArray(s?.points) ? s.points.slice(0, 3).map(String) : [],
      }));

      setAiSuggestions(normalized);
    } catch (e: any) {
      setAiSuggestions(null);
      setAiError(e?.message ?? 'failed');
    } finally {
      setLoadingAi(false);
    }
  }

  useEffect(() => {
    // occasion/style が取れているなら初回に生成
    if (occasion && style) {
      fetchAiSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <div className="min-h-dvh bg-[#FFFAF5] text-[#3D3D3D]">
      <div className="mx-auto w-full max-w-[420px] px-5 pb-10 pt-10">
        {/* ヘッダー */}
        <header className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">今日のコーデ提案</h1>
          <p className="mt-2 text-sm text-[#7A7A7A]">あなたにぴったりのコーデを3つご提案</p>
        </header>

        {/* 今回の条件 */}
        <section className="mt-8">
          <Card>
            <h2 className="text-lg font-extrabold">今回の条件</h2>
            
            <div className="mt-4 space-y-3 text-sm">
              {/* 天気情報 */}
              <div>
                <span className="font-semibold text-[#7A7A7A]">東京: </span>
                <span className="font-bold text-[#3D3D3D]">
                  {temp ? `${temp}℃` : '--℃'}
                </span>
                {feels && (
                  <span className="ml-2 text-[#7A7A7A]">
                    （体感 {feels}℃）
                  </span>
                )}
                {!feels && temp && (
                  <span className="ml-2 text-[#7A7A7A]">（体感 --℃）</span>
                )}
              </div>
              
              {/* シチュエーション */}
              <div>
                <span className="font-semibold text-[#7A7A7A]">シチュエーション: </span>
                <span className="font-bold text-[#3D3D3D]">
                  {occasion || '未選択'}
                </span>
              </div>
              
              {/* テイスト */}
              <div>
                <span className="font-semibold text-[#7A7A7A]">テイスト: </span>
                <span className="font-bold text-[#3D3D3D]">
                  {style || '未選択'}
                </span>
              </div>
            </div>
          </Card>
        </section>

        {aiError && (
  <div className="mt-4 text-center text-xs text-[#7A7A7A]">
    AI生成に失敗したのでダミー表示中：{aiError}
  </div>
)}


        {/* コーデ提案リスト */}
        <div className="mt-8 space-y-6">
          {loadingAi && (
            <div className="text-center text-sm text-[#7A7A7A]">
              提案を生成中…
            </div>
          )}

          {aiError && (
            <div className="text-center text-xs text-[#7A7A7A]">
              生成に失敗したのでダミー提案を表示中（{aiError}）
            </div>
          )}

          {(aiSuggestions ?? COORDINATE_PROPOSALS).map((proposal, index) => (

            <Card key={index}>
              {/* 見出し */}
              <h2 className="text-xl font-extrabold">{proposal.title}</h2>

              {/* 説明文 */}
              <p className="mt-3 leading-relaxed text-[#3D3D3D]">{proposal.description}</p>

              {/* ポイント（箇条書き） */}
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-[#7A7A7A]">ポイント</h3>
                <ul className="mt-2 space-y-2">
                  {proposal.points.map((point, pointIndex) => (
                    <li key={pointIndex} className="flex items-start gap-2 text-sm">
                      <span className="mt-1 text-[#D4A574]">•</span>
                      <span className="flex-1 leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>

        {/* フッター（ホームに戻るボタンなど） */}
        <footer className="mt-10 flex justify-center">
          <button
            type="button"
            className="rounded-full border border-[#E8DED3] bg-white px-6 py-3 text-sm font-semibold text-[#3D3D3D] transition active:scale-[0.99]"
            onClick={() => window.history.back()}
          >
            戻る
          </button>
        </footer>
      </div>
    </div>
  );
}

