/** Shared by the player and standalone first-lesson route only. */
export function DesignIdWelcomeBody({ bodyHtml, image }: { bodyHtml: string; image: { src: string; alt: string } }) {
  return <section className="lesson-source readable-lesson-body designid-clean-lesson designid-welcome-body" aria-label="Lesson body">
    <figure className="designid-welcome-artwork"><img src={image.src} alt={image.alt} /></figure>
    <div className="designid-semantic-body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
  </section>;
}
