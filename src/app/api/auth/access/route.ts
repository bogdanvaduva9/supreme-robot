import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { key } = await request.json();

  const expected = process.env.ALPHA_ACCESS_KEY;

  if (!expected) {
    // No key configured — open access (local dev)
    return NextResponse.json({ success: true });
  }

  if (!key || key !== expected) {
    return NextResponse.json({ error: 'Invalid access key.' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set('lifesim_access', 'granted', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });

  return response;
}
