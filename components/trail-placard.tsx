import type { ReactNode } from "react";
type Props = {
  number: string;
  name: string;
  description: string;
  rating: string;
  ratingNote: string;
  terrain: string;
  gear: string;
  bestFor: string;
  permit: string;
  main?: boolean;
  children: ReactNode;
};
export function TrailPlacard({
  number,
  name,
  description,
  rating,
  ratingNote,
  terrain,
  gear,
  bestFor,
  permit,
  main,
  children,
}: Props) {
  return (
    <div className={`trail-placard${main ? " trail-placard-main" : ""}`}>
      <div className="trail-placard-top">
        <span>DYDD · TRAIL GUIDE</span>
        <span>{number}</span>
      </div>
      <div className="trail-placard-body">
        <h3>{name}</h3>
        <p className="trail-description">{description}</p>
        <div className={`trail-rating trail-rating-${rating.toLowerCase()}`}>
          <span className="trail-rating-marker" aria-hidden="true" />
          <div>
            <strong>{rating}</strong>
            <p>{ratingNote}</p>
          </div>
          <small>Trail commitment</small>
        </div>
        <dl className="trail-placard-facts">
          <div>
            <dt>Terrain</dt>
            <dd>{terrain}</dd>
          </div>
          <div>
            <dt>Gear to bring</dt>
            <dd>{gear}</dd>
          </div>
          <div>
            <dt>Best for</dt>
            <dd>{bestFor}</dd>
          </div>
          <div>
            <dt>Permit</dt>
            <dd>{permit}</dd>
          </div>
        </dl>
        {children}
      </div>
      <div className="trail-placard-foot" aria-hidden="true">
        <span />
        WALK WITH PURPOSE
        <span />
      </div>
    </div>
  );
}
