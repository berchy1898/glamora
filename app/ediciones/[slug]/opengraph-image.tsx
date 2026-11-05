import { ImageResponse } from 'next/og';
import { getIssueBySlug } from '@/lib/issues-data';

export const runtime = 'nodejs';
export const alt = 'GLAMORA · The Digital Issue';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  let issueNum = '01';
  let issueTitle = 'The Digital Issue';

  try {
    const { slug } = await params;
    const issue = await getIssueBySlug(slug);
    if (issue) {
      issueNum = String(issue.issue_number || 1).padStart(2, '0');
      issueTitle = issue.title || 'The Digital Issue';
    }
  } catch {
    // defaults
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0d0b0a',
          backgroundImage: 'radial-gradient(circle at 75% 30%, #1a1614 0%, #0d0b0a 70%)',
          color: '#f6f2ec',
          fontFamily: 'serif',
          position: 'relative',
          padding: '44px 54px',
          boxSizing: 'border-box',
          border: '14px solid #161311',
        }}
      >
        {/* Inner Gold Frame */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 14,
            right: 14,
            bottom: 14,
            border: '1px solid rgba(201, 163, 107, 0.4)',
            pointerEvents: 'none',
            display: 'flex',
          }}
        />

        {/* Masthead */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(201, 163, 107, 0.3)',
            paddingBottom: '18px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              display: 'flex',
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
              fontSize: '13px',
              letterSpacing: '0.26em',
              color: '#c9a36b',
              textTransform: 'uppercase',
            }}
          >
            <span>THE DIGITAL ISSUE</span>
            <span>·</span>
            <span>BOLIVIA</span>
          </div>
        </div>

        {/* Content Body */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            gap: '46px',
          }}
        >
          {/* Cover Plate */}
          <div
            style={{
              width: '300px',
              height: '410px',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#161311',
              border: '2px solid rgba(201, 163, 107, 0.65)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.85)',
              position: 'relative',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '30px 24px',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: '11px',
                letterSpacing: '0.24em',
                color: '#c9a36b',
                textTransform: 'uppercase',
              }}
            >
              EDICION DIGITAL
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  fontSize: '34px',
                  letterSpacing: '0.18em',
                  color: '#f6f2ec',
                  marginBottom: '10px',
                }}
              >
                GLAMORA
              </div>
              <div
                style={{
                  display: 'flex',
                  width: '40px',
                  height: '1px',
                  backgroundColor: '#c9a36b',
                  marginBottom: '10px',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  fontSize: '14px',
                  letterSpacing: '0.2em',
                  color: '#c9a36b',
                }}
              >
                NO. {issueNum}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                backgroundColor: 'rgba(201, 163, 107, 0.12)',
                border: '1px solid #c9a36b',
                color: '#c9a36b',
                fontSize: '10px',
                letterSpacing: '0.18em',
                padding: '4px 12px',
                textTransform: 'uppercase',
              }}
            >
              HAUTE COUTURE
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
                display: 'flex',
                color: '#c9a36b',
                fontSize: '13px',
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                marginBottom: '16px',
              }}
            >
              EDICION NO. {issueNum} · VOLUMEN 2026
            </div>

            <div
              style={{
                display: 'flex',
                fontSize: '44px',
                lineHeight: 1.15,
                fontWeight: 700,
                color: '#f6f2ec',
                marginBottom: '22px',
                maxHeight: '150px',
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
                marginTop: '8px',
              }}
            >
              {['MODA & ATELIER', 'SOCIEDAD & GALAS', 'DIALOGOS', 'GOURMET'].map((tag) => (
                <div
                  key={tag}
                  style={{
                    display: 'flex',
                    backgroundColor: 'rgba(201, 163, 107, 0.12)',
                    border: '1px solid rgba(201, 163, 107, 0.4)',
                    color: '#ded3c5',
                    fontSize: '11px',
                    letterSpacing: '0.14em',
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
            marginTop: '18px',
            fontSize: '11px',
            letterSpacing: '0.2em',
            color: '#a39788',
          }}
        >
          <span>LECTOR DIGITAL DE DOBLE PAGINA · ALTA COSTURA DIDONE</span>
          <span style={{ color: '#c9a36b' }}>GLAMORA-TWO.VERCEL.APP</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
