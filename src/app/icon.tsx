import { ImageResponse } from 'next/og';

// Browser-tab favicon — Next's special-filename convention auto-injects the
// <link rel="icon"> tag, no manual wiring needed in layout.tsx.
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
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
          fontSize: 16,
          fontWeight: 700,
          fontFamily: 'sans-serif',
        }}
      >
        PF
      </div>
    ),
    { ...size },
  );
}
