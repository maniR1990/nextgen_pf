import { ImageResponse } from 'next/og';

// Maskable variant for Android's adaptive icons — the OS crops this into a circle,
// squircle, rounded square, etc., so content must sit inside the safe zone (roughly
// the inner 80% of the canvas) with the background filling the full square edge to
// edge, or the monogram gets clipped depending on which mask shape the launcher picks.
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
          fontSize: 160,
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
