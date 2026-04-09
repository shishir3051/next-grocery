import { NextRequest, NextResponse } from 'next/server';

const BARIKOI_KEY = process.env.NEXT_PUBLIC_BARIKOI_API_KEY;
const BASE = 'https://barikoi.xyz/v2/api/search';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'reverse' or 'autocomplete'

  let url = '';

  if (type === 'reverse') {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    url = `${BASE}/reverse/geocode?api_key=${BARIKOI_KEY}&longitude=${lng}&latitude=${lat}&district=true&post_code=true&sub_district=true&union=true&address=true&area=true`;
  } else if (type === 'autocomplete') {
    const q = searchParams.get('q');
    url = `${BASE}/autocomplete/place?api_key=${BARIKOI_KEY}&q=${encodeURIComponent(q || '')}&city=dhaka&sub_area=true&sub_district=true`;
  } else {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  try {
    const res = await fetch(url);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Barikoi fetch failed' }, { status: 500 });
  }
}
