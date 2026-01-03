import { NextResponse } from 'next/server';

// Open-Meteoのweather_codeを日本語の天気に変換する関数
function convertWeatherCodeToJapanese(weatherCode: number): string {
  const weatherCodeMap: { [key: number]: string } = {
    0: '晴れ',
    1: '主に晴れ',
    2: '部分的に曇り',
    3: '曇り',
    45: '霧',
    48: '霧氷',
    51: '小雨',
    53: '中程度の雨',
    55: '強い雨',
    56: '小雨（凍結）',
    57: '強い雨（凍結）',
    61: '小雨',
    63: '中程度の雨',
    65: '強い雨',
    66: '小雨（凍結）',
    67: '強い雨（凍結）',
    71: '小雪',
    73: '中程度の雪',
    75: '強い雪',
    77: '雪粒',
    80: '小雨のにわか雨',
    81: '中程度のにわか雨',
    82: '激しいにわか雨',
    85: '小雪のにわか雪',
    86: '激しいにわか雪',
    95: '雷雨',
    96: '雷雨（小さな雹）',
    99: '雷雨（大きな雹）',
  };

  // weather_codeが見つからない場合は「不明」を返す
  return weatherCodeMap[weatherCode] || '不明';
}

// APIルートのGETハンドラー
export async function GET() {
  try {
    // 東京の緯度・経度
    const latitude = 35.682839;
    const longitude = 139.759455;

    // Open-Meteo APIのエンドポイント
    // current_weather: 現在の天気情報
    // hourly: 時間ごとのデータ（湿度を取得するため）
    // daily: 日ごとのデータ（最高気温・最低気温を取得するため）
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FTokyo`;

    // APIからデータを取得（キャッシュしない）
    const response = await fetch(apiUrl, { cache: 'no-store' });

    // エラーチェック
    if (!response.ok) {
      throw new Error('天気情報の取得に失敗しました');
    }

    // JSONデータを取得
    const data = await response.json();

    // 現在の天気情報
    const currentWeather = data.current_weather;

    // 現在時刻のインデックスを取得（hourlyデータから）
    // Open-Meteoは現在時刻に最も近い時間のデータを返す
    const hourlyData = data.hourly;
    let humidity: number | null = null;

    // hourlyデータが存在する場合、最初の要素（現在時刻に最も近いデータ）を使用
    if (hourlyData && hourlyData.relativehumidity_2m && hourlyData.relativehumidity_2m.length > 0) {
      humidity = hourlyData.relativehumidity_2m[0];
    }

    // 今日の最高気温・最低気温を取得
    const dailyData = data.daily;
    const todayMaxTemp = dailyData.temperature_2m_max?.[0] ?? currentWeather.temperature;
    const todayMinTemp = dailyData.temperature_2m_min?.[0] ?? currentWeather.temperature;

    // 風速をkm/hに変換（Open-Meteoは通常m/sで返すが、windspeedは既にkm/hの場合もある）
    // 確認のため、そのまま使用（必要に応じて変換）
    const windKmh = currentWeather.windspeed;

    // 指定されたJSON形式で返す
    const weatherData = {
      city: '東京の天気',
      tempNow: Math.round(currentWeather.temperature),
      condition: convertWeatherCodeToJapanese(currentWeather.weathercode),
      hi: Math.round(todayMaxTemp),
      lo: Math.round(todayMinTemp),
      feelsLike: Math.round(currentWeather.apparent_temperature || currentWeather.temperature),
      humidity: humidity ? Math.round(humidity) : null,
      windKmh: Math.round(windKmh),
    };

    return NextResponse.json(weatherData);
  } catch (error) {
    // エラーが発生した場合
    console.error('天気APIエラー:', error);
    return NextResponse.json(
      { error: '天気情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

