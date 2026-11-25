// One source-image coordinate plane. Hiking and water adventures never share geometry.
// Source palette is preserved verbatim from the approved .relief-route-* rules.
export const mapTerrain = { width: 1672, height: 941, image: "/brand/adventure/realistic-ranger-camp-update.webp" };
export const positions: Record<string, [number, number]> = {
 "start-here": [68,76], "base-camp": [80.2,49.7], "ranger-station": [83.2,43.3],
 "trailheads": [60.6,54.5], "fireside": [86.9,54.5], "camp-circles": [52.2,79],
 "waypoints": [29.1,33.3], "dydd-journey": [25.5,15.8], "spiritual-gifts": [16.4,21.5],
 "fruitlife-360": [89.7,56.5], "designpd": [70.6,64], "designid": [57.8,43.9], "field-kit": [74.2,51.3]
};
// River centerline is reviewed independently against the actual native image.
export const riverAdventure = "M74 13 L72 13.7 L69.5 14.6 L68.5 15.6 L68.1 16.6 L68.7 17.6 L69.7 18.5 L69.8 19.5 M65.7 21.3 L63.5 22.4 L62.5 23.8 L62.7 25 L63.8 26.6 L65.5 27.8 L66.1 29 L65.2 30.5 L64.8 32 L65.4 33.7 L66.4 35.1 L66.3 36.2 L65 37.4 L63 38.7 L62 40 L61.3 42 L59.5 43.4 L57.5 44.4 L55.3 45.4 L53.6 46.8 L53.2 48.3 L54 49.6 M55.7 55.3 L56.1 56.7 L55.4 58 L54.6 59.1 L55 60.4 L53.7 61.8 L52.8 63 L51.4 64 L49.6 65.3 L47.2 66.9 L44.5 68 L42 69.2 L40 70.3 L39.4 71.7 L40.1 73.4 L39.2 75 L37.2 76.1 L35.5 77.1 L33.7 78.1 L31.8 79.4 L30 80.9 L28.7 82.4 L27.1 83.9 L25.7 85.1 L24.5 86.3 L23.5 87.5 L22.2 89";
// Visible station-to-bridge approach, then terrain-following western switchbacks.
const stationToJunction = "M81 49.3 L80.3 51.1 L79 52.2 L77.3 53.1 L75.6 54.3 L73.3 55.3 L71.5 55.3 L69 54.6 L66 54.2 L62.8 54.3 L60 54 L57.6 53 L55.5 52.3 L52 51 L50.1 50.3 L48.4 48.9 L47.8 46.7 L47 44.8 L44.8 43.8 L42.1 43 L40 41.5 L38.2 39.8 L36.8 37.9 L35.3 35.7 L33.8 34 L31.4 32.6 L29.1 33.3";
const junctionToPeak = " L27.3 31.1 L24.6 30.3 L22.7 29.6 L22.1 28.8 L22.4 27.7 L24 26.3 L24 25.6 L22.5 24.8 L19.6 24 L17 23 L16 22.1 L16.4 21.5 L18.7 20.5 L21.5 19.9 L23.9 18.8 L24.5 17.6 L24 16.9 L24.8 15.2 L25.5 13.9 L27.1 12.2 L28.3 10.6 L29.2 8.5 L30.5 6.2";
export const trails = [
 { id: "dydd-journey", color: "#4fb36b", hot: "#b9ffd0", kind: "hike", d: stationToJunction + junctionToPeak },
 { id: "spiritual-gifts", color: "#3d9de8", hot: "#c8edff", kind: "hike", d: "M29.1 33.3" + junctionToPeak.split(" L18.7")[0] + " L15.2 20 L14.9 18.7" },
 { id: "fruitlife-360", color: "#d94f34", hot: "#ffd0bd", kind: "hike", d: "M81 49.3 L83 51 L85 51 L87.4 51.4 L89.7 53.1 L90 56.5 L88 58 L84.5 57.3 L82.7 54.8 L83 51 L81 49.3" },
 { id: "designpd", color: "#e88924", hot: "#ffe0a4", kind: "hike", d: "M81 49.3 L80.3 51.1 L79 52.2 L77.3 53.1 L75.6 54.3 L74.2 53 L73.6 54.8 L73 58 L71.5 61.8 L70 65.6 L68 70 L66.9 73 L65.4 75.7 L62.7 78.3 L59 80 L55 80.4 L52.2 79" },
 { id: "designid", color: "#8a67db", hot: "#dccdff", kind: "water", d: riverAdventure }
];
// Small, static trail fork makes Waypoints a genuine three-way junction. It is
// ground guidance only: it is never animated and never overlays the river.
export const waypointFork = "M29.1 33.3 L28.9 35.5 L28.6 37.1";
// Short whitecap glints are each registered to clear open water, not a scene filter.
export const riverWaterPools = [
 "65.5,28.5 66,28.7 66,29.2 65.3,30.1 64.9,30.3 65,29.6",
 "54.8,45.8 55.4,45.6 56.8,45.1 57.2,45.3 56,46.1 54.8,46.8 54,47.3 53.8,47",
 "40,70.1 41.9,69.2 44.4,68.2 46.1,67.6 46.3,68 44.5,68.8 42.2,69.7 40.2,70.8",
 "22.1,88.9 23.6,87.1 25,85.8 25.4,85.8 24.5,87.1 22.8,89.4"
];
export const riverFlow = [
 "M65.8 28.9 L65.5 29.4 L65.1 30",
 "M56.8 45.4 L55.7 45.9 L54.8 46.3 L54.2 47",
 "M45.9 67.9 L44.3 68.5 L42.2 69.5 L40.4 70.4",
 "M25 86.1 L24.4 86.7 L23.6 87.8 L22.6 89"
];
export const routeNotes: Record<string, string> = {
 "dydd-journey": "Leave Ranger Station, cross the timber footbridge, pause at the Waypoints junction and climb the western switchbacks to the high mountain lookout. Return along the same mountain trail.",
 "spiritual-gifts": "At Waypoints, take the first western ridge to the left-hand peak. The blue trail remains separate from the longer green summit climb.",
 "fruitlife-360": "A fireside hiking loop leaves Ranger Station and circles the smaller fire clearing to its right. Stay on this bank: this trail does not cross the bridge.",
 "designpd": "Walk from Ranger Station past the separate Field Kit outbuilding, then follow the lower valley trail to the Camp Circles clearing.",
 "designid": "A water adventure follows the actual turquoise river channel, winding through the valley and below the timber footbridge to the foreground pools. Purple guidance and whitecaps stay on water."
};
