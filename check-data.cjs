const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/data.js','utf8')+';globalThis.D=DATA',ctx);const D=ctx.D;
assert.equal(D.companies.length,6);assert.equal(D.drugs.length,12);assert.equal(D.cases.length,4);assert.equal(D.quiz.length,5);
const stable=JSON.parse(fs.readFileSync(__dirname+'/research-data.json'));assert.equal(JSON.stringify(D),JSON.stringify(stable),'data.js matches machine readable research');
const key=(id)=>D.companies.find(c=>c.id===id);
const expected={pfizer:[62579,7771,10437,null],merck:[65011,18254,15789,null],roche:[61516,12880,13352,18476],novartis:[54532,13984,11200,17644],novo:[309064,102434,52039,127658],takeda:[4581551,107928,730227,342586]};
for(const c of D.companies){assert.deepEqual([c.revenue.value,c.netIncome.value,c.rd.value,c.operatingIncome.value],expected[c.id]);assert.equal(c.unit,'million');assert.ok(c.currency);assert.ok(c.standard);assert.ok(c.start<c.end);for(const m of ['revenue','netIncome','rd','operatingIncome','pharmaRevenue'])assert.ok(D.sources[c[m].source]);for(const p of [c.representativeDrug,...c.additionalProducts||[]]){assert.ok(p.sales>=0);assert.ok(D.sources[p.source])}}
assert.equal(key('takeda').end,'2025-03-31');assert.equal(key('roche').totalRevenueIncludingOther.value,63356);assert.equal(key('novartis').groupNetIncome.value,13967);
assert.equal(key('pfizer').additionalProducts.find(p=>p.name==='Comirnaty').sales,4367);assert.equal(key('roche').additionalProducts.find(p=>p.name==='Hemlibra').sales,4754);assert.equal(key('novartis').additionalProducts.find(p=>p.name==='Kymriah').sales,381);
for(const d of D.drugs){assert.ok(key(d.companyId));assert.match(d.firstFDAApproval,/^\d{4}-\d{2}-\d{2}$/);assert.ok(d.sources.length>=2);for(const s of d.sources)assert.ok(D.sources[s.id]);for(const e of d.events)for(const s of e.sources)assert.ok(D.sources[s],`missing event source ${s}`)}
for(const c of D.cases)for(const s of c.sources)assert.ok(D.sources[s]);
for(const e of D.timeline){assert.ok(e.year>=1996&&e.year<=2025);for(const s of e.sources)assert.ok(D.sources[s])}
for(const q of D.quiz){assert.equal(q.choices.length,3);assert.ok(q.answer>=0&&q.answer<3);assert.ok(q.explanation.length>20)}
for(const s of Object.values(D.sources))assert.match(s.url,/^https:\/\//);
// Test the actual app's pure filter functions without browser automation.
const app=fs.readFileSync(__dirname+'/app.js','utf8');const pure=app.slice(0,app.indexOf('function renderExplore'));
vm.runInContext('const document={querySelector:()=>null};'+pure+';globalThis.F=filterDrugs;',ctx);
assert.equal(ctx.F('','all','all').length,12);assert.equal(ctx.F('','merck','all').length,2);assert.equal(ctx.F('','all','1996-2005').length,3);assert.equal(ctx.F('','all','2006-2015').length,3);assert.equal(ctx.F('','all','2016-2025').length,6);assert.equal(ctx.F('semaglutide','all','all').length,2);assert.equal(ctx.F('1998','all','all').some(d=>d.id==='herceptin'),true);assert.equal(ctx.F('NO_MATCH_123','all','all').length,0);assert.equal(ctx.F('  LIPITOR  ','pfizer','all').length,1);
console.log('PASS: 6 financial sets, 12 drug cards, 4 cases, '+D.timeline.length+' timeline events, '+Object.keys(D.sources).length+' sources, 5 quizzes, actual filter predicates, JSON parity and exact financial source values.');
