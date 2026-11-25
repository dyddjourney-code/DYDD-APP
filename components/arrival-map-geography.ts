// One source-image coordinate plane. Hiking and water adventures never share geometry.
// Source palette is preserved verbatim from the approved .relief-route-* rules.
export const mapTerrain = { width: 1672, height: 941, image: "/brand/adventure/realistic-ranger-north-water-trail-20261125.webp" };
export const positions: Record<string, [number, number]> = {
 "start-here": [94,94], "base-camp": [80.2,49.7], "ranger-station": [83.2,43.3],
 "trailheads": [60.6,54.5], "fireside": [86.9,54.5], "camp-circles": [52.2,79],
 "waypoints": [16.8,49.1], "dydd-journey": [25.5,15.8], "spiritual-gifts": [16.4,21.5],
 "fruitlife-360": [76.9,44.8], "designpd": [70.6,64], "designid": [57.8,43.9], "field-kit": [74.2,51.3]
};
// River centerline is reviewed independently against the actual native image.
export const riverAdventure = "M74 13 L72 13.7 L69.5 14.6 L68.5 15.6 L68.1 16.6 L68.7 17.6 L69.7 18.5 L69.8 19.5 M65.7 21.3 L63.5 22.4 L62.5 23.8 L62.7 25 L63.8 26.6 L65.5 27.8 L66.1 29 L65.2 30.5 L64.8 32 L65.4 33.7 L66.4 35.1 L66.3 36.2 L65 37.4 L63 38.7 L62 40 L61.3 42 L59.5 43.4 L57.5 44.4 L55.3 45.4 L53.6 46.8 L53.2 48.3 L54 49.6 M55.7 55.3 L56.1 56.7 L55.4 58 L54.6 59.1 L55 60.4 L53.7 61.8 L52.8 63 L51.4 64 L49.6 65.3 L47.2 66.9 L44.5 68 L42 69.2 L40 70.3 L39.4 71.7 L40.1 73.4 L39.2 75 L37.2 76.1 L35.5 77.1 L33.7 78.1 L31.8 79.4 L30 80.9 L28.7 82.4 L27.1 83.9 L25.7 85.1 L24.5 86.3 L23.5 87.5 L22.2 89";
// Only exposed trail is drawn. M breaks deliberately hide guidance behind foliage,
// buildings and bridge rails; they are not invented shortcuts over the source art.
const stationToJunction = "M80.8 49.2 L80.1 51 L79.1 52.2 L77.9 53 L76.4 53.8 L75.1 54.3 M73.4 54.6 L71.8 54.7 L70.2 54.4 M68.5 54.1 L66.8 54 L65 54.3 L62.8 54.2 L60.6 53.8 L59.8 53.3 M58.5 52.8 L57 52.1 L55.3 51.4 L53.5 50.8 L51.6 50.5 L50 49.9 L48.8 48.8 L48.1 47.1 L47.8 45.5 L47.3 44.4 L46.2 43.6 L44.4 43 L42.8 42.3 L41.2 41.7 M39.6 40.7 L38 39.8 L36.7 38.4 L35.2 36.6 M33.5 35.2 L32 34 L30.7 33.3 L29.3 33.2 L28.3 34.3 L27.7 35.6 L26.5 36.7 L24.4 37.7 L22.6 38.4 L21.6 39.1 L22.1 39.9 L23.1 40.6 L23.7 41.5 L22.7 42.6 L20.7 43.5 L18.8 44.1 L17.7 45 L17.4 46.1 M19 46.2 L20.7 46.4 L22.2 47.2 L22.6 48 L21.6 49.1 L19.9 50.2 L18 51.1 L17 51.6 L17.7 53.2 L18.9 54.7 L20.5 55.7 L22.5 56.6 L24.2 57.4 L25.2 58.8 L26.2 60.1 L27.2 61.3";
const junctionToPeak = "M28.6 32.7 L27.2 31.9 L25.4 31.4 L23.8 30.8 L22.4 30.1 L21.6 29.2 L21.9 28.3 L23.1 27 L24.2 26 L24.2 25.2 L23.1 24.6 L21.5 24.1 L19.5 23.6 L17.6 22.9 L16.2 22.2 L16 21.6 L17.1 20.9 L18.7 20.5 L20.8 20 L22.8 19.2 L24.1 18.3 L24.5 17.5 L24 16.8 M24.6 15.5 L25.5 14.2 L26.6 12.9 M27.5 11.5 L28.4 10.2 L29.2 8.6 L30.4 6.4";
export const trails = [
 { id: "dydd-journey", color: "#4fb36b", hot: "#b9ffd0", kind: "hike", d: stationToJunction + " " + junctionToPeak },
 { id: "spiritual-gifts", color: "#3d9de8", hot: "#c8edff", kind: "hike", d: stationToJunction.split(" L17.7 53.2")[0] + " " + junctionToPeak.split(" L17.1")[0] },
 { id: "fruitlife-360", color: "#d94f34", hot: "#ffd0bd", kind: "hike", d: "M80.5 48.4 L79.6 47.6 L78.7 47.1 M77.6 46.6 L76.5 46 L75.5 45.8 M74 45.1 L72.9 44.3 M71.8 43.5 L71 42.8 L70.5 41.8" },
 { id: "designpd", color: "#e88924", hot: "#ffe0a4", kind: "hike", d: "M80.8 49.2 L80.1 51 L79.1 52.2 L77.9 53 L76.4 53.8 L75.1 54.3 M73.5 55.5 L73 57.7 M72.1 60.2 L71.2 62 M70 64.5 L69 66.4 L67.8 68.4 M67.1 69.3 L66.5 70.8 L66.2 72.3 L65.4 73.7 M64.8 75 L64 76.5 L62.6 78 L60.7 79.2 L58.8 80 L56.8 80.2 L54.9 79.9 L53.4 79.1 L52.2 79" },
 { id: "designid", color: "#8a67db", hot: "#dccdff", kind: "water", d: riverAdventure }
];
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
 "dydd-journey": "Leave Ranger Station, cross the timber footbridge, pause at the Waypoints pagoda and climb the western switchbacks to the high mountain lookout. Return along the same mountain trail.",
 "spiritual-gifts": "From the Waypoints pagoda, climb the western switchbacks to the first ridge; return the same way. Guidance disappears behind the trees rather than crossing their crowns.",
 "fruitlife-360": "Head north-west from Ranger Station toward the rear river bank; return along the same approach. Gaps leave intervening vegetation and buildings in front. This route is separate from Fireside and does not cross the bridge.",
 "designpd": "Walk from Ranger Station past the separate Field Kit outbuilding, then follow the lower valley trail to the Camp Circles clearing.",
 "designid": "A water adventure follows the actual turquoise river channel, winding through the valley and below the timber footbridge to the foreground pools. Purple guidance and whitecaps stay on water."
};
