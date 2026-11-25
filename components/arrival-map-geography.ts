// Source-preserving realistic relief: original oblique ranger-table landscape.
// Coordinates follow visible valleys, ridgelines, paths, cabin, river and fire ring.
// These are conceptual course routes, not surveyed trails or safe boating directions.
export const mapTerrain = { width: 1672, height: 941, image: "/brand/adventure/relief-landscape.webp" };
export const positions: Record<string, [number, number]> = {
  "start-here": [16, 53], "base-camp": [39, 84],
  "ranger-station": [79, 44], "trailheads": [21, 43],
  "fireside": [50, 77], "camp-circles": [58, 82],
  "waypoints": [18, 14], "dydd-journey": [31, 26],
  "spiritual-gifts": [40, 37], "fruitlife-360": [62, 67],
  "designpd": [73, 58], "designid": [56, 46], "field-kit": [78, 49]
};
export const trails = [
  { id: "dydd-journey", d: "M21 49 C18 47 12 44 12 40 C12 36 17 36 18 32 C19 29 14 30 15 26 C16 23 23 26 25 23 C27 20 20 20 20 17 C20 15 17 15 18 14 C21 12 23 16 24 18 C27 22 30 20 31 24 C33 27 28 28 29 31 C30 34 37 30 39 33 C41 36 35 37 36 40 C37 44 46 43 47 47 L51 51 L54 54 C58 56 61 53 65 53 C70 53 72 57 76 56 L79 53" },
  { id: "spiritual-gifts", d: "M21 49 C25 49 27 47 31 49 C34 49 35 44 34 41 C33 37 37 35 40 37 C43 39 46 37 48 39 C49 42 44 46 46 49 C43 50 38 48 34 49 L28 51 L23 52" },
  { id: "fruitlife-360", d: "M50 77 C45 77 41 79 39 80 C41 84 48 86 53 85 C58 83 58 78 60 75 C61 71 65 70 65 67 C66 64 72 63 73 60 C74 58 79 58 79 56" },
  { id: "designpd", d: "M79 53 L78 54 C80 55 81 57 79 59 C78 62 73 64 69 67 C65 70 64 74 62 78 C60 83 56 83 53 84 C48 84 43 83 40 79 C38 76 40 72 37 70" },
  { id: "designid", d: "M64 19 C66 21 59 23 61 25 C64 28 57 28 56 31 C54 33 53 34 54 36 C57 38 59 38 58 41 C57 44 55 46 56 48 C58 50 55 52 54 54 C52 58 48 59 45 61 C42 64 40 67 36 68 C33 70 34 72 29 74 C25 76 23 79 19 80 L11 84" }
];
export const routeNotes: Record<string, string> = {
  "dydd-journey": "The long journey leaves the timber trailhead, climbs the western forest and mountain contours to the high lookout, then descends through the valley and the existing river crossing to Ranger Station.",
  "spiritual-gifts": "A woodland discovery loop follows the sheltered foothills above the trailhead, returning to the valley path.",
  "fruitlife-360": "A lower-valley route stays beside the fire-circle clearing, following the visible path back toward the cabin.",
  "designpd": "Follow the cabin-side path past the Field Kit porch and down to the fireside gathering clearing.",
  "designid": "Follow the winding turquoise river from the distant mountain valley, through the forest gorge and down to the foreground pools."
};
