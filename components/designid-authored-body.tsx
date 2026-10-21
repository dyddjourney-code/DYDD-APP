/** Source-authored teaching shared by the player and standalone routes. */
export function DesignIdAuthoredBody({ bodyHtml, images }: { bodyHtml: string; images: readonly { src: string; alt: string }[] }) {
  return <section className="lesson-source readable-lesson-body designid-clean-lesson designid-authored-body" aria-label="Lesson body">
    {images.map(image => <figure className="designid-authored-artwork" key={image.src}><img src={image.src} alt={image.alt} loading="lazy" /></figure>)}
    <div className="designid-semantic-body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
  </section>;
}
