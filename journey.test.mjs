import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,choose,scene,migrate} from './dist/engine.mjs';
import {startJourney,zones,xpNeeded} from './dist/journey.mjs';
import {abilities,combatStats,fastForward,tickBattle,maxHp,maxEnergy} from './dist/combat.mjs';
function hero(path='inner',weapon=1,element=0){let s=initial('여울');for(const id of ['observe','try-'+path,'commit','element-'+element,'weapon-'+weapon,'control','skill','partner','guard','start-battle'])s=choose(s,id);s=fastForward(s);for(const id of ['continue','child','resolve-control','next-chapter'])s=choose(s,id);return s;}
function fight(s,zone='trail'){s=choose(s,'open-map');s=choose(s,'explore-'+zone);s=choose(s,'start-battle');return fastForward(s);}
function strong(s){s.journey.level=4;s.journey.gear=3;s.journey.armor=2;s.control+=3;s.skill+=3;s.insight+=2;s.hp=maxHp(s);s.energy=maxEnergy(s);s.loadout=['signature','weapon'];return s;}
test('서장 완료 저장에서 이름·길·무기·깨달음을 보존하고 탐험에 진입한다',()=>{
 const s=hero();assert.equal(s.scene,'hub');assert.equal(s.name,'여울');assert.equal(s.path,'inner');assert.equal(s.weapon,'검');assert.ok(abilities(s).some(a=>a.id==='signature'));assert.equal(s.journey.points,1);assert.equal(s.hp,maxHp(s));
 const old={...structuredClone(s),version:2,scene:'ending'};delete old.journey;const restored=migrate(old);const next=choose(restored,'next-chapter');assert.equal(next.scene,'hub');assert.equal(next.journey.gold,8);
});
test('새 지역은 앞선 승리의 단서가 있어야 열리고 엔진도 잠금을 강제한다',()=>{
 let s=choose(hero(),'open-map');assert.equal(scene(s).choices.find(c=>c.id==='explore-pass').disabled,true);assert.throws(()=>choose(s,'explore-pass'));
 s=strong(choose(s,'to-hub'));s=fight(s);assert.equal(s.battle.enemy.name,zones[0].enemy.name);assert.equal(s.battle.outcome,'victory');s=choose(s,'continue');assert.ok(s.journey.cleared.includes('trail'));
 s=choose(choose(s,'to-hub'),'open-map');assert.equal(scene(s).choices.find(c=>c.id==='explore-waterway').disabled,false);
});
test('승리 보상은 한 번만 정산되고 재탐험에서도 중복 단서 보상은 없다',()=>{
 let s=fight(strong(hero()));const before={gold:s.journey.gold,ore:s.journey.ore,herbs:s.journey.herbs};s=choose(s,'continue');
 assert.equal(s.journey.gold,before.gold+5);assert.equal(s.journey.ore,before.ore+1);assert.equal(s.journey.herbs,before.herbs+1);assert.throws(()=>choose(s,'continue'));
 s=choose(s,'to-hub');s.hp=maxHp(s);s.energy=maxEnergy(s);s=choose(fight(s),'continue');assert.equal(s.journey.reward.first,false);assert.equal(s.journey.herbs,before.herbs+1);assert.equal(s.journey.history.length,2);
});
test('등급 상승은 경험을 소모하고 최대 자원과 배분 가능한 성장점을 늘린다',()=>{
 let s=strong(hero());s.journey.level=1;s.journey.xp=xpNeeded(s.journey)-1;const points=s.journey.points;s=choose(fight(s),'continue');
 assert.equal(s.journey.level,2);assert.equal(s.journey.points,points+1);assert.equal(maxHp(s),12);assert.equal(s.journey.xp,3);
 s=choose(choose(s,'to-hub'),'rest');assert.equal(s.hp,12);assert.equal(s.energy,maxEnergy(s));
});
test('성장점과 장비 보강의 지출이 능력과 실제 전투에 반영된다',()=>{
 let s=choose(hero(),'open-growth');const skill=s.skill;s=choose(s,'grow-skill');assert.equal(s.skill,skill+1);assert.equal(s.journey.points,0);assert.throws(()=>choose(s,'grow-skill'));
 s=choose(choose(s,'to-hub'),'open-forge');const power=combatStats(s).attack;s=choose(s,'upgrade-gear');assert.equal(combatStats(s).attack,power+1);assert.equal(s.journey.gold,2);assert.equal(s.journey.ore,1);assert.throws(()=>choose(s,'upgrade-armor'));
});
test('기술 강화는 실제 같은 타격의 피해를 높이고 소비 자원은 유지한다',()=>{
 let s=hero();s.loadout=['weapon'];s=choose(choose(choose(s,'open-map'),'explore-trail'),'start-battle');s.battle.actor='player';s.battle.seed=1;
 const before=tickBattle(s);const upgraded=structuredClone(s);upgraded.journey.skillRanks.weapon=2;const after=tickBattle(upgraded);
 assert.ok(after.battle.enemy.hp<before.battle.enemy.hp);assert.equal(after.energy,before.energy);
});
test('패배하면 무보상으로 복귀하고 무료 휴식과 재도전이 가능하다',()=>{
 let s=choose(choose(choose(hero(),'open-map'),'explore-trail'),'start-battle');s.hp=0;s=fastForward(s);s=choose(s,'continue');assert.equal(s.journey.reward.outcome,'defeat');assert.equal(s.journey.reward.gold,0);assert.ok(s.hp>=1);
 s=choose(choose(s,'to-hub'),'rest');assert.equal(s.hp,maxHp(s));assert.equal(s.energy,maxEnergy(s));s=choose(choose(s,'open-map'),'explore-trail');assert.equal(s.scene,'combat');
});
test('전투 준비 중에만 약초를 쓸 수 있고 개수와 체력을 제한한다',()=>{
 let s=choose(choose(hero(),'open-map'),'explore-trail');assert.throws(()=>choose(s,'use-herb'));s.hp=2;const herbs=s.journey.herbs;s=choose(s,'use-herb');assert.equal(s.hp,8);assert.equal(s.journey.herbs,herbs-1);s.journey.herbs=0;assert.throws(()=>choose(s,'use-herb'));
});
test('새 적도 재생·빠른 진행·중간 저장 복원 결과가 같다',()=>{
 let s=strong(hero());s.journey.cleared=['trail'];s=choose(choose(choose(s,'open-map'),'explore-waterway'),'start-battle');const mid=tickBattle(s);assert.deepEqual(fastForward(mid),fastForward(migrate(JSON.parse(JSON.stringify(mid)))));
});
test('84가지 캐릭터 조합이 장비와 수련으로 우두머리를 넘고 의뢰를 마칠 수 있다',()=>{
 let count=0;
 for(const path of ['inner','outer'])for(let w=0;w<6;w++)for(let e=0;e<7;e++){
  let s=strong(hero(path,w,e));s.journey.cleared=['trail','waterway'];s=fight(s,'pass');assert.equal(s.battle.outcome,'victory',path+'/'+w+'/'+e);s=choose(s,'continue');assert.equal(s.journey.complete,true);
  s=choose(s,'to-hub');assert.ok(scene(s).choices.some(c=>c.id==='read-letter'));s=choose(s,'read-letter');assert.equal(s.scene,'chapter-end');s=choose(s,'to-hub');assert.equal(s.scene,'hub');count++;
 }assert.equal(count,84);
});
