import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,scene,migrate} from './dist/engine.mjs';
import {chooseFixture as choose} from './test-fixtures.mjs';
import {startJourney} from './dist/journey.mjs';
import {beginBattle,tickBattle,fastForward,effectiveStats} from './dist/combat.mjs';
import {applyStatus,statusFor,activeStatuses,elementStatus,statusModifiers} from './dist/statuses.mjs';
import {routeCards} from './dist/chapter-ui.mjs';
const act=(s,...ids)=>ids.reduce((s,id)=>choose(s,id),s);
function hero(element='물'){return Object.assign(initial('상태 실험'),{path:'inner',element,weapon:'검',control:3,skill:2,insight:2,learnedSkills:['element','counter'],loadout:['element'],flags:['art-control']});}
function duel(element='물'){const s=beginBattle(hero(element),{enemy:{hp:200,attack:4,defense:2,speed:1}});s.battle.seed=1;s.battle.actor='player';return s;}
test('성장점이 생기면 장비·갈림길·전투보다 먼저 모두 배분해야 한다',()=>{
 let s=startJourney(hero());assert.equal(s.scene,'growth');assert.equal(s.journey.growthReturn,'hub');for(const id of ['to-hub','open-bag','node-fight-trail','challenge-boss'])assert.throws(()=>choose(s,id));
 s.journey.points=2;s=choose(s,'grow-control');assert.equal(s.scene,'growth');assert.equal(s.journey.points,1);assert.ok(!scene(s).choices.some(c=>c.id==='to-hub'));
 s=choose(s,'study-weapon');assert.equal(s.journey.points,0);assert.equal(s.scene,'hub');assert.equal(s.journey.route.used,0);
});
test('전투 중이던 이전 저장도 배분부터 하고 전투 보너스와 행동 위치를 보존한다',()=>{
 let s=act(startJourney(hero()),'grow-control','node-fight-trail','start-battle');s.journey.points=2;s.battle.stats.attack+=2;const attack=s.battle.stats.attack,seed=s.battle.seed,turn=s.battle.turn;
 s=migrate(s);assert.equal(s.scene,'growth');assert.equal(s.journey.growthReturn,'battle');s=choose(s,'grow-skill');assert.equal(s.scene,'growth');s=choose(s,'grow-skill');assert.equal(s.scene,'battle');assert.equal(s.battle.stats.attack,attack+1);assert.equal(s.battle.seed,seed);assert.equal(s.battle.turn,turn);
});
test('전투 정산으로 얻은 성장점은 배분 후 보상 화면으로 정확히 돌아온다',()=>{
 let s=act(startJourney(hero()),'grow-control','node-fight-trail','start-battle');s.journey.xp=5;s=fastForward(s);assert.equal(s.battle.outcome,'victory');s=choose(s,'continue');assert.equal(s.scene,'growth');assert.equal(s.journey.growthReturn,'reward');const gold=s.journey.gold;
 const saved=migrate(JSON.parse(JSON.stringify(s)));assert.equal(saved.scene,'growth');assert.throws(()=>choose(saved,'to-hub'));s=choose(saved,'grow-skill');assert.equal(s.scene,'reward');assert.equal(s.journey.gold,gold);assert.throws(()=>choose(s,'continue'));
});
test('이벤트 성장과 기존 저장도 미사용 성장점 배분을 강제한다',()=>{
 let s=choose(startJourney(hero()),'grow-control');s.journey.xp=5;s.journey.route.used=4;s=act(s,'node-story-scout','event-training');assert.equal(s.scene,'growth');assert.equal(s.journey.route.used,5);s=choose(s,'grow-insight');assert.equal(s.scene,'hub');assert.equal(s.journey.route.used,5);
 s.scene='shop';s.journey.points=1;s=migrate(s);assert.equal(s.scene,'growth');s=choose(s,'grow-control');assert.equal(s.scene,'shop');
});
test('갈림길 카드는 종류만 표시하고 보상·상대·이벤트 결과를 노출하지 않는다',()=>{
 let s=choose(startJourney(hero()),'grow-control');let html=routeCards(s);assert.match(html,/전투/);assert.match(html,/상점/);assert.match(html,/이벤트/);for(const phrase of ['매복꾼','경험 4','엽전 5','보급','강화석','멈춰 선 행상'])assert.ok(!html.includes(phrase));
 assert.deepEqual(scene(s).choices.filter(c=>c.id.startsWith('node-')).map(c=>c.hint),['','','']);
});
test('일곱 속성의 적중 기술은 각각 다른 상태를 부여한다',()=>{
 for(const [element,id] of Object.entries(elementStatus)){let s=duel(element);s=tickBattle(s);assert.ok(statusFor(s,'enemy',id),element);assert.ok(s.battle.effects.some(e=>e.kind==='status'&&e.status===id));}
});
test('화상은 방어 행동 중에도 행동 시작에 보호막을 무시하고 피해를 준다',()=>{
 let s=duel();s.loadout=[];s.battle.round=3;s.battle.playerShield=5;applyStatus(s,'player','burn');s=tickBattle(s);assert.equal(s.hp,9);assert.equal(s.battle.playerShield,5);assert.equal(statusFor(s,'player','burn').turns,1);
 s.battle.actor='player';s=tickBattle(s);assert.equal(s.hp,8);assert.equal(statusFor(s,'player','burn'),null);
});
test('출혈은 공격할 때만 피해를 주고 방어 행동에는 피해를 주지 않는다',()=>{
 let s=duel();s.loadout=[];s.battle.round=3;applyStatus(s,'player','bleed');s=tickBattle(s);assert.equal(s.hp,10);assert.ok(s.battle.effects.some(e=>e.label==='기본 방어'));
 s.battle.actor='player';s.battle.round=4;s.battle.playerShield=20;s=tickBattle(s);assert.equal(s.hp,9);assert.equal(s.battle.playerShield,20);assert.ok(s.battle.effects.some(e=>e.kind==='bleed'));
});
test('부식은 방어를 최대 두 단계 낮추고 보호막을 깎으며 체력을 직접 깎지 않는다',()=>{
 let s=duel();for(let i=0;i<5;i++)applyStatus(s,'player','corrosion');assert.equal(statusFor(s,'player','corrosion').stacks,2);assert.equal(effectiveStats(s).defense,0);s.loadout=[];s.battle.playerShield=5;s=tickBattle(s);assert.equal(s.hp,10);assert.equal(s.battle.playerShield,4);
 const base=duel();const corroded=structuredClone(base);applyStatus(corroded,'enemy','corrosion');applyStatus(corroded,'enemy','corrosion');const cleanHit=tickBattle(base),weakHit=tickBattle(corroded);assert.equal(cleanHit.battle.enemy.hp-weakHit.battle.enemy.hp,2);
});
test('감전은 다음 행동의 기술을 봉쇄하지만 행동 전체를 빼앗지 않는다',()=>{
 let s=duel();applyStatus(s,'player','shock');const energy=s.energy;s=tickBattle(s);assert.equal(s.energy,energy);assert.ok(s.battle.effects.some(e=>e.kind==='attack'));assert.ok(!s.battle.effects.some(e=>e.kind==='skill'));assert.equal(statusFor(s,'player','shock'),null);
 s=duel();s.battle.actor='enemy';s.battle.round=3;s.battle.stats.evasion=0;applyStatus(s,'enemy','shock');s=tickBattle(s);assert.ok(s.battle.effects.some(e=>e.actor==='enemy'&&e.kind==='attack'));assert.ok(!s.battle.effects.some(e=>e.actor==='enemy'&&e.kind==='skill'));
});
test('중독은 지속 피해 대신 회복량·숨 회복·공격을 약화한다',()=>{
 let s=startJourney(hero());s=choose(s,'grow-control');s.journey.learned=['mend'];s.loadout=['mend'];s=beginBattle(s);s.hp=2;applyStatus(s,'player','poison');s.battle.actor='player';s=tickBattle(s);assert.equal(s.hp,4);assert.equal(statusModifiers(s,'player').recovery,1);assert.ok(!s.battle.effects.some(e=>e.kind==='poison'));
 const base=duel();const poisoned=structuredClone(base);applyStatus(poisoned,'player','poison');assert.equal(effectiveStats(poisoned).attack,effectiveStats(base).attack-1);
});
test('냉기는 위력을, 흔들림은 명중률을 낮추며 체력을 직접 줄이지 않는다',()=>{
 const base=duel();applyStatus(base,'player','chill');applyStatus(base,'player','unsteady');assert.equal(effectiveStats(base).attack,base.battle.stats.attack-1);assert.equal(effectiveStats(base).accuracy,base.battle.stats.accuracy-.15);const s=tickBattle(base);assert.equal(s.hp,10);
});
test('적의 속성 강타도 플레이어에게 상태이상을 부여하고 전투마다 초기화된다',()=>{
 let s=beginBattle(hero(),{enemy:{element:'쇠',hp:200,attack:10,speed:20,heavyEvery:1}});s.battle.stats.evasion=0;s.battle.actor='enemy';s.battle.seed=1;s=tickBattle(s);assert.ok(statusFor(s,'player','bleed'));s=beginBattle(s);assert.deepEqual(activeStatuses(s,'player'),[]);
});
test('상태이상은 저장·복원·빠른 진행에서 같은 결과를 내며 재생으로 중복 적용되지 않는다',()=>{
 let s=duel('흙');applyStatus(s,'enemy','burn');applyStatus(s,'player','bleed');s=tickBattle(s);assert.deepEqual(fastForward(migrate(JSON.parse(JSON.stringify(s)))),fastForward(s));const copy=structuredClone(s);activeStatuses(s,'player');effectiveStats(s);assert.deepEqual(s,copy);
});
test('이전 전투의 연소 상태도 새 화상 상태로 이어진다',()=>{
 let s=duel();delete s.battle.statuses;s.battle.enemy.burn=2;s.battle.actor='enemy';s.battle.stats.evasion=1;const hp=s.battle.enemy.hp;s=tickBattle(s);assert.equal(s.battle.enemy.hp,hp-1);assert.equal(statusFor(s,'enemy','burn').turns,1);
});
