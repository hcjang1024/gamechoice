import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,migrate} from './dist/engine.mjs';
import {chooseFixture as choose} from './test-fixtures.mjs';
import {abilities,beginBattle,tickBattle,fastForward} from './dist/combat.mjs';
import {manualsFor,recipesFor} from './dist/workshop.mjs';
import {startJourney} from './dist/journey.mjs';
import {applyStatus,statusFor} from './dist/statuses.mjs';
import {ensurePathState} from './dist/paths.mjs';
import {marketPanel} from './dist/market-ui.mjs';
const act=(s,...ids)=>ids.reduce((s,id)=>choose(s,id),s);
function hero(path='inner',weapon='검'){return Object.assign(initial('같은 제자'),{path,weapon,element:'불',control:3,skill:2,insight:2,learnedSkills:['weapon','element','counter'],loadout:['weapon'],flags:['art-control']});}
function duel(path='inner',loadout=['weapon'],weapon='검'){const s=beginBattle({...hero(path,weapon),loadout},{enemy:{hp:200,attack:2,defense:2,speed:1}});s.battle.actor='player';s.battle.seed=1;return s;}
function own(s){s.battle.actor='player';s.battle.seed=1;return tickBattle(s);}
test('같은 무기와 결이라도 무공은 즉시 타격하고 주문은 준비한 뒤 발동한다',()=>{
 const inner=own(duel()),outer=own(duel('outer'));assert.ok(inner.battle.enemy.hp<200);assert.equal(inner.battle.pathState.casting,null);assert.equal(outer.battle.enemy.hp,200);assert.equal(outer.battle.pathState.casting.id,'weapon');assert.equal(outer.energy,4);
 const released=own(outer);assert.ok(released.battle.enemy.hp<200);assert.equal(released.battle.pathState.casting,null);assert.equal(released.energy,5);
});
test('첫 기술·추가 가르침·조합의 이름과 설명이 길마다 다르다',()=>{
 const inner=hero(),outer=hero('outer');for(const id of ['weapon','element','counter','signature']){const a=abilities(inner).find(a=>a.id===id),b=abilities(outer).find(a=>a.id===id);assert.notEqual(a.name,b.name);assert.notEqual(a.description,b.description);assert.notEqual(a.mode,b.mode);}
 for(const [a,b] of manualsFor(inner).map((a,i)=>[a,manualsFor(outer)[i]])){assert.notEqual(a.name,b.name);assert.notEqual(a.description,b.description);}
 for(const [a,b] of recipesFor(inner).map((a,i)=>[a,recipesFor(outer)[i]])){assert.notEqual(a.name,b.name);assert.notEqual(a.description,b.description);assert.notDeepEqual(a.labels,b.labels);}
});
test('축기는 기본 동작으로 최대 세 개 쌓이며 무공에 모두 방출된다',()=>{
 let s=duel('inner',[]);for(let i=0;i<5;i++){s.battle.round=1;s=own(s);}assert.equal(s.battle.pathState.vigor,3);
 s.loadout=['weapon'];const base=duel();base.battle.round=1;const clean=own(base);s.battle.enemy.hp=200;s=own(s);assert.equal(s.battle.pathState.vigor,0);assert.equal(s.battle.pathState.release,3);assert.equal(clean.battle.enemy.hp-s.battle.enemy.hp,6);
});
test('호신 무공은 축기로 보호막과 반격을 강화한다',()=>{
 let s=duel('inner',['counter']);s.hp=3;s.battle.pathState.vigor=3;s=own(s);assert.equal(s.battle.playerShield,5);assert.equal(s.battle.counter,true);assert.equal(s.battle.counterPower,3);assert.equal(s.battle.pathState.vigor,0);
});
test('마법사는 기본 공격으로 축기를 얻지 않고 주변 숨을 지속 인도한다',()=>{
 let s=duel('outer',[]);s.energy=1;s=own(s);assert.equal(s.energy,2);assert.equal(s.battle.pathState.vigor,0);assert.ok(s.battle.effects.some(e=>e.label==='주변 숨 유입'));
});
test('교란술은 물리 반격 대신 적의 강타와 반격 준비를 봉쇄한다',()=>{
 let s=duel('outer',['counter']);s.hp=3;s.battle.round=3;s=own(s);assert.equal(s.battle.counter,false);assert.equal(s.battle.enemy.disrupted,1);s.battle.actor='enemy';s.battle.stats.evasion=0;s=tickBattle(s);assert.ok(s.battle.effects.some(e=>e.actor==='enemy'&&e.kind==='attack'));assert.ok(!s.battle.effects.some(e=>e.kind==='counter'));assert.equal(s.battle.enemy.disrupted,0);
});
test('영역 주문은 발동 뒤에도 적 행동마다 상태를 새로 부여한다',()=>{
 let s=own(own(duel('outer',['element'])));assert.equal(s.battle.pathState.field.turns,2);delete s.battle.statuses.enemy.burn;s.battle.actor='enemy';s=tickBattle(s);assert.ok(statusFor(s,'enemy','burn'));assert.equal(s.battle.pathState.field.turns,1);s.battle.actor='enemy';s=tickBattle(s);assert.equal(s.battle.pathState.field,null);
});
test('강타 피해가 크면 준비 중인 주문이 끊기고 준비에 쓴 숨은 돌아오지 않는다',()=>{
 let s=own(duel('outer'));const energy=s.energy;s.battle.actor='enemy';s.battle.round=3;s.battle.stats.evasion=0;s.battle.enemy.attack=5;s.battle.enemy.heavyBonus=1;s=tickBattle(s);assert.equal(s.battle.pathState.casting,null);assert.equal(s.energy,energy);assert.ok(s.battle.effects.some(e=>e.label==='강타 · 주문 끊김'));assert.ok(s.hp>0);
});
test('보호막으로 강타를 흡수하면 주문 준비가 유지된다',()=>{
 let s=own(duel('outer'));s.battle.playerShield=20;s.battle.actor='enemy';s.battle.round=3;s.battle.stats.evasion=0;s=tickBattle(s);assert.equal(s.battle.pathState.casting.id,'weapon');
});
test('감전은 준비한 주문을 끊고 이번 행동은 기본 동작으로 제한한다',()=>{
 let s=own(duel('outer'));applyStatus(s,'player','shock');s=own(s);assert.equal(s.battle.pathState.casting,null);assert.ok(s.battle.effects.some(e=>e.label==='감전 · 주문 끊김'));assert.ok(!s.battle.effects.some(e=>e.kind==='skill'));
});
test('마법사의 여섯 매개는 주문 효과에도 각각 반영된다',()=>{
 for(const weapon of ['맨손','검','도','창','활','지팡이']){const s=own(own(duel('outer',['weapon'],weapon)));assert.ok(s.battle.enemy.hp<200);if(weapon==='맨손')assert.equal(s.battle.enemy.weaken,2);if(weapon==='도')assert.ok(s.battle.effects.some(e=>e.label==='파열하는 매개'));if(weapon==='지팡이')assert.equal(s.battle.playerShield,2);assert.equal(s.battle.pathState.vigor,0);}
});
test('마법사의 회복은 즉시 회복 대신 세 행동 동안 유지된다',()=>{
 let s=choose(startJourney(hero('outer')),'grow-control');s.journey.learned=['mend'];s.loadout=['mend'];s=beginBattle(s,{enemy:{hp:200}});s.hp=2;s=own(s);assert.equal(s.hp,2);assert.equal(s.battle.pathState.renewal,3);s=own(s);assert.equal(s.hp,4);assert.equal(s.battle.pathState.renewal,2);
});
test('마법 조합 반격은 술식 역류로 바뀌고 물리 반격을 준비하지 않는다',()=>{
 let s=choose(startJourney(hero('outer')),'grow-control');s.journey.learned=['flow-counter'];s.loadout=['flow-counter'];s=beginBattle(s,{enemy:{hp:200}});s.hp=3;s=own(s);assert.equal(s.battle.counter,false);assert.equal(s.battle.enemy.disrupted,2);assert.ok(statusFor(s,'enemy','burn'));
});
test('주문 준비와 영역을 저장해도 복원·빠른 진행 결과가 같다',()=>{
 const s=own(duel('outer',['element']));const restored=migrate(JSON.parse(JSON.stringify(s)));assert.deepEqual(restored.battle.pathState,s.battle.pathState);assert.deepEqual(fastForward(restored),fastForward(s));
 const maintained=own(restored);assert.deepEqual(fastForward(migrate(JSON.parse(JSON.stringify(maintained)))),fastForward(maintained));
});
test('이전 저장은 학습과 장착을 유지하며 마법사의 기존 반격 태세는 교란으로 이어진다',()=>{
 const old=duel('outer');old.battle.version=3;old.battle.counter=true;old.battle.counterElement=true;delete old.battle.pathState;const s=migrate(old);assert.deepEqual(s.loadout,old.loadout);assert.deepEqual(s.learnedSkills,old.learnedSkills);assert.equal(ensurePathState(s).mode,'outer');assert.ok(abilities(s).every(a=>a.mode!=='instant'));assert.equal(s.battle.counter,false);assert.equal(s.battle.enemy.disrupted,2);
});
test('길별 조합 목록은 가능한 조합을 잠긴 목록에 중복 표시하지 않는다',()=>{
 for(const path of ['inner','outer']){const s=choose(startJourney(hero(path)),'grow-control');s.scene='synthesis';const html=marketPanel(s);for(const id of ['infused','flow-counter','aegis','tempest'])assert.equal(html.split('data-choice="combine-'+id+'"').length-1,1);}
});
test('마법사의 교란술과 유지 회복술도 기술 강화 효과를 받는다',()=>{
 let s=choose(startJourney(hero('outer')),'grow-control');s.journey.skillRanks.counter=2;s.loadout=['counter'];s=beginBattle(s);s.hp=3;s=own(s);assert.equal(s.battle.playerShield,4);assert.equal(s.battle.enemy.disrupted,2);
 s=choose(startJourney(hero('outer')),'grow-control');s.journey.learned=['mend'];s.journey.skillRanks.mend=2;s.loadout=['mend'];s=beginBattle(s,{enemy:{hp:200}});s.hp=1;s=own(s);assert.equal(s.battle.pathState.renewalPower,4);s=own(s);assert.equal(s.hp,5);
});
