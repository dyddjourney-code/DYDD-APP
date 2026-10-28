#!/usr/bin/env python3
"""Refresh reviewed quotation usage; references alone never imply reproduced text.
Run from anywhere. This is a bounded Oct20→Oct23 source reconciliation, not a
translation verifier, a remote audit, or an automatic license interpretation.
"""
from pathlib import Path
from datetime import datetime, timezone
import csv, hashlib, html, json, re, subprocess

ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = ROOT.parents[1]
BASE = WORKSPACE / 'outputs/scripture-audit-2026-10-20'
OUT = WORKSPACE / 'outputs/scripture-ledger-2026-10-23'
OUT.mkdir(parents=True, exist_ok=True)
BASE_COMMIT = '6ed5d49839999d3a98ec648535d8b147b90824c7'
# Human-reviewed actual quotation contexts, not all references in these files.
REVIEWED = {
 'lib/journey/dydd-course-outline.ts': 'Ephesians 2:10|Ephesians 2:8-10|Psalm 139:13-14|1 John 3:1|Mark 12:28-31|1 Peter 4:8|Matthew 6:21|Matthew 16:26|Philippians 4:13|2 Corinthians 12:10|1 Peter 2:9|Romans 8:16'.split('|'),
 'lib/journey/expertise-lessons.ts': 'Philippians 1:6|Ephesians 2:10|1 Peter 4:10|Proverbs 1:7|Proverbs 22:29|Luke 16:10|Acts 4:13|Colossians 3:23|Hebrews 5:14|Exodus 35:31|Psalm 46:10|John 15:4'.split('|'),
 'lib/courses/designid-authored-lessons.ts': 'Genesis 1:26-27|John 8:12|Matthew 5:14-16|2 Corinthians 9:8|2 Corinthians 12:9|Ephesians 2:8-10|Titus 3:8|2 Corinthians 5:17|Ephesians 2:10|1 Corinthians 12:5-6|Proverbs 1:5|2 Peter 3:18|1 John 1:7|Proverbs 27:17'.split('|'),
 'lib/courses/designid-welcome.ts': ['Ephesians 2:10'],
}
BOOKS = ['Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther','Job','Psalm','Proverbs','Ecclesiastes','Song of Solomon','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi','Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation']
REF = re.compile(r'(?<![\w])('+'|'.join(re.escape(b) for b in sorted(BOOKS,key=len,reverse=True))+r')\s+(\d+):(\d+)(?:\s*[-–—]\s*(\d+))?')
def normalize(t):
 return t.replace('First Peter','1 Peter').replace('Psalms ','Psalm ').replace('Peter 4:10','1 Peter 4:10').replace('1 1 Peter','1 Peter').replace('–','-').replace('—','-')
def refs(t):
 return [f'{m[1]} {m[2]}:{m[3]}'+(f'-{m[4]}' if m[4] else '') for m in REF.finditer(normalize(t))]
def expand(ref):
 m=REF.fullmatch(ref); assert m,ref
 return [f'{m[1]} {m[2]}:{v}' for v in range(int(m[3]),int(m[4] or m[3])+1)]
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def git(*args,cwd=ROOT):return subprocess.check_output(['git',*args],cwd=cwd,text=True).strip()
def sortkey(v):
 m=REF.fullmatch(v);return BOOKS.index(m[1]),int(m[2]),int(m[3])
rows=list(csv.DictReader((BASE/'quoted-verses.csv').open()))
assert len(rows)==150 and len({(r['Book'],r['Chapter'],r['Verse']) for r in rows})==150
verses={f"{r['Book']} {r['Chapter']}:{r['Verse']}": {'verse':f"{r['Book']} {r['Chapter']}:{r['Verse']}", 'inOctober20Baseline':True,'baselineSources':r['Sources'].split('; '),'evidenceIds':[]} for r in rows}
baseline=set(verses)
sandbox_baseline={v for v,d in verses.items() if any('projects/dydd-online-school-sandbox/' in s for s in d['baselineSources'])}
production_baseline={v for v,d in verses.items() if any('projects/dydd-online-school/' in s for s in d['baselineSources'])}
evidence=[];course_set=set();waypoint_set=set();released_set=set();future_set=set();new_waypoint_set=set();old_waypoint_set=set()
original=json.loads(git('show',BASE_COMMIT+':lib/waypoints/waypoints.json'))
original_ids={r['id'] for r in original}
def add(source,line,reference,context,stage,**extra):
 vs=expand(reference)
 # Authored shortened Matthew quote omits v15; keep the baseline's explicit exception.
 if source=='lib/courses/designid-authored-lessons.ts' and reference=='Matthew 5:14-16':vs.remove('Matthew 5:15')
 eid=f'q{len(evidence)+1:04d}'
 e={'id':eid,'source':source,'line':line,'reference':reference,'quotedVerses':vs,'quotationContext':context,'stage':stage,**extra}
 evidence.append(e)
 for v in vs:
  if v not in verses:verses[v]={'verse':v,'inOctober20Baseline':False,'baselineSources':[],'evidenceIds':[]}
  verses[v]['evidenceIds'].append(eid)
 return set(vs)
