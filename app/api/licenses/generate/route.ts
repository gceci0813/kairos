import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { type, duration, features } = await request.json();
    
    // Generate new license
    const licenseId = `LIC-${Date.now()}`;
    const licenseKey = `KAIROS-${type.toUpperCase()}-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    const newLicense = {
      id: licenseId,
      key: licenseKey,
      client: "New Client",
      type: type,
      status: "pending",
      expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      features: features,
      seats: type === 'government' ? 100 : type === 'enterprise' ? 50 : 10,
      cost: type === 'government' ? 500000 : type === 'enterprise' ? 250000 : 50000
    };
    
    return NextResponse.json({
      license: newLicense,
      message: "License generated successfully",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Generate license error:', error);
    return NextResponse.json(
      { error: 'Failed to generate license' },
      { status: 500 }
    );
  }
}