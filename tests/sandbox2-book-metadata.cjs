const assert=require('node:assert/strict'),fs=require('node:fs'),load=require('../scripts/fruitlife-test-load.cjs');
const source=fs.readFileSync('app/layout.tsx','utf8');const cssMocks=Object.fromEntries([...source.matchAll(/import "(\.\/[^"\n]+\.css)"/g)].map(m=>[m[1],{}]));
const AppChrome=()=>null;const {default:RootLayout}=load('app/layout.tsx',{'@/components/app-chrome':{AppChrome},...cssMocks});
const tree=RootLayout({children:'read-only fixture'}),chrome=tree.props.children.props.children;assert.equal(chrome.type,AppChrome);assert.equal(chrome.props.children,'read-only fixture');
const courses=chrome.props.courses;const {allCourseSummaries}=load('lib/courses/course-catalog.ts');assert.equal(courses.length,allCourseSummaries.length);assert(courses.length>=6);
for(let i=0;i<courses.length;i++){assert.deepEqual(Object.keys(courses[i]).sort(),['description','hrefBase','logo','slug','title']);for(const key of Object.keys(courses[i]))assert.equal(courses[i][key],allCourseSummaries[i][key]);}
assert(!JSON.stringify(courses).includes('Planning is not just making a list'));assert(!/import\s+(?!type)[^;]+from ["']@\/lib\/courses\/course-catalog/.test(fs.readFileSync('components/course-book.tsx','utf8')));
console.log('PASS actual server layout emits only five public course metadata fields; all six catalog records exact, no lesson bodies/modules in book props or runtime client catalog import.');
