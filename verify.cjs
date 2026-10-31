const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(script);
const core=script.slice(0,script.indexOf('  /* ---------- DOM ---------- */'))+'globalThis.api={parseDate,periodOf,aggregateLive,calculate};})();';
const ctx={};vm.runInNewContext(core,ctx);const {parseDate:d,periodOf,aggregateLive:agg,calculate}=ctx.api;
const pairs=a=>a.map(([f,t])=>({from:d(f),to:d(t)}));let count=0;
function test(name,fn){fn();count++;console.log('PASS '+name)}
test('leap day counted',()=>assert.equal(periodOf(d('2024-02-28'),d('2024-03-01')).days,3));
test('invalid non-leap date rejected',()=>assert.equal(d('2023-02-29'),null));
test('Gregorian century rule',()=>assert.equal(d('2100-02-29'),null));
test('month-end has no negative remainder',()=>assert.equal(periodOf(d('2025-01-31'),d('2025-02-28')).d,0));
test('overlap deduplicated',()=>assert.equal(agg(pairs([['2024-01-01','2024-01-10'],['2024-01-05','2024-01-15']])).days,15));
test('ownership clipped at both ends',()=>{let r=agg(pairs([['2018-01-01','2026-12-31']]),d('2024-02-28'),d('2024-03-01'));assert.equal(r.days,3);assert.equal(r.clipped,true)});
test('entirely outside ownership excluded',()=>assert.equal(agg(pairs([['2020-01-01','2020-01-31']]),d('2024-01-01'),d('2024-12-31')).days,0));
test('discontinuous years never invented',()=>{let r=agg(pairs([['2018-06-01','2021-05-31'],['2023-06-01','2026-09-11']]));assert.equal(r.days,2295);assert.equal(r.years,null);assert.equal(r.requiresReview,true)});
test('reversed interval flagged',()=>assert.equal(agg(pairs([['2024-03-01','2024-02-01']])).anyInvalid,true));
test('partial interval flagged',()=>assert.equal(agg(pairs([['2024-03-01','']])).anyInvalid,true));
test('adjacent intervals merged',()=>{let r=agg(pairs([['2024-01-01','2024-01-10'],['2024-01-11','2024-01-20']]));assert.equal(r.segments.length,1);assert.equal(r.days,20)});
test('unresolved tax is not zero',()=>{let r=calculate({hold:periodOf(d('2018-01-01'),d('2026-01-01')),holdYears:8,kind:'house',oneHouse:true,live:{anyInvalid:false,days:2295},residenceBlocked:true});assert.equal(r.blocked,true);assert.equal(r.total,null);assert.equal(r.exempt,undefined)});
console.log(count+' tests passed; full script syntax OK');

