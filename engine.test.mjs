import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,choose,scene,art,elements,weapons} from './dist/engine.mjs';

function prepared(path='inner',element=0,weapon=0,training=['control','insight','trust']){
 let s=initial('테스트 제자');
 for(const id of ['observe','try-'+path,'commit','element-'+element,'weapon-'+weapon,...training])s=choose(s,id);
 return s;
}
test('모든 길·결·무기 조합이 실전과 첫 깨달음까지 이어진다',()=>{
 let count=0;
 for(const path of ['inner','outer'])for(let e=0;e<elements.length;e++)for(let w=0;w<weapons.length;w++){
  let s=prepared(path,e,w);
  for(const id of ['read','flow','both','resolve-control'])s=choose(s,id);
  assert.equal(s.scene,'ending');assert.equal(s.ending,'together');assert.ok(s.flags.includes('won'));assert.ok(art(s).includes(elements[e]));
  assert.equal(s.path,path);assert.equal(s.weapon,weapons[w]);assert.ok(s.hp>0&&s.energy>=0);count++;
 }
 assert.equal(count,84);
});
test('확정 이전에 양쪽 길을 체험하고 선택할 수 있다',()=>{
 let s=choose(choose(initial('연'),'help'),'try-inner');assert.equal(s.path,null);
 s=choose(s,'switch');assert.equal(s.trial,'outer');assert.equal(s.path,null);
 s=choose(s,'commit');assert.equal(s.path,'outer');assert.throws(()=>choose(s,'switch'));
});
test('준비가 부족하면 부상을 입지만 이야기를 끝낼 수 있다',()=>{
 let s=prepared('outer',6,4,['insight','insight','insight']);
 s=choose(s,'rush');s=choose(s,'technique');assert.ok(!s.flags.includes('won'));assert.equal(s.hp,6);
 s=choose(s,'child');s=choose(s,'resolve-trust');assert.equal(s.scene,'ending');assert.equal(s.ending,'child');
});
test('신뢰와 자원 조건은 선택지를 잠그고 엔진도 거부한다',()=>{
 let s=prepared('inner',0,0,['skill','skill','skill']);s=choose(s,'rush');
 assert.equal(scene(s).choices.find(c=>c.id==='cooperate').disabled,true);assert.throws(()=>choose(s,'cooperate'));
 s=choose(s,'technique');assert.equal(scene(s).choices.find(c=>c.id==='both').disabled,true);assert.throws(()=>choose(s,'both'));
 s=choose(s,'herbs');assert.equal(s.ending,'herbs');assert.ok(s.flags.includes('isol-injured'));
});
test('신뢰는 제어가 낮아도 협력에 의한 해결을 가능하게 한다',()=>{
 let s=prepared('outer',1,3,['trust','trust','trust']);s=choose(s,'guard');s=choose(s,'cooperate');
 assert.ok(s.flags.includes('won'));s=choose(s,'both');assert.equal(s.ending,'together');assert.ok(s.energy>=0);
});
test('저장한 상태를 복원해도 같은 선택은 같은 결과를 낸다',()=>{
 const s=prepared();const saved=JSON.parse(JSON.stringify(s));
 assert.deepEqual(choose(saved,'read'),choose(s,'read'));assert.equal(s.scene,'mission');assert.equal(s.journal.length,8);
});
test('수련과 전투의 선택 조합에서 자원이 범위를 벗어나지 않는다',()=>{
 const choices=['control','skill','insight','trust'];let completed=0;
 for(const a of choices)for(const b of choices)for(const c of choices)for(const approach of ['read','guard','rush'])for(const move of ['technique','flow','cooperate']){
  let s=choose(prepared('outer',2,5,[a,b,c]),approach);
  if(scene(s).choices.find(x=>x.id===move).disabled)continue;
  s=choose(s,move);
  for(const ending of scene(s).choices.filter(x=>!x.disabled)){
   const final=choose(choose(s,ending.id),'resolve-skill');assert.equal(final.scene,'ending');assert.ok(final.hp>=1&&final.hp<=10);assert.ok(final.energy>=0&&final.energy<=6);completed++;
  }
 }
 assert.ok(completed>1000);
});
