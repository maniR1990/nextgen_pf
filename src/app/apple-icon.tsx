import { ImageResponse } from 'next/og';

// iOS home-screen icon when installed via Safari's "Add to Home Screen" — Next's
// special-filename convention auto-injects the apple-touch-icon <link> tag.
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
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
          fontSize: 86,
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
