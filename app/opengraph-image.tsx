import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'GLAMORA · Estilo, Cultura, Sociedad';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#151219',
          backgroundImage: 'radial-gradient(circle at center, #26202c 0%, #110e15 100%)',
          color: '#fbf7f2',
          padding: '60px',
          border: '14px solid #1a1620',
          position: 'relative',
        }}
      >
        {/* Marco fino interior editorial */}
        <div
          style={{
            position: 'absolute',
            inset: '24px',
            border: '1px solid rgba(231, 199, 180, 0.35)',
            display: 'flex',
          }}
        />

        {/* Monograma G */}
        <div
          style={{
            fontSize: '110px',
            fontFamily: 'serif',
            color: '#e7c7b4',
            lineHeight: 0.85,
            marginBottom: '10px',
          }}
        >
          G
        </div>

        {/* Wordmark GLAMORA */}
        <div
          style={{
            fontSize: '54px',
            fontFamily: 'serif',
            letterSpacing: '0.34em',
            paddingLeft: '0.34em',
            color: '#fbf7f2',
            lineHeight: 1.1,
            marginBottom: '16px',
          }}
        >
          GLAMORA
        </div>

        {/* Subtítulo de Alta Gama */}
        <div
          style={{
            fontSize: '14px',
            fontFamily: 'sans-serif',
            letterSpacing: '0.38em',
            paddingLeft: '0.38em',
            color: '#d9b9a4',
            textTransform: 'uppercase',
            marginBottom: '26px',
          }}
        >
          ESTILO · CULTURA · SOCIEDAD
        </div>

        {/* Badge inferior */}
        <div
          style={{
            fontSize: '10px',
            letterSpacing: '0.28em',
            paddingLeft: '0.28em',
            color: 'rgba(251, 247, 242, 0.65)',
            textTransform: 'uppercase',
          }}
        >
          REVISTA DIGITAL · BOLIVIA & THE WORLD
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
