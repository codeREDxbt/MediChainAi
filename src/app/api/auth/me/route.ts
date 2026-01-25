import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'medichain-dev-secret-key-change-in-production'
);

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { user: null },
        { status: 200 }
      );
    }
    
    // Verify JWT
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Return user info from token
    return NextResponse.json({
      user: {
        id: payload.sub,
        address: payload.address,
        role: payload.role,
        name: payload.role === 'admin' 
          ? 'Admin User' 
          : `User ${(payload.address as string).slice(0, 6)}...${(payload.address as string).slice(-4)}`,
      },
    });
  } catch (error) {
    // Token is invalid or expired
    const response = NextResponse.json(
      { user: null },
      { status: 200 }
    );
    
    // Clear invalid token
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });
    
    return response;
  }
}
