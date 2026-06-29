import { NextRequest, NextResponse } from 'next/server';
import { getUserByUsername, updateUserLastLogin } from '@/lib/database';
import { checkRateLimit, logAuditEvent } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password required' },
        { status: 400 }
      );
    }
    
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`login:${clientIP}`, 5, 60000)) {
      logAuditEvent('login_rate_limit_exceeded', 'unknown', { ip: clientIP });
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }
    
    // Get user from database
    const user = await getUserByUsername(username);
    
    if (!user) {
      logAuditEvent('login_failed_invalid_user', username, { ip: clientIP });
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Simple password verification for demo purposes
    // In production, use proper password hashing
    const validCredentials = [
      { username: 'admin', password: 'admin123' },
      { username: 'analyst', password: 'analyst123' },
      { username: 'operator', password: 'operator123' }
    ];
    
    const validCredential = validCredentials.find(cred => cred.username === username && cred.password === password);
    
    if (!validCredential) {
      logAuditEvent('login_failed_invalid_password', username, { ip: clientIP });
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Generate session token
    const sessionToken = Buffer.from(`${username}:${Date.now()}`).toString('base64');
    
    // Update last login
    await updateUserLastLogin(username);
    
    // Log successful login
    logAuditEvent('user_login', username, { ip: clientIP });
    
    const response = NextResponse.json({
      success: true,
      user: {
        username: user.username,
        role: user.role,
        clearance: user.clearance
      },
      token: sessionToken
    });
    
    response.cookies.set('kairos_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24,
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