import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,choose,scene,art,elements,weapons,migrate,relationshipEvents} from './dist/engine.mjs';
import {abilities,combatStats,beginBattle,tickBattle,fastForward} from './dist/combat.mjs';

function prepared(path='inner',element=0,weapon=0,training=['control','skill','partner'],name='테스트 제자'){
 let s=initial(name);for(const id of ['observe','try-'+path,'commit','element-'+element,'weapon-'+weapon,...training])s=choose(s,id);return s;
}
function battle(s,approach='guard'){return choose(choose(s,approach),'start-battle');}
test('84가지 길·결·무기 조합이 실제 전투와 첫 깨달음까지 이어진다',()=>{
 let count=0;
 for(const path of ['inner','outer'])for(let e=0;e<elements.length;e++)for(let w=0;w<weapons.length;w++){
  let s=fastForward(battle(prepared(path,e,w)));assert.ok(['victory','defeat','retreat'].includes(s.battle.outcome));assert.ok(s.battle.log.length>3);
  s=choose(s,'continue');s=choose(s,'child');s=choose(s,'resolve-control');
  assert.equal(s.scene,'ending');assert.ok(art(s).includes(elements[e]));assert.equal(s.path,path);assert.equal(s.weapon,weapons[w]);assert.ok(s.hp>0&&s.energy>=0);count++;
 }
 assert.equal(count,84);
});
test('확정 이전에 양쪽 길을 체험할 수 있고 확정 뒤에는 변경할 수 없다',()=>{
 let s=choose(choose(initial('연'),'help'),'try-inner');assert.equal(s.path,null);s=choose(s,'switch');assert.equal(s.trial,'outer');assert.equal(s.path,null);s=choose(s,'commit');assert.equal(s.path,'outer');assert.throws(()=>choose(s,'switch'));
});
test('동료는 숫자 능력치가 아닌 사건 기록을 남긴다',()=>{
 let s=initial('연');assert.ok(!('trust' in s));s=choose(s,'help');assert.deepEqual(s.relations,['first-help']);assert.equal(s.insight,0);
 s=prepared();assert.ok(s.relations.includes('shared-practice'));assert.ok(relationshipEvents(s).some(x=>x.includes('합을 맞췄다')));
});
test('함께한 수련은 한 번만 가능하며, 수치가 없어도 구조 선택에 영향을 준다',()=>{
 let s=initial('연');for(const id of ['help','try-inner','commit','element-0','weapon-0','partner'])s=choose(s,id);
 assert.equal(scene(s).choices.find(c=>c.id==='partner').disabled,true);assert.throws(()=>choose(s,'partner'));
 s.scene='bridge';s.energy=1;s.control=0;s.insight=0;assert.equal(scene(s).choices.find(c=>c.id==='both').disabled,false);
 s=choose(s,'both');assert.equal(s.energy,0);assert.ok(s.relations.includes('shared-rescue'));
});
test('수련에 따라 배운 기술이 열리고 미장착 기술은 자동 전투에서 쓰지 않는다',()=>{
 let s=prepared();assert.deepEqual(abilities(s).map(x=>x.id),['weapon','element','counter']);s.loadout=['counter'];s=fastForward(battle(s));
 assert.ok(!s.battle.log.some(x=>x.skill==='흘림검'||x.skill==='물결 · 결의 발경'));assert.ok(s.battle.log.some(x=>x.actor==='player'));
});
test('무기의 속도·위력·사거리가 전투에 반영된다',()=>{
 const bow=prepared('inner',0,4),blade=prepared('inner',0,2);assert.ok(combatStats(bow).speed>combatStats(blade).speed);assert.ok(combatStats(blade).attack>combatStats(bow).attack);
 const b=fastForward(battle(bow));assert.ok(b.battle.log.some(x=>x.text.includes('사거리')));
});
test('결의 효과가 실제 상태와 자원을 바꾼다',()=>{
 for(let i=0;i<elements.length;i++){
  let s=battle(prepared('outer',i,1));s.battle.seed=1;s.battle.actor='player';s.loadout=['element'];s.hp=7;const next=tickBattle(s);
  assert.equal(next.energy,s.energy-2);assert.ok(next.battle.enemy.hp<s.battle.enemy.hp);
  if(elements[i]==='물')assert.ok(next.battle.playerShield>s.battle.playerShield);
  if(elements[i]==='흙')assert.equal(next.battle.playerShield,s.battle.playerShield+2);
  if(elements[i]==='불')assert.equal(next.battle.enemy.burn,2);
  if(elements[i]==='나무')assert.equal(next.hp,8);
 }
});
test('직접 재생, 빠른 진행, 중간 저장 복원의 결과는 같다',()=>{
 const s=battle(prepared());let played=structuredClone(s);for(let i=0;i<110&&!played.battle.outcome;i++)played=tickBattle(played);assert.deepEqual(played,fastForward(s));
 const middle=tickBattle(tickBattle(s));assert.deepEqual(fastForward(migrate(JSON.parse(JSON.stringify(middle)))),played);assert.equal(s.battle.turn,0);
});
test('패배해도 결과 확인 전에는 진행할 수 없고, 처치 후 서장을 마칠 수 있다',()=>{
 let s=battle(prepared());assert.throws(()=>choose(s,'continue'));s.hp=1;s.battle.actor='enemy';s.battle.playerShield=0;s.battle.round=2;s.battle.stats.evasion=0;s.battle.stats.defense=0;s=tickBattle(s);assert.equal(s.battle.outcome,'defeat');assert.equal(s.hp,0);
 s=choose(s,'continue');assert.equal(s.hp,1);s=choose(s,'herbs');s=choose(s,'resolve-insight');assert.equal(s.scene,'ending');assert.ok(s.relations.includes('isol-injured'));
});
test('이전 버전 저장은 이름과 진행을 보존하고 숫자 관계를 사건으로 변환한다',()=>{
 const legacy={...prepared(),version:1,trust:3};delete legacy.relations;legacy.journal.push({scene:'수련',choice:'이솔과 서로의 빈틈을 짚어 준다'});
 const next=migrate(legacy);assert.equal(next.version,4);assert.equal(next.name,legacy.name);assert.equal(next.scene,legacy.scene);assert.ok(!('trust' in next));assert.ok(next.relations.includes('shared-practice'));assert.throws(()=>migrate({...next,weapon:'없는 무기'}));
});
test('수련·접근·기술 구성 조합에서 전투는 끝나고 자원이 범위를 벗어나지 않는다',()=>{
 const options=['control','skill','insight','partner'];let completed=0;
 for(const a of options)for(const b of options)for(const c of options){if([a,b,c].filter(x=>x==='partner').length>1)continue;
  for(const approach of ['read','guard','rush'])for(const loadout of [[],['weapon'],['element','counter']]){
   let s=prepared('outer',completed%7,completed%6,[a,b,c]);s.loadout=loadout;s=fastForward(battle(s,approach));assert.ok(s.battle.outcome);assert.ok(s.hp>=0&&s.hp<=10);assert.ok(s.energy>=0&&s.energy<=6);assert.ok(s.battle.enemy.hp>=0);assert.ok(s.battle.turn<=50);s=choose(s,'continue');assert.ok(scene(s).choices.some(x=>!x.disabled));completed++;
  }
 }
 assert.ok(completed>300);
});
