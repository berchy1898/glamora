import {
  parseVideoSource,
  type EditorialVideoConfig,
} from '@/lib/editorial-video';

type EditorialVideoPlayerProps = {
  video: EditorialVideoConfig;
  title?: string;
};

export function EditorialVideoPlayer({
  video,
  title = 'Video editorial GLAMORA',
}: EditorialVideoPlayerProps) {
  const source = parseVideoSource(video.url);
  if (!source) return null;

  const isVertical =
    video.aspect === '9:16' || source.kind === 'instagram';

  return (
    <section
      className={`editorial-video-section${isVertical ? ' is-vertical' : ' is-cinema'}`}
      aria-label="Video editorial"
    >
      <div className="editorial-video-header">
        <span className="section-overline">
          GLAMORA · MOTION &amp; FILM
        </span>
        <span className="editorial-video-format">
          {isVertical ? 'SOCIAL REEL · 9:16' : 'CINEMA · 16:9'}
        </span>
      </div>

      <figure className="editorial-video-figure">
        <div
          className={`editorial-video-frame${isVertical ? ' frame-vertical' : ' frame-cinema'}`}
        >
          {source.kind === 'direct' ? (
            <video
              src={source.src}
              controls
              playsInline
              preload="metadata"
              className="editorial-video-element"
            >
              Tu navegador no soporta la reproducción de video.
            </video>
          ) : (
            <iframe
              src={source.embedUrl}
              title={video.caption || title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              className="editorial-video-iframe"
            />
          )}
        </div>

        {video.caption && (
          <figcaption className="editorial-video-caption">
            <span>FILM</span>
            <p>{video.caption}</p>
          </figcaption>
        )}
      </figure>
    </section>
  );
}
