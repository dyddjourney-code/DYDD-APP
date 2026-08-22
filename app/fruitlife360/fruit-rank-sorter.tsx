"use client";

import { useMemo, useState } from "react";
import { fruitLifeFruits } from "@/lib/fruitlife360/intake";

type RankedFruit = (typeof fruitLifeFruits)[number];
type FruitKey = RankedFruit["key"];

function isFruitKey(value: string): value is FruitKey {
  return fruitLifeFruits.some((fruit) => fruit.key === value);
}

function moveItem(items: RankedFruit[], fromIndex: number, toIndex: number) {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}

export function FruitRankSorter() {
  const [rankedFruits, setRankedFruits] = useState<RankedFruit[]>([...fruitLifeFruits]);
  const fruitPositions = useMemo(
    () => new Map(rankedFruits.map((fruit, index) => [fruit.key, index])),
    [rankedFruits],
  );

  function moveByOne(fruitKey: FruitKey, direction: -1 | 1) {
    const fromIndex = fruitPositions.get(fruitKey);
    if (fromIndex === undefined) return;
    const toIndex = Math.max(0, Math.min(rankedFruits.length - 1, fromIndex + direction));
    setRankedFruits(moveItem(rankedFruits, fromIndex, toIndex));
  }

  return (
    <div className="fruitlife-rank-sorter">
      {rankedFruits.map((fruit, index) => (
        <div
          className="fruitlife-rank-item"
          draggable
          key={fruit.key}
          onDragOver={(event) => event.preventDefault()}
          onDragStart={(event) => {
            event.dataTransfer.setData("text/plain", fruit.key);
            event.dataTransfer.effectAllowed = "move";
          }}
          onDrop={(event) => {
            event.preventDefault();
            const draggedKey = event.dataTransfer.getData("text/plain");
            if (!isFruitKey(draggedKey)) return;
            const fromIndex = fruitPositions.get(draggedKey);
            if (fromIndex === undefined || fromIndex === index) return;
            setRankedFruits(moveItem(rankedFruits, fromIndex, index));
          }}
        >
          <input name={`fruit_rank_${index + 1}`} type="hidden" value={fruit.key} />
          <span className="fruitlife-rank-number">{index + 1}</span>
          <strong>{fruit.label}</strong>
          <div className="fruitlife-rank-actions" aria-label={`Move ${fruit.label}`}>
            <button
              aria-label={`Move ${fruit.label} up`}
              disabled={index === 0}
              onClick={() => moveByOne(fruit.key, -1)}
              type="button"
            >
              Up
            </button>
            <button
              aria-label={`Move ${fruit.label} down`}
              disabled={index === rankedFruits.length - 1}
              onClick={() => moveByOne(fruit.key, 1)}
              type="button"
            >
              Down
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
