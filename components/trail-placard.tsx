import type { ReactNode } from "react";
import { TrailDetails } from "@/components/trail-details";
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
  assessmentIcon?: string;
  trailId: "journey" | "designid" | "spiritual-gifts" | "fruitlife-360" | "designpd";
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
  assessmentIcon,
  trailId,
  children,
}: Props) {
  return (
    <div className={`trail-placard${main ? " trail-placard-main" : ""}`}>
      <div className="trail-placard-top">
        <span>DYDD · TRAIL GUIDE</span>
        <span>{number}</span>
      </div>
      <div className="trail-placard-body">
        {assessmentIcon ? (
          <div className="trail-placard-heading">
            <h3>{name}</h3>
            <img
              className="trail-placard-icon"
              src={assessmentIcon}
              alt=""
              width={40}
              height={40}
            />
          </div>
        ) : <h3>{name}</h3>}
        <p className="trail-description">{description}</p>
        <div className={`trail-rating trail-rating-${rating.toLowerCase()}`}>
          <small>Trail commitment</small>
          <div className="trail-rating-summary">
            <span className="trail-rating-marker" aria-hidden="true" />
            <div>
              <strong>{rating}</strong>
              <p>{ratingNote}</p>
            </div>
          </div>
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
        <div className="trail-details-action">
          <TrailDetails
            trailId={trailId}
            supplement={
              <section className="trail-mobile-guide-extras">
                <h3>Trail essentials</h3>
                <p>{ratingNote}</p>
                <dl>
                  {[["Terrain", terrain], ["Gear to bring", gear], ["Best for", bestFor], ["Permit", permit]].map(([label, value]) => (
                    <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                  ))}
                </dl>
              </section>
            }
          />
        </div>
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
