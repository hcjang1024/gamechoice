import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,scene,migrate,relationshipEvents} from './dist/engine.mjs';
import {chooseFixture as choose} from './test-fixtures.mjs';
import {startJourney,advanceChapter,zoneFor} from './dist/journey.mjs';
import {secondZones,campaignFor} from './dist/campaign.mjs';
import {optionsFor} from './dist/chapter.mjs';
import {chapterProgress,routeCards} from './dist/chapter-ui.mjs';
import {beginBattle,tickBattle,fastForward,maxHp} from './dist/combat.mjs';
import {opponentArt} from './dist/battle-stage.mjs';
const act=(s,...ids)=>ids.reduce((s,id)=>choose(s,id),s);
function hero(path='inner'){const h=Object.assign(initial('새 길'),{path,element:'물',weapon:'검',control:4,skill:3,insight:2,learnedSkills:['weapon','element','counter'],loadout:['signature','flow-counter'],flags:['art-control']});let s=choose(startJourney(h),'hone-signature');Object.assign(s.journey,{level:3,gold:25,ore:8,gear:1,learned:['flow-counter']});return s;}
function completed(){const s=hero();s.journey.complete=true;s.journey.route.used=6;s.journey.route.ended='victory';return s;}
function next(){return act(completed(),'read-letter','next-journey');}
test('첫 챕터의 승리 결말에서만 두 번째 챕터로 이동할 수 있다',()=>{
 assert.throws(()=>advanceChapter(hero()));assert.throws(()=>choose(hero(),'next-journey'));const s=completed();assert.throws(()=>choose(s,'next-journey'));const end=choose(s,'read-letter');assert.ok(scene(end).choices.some(c=>c.id==='next-journey'));assert.equal(choose(end,'next-journey').journey.chapter,2);
});
test('새 챕터는 성장·이름·길·장비·기술을 유지하고 여정과 전투 상태만 새로 시작한다',()=>{
 const before=completed(),s=act(before,'read-letter','next-journey');for(const key of ['name','path','weapon','element','control','skill','insight','learnedSkills','loadout'])assert.deepEqual(s[key],before[key]);
 for(const key of ['level','gear','armor','learned','skillRanks','inventory','equipped'])assert.deepEqual(s.journey[key],before.journey[key]);assert.equal(s.journey.gold,before.journey.gold+8);assert.equal(s.journey.herbs,before.journey.herbs+1);assert.equal(s.hp,maxHp(s));assert.equal(s.journey.route.used,0);assert.equal(s.journey.completedChapters.length,1);assert.equal(s.battle,null);
});
test('챕터 전환과 여비 지급을 반복 호출해 재화를 쌓을 수 없다',()=>{
 let s=next();assert.throws(()=>choose(s,'next-journey'));assert.throws(()=>advanceChapter(s));const gold=s.journey.gold;s.journey.route.ended='defeat';s=choose(s,'retry-chapter');assert.equal(s.journey.gold,gold);assert.equal(s.journey.completedChapters.length,1);assert.equal(s.journey.chapter,2);
});
test('두 번째 챕터도 여섯 갈림길이며 첫 챕터 전투로 돌아갈 수 없다',()=>{
 const s=next();assert.equal(s.journey.route.total,6);assert.equal(optionsFor(s).length,3);assert.throws(()=>choose(s,'node-fight-trail'));assert.throws(()=>choose(s,'challenge-boss'));assert.match(chapterProgress(s),/CHAPTER 02/);assert.match(routeCards(s),/전투/);assert.ok(!routeCards(s).includes('독침꾼'));
});
test('새 사건은 선택 뒤 한 번만 보상하고 기존 결과 예고를 숨긴다',()=>{
 let s=act(next(),'node-story-ledger');assert.ok(scene(s).choices.every(c=>c.hint===''));const hp=s.hp,gold=s.journey.gold;s=choose(s,'event-carry');assert.equal(s.hp,hp-2);assert.equal(s.journey.gold,gold+10);assert.equal(s.journey.route.used,1);assert.throws(()=>choose(s,'event-carry'));
});
test('새 사건의 경험 보상도 성장점을 얻으면 다음 선택 전에 배분을 강제한다',()=>{
 let s=next();s.journey.xp=11;s=act(s,'node-story-ledger','event-copy');assert.equal(s.scene,'growth');assert.throws(()=>choose(s,'node-mentor'));s=choose(s,'grow-control');assert.equal(s.scene,'hub');assert.equal(s.journey.route.used,1);
});
test('이솔과 밤 경계를 나눈 기록은 능력치와 별개로 보스 주문을 약화한다',()=>{
 let s=next();s.journey.route.used=4;s=act(s,'node-story-watch','event-together');assert.ok(s.relations.includes('shared-watch'));assert.ok(relationshipEvents(s).some(x=>x.includes('밤 경계')));s=act(s,'node-forge','to-hub','challenge-boss','start-battle');assert.equal(s.battle.enemy.castPower,3);
});
test('인장 단서는 보스 보호막의 시작량과 보충량을 줄인다',()=>{
 let s=next();s.journey.route.used=2;s=act(s,'node-story-watermarks','event-trace');s.journey.route.used=6;s=act(s,'challenge-boss','start-battle');assert.equal(s.battle.enemy.shield,1);assert.equal(s.battle.enemy.wardAmount,3);assert.equal(opponentArt(s),'seal-mage');
});
test('두 번째 챕터 재도전은 그 챕터 시작점으로 돌아가며 첫 챕터 기록은 유지한다',()=>{
 let s=next();const gold=s.journey.gold,skill=s.skill;s=act(s,'node-story-ledger','event-carry');s.skill+=5;s.journey.route.ended='defeat';s=choose(s,'retry-chapter');assert.equal(s.journey.chapter,2);assert.equal(s.journey.route.used,0);assert.equal(s.journey.gold,gold);assert.equal(s.skill,skill);assert.equal(s.journey.completedChapters.length,1);assert.ok(!s.journey.route.checkpoint.journey.route);
});
test('기존 첫 챕터 완료 저장도 새로 시작하지 않고 다음 챕터로 이어진다',()=>{
 const raw=completed();delete raw.journey.chapter;delete raw.journey.completedChapters;const s=act(migrate(raw),'read-letter','next-journey');assert.equal(campaignFor(s).id,2);assert.equal(s.name,raw.name);assert.equal(s.journey.route.checkpoint.journey.chapter,2);assert.deepEqual(migrate(JSON.parse(JSON.stringify(s))),s);
});
test('수로의 마법 적은 준비 행동 뒤에 주문을 발동한다',()=>{
 let s=beginBattle(hero(),{enemy:zoneFor('canal-sentry').enemy,zone:'canal-sentry'});s.battle.actor='enemy';s.battle.round=3;s.battle.stats.evasion=0;s.battle.seed=1;const hp=s.hp;s=tickBattle(s);assert.equal(s.hp,hp);assert.ok(s.battle.enemy.casting);assert.ok(s.battle.effects.some(e=>e.kind==='cast'&&e.actor==='enemy'));s.battle.actor='enemy';s=tickBattle(s);assert.equal(s.battle.enemy.casting,null);assert.ok(s.battle.effects.some(e=>e.magic&&e.kind==='skill'&&e.actor==='enemy'));
});
test('보스는 정해진 공방에 보호막을 보충하고 직접 공격은 보호막부터 깎는다',()=>{
 let s=beginBattle({...hero(),loadout:[]},{enemy:zoneFor('sealkeeper').enemy,zone:'sealkeeper'});s.battle.actor='enemy';s.battle.round=4;const hp=s.hp;s=tickBattle(s);assert.equal(s.hp,hp);assert.equal(s.battle.enemy.shield,9);s.battle.actor='player';s.battle.round=5;s.battle.seed=1;const enemyHp=s.battle.enemy.hp;s=tickBattle(s);assert.equal(s.battle.enemy.hp,enemyHp);assert.ok(s.battle.enemy.shield<9);assert.ok(s.battle.effects.some(e=>e.kind==='block'&&e.actor==='enemy'));
});
test('충분히 강한 타격이나 교란으로 적의 준비 주문을 끊을 수 있다',()=>{
 let s=beginBattle({...hero(),loadout:['signature']},{enemy:{...zoneFor('canal-sentry').enemy,casting:{name:'수로의 결박'}}});s.battle.actor='player';s.battle.seed=1;s=tickBattle(s);assert.equal(s.battle.enemy.casting,null);
 s=beginBattle({...hero('outer'),loadout:['flow-counter']},{enemy:{...zoneFor('canal-sentry').enemy,casting:{name:'수로의 결박'}}});s.battle.actor='player';s=tickBattle(s);assert.ok(s.battle.enemy.disrupted);s.battle.actor='enemy';s=tickBattle(s);assert.equal(s.battle.enemy.casting,null);assert.ok(!s.battle.effects.some(e=>e.magic&&e.kind==='skill'&&e.actor==='enemy'));
});
test('새 적의 주문과 보호막도 저장 복원 및 빠른 진행 결과가 같다',()=>{
 let s=beginBattle(hero('outer'),{enemy:zoneFor('sealkeeper').enemy,zone:'sealkeeper'});s.journey.active='sealkeeper';s.battle.actor='enemy';s.battle.round=3;s=tickBattle(s);assert.ok(s.battle.enemy.casting);assert.deepEqual(fastForward(migrate(JSON.parse(JSON.stringify(s)))),fastForward(s));assert.equal(secondZones.length,3);
});
test('두 번째 보스 승리 뒤에는 결말을 보고 종료하며 미구현 챕터로 넘어갈 수 없다',()=>{
 let s=next();s.journey.route.used=6;s=act(s,'challenge-boss','start-battle');s.battle.enemy.hp=1;s.battle.seed=1;s.battle.actor='player';s=fastForward(s);assert.equal(s.battle.outcome,'victory');s=choose(s,'continue');while(s.scene==='growth')s=choose(s,'grow-control');s=choose(s,'read-letter');assert.match(scene(s).title,/산문/);assert.ok(!scene(s).choices.some(c=>c.id==='next-journey'));s=choose(s,'to-hub');assert.equal(optionsFor(s).length,0);assert.throws(()=>choose(s,'next-journey'));
});