# Parse JSON string tokens, retaining source line and nearby paired scripture reference.
for source,reviewed in REVIEWED.items():
 text=(ROOT/source).read_text();seen=set()
 if 'designid-' in source:
  blocks=re.findall(r'<blockquote\b.*?</blockquote>',text,re.S)
  for b in blocks:
   ctx=html.unescape(re.sub(r'<[^>]+>',' ',b)).replace('\\n',' ')
   for ref in refs(ctx):
    if ref in reviewed:
     line=text[:text.index(b)].count('\n')+1
     course_set|=add(source,line,ref,ctx,'committed-sandbox-course-source',translation='mixed/unverified; preserve authored wording')
     seen.add(ref)
 else:
  tokens=list(re.finditer(r'"(?:[^"\\]|\\.)*"',text))
  for i,m in enumerate(tokens):
   value=json.loads(m[0]);ctx=value
   if value in ['reference','anchorScripture','text','prompt','explanation']:continue
   # A proper scripture object has text followed by its reference property.
   if i+2<len(tokens) and json.loads(tokens[i+1][0])=='reference':
    reference=json.loads(tokens[i+2][0]); candidates=refs(reference)
   elif i+1<len(tokens) and re.search(r'\breference\s*:\s*$',text[m.end():tokens[i+1].start()]):
    candidates=refs(json.loads(tokens[i+1][0]))
   elif '“' in value or '”' in value:candidates=refs(value)
   else:continue
   for ref in candidates:
    if ref in reviewed:
     course_set|=add(source,text[:m.start()].count('\n')+1,ref,ctx,'committed-sandbox-course-source',translation='mixed/unverified; preserve authored wording')
     seen.add(ref)
 assert set(reviewed)==seen,(source,'reviewed quotations missing',set(reviewed)-seen)
now=datetime.now(timezone.utc)
wp_path=ROOT/'lib/waypoints/waypoints.json';waypoints=json.loads(wp_path.read_text());pending=[]
for w in waypoints:
 if not w.get('scriptureText','').strip():
  pending.append({'id':w['id'],'reference':w['scripture'],'reason':'reference only; full text not yet present'})
  continue
 assert w.get('scriptureTranslation')=='NIV',(w['id'],'unexpected translation')
 assert '…' not in w['scriptureText'] and '...' not in w['scriptureText'],(w['id'],'shortened quotation; full passage required')
 assert w.get('scriptureAttribution'),(w['id'],'missing attribution')
 references=refs(w['scripture']);assert len(references)==1,(w['id'],w['scripture'])
 release=datetime.fromisoformat(w['releaseAt'].replace('Z','+00:00'))
 vs=add('lib/waypoints/waypoints.json',next((i for i,l in enumerate(wp_path.read_text().splitlines(),1) if '"id": "'+w['id']+'"' in l),None),references[0],w['scriptureText'],'local-waypoints-authored-library',waypointId=w['id'],releaseAt=w['releaseAt'],releasedAsOfAudit=release<=now,translation=w['scriptureTranslation'],attribution=w['scriptureAttribution'],textCompleteness='declared full passage; separately verify against NIV source')
 waypoint_set|=vs
 (old_waypoint_set if w['id'] in original_ids else new_waypoint_set).update(vs)
 (released_set if release<=now else future_set).update(vs)
