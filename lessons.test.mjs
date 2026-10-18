import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,scene,migrate} from './dist/engine.mjs';
import {chooseFixture as choose} from './test-fixtures.mjs';
import {abilities,beginBattle,tickBattle} from './dist/combat.mjs';
import {startJourney} from './dist/journey.mjs';
const act=(s,...ids)=>ids.reduce((s,id)=>choose(s,id),s);
const novice=()=>act(initial('서린'),'observe','try-inner','commit','element-0','weapon-1');
const lesson=()=>act(novice(),'control','skill','partner');
test('처음에는 공격과 방어만 사용하며 능력치 상승은 기술을 자동 지급하지 않는다',()=>{
 const s=novice();s.control=10;s.insight=10;assert.deepEqual(abilities(s),[]);assert.deepEqual(s.loadout,[]);
 let b=beginBattle(s);b.battle.actor='player';b.battle.round=3;b=tickBattle(b);
 assert.ok(b.battle.effects.some(e=>e.kind==='guard'&&e.label==='기본 방어'));assert.equal(b.energy,s.energy);
 b.battle.actor='enemy';b.battle.stats.evasion=0;b.battle.seed=1;b=tickBattle(b);assert.ok(b.battle.effects.some(e=>e.kind==='block'));
});
test('첫 수련 후 세 후보 중 정확히 하나를 선택하고 자동 장착한다',()=>{
 for(const id of ['weapon','element','counter']){let s=lesson();assert.equal(s.scene,'first-lesson');assert.equal(scene(s).choices.length,3);assert.equal(abilities(s).length,0);s=choose(s,'pick-'+id);assert.equal(s.scene,'mission');assert.deepEqual(abilities(s).map(a=>a.id),[id]);assert.deepEqual(s.loadout,[id]);assert.throws(()=>choose(s,'pick-weapon'));}
});
test('성장점으로 선택한 기술 하나만 배우며 비용과 중복 제한을 적용한다',()=>{
 let s=startJourney(choose(lesson(),'pick-weapon'));s=choose(s,'study-counter');
 assert.equal(s.journey.points,0);assert.deepEqual(abilities(s).map(a=>a.id),['weapon','counter']);assert.deepEqual(s.loadout,['weapon','counter']);assert.throws(()=>choose(s,'study-counter'));assert.throws(()=>choose(s,'study-element'));
});
test('교관에게 배운 기본 기술도 재화를 지불하고 하나씩 익힌다',()=>{
 let s=startJourney(choose(lesson(),'pick-weapon'));s=act(s,'grow-insight','node-story-caravan','event-lift','node-mentor');const before=s.journey.gold;s=choose(s,'learn-element');
 assert.equal(s.journey.gold,before-6);assert.deepEqual(abilities(s).map(a=>a.id),['weapon','element']);assert.throws(()=>choose(s,'learn-element'));assert.deepEqual(s.loadout,['weapon','element']);
});
test('기술 장착 두 칸이 차면 새 기술은 기존 구성을 바꾸지 않는다',()=>{
 let s=startJourney(choose(lesson(),'pick-weapon'));s=act(s,'study-counter','node-story-caravan','event-lift','node-mentor','learn-element');
 assert.deepEqual(s.loadout,['weapon','counter']);assert.equal(abilities(s).length,3);
});
test('새 학습 기록은 저장과 재도전 시점에 보존된다',()=>{
 let s=startJourney(choose(lesson(),'pick-weapon'));s=act(s,'study-element');assert.deepEqual(migrate(JSON.parse(JSON.stringify(s))),s);s.journey.route.ended='defeat';s=choose(s,'retry-chapter');assert.deepEqual(s.learnedSkills,['weapon']);assert.equal(s.version,6);
});
test('기존 저장과 챕터 시작점에 있던 기술은 유지된다',()=>{
 const old=startJourney(choose(lesson(),'pick-weapon'));old.version=5;delete old.learnedSkills;old.journey.route.checkpoint.version=5;delete old.journey.route.checkpoint.learnedSkills;const s=migrate(old);assert.deepEqual(s.learnedSkills,['weapon','element','counter']);assert.equal(s.version,6);assert.deepEqual(s.journey.route.checkpoint.learnedSkills,['weapon','element','counter']);
});
