import { ImageResponse } from 'next/og';

// Placeholder home-screen icon — solid brand blue with a monogram. Swap for a real
// designed icon later without touching manifest.ts or any layout wiring; the URL
// (/icon-192) stays stable either way since this is a plain route, not a static file.
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#3b82f6',
          color: '#ffffff',
          fontSize: 92,
          fontWeight: 700,
          fontFamily: 'sans-serif',
        }}
      >
        PF
      </div>
    ),
    { width: 192, height: 192 },
  );
}
