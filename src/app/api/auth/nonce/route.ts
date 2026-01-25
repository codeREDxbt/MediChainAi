import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export async function POST() {
  try {
    // Generate a random nonce
    const nonce = randomBytes(16).toString('hex');
    
    // Create response with nonce
    const response = NextResponse.json({ nonce });
    
    // Store nonce in httpOnly cookie for verification
    response.cookies.set('siwe_nonce', nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 5, // 5 minutes
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Nonce generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate nonce' },
      { status: 500 }
    );
  }
}
