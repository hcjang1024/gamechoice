import {permanentRates} from './attributes.mjs';
import {passiveCatalog,learnedPassives,grantPassive,ensurePassives,isPassive} from './passives.mjs';
import {coreAbility,MAX_ABILITY_RANK,powerDescription} from './powers.mjs';
import {abilities,abilityCatalog,grantAbility,combatStats} from './combat.mjs';
import {items,itemFor,itemCount,manualsFor,ensureWorkshop} from './workshop.mjs';
const statNames={control:'지능',skill:'근력',insight:'민첩',charisma:'매력'};
export const MAX_SKILL_RANK=3;
export function growthPool(s){
 const j=s.journey,known=[...abilities(s),...learnedPassives(s)],knownIds=new Set(known.map(a=>a.id));
 const skills=[...abilityCatalog(s).filter(a=>!a.ingredients&&a.minLevel<=(j.level||1)&&(!a.stat||s[a.stat]>=a.min)),...passiveCatalog(s)];
 for(const a of known)if(!skills.some(k=>k.id===a.id))skills.push(a);
 const skillOffers=skills.filter(a=>!knownIds.has(a.id)||((a.passive?s.passiveRanks?.[a.id]:j.skillRanks[a.id])||0)<(a.passive?MAX_ABILITY_RANK:MAX_SKILL_RANK)).map(a=>{
  const learned=knownIds.has(a.id),rank=(a.passive?s.passiveRanks?.[a.id]:j.skillRanks[a.id])||0;
  const ability=known.find(k=>k.id===a.id)||{...a,rank:0};
  return {id:(learned?'hone-':'study-')+a.id,title:ability.name+(learned?' 강화':' 배우기'),hint:learned?'강화 '+rank+' → '+(rank+1)+' / '+(a.passive?MAX_ABILITY_RANK:MAX_SKILL_RANK)+' · 성장점 1':a.description+' · 성장점 1',rewardType:a.passive?(learned?'passive-upgrade':'passive'):(learned?'upgrade':'skill'),ability};
 });
 const stats=Object.keys(statNames).filter(stat=>(s[stat]||0)<60).map(stat=>({id:'grow-'+stat,title:statNames[stat]+' +1',hint:statNames[stat]+' '+s[stat]+' → '+(s[stat]+1)+' · 성장점 1',rewardType:'stat',stat}));
 const rates=permanentRates(s);for(const [stat,label,step,max]of [['healthBonus','최대 체력',2,989],['criticalBonus','치명타율',.02,.6],['evasionBonus','회피율',.02,.6],['resist-burn','발화 저항',.05,.6],['resist-poison','중독 저항',.05,.6],['resist-bleed','출혈 저항',.05,.6]]){const key=stat.replace('resist-',''),value=stat.startsWith('resist-')?s.resistances?.[key]||0:s[stat]||0;if(value<max&&(stat!=='criticalBonus'||rates.critical<.6)&&(stat!=='evasionBonus'||rates.evasion<.6))stats.push({id:'grow-'+stat,title:label+' +'+(step<1?Math.round(step*100)+'%p':step),hint:'성장점 1',rewardType:'stat',stat,step});}
 const rewards=items.filter(i=>i.minLevel<=(j.level||1)&&(i.type!=='equipment'||!itemCount(j,i.id))).map(item=>({id:'claim-item-'+item.id,title:item.name,hint:item.description+' · 1개 획득 · 성장점 1',rewardType:'item',item}));
 const innate=coreAbility(s),powers=skillOffers.filter(c=>c.ability.passive);
 if(innate&&innate.rank<MAX_ABILITY_RANK&&(j.level||1)>=2)powers.push({id:'hone-core-breath',title:innate.name+' 능력 강화',hint:'능력 Lv.'+innate.level+' → Lv.'+(innate.level+1)+' · 성장점 1',rewardType:'ability-upgrade',ability:innate});
 return {skills:skillOffers.filter(c=>!c.ability.passive),abilities:powers,stats,items:rewards};
}
function hash(text){let value=2166136261;for(const c of text)value=Math.imul(value^c.charCodeAt(0),16777619);return value>>>0||1;}
export function ensureGrowthDraft(s){
 const j=s.journey;if(!j||s.scene!=='growth'||j.points<1)return;
 ensureWorkshop(j);ensurePassives(s);j.skillRanks??={};
 j.growthSeed??=hash([s.name,s.path,s.weapon,s.element,j.chapter,j.level,s.journal.length,s.runSetup?.seed||''].join('|'));
 j.growthRound??=0;
 const pool=growthPool(s),all=[...pool.skills,...pool.abilities,...pool.stats,...pool.items],available=new Set(all.map(c=>c.id));
 if(j.growthDraft?.ids?.length===3&&new Set(j.growthDraft.ids).size===3&&j.growthDraft.ids.every(id=>available.has(id)))return;
 const random=()=>{let x=j.growthSeed||1;x^=x<<13;x^=x>>>17;x^=x<<5;j.growthSeed=x>>>0;return j.growthSeed/4294967296;};
 const pick=list=>list.splice(Math.floor(random()*list.length),1)[0];
 // Sample without replacement from one shared pool. Every eligible reward
 // has the same chance; no category receives reserved slots or extra weight.
 const remaining=[...all],selected=[];
 while(selected.length<3)selected.push(pick(remaining));
 j.growthDraft={round:j.growthRound,ids:selected.map(c=>c.id)};
}
export function growthChoices(s){
 const j=s.journey;if(j.points<1)return [{id:'to-hub',title:'여정으로 돌아간다',hint:''}];
 ensureGrowthDraft(s);const pool=growthPool(s),all=[...pool.skills,...pool.abilities,...pool.stats,...pool.items];
 return j.growthDraft.ids.map(id=>({...all.find(c=>c.id===id),disabled:false}));
}
export function applyGrowth(s,id){
 const j=s.journey;ensureGrowthDraft(s);
 const choice=growthChoices(s).find(c=>c.id===id);
 if(j.points<1||!choice||choice.disabled)throw Error('제시된 성장 보상 중 하나를 선택하세요.');
 const previous=combatStats(s);
 if(choice.rewardType==='stat'){if(choice.stat.startsWith('resist-')){s.resistances??={};const key=choice.stat.slice(7);s.resistances[key]=Math.min(.6,(s.resistances[key]||0)+choice.step);}else s[choice.stat]=(s[choice.stat]||0)+(choice.step||1);s.last=choice.title+' · 성장점 1 사용';}
 else if(choice.rewardType==='item'){
  const item=itemFor(id.slice(11));if(item.id==='herb')j.herbs++;else j.inventory[item.id]=(j.inventory[item.id]||0)+1;
  s.last=item.name+' 1개 획득 · 성장점 1 사용 · 장비 탭에서 '+(item.type==='equipment'?'장착':'사용')+'하세요.';
 }else if(choice.rewardType==='ability-upgrade'){s.innateRank=(s.innateRank||0)+1;s.last=coreAbility(s).name+' 능력 Lv.'+(s.innateRank+1);
 }else if(choice.rewardType==='passive'){grantPassive(s,choice.ability.id);s.last=choice.ability.name+' 능력 획득'+(s.passiveLoadout.includes(choice.ability.id)?' · 활성화':' · 능력 탭에서 활성화하세요');
 }else if(choice.rewardType==='passive-upgrade'){const a=choice.ability;s.passiveRanks[a.id]=(s.passiveRanks[a.id]||0)+1;s.last=a.name+' 강화 → +'+s.passiveRanks[a.id];
 }else if(choice.rewardType==='skill'){
  const ability=choice.ability;
  if(!['weapon','element','counter'].includes(ability.id))j.learned.push(ability.id);
  grantAbility(s,ability.id);
  s.last=ability.name+' 습득 · 성장점 1 사용'+(s.loadout.includes(ability.id)?' · 자동 장착':' · 기술 탭에서 장착하세요');
 }else{
  const ability=choice.ability;j.skillRanks[ability.id]=(j.skillRanks[ability.id]||0)+1;
  s.last=ability.name+' 강화 → +'+j.skillRanks[ability.id]+' · 성장점 1 사용';
 }
 j.points--;j.growthRound=(j.growthRound||0)+1;delete j.growthDraft;
 if(j.growthReturn==='battle'&&s.battle){const next=combatStats(s);for(const k of ['attack','defense','speed','accuracy','evasion','range'])s.battle.stats[k]+=next[k]-previous[k];}
 return s;
}

