import { ImageResponse } from 'next/og';

// See icon-192/route.tsx for the placeholder-icon rationale.
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
          fontSize: 244,
          fontWeight: 700,
          fontFamily: 'sans-serif',
        }}
      >
        PF
      </div>
    ),
    { width: 512, height: 512 },
  );
}
