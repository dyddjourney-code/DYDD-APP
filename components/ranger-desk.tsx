"use client";

import Link from "next/link";
import { useState } from "react";

const questions = [
  {
    question: "Where should I begin?",
    answer: "For the whole picture, begin with the Discover Your Divine Design Journey. It brings identity, design, gifting, and purpose together. If you want a smaller beginning, choose a focused short trail at Trailheads.",
    href: "/trailheads", action: "Explore Trailheads",
  },
  {
    question: "Do I have to take the full Journey?",
    answer: "No. DesignID, Spiritual Gifts, and FruitLife360 can each be a focused starting point. Choose the full Journey when you want to connect the pieces; choose a short trail when you want to explore one area first.",
    href: "/trailheads", action: "Choose a trail",
  },
  {
    question: "What will DesignID help me discover?",
    answer: "DesignID explores how you naturally reflect God's design through your primary reflection: Architect, Artisan, Shepherd, or Steward. Start with the assessment, then use the course to understand your design language and how you contribute.",
    href: "/field-kit", action: "Find the DesignID assessment",
  },
  {
    question: "Where do I explore my spiritual gifts?",
    answer: "The Spiritual Gifts assessment helps you recognize gifting to explore through prayer, service, and feedback. The accompanying course helps connect those discoveries to maturity and faithful action. Your results are a starting point for discernment, not a limit on how God can use you.",
    href: "/field-kit", action: "Find Spiritual Gifts",
  },
  {
    question: "What is FruitLife360?",
    answer: "FruitLife360 is a focused path for reflecting on the fruit of the Spirit in everyday life. It brings personal reflection and feedback into a conversation about growth, with a course to help you consider your next practical step.",
    href: "/fruitlife360", action: "Explore FruitLife360",
  },
  {
    question: "When am I ready for DesignPD?",
    answer: "Begin with DesignID so you know your primary reflection. DesignPD builds on that foundation to explore your tendencies in planning, deciding, and doing. Your available DesignPD options and any access requirements are shown in Field Kit.",
    href: "/field-kit", action: "View DesignPD options",
  },
  {
    question: "Where are my assessment results?",
    answer: "Open Field Kit for your available assessment results and reports. Use the same account you used for your assessment. Base Camp is where you can check your personal progress and passport.",
    href: "/field-kit", action: "Open Field Kit",
  },
  {
    question: "How do I return to my course?",
    answer: "Go to Trailheads to open your course and continue learning. You can also return to Base Camp to see your journey progress and find your next step.",
    href: "/trailheads", action: "Return to Trailheads",
  },
  {
    question: "Where can I find a short encouragement?",
    answer: "Visit Fireside for teaching and encouragement, or explore Waypoints for shorter reflections between bigger steps. You can pause there and return to your trail when you are ready.",
    href: "/fireside#waypoints", action: "Explore Waypoints",
  },
  {
    question: "Where do I see my passport and badges?",
    answer: "Your passport lives in Base Camp. It brings your main Journey, short trails, and deeper exploration together. Assessment milestones can appear in more than one trail, so you can see how the pieces connect.",
    href: "/base-camp", action: "Open my passport",
  },
];

export function RangerDesk() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = questions[activeIndex];

  return (
    <section className="ranger-desk-section ranger-desk-guided" id="ranger-desk" aria-label="Ranger desk">
      <article className="ranger-desk-card ranger-desk-faq">
        <div className="ranger-desk-art" aria-label="Dydi at the ranger desk">
          <img src="/brand/dydi-ranger-hallway.webp" alt="Dydi standing in the Ranger Station hall" />
        </div>
        <div className="ranger-desk-copy">
          <div>
            <p className="section-label">Ranger desk</p>
            <h2>Ask Dydi</h2>
            <p>Choose a question to find your next step.</p>
          </div>
          <div className="ranger-faq-questions" aria-label="Common questions">
            {questions.map((item, index) => (
              <button
                type="button"
                key={item.question}
                id={`ranger-question-${index}`}
                aria-pressed={activeIndex === index}
                aria-controls="ranger-desk-answer"
                onClick={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                onPointerEnter={(event) => {
                  if (event.pointerType === "mouse") setActiveIndex(index);
                }}
              >
                {item.question}
              </button>
            ))}
          </div>
          <div className="ranger-faq-answer" id="ranger-desk-answer" role="region" aria-label="Dydi's answer" aria-live="polite" aria-atomic="true">
            <h3>{active.question}</h3>
            <p>{active.answer}</p>
            <Link href={active.href}>{active.action}<span aria-hidden="true"> &rarr;</span></Link>
          </div>
        </div>
      </article>
    </section>
  );
}
