import {passiveDefinitions,grantPassive} from './dist/passives.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,choose,scene,migrate,weapons,elements} from './dist/engine.mjs';
import {startJourney,advanceChapter} from './dist/journey.mjs';
import {abilities,abilityCatalog,combatStats,beginBattle,tickBattle} from './dist/combat.mjs';
import {growthPool,growthChoices,ensureGrowthDraft} from './dist/growth.mjs';
import {items,itemCount,manualsFor,recipesFor} from './dist/workshop.mjs';
import {growthPanel} from './dist/insight-ui.mjs';
import {withGrowthChoice} from './test-fixtures.mjs';
function hero(path='inner',name='보상 실험'){
 return startJourney(Object.assign(initial(name),{path,weapon:'검',element:'물',control:4,skill:3,insight:2,learnedSkills:['weapon'],loadout:['weapon'],flags:['art-control']}));
}
const chooseOffer=(s,id)=>choose(withGrowthChoice(s,id),id);
test('every growth draft has exactly three distinct eligible rewards from the shared pool',()=>{
 const types=new Set(),drafts=new Set();
 for(const path of ['inner','outer'])for(const weapon of weapons)for(const element of elements)for(let i=0;i<5;i++){
  const s=hero(path,'후보 '+i);s.weapon=weapon;s.element=element;delete s.journey.growthDraft;s.journey.growthSeed=(Math.imul(i+1,2654435761)+weapon.length+elements.indexOf(element))>>>0;
  const pool=growthPool(s),choices=growthChoices(s);assert.equal(choices.length,3);assert.equal(new Set(choices.map(c=>c.id)).size,3);
  for(const c of choices){types.add(c.rewardType);assert.equal(c.disabled,false);assert.ok([...pool.skills,...pool.stats,...pool.items].some(a=>a.id===c.id));}
  drafts.add(choices.map(c=>c.id).join(','));
 }
 assert.ok(drafts.size>30);assert.deepEqual([...types].sort(),['item','passive','skill','stat','upgrade']);
});
test('rendering, repeated scene reads and reload do not reroll an unresolved draft or consume RNG',()=>{
 const s=hero(),before=structuredClone(s);
 for(let i=0;i<10;i++){scene(s);growthPanel(s,scene(s));assert.deepEqual(s,before);}
 const restored=migrate(JSON.parse(JSON.stringify(s)));assert.deepEqual(restored,s);
 assert.deepEqual(scene(restored).choices,scene(s).choices);
});
test('only a currently offered reward can be selected; bypassing the draft does not spend points',()=>{
 const s=hero(),pool=growthPool(s),offered=scene(s).choices;
 const hidden=[...pool.skills,...pool.stats,...pool.items].find(c=>!offered.some(k=>k.id===c.id));
 const before=structuredClone(s);assert.throws(()=>choose(s,hidden.id));assert.throws(()=>choose(s,'to-hub'));assert.deepEqual(s,before);
});
test('one point grants only the selected reward and advances to a new saved draft',()=>{
 let s=hero();s.journey.points=2;s=withGrowthChoice(s,'study-counter');const gold=s.journey.gold,inventory=structuredClone(s.journey.inventory),stats=[s.control,s.skill,s.insight],seed=s.journey.growthSeed;
 s=choose(s,'study-counter');assert.equal(s.journey.points,1);assert.equal(s.scene,'growth');assert.equal(s.journey.growthRound,1);assert.ok(abilities(s).some(a=>a.id==='counter'));assert.equal(s.journey.gold,gold);assert.deepEqual(s.journey.inventory,inventory);assert.deepEqual([s.control,s.skill,s.insight],stats);assert.notEqual(s.journey.growthSeed,seed);
 assert.equal(s.journey.growthDraft.round,1);assert.equal(scene(s).choices.length,3);
 s=choose(s,scene(s).choices[0].id);assert.equal(s.journey.points,0);assert.equal(s.scene,'hub');assert.equal(s.journey.growthDraft,undefined);assert.equal(s.journey.route.used,0);
 assert.throws(()=>choose(s,'study-counter'));
});
test('a recurring learned skill becomes a rank upgrade and stops appearing at maximum rank',()=>{
 let s=hero();s.journey.points=5;s=chooseOffer(s,'study-counter');const count=abilities(s).length,loadout=[...s.loadout];
 assert.ok(!growthPool(s).skills.some(c=>c.id==='study-counter'));
 for(let rank=1;rank<=3;rank++){s=withGrowthChoice(s,'hone-counter');assert.equal(scene(s).choices.find(c=>c.id==='hone-counter').rewardType,'upgrade');s=choose(s,'hone-counter');assert.equal(s.journey.skillRanks.counter,rank);assert.equal(abilities(s).length,count);assert.deepEqual(s.loadout,loadout);}
 assert.ok(!growthPool(s).skills.some(c=>c.id==='hone-counter'));assert.throws(()=>choose(s,'hone-counter'));
});
test('manual skills obey path requirements and can be learned and strengthened without synthesis or gold',()=>{
 for(const path of ['inner','outer']){
  let s=hero(path);s.control=1;s.skill=1;assert.ok(!growthPool(s).skills.some(c=>c.ability.id==='chain'||c.ability.id==='mend'));
  s.control=2;s.skill=2;s.journey.points=2;
  const gold=s.journey.gold;s=chooseOffer(s,'study-mend');assert.equal(s.journey.gold,gold);assert.ok(s.journey.learned.includes('mend'));s=chooseOffer(s,'hone-mend');assert.equal(s.journey.skillRanks.mend,1);
  assert.ok(!recipesFor(s).some(a=>a.ingredients.includes('mend')||a.ingredients.includes('focus')||a.ingredients.includes('signature')));
  assert.ok(!growthPool(s).skills.some(c=>c.rewardType==='skill'&&c.ability.ingredients));
 }
});
test('all item reward types go to inventory, cost one point and no gold, and equipment is not duplicated',()=>{
 for(const item of items){
  let s=hero();const before=itemCount(s.journey,item.id),gold=s.journey.gold,hp=s.hp,energy=s.energy,equipped=structuredClone(s.journey.equipped);
  s=chooseOffer(s,'claim-item-'+item.id);assert.equal(itemCount(s.journey,item.id),before+1);assert.equal(s.journey.gold,gold);assert.equal(s.journey.points,0);assert.equal(s.hp,hp);assert.equal(s.energy,energy);assert.deepEqual(s.journey.equipped,equipped);
  if(item.type==='equipment')assert.ok(!growthPool(s).items.some(c=>c.item.id===item.id));
  assert.deepEqual(migrate(JSON.parse(JSON.stringify(s))),s);
 }
});
test('stat rewards apply the shown increase and preserve all other rewards and resources',()=>{
 for(const stat of ['control','skill','insight']){
  let s=hero();s=withGrowthChoice(s,'grow-'+stat);const before=structuredClone(s);s=choose(s,'grow-'+stat);
  for(const key of ['control','skill','insight'])assert.equal(s[key],before[key]+(key===stat?1:0));
  assert.deepEqual(s.journey.inventory,before.journey.inventory);assert.deepEqual(s.learnedSkills,before.learnedSkills);assert.equal(s.journey.gold,before.journey.gold);assert.equal(s.journey.points,0);
 }
});
test('when skills are maxed, three usable stats or items still appear with no disabled dead end',()=>{
 const s=hero();for(const a of passiveDefinitions){grantPassive(s,a.id);s.passiveRanks[a.id]=3;}s.learnedSkills=['weapon','element','counter'];s.journey.learned=manualsFor(s).map(a=>a.id).concat(recipesFor(s).map(a=>a.id));
 for(const a of abilities(s))s.journey.skillRanks[a.id]=3;
 for(const i of items.filter(i=>i.type==='equipment'))s.journey.inventory[i.id]=1;
 delete s.journey.growthDraft;const choices=growthChoices(s);
 assert.equal(choices.length,3);assert.ok(choices.every(c=>['stat','item'].includes(c.rewardType)&&!c.disabled));assert.ok(choices.filter(c=>c.rewardType==='item').every(c=>c.item.type==='consumable'));
});
test('legacy growth saves initialize a stable draft without changing build, points or return scene',()=>{
 const raw=hero();delete raw.journey.growthDraft;delete raw.journey.growthSeed;delete raw.journey.growthRound;raw.journey.points=2;raw.journey.growthReturn='reward';
 const s=migrate(raw);assert.equal(s.journey.points,2);assert.equal(s.journey.growthReturn,'reward');assert.equal(scene(s).choices.length,3);assert.deepEqual(s.learnedSkills,raw.learnedSkills);assert.deepEqual(migrate(JSON.parse(JSON.stringify(s))),s);
});
test('chapter retry restores its initial offers, points and inventory without reward farming',()=>{
 let s=hero();const offers=structuredClone(s.journey.growthDraft),seed=s.journey.growthSeed,starting=structuredClone(s.journey.inventory);
 s=choose(s,scene(s).choices[0].id);s.journey.route.ended='defeat';s=choose(s,'retry-chapter');
 assert.equal(s.journey.points,1);assert.equal(s.scene,'growth');assert.deepEqual(s.journey.growthDraft,offers);assert.equal(s.journey.growthSeed,seed);assert.deepEqual(s.journey.inventory,starting);
});
test('fusion produces a distinct named skill on both paths and retains the new name after reload and rank upgrade',()=>{
 for(const path of ['inner','outer'])for(const weapon of weapons){
  let s=hero(path);s=choose(s,scene(s).choices[0].id);s.weapon=weapon;s.learnedSkills=['weapon','element','counter'];s.journey.gold=100;s.journey.ore=10;s.journey.learned=['chain','guard'];s.scene='synthesis';
  for(const recipe of recipesFor(s)){
   const names=abilities(s).filter(a=>recipe.ingredients.includes(a.id)).map(a=>a.name);assert.ok(!names.includes(recipe.name));
   s=choose(s,'combine-'+recipe.id);const a=abilities(s).find(a=>a.id===recipe.id);assert.equal(a.name,recipe.name);assert.ok(recipe.ingredients.every(id=>abilities(s).some(k=>k.id===id)));
   s.journey.points=1;s=migrate(s);s=chooseOffer(s,'hone-'+recipe.id);assert.ok(abilities(s).find(a=>a.id===recipe.id).name.startsWith(recipe.name));assert.deepEqual(migrate(JSON.parse(JSON.stringify(s))),s);
  }
 }
});


test('no category is guaranteed: three skills, three stats or three items can each be offered',()=>{
 const cases=[['skill',2027808452],['stat',2253901550],['item',3041712678]];
 for(const [type,seed]of cases){
  const s=hero();s.journey.growthSeed=seed;delete s.journey.growthDraft;
  const choices=growthChoices(s);assert.equal(choices.length,3);
  assert.ok(choices.every(c=>(['upgrade','passive','passive-upgrade'].includes(c.rewardType)?'skill':c.rewardType)===type));
  assert.deepEqual(scene(migrate(JSON.parse(JSON.stringify(s)))).choices,choices);
 }
});
