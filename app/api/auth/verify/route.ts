import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('kairos_session')?.value;
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }
    
    // Decode session token
    const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8');
    const [username, timestamp] = decoded.split(':');
    
    // Check if session is valid (24 hours)
    const sessionAge = Date.now() - parseInt(timestamp);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (sessionAge > maxAge) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }
    
    // Get user info
    const validCredentials = [
      { username: 'admin', role: 'administrator', clearance: 'top_secret' },
      { username: 'analyst', role: 'analyst', clearance: 'secret' },
      { username: 'operator', role: 'operator', clearance: 'confidential' }
    ];
    
    const user = validCredentials.find(cred => cred.username === username);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      success: true,
      user: {
        username: user.username,
        role: user.role,
        clearance: user.clearance
      }
    });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}