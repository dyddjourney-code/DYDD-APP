import {
  fruitLifeFruits,
  fruitLifeQuestionBank,
  fruitLifeRatingOptions,
  fruitRatingField,
  type FruitLifeResponseType,
} from "@/lib/fruitlife360/intake";
import { FruitRankSorter } from "./fruit-rank-sorter";

type FruitLifeAssessmentFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  message?: string;
  responseType: FruitLifeResponseType;
  sessionId?: string;
  token?: string;
};

const fruitLifeQuestionsByFruit = new Map(
  fruitLifeFruits.map((fruit) => [
    fruit.key,
    fruitLifeQuestionBank.filter((question) => question.fruitKey === fruit.key),
  ]),
);

export function FruitLifeAssessmentForm({
  action,
  message,
  responseType,
  sessionId,
  token,
}: FruitLifeAssessmentFormProps) {
  const isSelf = responseType === "self";

  return (
    <form action={action} className="fruitlife-form">
      <input name="session_id" type="hidden" value={sessionId ?? ""} />
      <input name="token" type="hidden" value={token ?? ""} />

      {message ? <p className="form-message">{message}</p> : null}

      <section className="fruitlife-panel">
        <p className="section-label">{isSelf ? "Self Reflection" : "Observer Reflection"}</p>
        <h2>{isSelf ? "Tell the truth with hope." : "Offer clear, helpful feedback."}</h2>
        <div className="fruitlife-grid two">
          <label>
            Your name
            <input name="reviewer_name" required type="text" />
          </label>
          <label>
            Your email
            <input name="reviewer_email" required={isSelf} type="email" />
          </label>
          <label>
            Relationship
            <input
              defaultValue={isSelf ? "Self" : ""}
              name="relationship_label"
              readOnly={isSelf}
              type="text"
            />
          </label>
        </div>
      </section>

      <section className="fruitlife-panel">
        <p className="section-label">Fruit Ratings</p>
        <h2>Rate each statement from 1 to 5.</h2>
        <div className="fruitlife-rating-list">
          {fruitLifeFruits.map((fruit) => (
            <fieldset className="fruitlife-fruit" key={fruit.key}>
              <legend>{fruit.label}</legend>
              <p>{fruitLifeQuestionsByFruit.get(fruit.key)?.[0]?.definition}</p>
              {fruitLifeQuestionsByFruit.get(fruit.key)?.map((question) => (
                <label className="fruitlife-scale" key={question.code}>
                  <span>{isSelf ? question.selfText : question.observerText}</span>
                  <select defaultValue="3" name={fruitRatingField(question.code)} required>
                    {fruitLifeRatingOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.value} - {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </fieldset>
          ))}
        </div>
      </section>

      <section className="fruitlife-panel">
        <p className="section-label">Fruit Ranking</p>
        <h2>{isSelf ? "Rank your fruits." : "Rank the fruits you see."}</h2>
        <p>
          Drag the fruits into order from most consistently visible at the top to greatest
          growth invitation at the bottom.
        </p>
        <FruitRankSorter />
      </section>

      <section className="fruitlife-panel">
        <p className="section-label">Reflection</p>
        <h2>Capture the language a report can use later.</h2>
        <label>
          What strength or visible fruit should be encouraged?
          <textarea name="reflection_strength" rows={4} />
        </label>
        <label>
          Where is there a growth invitation?
          <textarea name="reflection_growth" rows={4} />
        </label>
        <label>
          What encouragement would help this person keep growing?
          <textarea name="reflection_encouragement" rows={4} />
        </label>
      </section>

      <button className="button primary" type="submit">
        Save FruitLife Reflection
      </button>
    </form>
  );
}
