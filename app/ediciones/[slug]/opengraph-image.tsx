import { ImageResponse } from 'next/og';
import { getIssueBySlug } from '@/lib/issues-data';

export const runtime = 'nodejs';
export const alt = 'GLAMORA · The Digital Issue';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const issue = await getIssueBySlug(slug);

  const issueNum = issue ? String(issue.issue_number).padStart(2, '0') : '01';
  const issueTitle = issue?.title || 'The Digital Issue';
  const coverUrl = issue?.cover_image || null;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0a0908',
          color: '#f6f2ec',
          fontFamily: 'serif',
          position: 'relative',
          padding: '48px 56px',
          boxSizing: 'border-box',
          border: '14px solid #161412',
        }}
      >
        {/* Inner Gold Inset Frame */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            right: 16,
            bottom: 16,
            border: '1px solid rgba(201, 163, 107, 0.45)',
            pointerEvents: 'none',
          }}
        />

        {/* Masthead */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(201, 163, 107, 0.3)',
            paddingBottom: '20px',
            marginBottom: '36px',
          }}
        >
          <div
            style={{
              fontSize: '44px',
              letterSpacing: '0.22em',
              fontWeight: 700,
              color: '#f6f2ec',
            }}
          >
            GLAMORA
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '14px',
              letterSpacing: '0.28em',
              color: '#c9a36b',
              textTransform: 'uppercase',
            }}
          >
            <span>THE DIGITAL ISSUE</span>
            <span>✦</span>
            <span>BOLIVIA</span>
          </div>
        </div>

        {/* Content Body */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            gap: '48px',
          }}
        >
          {/* Cover representation */}
          <div
            style={{
              width: '320px',
              height: '420px',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#161412',
              border: '2px solid rgba(201, 163, 107, 0.6)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
              overflow: 'hidden',
              position: 'relative',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt={issueTitle}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '32px', letterSpacing: '0.2em', color: '#c9a36b', marginBottom: '8px' }}>
                  GLAMORA
                </div>
                <div style={{ fontSize: '18px', color: '#ded3c5' }}>EDICIÓN Nº {issueNum}</div>
              </div>
            )}
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                right: '12px',
                backgroundColor: 'rgba(10, 9, 8, 0.92)',
                border: '1px solid #c9a36b',
                color: '#c9a36b',
                fontSize: '11px',
                letterSpacing: '0.15em',
                padding: '4px 10px',
                fontWeight: 600,
              }}
            >
              Nº {issueNum}
            </div>
          </div>

          {/* Right info */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                color: '#c9a36b',
                fontSize: '13px',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                marginBottom: '16px',
              }}
            >
              EDICIÓN COLECCIONABLE · VOLUMEN {new Date().getFullYear()}
            </div>

            <div
              style={{
                fontSize: '46px',
                lineHeight: 1.15,
                fontWeight: 700,
                color: '#f6f2ec',
                marginBottom: '20px',
                maxHeight: '160px',
                overflow: 'hidden',
              }}
            >
              {issueTitle}
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginTop: '12px',
              }}
            >
              {['MODA & ATELIER', 'SOCIEDAD & GALAS', 'DIÁLOGOS', 'GOURMET'].map((tag) => (
                <div
                  key={tag}
                  style={{
                    backgroundColor: 'rgba(201, 163, 107, 0.12)',
                    border: '1px solid rgba(201, 163, 107, 0.35)',
                    color: '#ded3c5',
                    fontSize: '11px',
                    letterSpacing: '0.15em',
                    padding: '6px 12px',
                    textTransform: 'uppercase',
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(201, 163, 107, 0.25)',
            paddingTop: '16px',
            marginTop: '20px',
            fontSize: '12px',
            letterSpacing: '0.2em',
            color: '#a39788',
          }}
        >
          <span>LECTOR DIGITAL DE DOBLE PÁGINA · EXPERIENCIA DIDONE</span>
          <span style={{ color: '#c9a36b' }}>GLAMORA-TWO.VERCEL.APP</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