current_course_union=baseline|course_set
all_set=baseline|course_set|waypoint_set
counts={'october20AllSurfaceBaseline':150,'october20SandboxSourceEvidence':len(sandbox_baseline),'october20ProductionSourceEvidence':len(production_baseline),'verifiedPostBaselineCourseDistinctVerses':len(course_set),'newCourseVersesBeyondBaseline':len(course_set-baseline),'baselinePlusVerifiedCourses':len(current_course_union),'waypointRecords':len(waypoints),'waypointRecordsWithQuotation':len(waypoints)-len(pending),'waypointDistinctPassages':len({e['reference'] for e in evidence if e['stage']=='local-waypoints-authored-library'}),'waypointUniqueVerses':len(waypoint_set),'waypointReleasedUniqueVerses':len(released_set),'waypointFutureUniqueVerses':len(future_set),'waypointNetNewBeyondBaselineAndCourses':len(waypoint_set-current_course_union),'releasedWaypointNetNewBeyondBaselineAndCourses':len(released_set-current_course_union),'newWaypointRecords':len([w for w in waypoints if w['id'] not in original_ids]),'newWaypointRecordUniqueVerses':len(new_waypoint_set),'originalWaypointRecordUniqueVerses':len(old_waypoint_set),'allAuthoredIncludingFutureUnion':len(all_set),'releasedSourcesAndBaselineUnion':len(current_course_union|released_set),'sandboxSourceEvidenceUnionIncludingLocalFutureWaypoints':len(sandbox_baseline|course_set|waypoint_set),'pendingReferenceOnlyWaypoints':len(pending)}
ledger={'schemaVersion':1,'auditDate':'2026-10-23','generatedAt':now.isoformat(),'method':'Canonical book/chapter/verse union; actual reproduced text incl partial quotations; all translations; baseline carry-forward plus reviewed Oct21–23 source changes. Not a license-remaining calculation.','scope':'Historical production/sandbox/workbook/published-report baseline retained; committed sandbox course delta; local authored Waypoints including scheduled future releases. No claim of fresh remote deployment verification.','baseline':{'path':str(BASE/'quoted-verses.csv'),'sha256':digest(BASE/'quoted-verses.csv'),'quotedCountScriptSha256':digest(BASE/'quoted-count.py'),'sandboxBaselineCommit':BASE_COMMIT,'referenceInventory513IsNotQuotationCount':True,'notReauditedRemotely':True},'sourceSnapshots':[{'path':p,'sha256':digest(ROOT/p)} for p in [*REVIEWED,'lib/waypoints/waypoints.json']],'sandboxHead':git('rev-parse','HEAD'),'counts':counts,'addedCourseVerses':sorted(course_set-baseline,key=sortkey),'addedWaypointVerses':sorted(waypoint_set-current_course_union,key=sortkey),'pendingWaypoints':pending,'plannedNewPassagesNotYetInSource':max(0,12-counts['newWaypointRecords']),'evidence':evidence,'verses':[verses[v] for v in sorted(all_set,key=sortkey)],'caveats':['Historical 150 is all translations, not an NIV-only audit.','Historical partial quotations stay partial; a whole citation range does not imply omitted verses were reproduced.','Local Waypoints source is not proof of deployment. Future library quotations count as authored/storage coverage, not currently released learner visibility.','Production, live PDFMonkey templates and workbooks have not been remotely recaptured; their Oct20 evidence is carried forward. Production post-Oct20 MAPS source diff reviewed without finding new reproduced Scripture.','Signed license not examined. September3 offer and October20 reported approval do not establish a fresh license-remaining number.','New Bible text is only counted when scriptureText exists; reference-only pending items do not count.']}
(ROOT/'lib/scripture/usage-ledger.json').write_text(json.dumps(ledger,indent=2,ensure_ascii=False)+'\n')
(OUT/'usage-ledger.json').write_text(json.dumps(ledger,indent=2,ensure_ascii=False)+'\n')
with (OUT/'quoted-verses.csv').open('w') as f:
 writer=csv.writer(f);writer.writerow(['Verse','October20Baseline','BaselineSources','CurrentEvidenceIds'])
 for v in ledger['verses']:writer.writerow([v['verse'],v['inOctober20Baseline'],'; '.join(v['baselineSources']),'; '.join(v['evidenceIds'])])
