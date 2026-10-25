import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,migrate,weapons,elements} from './dist/engine.mjs';
import {abilityCatalog,abilities,beginBattle,playTurn,settleEnemy,battleActions,combatStats} from './dist/combat.mjs';
import {manageBuild} from './dist/management.mjs';
import {applyStatus,statusFor} from './dist/statuses.mjs';
import {skillInsight} from './dist/insight-ui.mjs';
import {techniquePower} from './dist/technique-combat.mjs';
import {typeIds} from './dist/skillbook.mjs';
import {growthPool} from './dist/growth.mjs';
import {startJourney} from './dist/journey.mjs';
const ids=Object.values(typeIds).flat();
const hero=(path='inner',weapon='검',element='불')=>Object.assign(initial('조합 검증'),{path,weapon,element,control:4,skill:4,insight:3,hp:10,energy:6,learnedSkills:[...ids],loadout:['weapon','counter','focus','signature'],flags:['art-control']});
function duel(h,id){h.loadout=[id];const s=settleEnemy(beginBattle(h,{enemy:{hp:1000,attack:1,speed:0,defense:0,heavyEvery:99}}));s.battle.round=5;s.battle.seed=1;return s;}
test('84 combinations each expose sixteen distinct techniques and four of each type',()=>{
 const names=new Set(),catalogs=new Set();let count=0;
 for(const path of ['inner','outer'])for(const weapon of weapons)for(const element of elements){const s=hero(path,weapon,element),catalog=abilityCatalog(s);assert.equal(catalog.length,16);assert.deepEqual(catalog.map(a=>a.id),ids);for(const type of Object.keys(typeIds))assert.equal(catalog.filter(a=>a.category===type).length,4);for(const a of catalog){assert.ok(!names.has(a.name),a.name);names.add(a.name);assert.ok(a.description.length>20);assert.ok(a.technique.ops.length+(a.technique.power?1:0)>=2);}catalogs.add(JSON.stringify(catalog.map(a=>a.technique)));count++;}
 assert.equal(count,84);assert.equal(names.size,1344);assert.equal(catalogs.size,84);
});
test('changing weapon, path, or element changes mechanics at all sixteen positions',()=>{
 const base=abilityCatalog(hero());
 for(const other of [hero('inner','창','불'),hero('outer','검','불'),hero('inner','검','물')])abilityCatalog(other).forEach((a,i)=>{assert.notEqual(a.name,base[i].name);assert.notDeepEqual(a.technique,base[i].technique,a.id);});
});
test('all 1,344 techniques execute manually, retain finite resources, and reload identically',()=>{
 for(const path of ['inner','outer'])for(const weapon of weapons)for(const element of elements)for(const id of ids){
  let s=duel(hero(path,weapon,element),id);s=playTurn(s,id);if(s.battle.pathState.casting)s=playTurn(s,'release');
  const key=[path,weapon,element,id].join('/');assert.ok([s.hp,s.energy,s.battle.enemy.hp,s.battle.playerShield].every(Number.isFinite),key);assert.ok(s.energy>=0&&s.energy<=6,key);assert.ok(s.battle.log.some(e=>e.actor==='player'),key);assert.deepEqual(migrate(JSON.parse(JSON.stringify(s))),s,key);
 }
});
test('combination skill descriptions use the exact shared power formula',()=>{
 for(const path of ['inner','outer'])for(const weapon of weapons)for(const element of elements){const s=hero(path,weapon,element),base=combatStats(s).attack;for(const a of abilityCatalog(s).filter(a=>a.technique.power)){assert.ok(skillInsight(s,a).value.includes(String(Number(techniquePower(s,a,base).toFixed(2)))));assert.ok(techniquePower(s,{...a,rank:1},base)>techniquePower(s,a,base));}}
});
test('elemental attacks inflict their own conditions rather than one common damage effect',()=>{
 for(const [element,status]of [['불','burn'],['물','chill'],['흙','corrosion'],['바람','unsteady'],['나무','poison'],['쇠','bleed'],['번개','shock']]){const s=playTurn(duel(hero('inner','검',element),'weapon'),'weapon');assert.ok(s.battle.log.some(e=>e.actor==='player'));assert.ok(s.battle.effects.some(e=>e.label.includes({burn:'화상',chill:'냉기',corrosion:'부식',unsteady:'흔들림',poison:'중독',bleed:'출혈',shock:'감전'}[status])),element);}
});
test('fire consumes burn for damage and transfers own burn; water cleanses poison',()=>{
 let clean=duel(hero(),'chain'),burning=structuredClone(clean);applyStatus(burning,'enemy','burn',{stacks:3,extend:true});const a=playTurn(clean,'chain'),b=playTurn(burning,'chain');assert.ok(b.battle.enemy.hp<a.battle.enemy.hp);assert.equal(statusFor(b,'enemy','burn'),null);
 let own=duel(hero(),'purify');applyStatus(own,'player','burn',{stacks:2,extend:true});own=playTurn(own,'purify');assert.equal(statusFor(own,'player','burn'),null);assert.ok(statusFor(own,'enemy','burn'));
 let water=duel(hero('inner','검','물'),'mend');water.hp=4;applyStatus(water,'player','poison');water=playTurn(water,'mend');assert.equal(statusFor(water,'player','poison'),null);assert.ok(water.hp>4);
});
test('earth trades shield for attack, bow spends marks, and wood drains dealt damage',()=>{
 let base=duel(hero('inner','검','흙'),'chain'),shielded=structuredClone(base);shielded.battle.playerShield=8;assert.ok(playTurn(shielded,'chain').battle.enemy.hp<playTurn(base,'chain').battle.enemy.hp);
 base=duel(hero('inner','활','불'),'signature');const marked=structuredClone(base);marked.battle.techniqueState.mark=4;marked.battle.techniqueState.markTurns=3;const result=playTurn(marked,'signature');assert.ok(result.battle.enemy.hp<playTurn(base,'signature').battle.enemy.hp);assert.equal(result.battle.techniqueState.mark,0);
 let wood=duel(hero('inner','검','나무'),'infused');wood.control=12;wood.hp=3;wood=playTurn(wood,'infused');assert.ok(wood.hp>3);
});
test('outer resonance grows on preparation and is spent only on an eligible release',()=>{
 let s=duel(hero('outer','검','바람'),'infused');s.battle.techniqueState.resonance=2;s=playTurn(s,'infused');assert.equal(s.battle.techniqueState.resonance,3);s=playTurn(s,'defend');assert.equal(s.battle.techniqueState.resonance,3);s=playTurn(s,'release');assert.equal(s.battle.techniqueState.resonance,0);assert.equal(s.battle.pathState.vigor,0);
});
test('self damage cannot be used at fatal health; free actions cannot repeat or advance time',()=>{
 let s=duel(hero('inner','도','불'),'infused');s.hp=2;assert.ok(battleActions(s).find(a=>a.id==='infused').disabled);assert.throws(()=>playTurn(s,'infused'));
 s=duel(hero(),'stance');const turn=s.battle.turn;s=playTurn(s,'stance');assert.equal(s.battle.turn,turn);assert.ok(s.battle.freeUsed);assert.throws(()=>playTurn(s,'stance'));
});
test('learning, switching, upgrading, growth, and legacy saves keep one technique per type',()=>{
 for(const path of ['inner','outer']){let s=hero(path);s=manageBuild(s,'active','element');assert.ok(!s.loadout.includes('weapon'));assert.equal(s.loadout.length,4);const saved=migrate(JSON.parse(JSON.stringify(s)));assert.deepEqual(saved,s);s=startJourney(s);s.journey.skillRanks.element=2;assert.equal(abilities(s).find(a=>a.id==='element').rank,2);assert.ok(growthPool(s).skills.some(c=>c.id==='hone-element'));}
});
test('elemental fields also function on the inner path and keep existing high stacks',()=>{
 for(const path of ['inner','outer']){let s=duel(hero(path,'검','나무'),'ascend');s=playTurn(s,'ascend');assert.equal(s.battle.pathState.field.turns,2);assert.ok(statusFor(s,'enemy','poison'));applyStatus(s,'enemy','poison',{stacks:3,extend:true});s=playTurn(s,'defend');assert.equal(statusFor(s,'enemy','poison').stacks,3);assert.equal(s.battle.pathState.field.turns,1);}
});
test('temporary attack buffs affect actual basics and expire, while elemental reflections apply status',()=>{
 let h=hero('inner','검','불');h.loadout=['purify'];let s=duel(h,'purify');s.battle.stats.accuracy=.99;const clean=structuredClone(s);s=playTurn(s,'purify');assert.ok(s.battle.techniqueState.buffs.some(b=>b.stat==='attack'));s.battle.seed=1;clean.battle.seed=1;s.battle.enemy.hp=1000;const next=playTurn(s,'basic'),normal=playTurn(clean,'basic');assert.ok(next.battle.enemy.hp<normal.battle.enemy.hp);let expired=playTurn(next,'defend');assert.ok(!expired.battle.techniqueState.buffs.some(b=>b.stat==='attack'));
 h=hero('outer','검','쇠');h.loadout=['counter'];s=duel(h,'counter');s.battle.stats.evasion=0;s=playTurn(s,'counter');assert.ok(s.battle.effects.some(e=>e.kind==='counter'&&e.magic));assert.ok(statusFor(s,'enemy','bleed'));
});
