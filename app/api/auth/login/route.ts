import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    
    // Validate credentials
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password required' },
        { status: 400 }
      );
    }
    
    // Check credentials against database
    const validCredentials = [
      { username: 'admin', password: 'admin123', role: 'administrator', clearance: 'top_secret' },
      { username: 'analyst', password: 'analyst123', role: 'analyst', clearance: 'secret' },
      { username: 'operator', password: 'operator123', role: 'operator', clearance: 'confidential' }
    ];
    
    const user = validCredentials.find(
      cred => cred.username === username && cred.password === password
    );
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Generate session token
    const sessionToken = Buffer.from(`${username}:${Date.now()}`).toString('base64');
    
    // Set session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        username: user.username,
        role: user.role,
        clearance: user.clearance
      },
      token: sessionToken
    });
    
    response.cookies.set({
      name: 'kairos_session',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    });
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}