import { NextRequest, NextResponse } from 'next/server';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { SignJWT } from 'jose';
import { getJwtSecret } from '@/lib/jwt';

const JWT_SECRET = getJwtSecret();

// User roles - in production, fetch from database
const USER_ROLES: Record<string, 'patient' | 'admin'> = {
  // Demo admin addresses (lowercase)
  '0x82d7b44000000000000000000000007b44': 'admin',
};

export async function POST(request: NextRequest) {
  try {
    const { message, signature, publicKey } = await request.json();

    if (!message || !signature || !publicKey) {
      return NextResponse.json(
        { error: 'Missing message, signature, or public key' },
        { status: 400 }
      );
    }

    // Get stored nonce from cookie
    const storedNonceCookie = request.cookies.get('siwe_nonce') || request.cookies.get('siwe-nonce');
    const storedNonce = storedNonceCookie?.value;

    if (!storedNonce) {
      return NextResponse.json(
        { error: 'Nonce not found' },
        { status: 400 }
      );
    }

    // Extract nonce from message (we formatted it as "Sign in to MediChainAI\nNonce: <nonce>")
    const messageNonceMatch = message.match(/Nonce: (.*)/);
    if (!messageNonceMatch || messageNonceMatch[1] !== storedNonce) {
      return NextResponse.json({ error: "Invalid nonce" }, { status: 422 });
    }

    // Verify the signature
    try {
      const signatureUint8 = bs58.decode(signature);
      const messageUint8 = new TextEncoder().encode(message);
      const pubKeyUint8 = bs58.decode(publicKey);

      const isValid = nacl.sign.detached.verify(
        messageUint8,
        signatureUint8,
        pubKeyUint8
      );

      if (!isValid) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } catch (e) {
      return NextResponse.json({ error: "Signature verification failed" }, { status: 401 });
    }

    // Get user role (default to patient)
    const address = publicKey;
    const role = USER_ROLES[address] || 'patient';

    // Generate a user ID from the address
    const userId = `usr_${address.slice(0, 8)}`;

    // Create JWT token
    const token = await new SignJWT({
      sub: userId,
      address: address,
      role,
      chainId: "solana",
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        address: address,
        role,
        name: role === 'admin' ? 'Admin User' : `User ${address.slice(0, 4)}...${address.slice(-4)}`,
      },
    });

    // Set JWT as httpOnly cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Clear nonce cookie
    response.cookies.delete('siwe_nonce');

    return response;
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
