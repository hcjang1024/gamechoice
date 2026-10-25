import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,scene,choose} from './dist/engine.mjs';
import {startJourney} from './dist/journey.mjs';
import {abilityCatalog,combatStats,beginBattle,tickBattle} from './dist/combat.mjs';
import {attackPower,attackHits} from './dist/scaling.mjs';
import {growthPanel,growthPreview,skillInsight,statGuide} from './dist/insight-ui.mjs';
function hero(path='inner',weapon='검'){return Object.assign(initial('수치 확인'),{path,weapon,element:'물',control:4,skill:3,insight:2,learnedSkills:['weapon'],loadout:['weapon'],flags:['art-control']});}
test('every growth choice appears once outside collapsible sections',()=>{
 for(const path of ['inner','outer']){const s=startJourney(hero(path)),data=scene(s),html=growthPanel(s,data);for(const c of data.choices)assert.equal(html.split('data-choice="'+c.id+'"').length-1,1);assert.equal((html.match(/<article class="growth-card/g)||[]).length,3);assert.ok(html.includes('세 보상 중'));}
});
test('stat preview observes breakpoints, caps and path-specific power',()=>{
 const s=hero();assert.match(growthPreview(s,'skill'),/위력 5 → 6/);assert.ok(!growthPreview(s,'control').includes('방어'));s.control=5;assert.match(growthPreview(s,'control'),/방어 2 → 3/);s.skill=100;s.insight=100;assert.ok(!growthPreview(s,'skill').includes('명중'));assert.ok(!growthPreview(s,'insight').includes('회피'));assert.match(statGuide(s,true),/치명타율<\/strong><b>60%/);
 const outer=hero('outer');outer.control=3;assert.match(growthPreview(outer,'control'),/위력 4 → 5/);
});
test('skill explanations follow real attack coefficients across weapons and paths',()=>{
 for(const path of ['inner','outer'])for(const weapon of ['맨손','검','도','창','활','지팡이']){const s=hero(path,weapon),st=combatStats(s);for(const a of abilityCatalog(s).filter(a=>['weapon','element','signature'].includes(a.id))){assert.ok(skillInsight(s,a).value.includes(String(Number(attackPower(s,a,st.attack).toFixed(2)))));assert.ok(attackPower(s,{...a,rank:1},st.attack)>attackPower(s,a,st.attack));}const element=abilityCatalog(s).find(a=>a.id==='element');if(path==='inner'&&weapon==='도')assert.ok(!skillInsight(s,element).notes.includes('적 방어 무시'));}
});
test('support explanations distinguish fixed recovery, vigor and rank scaling',()=>{
 const s=hero();assert.match(skillInsight(s,{id:'mend',rank:1}).value,/체력 5/);assert.match(skillInsight(s,{id:'aegis',rank:1}).value,/보호막 6 → 축기 3일 때 9/);s.path='outer';assert.match(skillInsight(s,{id:'mend',rank:1}).value,/3 × 3회/);assert.match(skillInsight(s,{id:'flow-counter',rank:2}).notes,/교란 3회/);assert.equal(attackHits(s,{id:'tempest'}),3);
});