(OUT/'quote-evidence.json').write_text(json.dumps(evidence,indent=2,ensure_ascii=False)+'\n')
print(json.dumps(counts,indent=2));print('New course verses:',', '.join(ledger['addedCourseVerses']));print('New waypoint verses:',', '.join(ledger['addedWaypointVerses']))
added_rows='\n'.join('| '+ref+' | '+str(len(expand(ref)))+' |' for ref in ['Mark 12:28-31','1 Peter 4:8','Matthew 6:21','Matthew 16:26','Philippians 4:13','2 Corinthians 12:10','1 Peter 2:9','Romans 8:16','Philippians 1:6','Proverbs 1:7','Proverbs 22:29','Acts 4:13','Hebrews 5:14','Psalm 46:10'])
wp_rows='\n'.join('| '+e['waypointId']+' | '+e['reference']+' | '+str(len(e['quotedVerses']))+' | '+('Released' if e['releasedAsOfAudit'] else 'Future')+' |' for e in evidence if e['stage']=='local-waypoints-authored-library')
doc=f'''# Scripture usage ledger — October 23, 2026

## Result and scope

**{counts['allAuthoredIncludingFutureUnion']} unique quoted verses** in the historical all-surface baseline plus verified current sandbox authored course additions and actual full-text Waypoints present in the local library, including future releases. This is an **all-translations, canonical unique-verse inventory**, not an NIV-only license adjudication or a fresh remote production audit.

| Evidence partition | Unique verses / records |
| --- | ---: |
| October 20 all-surface quoted baseline | 150 verses |
| New verified course verses beyond that baseline | {counts['newCourseVersesBeyondBaseline']} verses |
| Baseline + current course source | {counts['baselinePlusVerifiedCourses']} verses |
| Actual full-text Waypoints | {counts['waypointRecordsWithQuotation']} of {counts['waypointRecords']} records |
| Distinct full-text Waypoints passages / canonical verses | {counts['waypointDistinctPassages']} / {counts['waypointUniqueVerses']} |
| Waypoints net new beyond baseline + courses | {counts['waypointNetNewBeyondBaselineAndCourses']} verses |
| Union including all future authored Waypoints | {counts['allAuthoredIncludingFutureUnion']} verses |
| Baseline + courses + date-released Waypoints only | {counts['releasedSourcesAndBaselineUnion']} verses |
| Waypoints still reference-only, excluded | {counts['pendingReferenceOnlyWaypoints']} records |

The original 513 was a reference inventory, not 513 quoted verses: 363 of those verses were reference-only. The historical 150 includes actual reproduced text and partial quotations, across translations. Do not reuse its old “350 remaining” arithmetic.

## What was reviewed

- Baseline CSV and quoted-count.py at `outputs/scripture-audit-2026-10-20/`, including source selections and explicit omissions. Historical production, sandbox, four published PDFMonkey templates, three workbook/static report libraries and image evidence remain in that captured universe. The CSV SHA-256 is `{ledger['baseline']['sha256']}`.
- Sandbox committed source changes from `{BASE_COMMIT}` through `{ledger['sandboxHead']}` across `app`, `lib`, `components`; quote-bearing authored DesignID and Journey/Expertise teaching, lists, CARE prompts and explanations were read. DesignID's new source-faithful quotations duplicate baseline verses; they do not automatically add a second verse selection.
- Reviewed Journey identity/love/Pathfinder content and Expertise Oct23 lessons add **17** previously uncounted verses. The authored “Peter 4:10” is normalized only in the ledger to **1 Peter 4:10**, supported by its actual quotation and another fully spelled-out instance; no lesson wording was edited.
- Local Waypoints source is `lib/waypoints/waypoints.json`, never the legacy database/email library. A `scripture` reference without nonempty `scriptureText` contributes no new quoted verse. Full-text records retain their actual text, translation, attribution, record ID, release time and visibility partition in the JSON evidence.
- Production's post-Oct20 source history was checked read-only: MAPS report changes add no new reproduced Bible passages in their source delta. Production, live workbooks and live PDFMonkey were **not** remotely recaptured. Their baseline evidence is carried forward, not represented as reverified today.

## New course verses beyond the baseline

| Quoted passage | New canonical verses |
| --- | ---: |
{added_rows}

Exact source paths, lines and complete containing quotation contexts are in `lib/scripture/usage-ledger.json` (`evidence`) and the workspace `quote-evidence.json`. New-course set: {', '.join(ledger['addedCourseVerses'])}.

## Waypoints reconciliation

Original baseline library: **23 records, 13 distinct reference strings**; Galatians 5:22–23 spans two verses, so 13 passages is not automatically 13 canonical verses. Original record IDs identify upgrades versus additions. Current new record count is **{counts['newWaypointRecords']}**; **{max(0,12-counts['newWaypointRecords'])}** of the planned twelve additions are not yet present in source and cannot yet be counted or assigned verse IDs. The original 13 full-text passages would add four baseline-absent verses: 1 Corinthians 12:18, Galatians 2:20, Proverbs 20:5, Psalm 37:23; do not count these until quotation text actually exists.

Current Waypoints net-new verses after course/baseline deduplication: **{', '.join(ledger['addedWaypointVerses']) or 'None present yet.'}**

| Waypoint record | Actual quoted passage | Verses | Date visibility |
| --- | --- | ---: | --- |
{wp_rows or '| Full-text source not yet written | Pending | — | Not counted |'}

Released and future sets can overlap; their totals must not be added without deduplication. Future scripture stored in the authored library is included in the authored union even when not yet visible to learners. “Released” here is computed from `releaseAt` against the recorded audit timestamp, not a live browser or deployment check. Local changes must not be described as already deployed.

## Method, boundaries and text completeness

1. Preserve each of the 150 baseline canonical book/chapter/verse IDs and its source provenance. This is a conservative carry-forward universe, not a claim that every original surface still prints every verse.
2. Add only manually reviewed actual quotation contexts, including partial text. Normalize book names, expand verse ranges, deduplicate verse IDs across all sources/translations. Track occurrences separately from distinct verses.
3. Inspect quoted text, not citation range alone. Matthew 5:15 remains excluded from the shortened DesignID Matthew 5:14–16 quote; 1 Peter 5:3 remains excluded from the historical shortened quote. Isaiah 61:3 was already quoted in FruitLife Joy prose; Isaiah 61:1–2 are not inferred from a broad citation.
4. Exclude chapter-only references, anchor/reference-only fields, suggested readings, table framework references and explanatory paraphrases. In particular, the new One Another CARE reading references are not themselves quotations.
5. Historical course excerpts remain historical excerpts; this audit does not silently expand them into full quotations. Waypoints newly declared full NIV passages are inventoried from their full-text field; the authoring verification must additionally establish exact NIV wording and absence of omitted verses. The ledger does not certify every old mixed-translation quotation as NIV.
6. Recompute all unions from sets, never add passage counts to verse counts. Hash the current inputs and retain quote evidence. The sandbox-source-evidence subset (baseline sandbox evidence + courses + local future Waypoints) is **{counts['sandboxSourceEvidenceUnionIncludingLocalFutureWaypoints']}**; it is not a newly measured live sandbox total. Historical sandbox-only provenance was 102 versus historical production-only provenance 87, with overlap and workbook/report evidence outside either subset.

## Permission and attribution evidence

- `memory/2026-09-03.md:25`: Biblica offer to 4D Education Inc. for DYDD, up to 500 NIV verse selections; electronic worldwide commercial distribution; two-year renewable term; attribution required; NIV default. This is the remembered offer, not the signed agreement.
- `memory/2026-10-20.md:83`: John reported final approval for up to 500 verses. The signed license and definition of “verse selections” were not examined in this audit.
- Public attribution source checked October23: [Bible Gateway NIV version information](https://www.biblegateway.com/versions/New-International-Version-NIV-Bible/), HTTP200; its permissions section gives: **THE HOLY BIBLE, NEW INTERNATIONAL VERSION®, NIV® Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.® Used by permission. All rights reserved worldwide.** Direct [Biblica permissions](https://www.biblica.com/permissions/) returned Cloudflare403. Public general quotation rules do not replace John's specific approval.
- All newly counted Waypoints records require `scriptureTranslation: NIV` and nonempty `scriptureAttribution`; attribution strings are retained verbatim as evidence. This audit does not install or change attribution UI, and does not infer that every old course/report has been relabeled.

**No fresh license-remaining figure is asserted.** The refreshed authored all-translation union is the planning evidence; NIV-only attribution, the signed terms and uncaptured external changes remain separate questions.

## Reproduce and handoff

Run `python3 scripts/refresh-scripture-ledger.py` from the sandbox checkout. It writes this document, `lib/scripture/usage-ledger.json`, and workspace `outputs/scripture-ledger-2026-10-23/{{usage-ledger.json,quoted-verses.csv,quote-evidence.json}}`. It reads but never changes course/Waypoints sources. If another author has not yet written full Waypoints text, rerun after that write; pending references remain excluded until then. No commit, push, deployment, scenario run, report generation or external content mutation was performed by this audit.

Audit snapshot: {now.isoformat()}.
'''
(ROOT/'docs/scripture-usage-ledger-2026-10-23.md').write_text(doc)
(OUT/'Scripture-Usage-Ledger.md').write_text(doc)
