
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Occasion = '仕事' | 'アフター6' | 'デート' | '休日カジュアル' | 'きれいめイベント';
type Style = 'きれいめ' | 'きれいめカジュアル' | 'カジュアル' | 'モード';

// 天気データの型定義
type WeatherData = {
  city: string;
  tempNow: number;
  condition: string;
  hi: number;
  lo: number;
  feelsLike: number;
  humidity: number | null;
  windKmh: number;
};

const OCCASIONS: { key: Occasion; icon: string }[] = [
  { key: '仕事', icon: '💼' },
  { key: 'アフター6', icon: '🌙' },
  { key: 'デート', icon: '❤️' },
  { key: '休日カジュアル', icon: '☀️' },
  { key: 'きれいめイベント', icon: '✨' },
];

const STYLES: { key: Style }[] = [
  { key: 'きれいめ' },
  { key: 'きれいめカジュアル' },
  { key: 'カジュアル' },
  { key: 'モード' },
];

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function Chip(props: {
  label: string;
  icon?: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  const { label, icon, selected, onClick } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-medium transition',
        'active:scale-[0.99]',
        selected
          ? 'border-transparent bg-[#D4A574] text-white'
          : 'border-[#E8DED3] bg-white text-[#3D3D3D]'
      )}
      aria-pressed={selected}
    >
      {icon ? <span className="text-base leading-none">{icon}</span> : null}
      <span>{label}</span>
    </button>
  );
}

function Card(props: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-[#FFF5EB] p-5 shadow-sm ring-1 ring-[#E8DED3]">
      {props.children}
    </div>
  );
}

export default function Home() {
  const [occasion, setOccasion] = useState<Occasion>('デート');
  const [style, setStyle] = useState<Style>('きれいめカジュアル');
  
  // ページ遷移用のルーター
  const router = useRouter();
  
  // 天気データの状態管理
  const [weather, setWeather] = useState<WeatherData | null>(null);
  // 天気データ取得中の状態管理
  const [isLoading, setIsLoading] = useState(false);

  // 天気データを取得する関数
  const fetchWeather = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/weather');
      if (!response.ok) {
        throw new Error('天気情報の取得に失敗しました');
      }
      const data = await response.json();
      setWeather(data);
    } catch (error) {
      console.error('天気データの取得エラー:', error);
      // エラーが発生してもアプリは動作し続ける
    } finally {
      setIsLoading(false);
    }
  };

  // 初回表示時に天気データを取得
  useEffect(() => {
    fetchWeather();
  }, []);

  return (
    <div className="min-h-dvh bg-[#FFFAF5] text-[#3D3D3D]">
      <div className="mx-auto w-full max-w-[420px] px-5 pb-10 pt-10">
        {/* Header */}
        <header className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">今日のコーデ</h1>
          <p className="mt-2 text-sm text-[#7A7A7A]">あなたにぴったりのコーデを提案</p>
        </header>

        {/* Weather */}
        <section className="mt-8">
          <Card>
            <div className="flex items-start justify-between">
              <div className="text-sm font-semibold text-[#7A7A7A]">
                {weather?.city || '東京の天気'}
              </div>
              <button
                type="button"
                className="text-xs font-medium text-[#7A7A7A] hover:opacity-80"
                onClick={fetchWeather}
                disabled={isLoading}
              >
                {isLoading ? '更新中…' : '更新'}
              </button>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <div className="text-4xl">🌤️</div>
              <div className="flex-1">
                <div className="text-5xl font-extrabold leading-none">
                  {weather?.tempNow ?? '--'}°
                </div>
                <div className="mt-2 text-sm font-semibold">
                  {weather?.condition || '取得中...'}
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-bold text-[#C66A6A]">
                  {weather?.hi ?? '--'}°
                </div>
                <div className="text-lg font-bold text-[#7A7A7A]">
                  / {weather?.lo ?? '--'}°
                </div>
                <div className="mt-2 text-xs text-[#7A7A7A]">
                  体感 {weather?.feelsLike ?? '--'}°
                </div>
              </div>
            </div>

            <div className="mt-5 h-px w-full bg-[#E8DED3]" />

            <div className="mt-4 grid grid-cols-2 gap-6 text-sm">
              <div>
                <div className="text-xs font-semibold text-[#7A7A7A]">湿度</div>
                <div className="mt-1 text-lg font-bold">
                  {weather?.humidity !== null && weather?.humidity !== undefined
                    ? `${weather.humidity}%`
                    : '--%'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-[#7A7A7A]">風速</div>
                <div className="mt-1 text-lg font-bold">
                  {weather?.windKmh ?? '--'}km/h
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Occasion */}
        <section className="mt-10">
          <h2 className="text-xl font-extrabold">今日の予定は？</h2>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {OCCASIONS.map((o) => (
              <Chip
                key={o.key}
                label={o.key}
                icon={o.icon}
                selected={occasion === o.key}
                onClick={() => setOccasion(o.key)}
              />
            ))}
          </div>
        </section>

        {/* Style */}
        <section className="mt-10">
          <h2 className="text-xl font-extrabold">好きな服装のジャンルは？</h2>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {STYLES.map((s) => (
              <Chip
                key={s.key}
                label={s.key}
                selected={style === s.key}
                onClick={() => setStyle(s.key)}
              />
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-10">
          <button
            type="button"
            className="w-full rounded-2xl bg-[#D4A574] py-5 text-lg font-extrabold text-white shadow-md active:scale-[0.99]"
            onClick={() => {
              // URLクエリパラメータを構築
              const queryParams: string[] = [];
              
              // 現在の気温（weatherがnullの場合は追加しない）
              if (weather?.tempNow !== undefined && weather.tempNow !== null) {
                queryParams.push(`temp=${weather.tempNow}`);
              }
              
              // 体感温度（weatherがnullの場合は追加しない）
              if (weather?.feelsLike !== undefined && weather.feelsLike !== null) {
                queryParams.push(`feels=${weather.feelsLike}`);
              }
              
              // シチュエーション（日本語なのでencodeURIComponentを使用）
              queryParams.push(`occasion=${encodeURIComponent(occasion)}`);
              
              // テイスト（日本語なのでencodeURIComponentを使用）
              queryParams.push(`style=${encodeURIComponent(style)}`);
              
              // クエリパラメータ付きで結果画面に遷移
              const queryString = queryParams.join('&');
              router.push(`/result?${queryString}`);
            }}
          >
            コーデを提案する
          </button>
        </section>

        {/* Footer Nav (ダミー) */}
        <footer className="mt-10 flex justify-center">
          <div className="flex flex-col items-center gap-1 text-xs font-semibold text-[#D4A574]">
            <div className="text-xl">🏠</div>
            <div>Home</div>
          </div>
        </footer>
      </div>
    </div>
  );
}
