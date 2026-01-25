import { NextRequest, NextResponse } from 'next/server';
import { SiweMessage } from 'siwe';
import { SignJWT } from 'jose';

// Secret key for JWT signing - in production, use environment variable
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'medichain-dev-secret-key-change-in-production'
);

// User roles - in production, fetch from database
const USER_ROLES: Record<string, 'patient' | 'admin'> = {
  // Demo admin addresses (lowercase)
  '0x82d7b44000000000000000000000007b44': 'admin',
};

export async function POST(request: NextRequest) {
  try {
    const { message, signature } = await request.json();
    
    if (!message || !signature) {
      return NextResponse.json(
        { error: 'Missing message or signature' },
        { status: 400 }
      );
    }
    
    // Get stored nonce from cookie
    const storedNonce = request.cookies.get('siwe_nonce')?.value;
    
    if (!storedNonce) {
      return NextResponse.json(
        { error: 'Nonce not found or expired' },
        { status: 400 }
      );
    }
    
    // Parse and verify the SIWE message
    const siweMessage = new SiweMessage(message);
    
    // Verify the signature
    const { success, data } = await siweMessage.verify({ signature });
    
    if (!success || !data) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // Verify nonce matches
    if (data.nonce !== storedNonce) {
      return NextResponse.json(
        { error: 'Nonce mismatch' },
        { status: 401 }
      );
    }
    
    // Get user role (default to patient)
    const address = data.address.toLowerCase();
    const role = USER_ROLES[address] || 'patient';
    
    // Generate a user ID from the address
    const userId = `usr_${address.slice(2, 10)}`;
    
    // Create JWT token
    const token = await new SignJWT({
      sub: userId,
      address: data.address,
      role,
      chainId: data.chainId,
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
        address: data.address,
        role,
        name: role === 'admin' ? 'Admin User' : `User ${address.slice(0, 6)}...${address.slice(-4)}`,
      },
    });
    
    // Set JWT as httpOnly cookie
    response.cookies.set('auth_token', token, {
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
