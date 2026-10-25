import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,migrate} from './dist/engine.mjs';
import {chooseFixture as choose} from './test-fixtures.mjs';
import {startJourney} from './dist/journey.mjs';
import {abilities,combatStats,maxHp,maxEnergy,tickBattle,beginBattle,fastForward} from './dist/combat.mjs';
import {items,itemCount} from './dist/workshop.mjs';
function hero(stop=0){const base=initial('가람');Object.assign(base,{path:'inner',weapon:'검',element:'물',control:2,skill:2,insight:2,flags:['art-control'],learnedSkills:['weapon','element','counter'],loadout:['weapon','element']});const s=choose(startJourney(base),'hone-counter');s.journey.gold=200;s.journey.ore=20;s.journey.route.used=stop;return s;}
const act=(s,...ids)=>ids.reduce((x,id)=>{while(x.scene==='growth'&&x.journey.points&&!/^(grow-|study-|hone-)/.test(id))x=choose(x,'grow-insight');return choose(x,id);},s);
test('상점의 장비 7종과 소모품 7종은 실제 구입 가능하고 지출을 기록한다',()=>{
 let s=act(hero(),'node-shop');assert.equal(items.filter(i=>i.grade==='common'&&i.type==='equipment').length,7);assert.equal(items.filter(i=>i.grade==='common'&&i.type==='consumable').length,7);
 s=choose(s,'buy-item-bracer');assert.equal(s.journey.gold,190);assert.equal(itemCount(s.journey,'bracer'),1);assert.throws(()=>choose(s,'buy-item-bracer'));
 s=choose(s,'buy-item-herb');assert.equal(s.journey.herbs,3);s.journey.gold=0;assert.throws(()=>choose(s,'buy-item-breath'));
});
test('같은 부위의 장비는 교체되고 효과가 중복되지 않는다',()=>{
 let s=act(hero(),'node-shop','buy-item-bracer','buy-item-gloves','open-bag');const base=combatStats(s);s=choose(s,'equip-item-bracer');assert.equal(combatStats(s).attack,base.attack+1);assert.equal(combatStats(s).defense,base.defense+1);
 s=choose(s,'equip-item-gloves');assert.equal(s.journey.equipped.hands,'gloves');assert.equal(combatStats(s).attack,base.attack);assert.ok(combatStats(s).accuracy>base.accuracy);
 s=choose(s,'equip-item-gloves');assert.ok(!s.journey.equipped.hands);assert.equal(combatStats(s).accuracy,base.accuracy);
});
test('최대 자원 장비 해제 시 현재 자원도 새 상한으로 제한된다',()=>{
 let s=act(hero(),'node-shop','buy-item-robe','buy-item-charm','open-bag','equip-item-robe','equip-item-charm');assert.equal(maxHp(s),12);assert.equal(maxEnergy(s),8);s.hp=12;s.energy=8;
 s=act(s,'equip-item-robe','equip-item-charm');assert.equal(s.hp,10);assert.equal(s.energy,6);
});
test('소모품은 개수와 사용 조건을 지키고 준비 효과는 다음 전투 한 번만 적용된다',()=>{
 let s=act(hero(),'node-shop','buy-item-oil','buy-item-ward','buy-item-breath','open-bag');s.energy=1;s=choose(s,'use-item-breath');assert.equal(s.energy,5);assert.throws(()=>choose(s,'use-item-breath'));
 s=act(s,'use-item-oil','use-item-ward');const boosted=combatStats(s).attack;s=act(s,'bag-back','to-hub','node-fight-waterway','start-battle');assert.equal(s.battle.stats.attack,boosted);assert.equal(s.battle.playerShield,4);assert.deepEqual(s.journey.prepBuffs,{});assert.equal(combatStats(s).attack,boosted-2);
});
test('전투 준비의 소지품에서 돌아가도 지역과 도전 상태가 유지된다',()=>{
 let s=act(hero(),'node-fight-trail','open-bag');assert.equal(s.scene,'bag');assert.equal(s.journey.active,'trail');const runs=s.journey.runs;s=choose(s,'bag-back');assert.equal(s.scene,'combat');assert.equal(s.journey.active,'trail');assert.equal(s.journey.runs,runs);
});
test('기술 습득은 조건과 비용을 검사하며 중복 습득을 막는다',()=>{
 let s=act(hero(1),'node-forge','open-school','learn-guard');assert.equal(s.journey.gold,194);assert.ok(abilities(s).some(a=>a.id==='guard'));assert.throws(()=>choose(s,'learn-guard'));
 s.skill=1;assert.throws(()=>choose(s,'learn-chain'));
});
test('기술 조합은 재료 가르침을 유지하며 상위 조합으로 이어진다',()=>{
 const base=hero(1);base.journey.level=2;let s=act(base,'node-forge','open-school','learn-chain','open-synthesis','combine-infused');assert.ok(abilities(s).some(a=>a.id==='weapon'));assert.ok(abilities(s).some(a=>a.id==='element'));assert.ok(abilities(s).some(a=>a.id==='infused'));assert.equal(s.journey.ore,19);
 s=choose(s,'combine-tempest');assert.ok(abilities(s).some(a=>a.id==='tempest'));assert.throws(()=>choose(s,'combine-tempest'));assert.throws(()=>choose(s,'combine-aegis'));
});
test('조합 기술은 장착하면 자동 전투에서 비용을 소모하고 연속 타격한다',()=>{
 const base=hero(1);base.journey.level=2;let s=act(base,'node-forge','open-school','learn-chain','open-synthesis','combine-infused','combine-tempest','to-hub');s.loadout=['tempest'];s=act(s,'node-fight-trail','start-battle');s.battle.enemy.hp=100;s.battle.enemy.maxHp=100;s.battle.seed=1;s.battle.actor='player';const energy=s.energy;s=tickBattle(s);assert.equal(s.energy,energy-4);assert.equal(s.battle.effects.filter(e=>e.actor==='player'&&['attack','skill'].includes(e.kind)).length,3);
});
test('공격·방어·흡수·반격을 실제 판정의 연출 사건으로 분리한다',()=>{
 let s=beginBattle(hero(),{enemy:{defense:2}});s.battle.seed=1;s.battle.actor='player';s=tickBattle(s);assert.ok(s.battle.effects.some(e=>e.kind==='skill'));assert.ok(s.battle.effects.some(e=>e.kind==='block'&&e.actor==='enemy'));
 s=hero();s.hp=3;s.loadout=['counter'];s=beginBattle(s);s.battle.actor='player';s.battle.round=2;s.battle.stats.evasion=0;s.battle.seed=1;s=tickBattle(s);assert.ok(s.battle.effects.some(e=>e.kind==='guard'));s=tickBattle(s);assert.ok(s.battle.effects.some(e=>e.kind==='block'));assert.ok(s.battle.effects.some(e=>e.kind==='counter'&&e.actor==='player'));
});
test('우두머리는 반격 태세를 잡고 플레이어의 공격에 역습한다',()=>{
 let s=beginBattle(hero(),{enemy:{hp:100,attack:4,counterEvery:3}});s.battle.actor='enemy';s.battle.round=3;s.battle.stats.range=0;s.battle.seed=1;s=tickBattle(s);assert.equal(s.battle.enemy.counterReady,true);s.battle.seed=1;s=tickBattle(s);assert.ok(s.battle.effects.some(e=>e.kind==='counter'&&e.actor==='enemy'));
});
test('조합 반격을 장착하면 기본 수비보다 우선해 반격 태세를 잡는다',()=>{
 let s=act(hero(1),'node-forge','open-school','learn-guard','open-synthesis','combine-flow-counter','to-hub');s.loadout=['flow-counter'];s=act(s,'node-fight-trail','start-battle');s.battle.actor='player';s.battle.round=3;s.battle.playerShield=0;s=tickBattle(s);assert.equal(s.battle.counter,true);assert.equal(s.battle.counterElement,true);assert.ok(s.battle.effects.some(e=>e.label.includes('회류반격')));
});
test('기존 저장에 빈 소지품과 학습 기록을 추가하며 진행과 재화를 보존한다',()=>{
 const old=hero();old.version=3;delete old.journey.inventory;delete old.journey.equipped;delete old.journey.learned;delete old.journey.prepBuffs;const s=migrate(old);assert.equal(s.version,6);assert.equal(s.journey.gold,200);assert.deepEqual(s.journey.equipped,{});assert.deepEqual(s.journey.learned,[]);
});
test('연출 사건이 있는 전투도 저장 복원과 빠른 진행 결과가 같다',()=>{
 const s=act(hero(),'node-fight-trail','start-battle');const mid=tickBattle(s);assert.deepEqual(fastForward(mid),fastForward(migrate(JSON.parse(JSON.stringify(mid)))));
});
