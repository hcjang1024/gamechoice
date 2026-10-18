import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,choose,migrate,scene} from './dist/engine.mjs';
import {startJourney} from './dist/journey.mjs';
import {abilities,grantAbility,beginBattle,tickBattle,fastForward,combatStats,maxHp,maxEnergy} from './dist/combat.mjs';
import {passiveCatalog,passiveDefinitions,grantPassive,passiveBonus,ensurePassives} from './dist/passives.mjs';
import {manageBuild} from './dist/management.mjs';
import {growthPool} from './dist/growth.mjs';
import {canUseItem} from './dist/workshop.mjs';
import {withGrowthChoice} from './test-fixtures.mjs';
function hero(path='inner'){const h=Object.assign(initial('장착 확인'),{path,weapon:'검',element:'물',control:3,skill:3,insight:2,flags:['art-control'],learnedSkills:['weapon','element','counter'],loadout:['weapon','element']});let s=startJourney(h);s=choose(withGrowthChoice(s,'grow-control'),'grow-control');return s;}
test('active slots allow three, reject a fourth and sanitize duplicate or unknown battle skills',()=>{
 let s=hero();s=manageBuild(s,'active','counter');assert.equal(s.loadout.length,3);assert.throws(()=>manageBuild(s,'active','signature'));s.loadout=['weapon','weapon','element','counter','signature','unknown'];const b=beginBattle(s);assert.deepEqual(b.loadout,['weapon','element','counter']);assert.throws(()=>manageBuild(hero(),'active','unknown'));
 s=hero();s.loadout=['weapon','element','counter'];s.journey.learned.push('guard');grantAbility(s,'guard');assert.deepEqual(s.loadout,['weapon','element','counter']);
});
test('passive slots are independent from active slots and have their own three-skill limit',()=>{
 let s=hero();const active=[...s.loadout];for(const a of passiveDefinitions.slice(0,4))grantPassive(s,a.id);assert.equal(s.passiveSkills.length,4);assert.equal(s.passiveLoadout.length,3);assert.deepEqual(s.loadout,active);assert.throws(()=>manageBuild(s,'passive',passiveDefinitions[3].id));
 s=manageBuild(s,'passive',passiveDefinitions[0].id);s=manageBuild(s,'passive',passiveDefinitions[3].id);assert.equal(s.passiveLoadout.length,3);assert.ok(s.passiveLoadout.includes(passiveDefinitions[3].id));assert.deepEqual(s.loadout,active);
});
test('only learned and equipped passives affect stats, including both paths and all six effects',()=>{
 for(const path of ['inner','outer'])for(const a of passiveDefinitions){
  let s=hero(path),clean=combatStats(s),hp=maxHp(s),energy=maxEnergy(s);grantPassive(s,a.id);const delta=passiveCatalog(s).find(k=>k.id===a.id).bonus,next=combatStats(s);
  for(const key of ['attack','defense','speed','accuracy','evasion'])assert.ok(Math.abs(next[key]-clean[key]-(delta[key]||0))<.00001);
  assert.equal(maxHp(s),hp+(delta.hp||0));assert.equal(maxEnergy(s),energy+(delta.energy||0));s=manageBuild(s,'passive',a.id);assert.deepEqual(combatStats(s),clean);assert.equal(maxHp(s),hp);
 }
 const s=hero();s.passiveLoadout=['passive-force'];assert.equal(passiveBonus(s).attack,0);
});
test('passive power and defense change actual hit resolution rather than only displayed stats',()=>{
 let base=hero(),strong=structuredClone(base);grantPassive(strong,'passive-force');
 const duel=s=>{const b=beginBattle(s,{enemy:{hp:100,attack:6,speed:1}});b.loadout=[];b.battle.actor='player';b.battle.seed=1;return tickBattle(b);};
 assert.equal(duel(base).battle.enemy.hp-duel(strong).battle.enemy.hp,1);
 strong=structuredClone(base);grantPassive(strong,'passive-resolve');
 const enemy=s=>{const b=beginBattle(s,{enemy:{hp:100,attack:6,speed:1}});b.battle.actor='enemy';b.battle.stats.evasion=0;b.battle.seed=1;return tickBattle(b);};
 assert.equal(enemy(strong).hp-enemy(base).hp,1);
});
test('passive learning and recurring upgrades consume one point and stop at rank three',()=>{
 let s=hero();s.journey.points=5;s=migrate(s);s=choose(withGrowthChoice(s,'study-passive-force'),'study-passive-force');assert.ok(s.passiveLoadout.includes('passive-force'));assert.equal(s.journey.points,4);
 for(let rank=1;rank<=3;rank++){s=choose(withGrowthChoice(s,'hone-passive-force'),'hone-passive-force');assert.equal(s.passiveRanks['passive-force'],rank);assert.equal(passiveBonus(s).attack,1+rank);assert.deepEqual(migrate(JSON.parse(JSON.stringify(s))),s);}
 assert.ok(!growthPool(s).skills.some(c=>c.ability.id==='passive-force'));
});
test('passives can be purchased once at school without consuming active slots',()=>{
 let s=hero();s.scene='school';s.journey.gold=20;const active=[...s.loadout];s=choose(s,'learn-passive-vitality');assert.equal(s.journey.gold,12);assert.ok(s.passiveSkills.includes('passive-vitality'));assert.deepEqual(s.loadout,active);assert.throws(()=>choose(s,'learn-passive-vitality'));
});
test('max-resource passives clamp on removal and cannot heal through repeated toggling',()=>{
 let s=hero();grantPassive(s,'passive-vitality');s.hp=maxHp(s);assert.equal(s.hp,13);s=manageBuild(s,'passive','passive-vitality');assert.equal(s.hp,10);s=manageBuild(s,'passive','passive-vitality');assert.equal(s.hp,10);
 const tonic={id:'tonic',type:'consumable',heal:10};s.journey.inventory.tonic=1;s.hp=11;assert.ok(canUseItem(s,tonic));s=manageBuild(s,'use','tonic');assert.equal(s.hp,13);
 grantPassive(s,'passive-breath');s.energy=maxEnergy(s);s=manageBuild(s,'passive','passive-breath');assert.equal(s.energy,6);s=manageBuild(s,'passive','passive-breath');assert.equal(s.energy,6);
});
test('equipment tab operations preserve scene, visit count and current encounter and validate ownership',()=>{
 let s=hero();s.scene='combat';s.journey.active='trail';s.journey.route.current={kind:'fight',zone:'trail',step:1};s.journey.inventory.robe=1;const before=structuredClone(s.journey.route);s=manageBuild(s,'equip','robe');assert.equal(s.journey.equipped.body,'robe');assert.equal(s.scene,'combat');assert.equal(s.journey.active,'trail');assert.deepEqual(s.journey.route,before);assert.throws(()=>manageBuild(s,'equip','mirror'));
 s=manageBuild(s,'equip','robe');assert.equal(s.journey.equipped.body,undefined);
});
test('growth allocation and battles block build edits while allowing read-only tabs',()=>{
 const pending=startJourney(hero());for(const [action,id]of [['active','weapon'],['passive','passive-force'],['equip','robe'],['use','herb']])assert.throws(()=>manageBuild(pending,action,id));
 const b=beginBattle(hero());assert.throws(()=>manageBuild(b,'active','weapon'));assert.throws(()=>manageBuild(b,'equip','robe'));b.battle.outcome='victory';assert.throws(()=>manageBuild(b,'active','weapon'));
});
test('old saves gain empty passive slots without changing their learned skills or active selection',()=>{
 const s=hero(),active=[...s.loadout];delete s.passiveSkills;delete s.passiveLoadout;delete s.passiveRanks;const restored=migrate(s);assert.deepEqual(restored.passiveSkills,[]);assert.deepEqual(restored.passiveLoadout,[]);assert.deepEqual(restored.loadout,active);assert.deepEqual(migrate(JSON.parse(JSON.stringify(restored))),restored);
});
test('passive combat and upgrades survive deterministic replay and chapter retry',()=>{
 let s=hero();grantPassive(s,'passive-resolve');s.passiveRanks['passive-resolve']=1;s.journey.active='trail';s=beginBattle(s,{enemy:{hp:50},zone:'trail',context:'journey'});s=tickBattle(s);assert.deepEqual(fastForward(migrate(JSON.parse(JSON.stringify(s)))),fastForward(s));
 s=hero();grantPassive(s,'passive-vitality');s.journey.route.ended='defeat';s=choose(s,'retry-chapter');assert.deepEqual(s.passiveSkills,[]);assert.equal(maxHp(s),10);
});


