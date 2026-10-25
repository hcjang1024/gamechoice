import {ACTIVE_LIMIT,ensurePassives,passiveBonus} from './passives.mjs';
import {techniqueCatalog} from './techniques.mjs';
import {executeTechnique,ensureTechniqueState,techniqueBuffs,beginTechniqueTurn,finishTechniqueTurn,addTechniqueStatus} from './technique-combat.mjs';
import {manuals,recipes} from './workshop.mjs';
import {decorateSkill,newArts,normalizeLoadout,categoryOf} from './skillbook.mjs';
import {attackPower,attackHits,shieldPower,recoveryPower} from './scaling.mjs';
import {adaptArt,ensurePathState} from './paths.mjs';
import {elementStatus,statusRules,ensureStatuses,statusFor,applyStatus,statusModifiers,decayStatuses} from './statuses.mjs';
import {equipmentBonus,extraArts} from './workshop.mjs';
// Combat is deterministic and serializable so reloading cannot reroll a fight.
export const weaponProfiles={
 '맨손':{attack:1,speed:4,guard:1,range:0,basic:'장타',art:'연환장',description:'빠른 연타 · 두 번째 타격은 절반 위력'},
 '검':{attack:2,speed:3,guard:1,range:0,basic:'베기',art:'흘림검',description:'공격 뒤 다음 피해 1 감소'},
 '도':{attack:3,speed:1,guard:0,range:0,basic:'내려베기',art:'단절도',description:'높은 위력 · 적 방어 무시'},
 '창':{attack:2,speed:2,guard:1,range:1,basic:'찌르기',art:'관통창',description:'첫 접근 저지 · 다음 적 공격 약화'},
 '활':{attack:2,speed:4,guard:0,range:2,basic:'사격',art:'집중시',description:'먼 거리에서 선공 · 높은 명중률'},
 '지팡이':{attack:1,speed:2,guard:2,range:1,basic:'후려치기',art:'회류봉',description:'공격 뒤 보호막 2 획득'}
};
export const elementDescriptions=Object.fromEntries(Object.entries(elementStatus).map(([element,id])=>[element,statusRules[id].name+' · '+statusRules[id].description]));
export const maxHp=s=>10+Math.max(0,(s.journey?.level||1)-1)*2+equipmentBonus(s).hp+passiveBonus(s).hp;
export const maxEnergy=s=>6+Math.floor(Math.max(0,(s.journey?.level||1)-1)/2)+equipmentBonus(s).energy+passiveBonus(s).energy;
export function abilityCatalog(s){
 return techniqueCatalog(s);
}
export function legacyAbilityCatalog(s){
 if(!s.path||!s.weapon)return [];
 const p=weaponProfiles[s.weapon],outer=s.path==='outer';
 const list=[{id:'weapon',name:outer?`${s.element}결 · ${p.art}`:p.art,cost:2,description:'무기로 강하게 공격 · '+p.description,kind:'무기 기술'}];
 list.push({id:'element',name:`${s.element}결 · ${outer?'숨의 파동':'결의 발경'}`,cost:2,description:'숨으로 공격 · '+elementDescriptions[s.element],kind:outer?'마법':'내공 기술'});
 list.push({id:'counter',name:'간파 반격',cost:1,description:'다음 피해 2 감소 · 막아낸 뒤 반격',kind:'방어 기술'});
 const signature=s.flags.find(f=>/^art-(control|skill|insight)$/.test(f));
 if(signature)list.push({id:'signature',name:`${s.element}결 · ${{'art-control':'고른 숨','art-skill':'첫 궤적','art-insight':'읽는 흐름'}[signature]}`,cost:3,description:'서장에서 얻은 깨달음 · 강한 일격과 자신만의 운용',kind:'고유 기술'});
 if(!signature)list.push({id:'signature',name:s.path==='outer'?'원류 공명':'첫 숨의 극의',cost:3,kind:'고유 궁극기',description:'길의 깨달음을 한 번의 강한 공격으로 펼친다.'});
 return [...list,...manuals,...recipes].map(a=>adaptArt(s,a)).concat(newArts(s)).map(a=>decorateSkill(s,{...a,rank:s.journey?.skillRanks[a.id]||0,name:a.name+((s.journey?.skillRanks[a.id]||0)>0?' +'+s.journey.skillRanks[a.id]:'')}));
}
export function abilities(s){return abilityCatalog(s).filter(a=>a.id==='signature'&&s.flags.some(f=>/^art-(control|skill|insight)$/.test(f))||(s.learnedSkills||[]).includes(a.id)||s.journey?.learned?.includes(a.id));}
function legacyAbilities(s){return legacyAbilityCatalog(s).filter(a=>a.id==='signature'&&s.flags.some(f=>/^art-(control|skill|insight)$/.test(f))||(s.learnedSkills||[]).includes(a.id)||s.journey?.learned?.includes(a.id));}
export function grantAbility(s,id){s.learnedSkills??=[];if(!s.learnedSkills.includes(id))s.learnedSkills.push(id);const known=abilities(s).map(a=>a.id);normalizeLoadout(s,known);if(!s.loadout.some(k=>categoryOf(k)===categoryOf(id)))s.loadout.push(id);}
export function combatStats(s){const p=weaponProfiles[s.weapon],gear=equipmentBonus(s),passive=passiveBonus(s),buff=s.journey?.prepBuffs||{};return {attack:(s.path==='inner'?2+Math.floor(s.skill/2):1+Math.floor(s.control/2))+p.attack+(s.journey?.gear||0)+Math.floor((s.journey?.level||1)/2)+gear.attack+passive.attack+(buff.attack||0),defense:p.guard+Math.floor(s.control/3)+(s.journey?.armor||0)+gear.defense+passive.defense,speed:p.speed+Math.floor(s.insight/2)+(s.element==='바람'?2:0)+gear.speed+passive.speed+(buff.speed||0),accuracy:Math.min(.99,.83+s.skill*.025+s.insight*.02+gear.accuracy+passive.accuracy),evasion:Math.min(.5,s.insight*.025+(s.element==='바람'?.12:0)+gear.evasion+passive.evasion),range:p.range};}
function random(b){let x=b.seed;x^=x<<13;x^=x>>>17;x^=x<<5;b.seed=x>>>0;return b.seed/4294967296;}
function seedFor(s){let n=2166136261;const encounter=s.journey?.route?.current?.step??s.journal.length;for(const c of `${s.name}|${s.path}|${s.element}|${s.weapon}|${encounter}`)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0||1;}
export function beginBattle(state,config={}){
 const s=structuredClone(state);ensurePassives(s);const stats=combatStats(s);const ids=abilities(s).map(a=>a.id);normalizeLoadout(s,ids);
 s.loadout=[...new Set(s.loadout?.filter(id=>ids.includes(id))??ids)].slice(0,ACTIVE_LIMIT);
 const enemy={name:'다리의 약탈자',hp:25,attack:3,defense:1,speed:3,weapon:'짧은 칼',heavyEvery:3,heavyBonus:2,...config.enemy};
 const first=stats.speed>=enemy.speed||s.flags.includes('advantage')?'player':'enemy';
 const initialShield=(s.journey?.prepBuffs?.shield||0)+(hasPassive(s,'passive-first-ward')?3+(s.passiveRanks?.['passive-first-ward']||0):0);
 s.scene='battle';s.last='';s.battle={version:4,context:config.context||'prologue',zone:config.zone||null,seed:seedFor(s),round:1,actor:first,first,enemy:{...enemy,maxHp:enemy.hp,burn:0,stun:0,weaken:0},pathState:{mode:s.path,vigor:0,casting:null,field:null,renewal:0,release:0},statuses:{player:{},enemy:{}},playerShield:initialShield,counter:false,counterElement:false,cooldowns:{},turn:0,outcome:null,log:[],effects:[],start:{hp:s.hp,energy:s.energy},stats};
 ensureTechniqueState(s);if(s.journey)s.journey.prepBuffs={};
 log(s,'system',`${s.name} · ${s.weapon} / ${s.path==='inner'?'내공 운용':'외부 숨 인도'}. ${first==='player'?'당신이 먼저 움직인다.':'적이 먼저 거리를 좁힌다.'}`);
 return s;
}
function log(s,actor,text,extra={}){const b=s.battle;b.log.push({round:b.round,actor,text,hp:s.hp,energy:s.energy,enemyHp:b.enemy.hp,shield:b.playerShield,...extra});}
function emit(s,kind,actor,target,label,amount=0,extra={}){s.battle.effects.push({id:s.battle.turn+'-'+s.battle.effects.length,kind,actor,target,label,amount,element:s.element,...extra});}
function finish(s){const b=s.battle;if(b.enemy.hp<=0){b.outcome='victory';if(!s.flags.includes('won'))s.flags.push('won');log(s,'system',`${b.enemy.name}을 물리쳤다. 승리.`);}else if(s.hp<=0){b.outcome='defeat';log(s,'system',b.context==='journey'?'더는 자세를 유지할 수 없다. 순찰대의 도움으로 전장에서 벗어났다.':'더는 자세를 유지할 수 없다. 이솔이 퇴로를 열었다.');}else if(b.round>24){b.outcome='retreat';log(s,'system','싸움이 길어졌다. 힘을 더 잃기 전에 안전한 곳으로 물러났다.');}if(b.outcome&&!b.energyRecovered){s.energy=maxEnergy(s);b.energyRecovered=true;log(s,'system','전투 종료 · 숨을 모두 회복했다.');}}
const hasPassive=(s,id)=>s.passiveSkills?.includes(id)&&s.passiveLoadout?.includes(id);
function passiveTurn(s){const b=s.battle;b.passiveTurns=(b.passiveTurns||0)+1;
 if(b.command==='defend'&&s.hp>0&&hasPassive(s,'passive-composure')){const gain=Math.min(maxHp(s)-s.hp,Math.floor((1+(s.passiveRanks?.['passive-composure']||0))*statusModifiers(s,'player').healing));s.hp+=gain;if(gain){emit(s,'heal','player','player','고요한 재생',gain);log(s,'player','고요한 재생 · 체력 +'+gain);}}
 if(b.passiveTurns%3===0&&s.hp>0&&hasPassive(s,'passive-circulation')){const gain=Math.min(maxEnergy(s)-s.energy,Math.max(0,1+(s.passiveRanks?.['passive-circulation']||0)-statusModifiers(s,'player').recovery));s.energy+=gain;if(gain){emit(s,'recover','player','player','삼박 순환',gain);log(s,'player','삼박 순환 · 숨 +'+gain);}}
}
function damageEnemy(s,power){const e=s.battle.enemy,absorbed=Math.min(e.shield||0,power);if(absorbed)e.shield-=absorbed;const damage=power-absorbed;e.hp=Math.max(0,e.hp-damage);if(damage>=12&&e.casting){e.casting=null;emit(s,'status','player','enemy','강한 타격 · 적 주문 끊김');log(s,'player','강한 타격으로 적이 준비한 주문을 끊었다.');}return {damage,absorbed};}
function strike(s,power,{pierce=false,accuracy=0}={}){const b=s.battle,e=b.enemy,own=statusModifiers(s,'player'),target=statusModifiers(s,'enemy'),defense=Math.max(0,e.defense-target.defense);if(random(b)>Math.max(.05,Math.min(.99,effectiveStats(s).accuracy+accuracy-(e.evasion||0))))return {damage:0,miss:true};const critical=random(b)<.08+s.insight*.015;const impact=damageEnemy(s,Math.max(1,Math.round(power-own.attack+(critical?2:0))-(pierce?0:defense)));return {damage:impact.damage,critical,blocked:(pierce?0:defense)+impact.absorbed};}
function inflict(s,side,element){const id=elementStatus[element];if(!id)return '';const rule=applyStatus(s,side,id);emit(s,'status',side==='enemy'?'player':'enemy',side,rule.name,0,{status:id});return rule.name+' 적용.';}
function elementEffect(s){const b=s.battle;let text=inflict(s,'enemy',s.element);if(s.element==='물'){b.playerShield++;emit(s,'guard','player','player','물의 보호막',1);}if(s.element==='흙'){b.playerShield+=2;emit(s,'guard','player','player','흙의 보호막',2);}if(s.element==='나무'){const gain=Math.min(Math.floor(statusModifiers(s,'player').healing),maxHp(s)-s.hp);s.hp+=gain;if(gain)emit(s,'heal','player','player','나무의 회복',gain);}return text;}
function statusDamage(s,side,id,amount){const name=statusRules[id].name;if(side==='player')s.hp=Math.max(0,s.hp-amount);else s.battle.enemy.hp=Math.max(0,s.battle.enemy.hp-amount);emit(s,id,'effect',side,name,amount);log(s,'effect',(side==='player'?s.name:s.battle.enemy.name)+' · '+name+' 피해 '+amount+'.');}
function bleedOnAttack(s,side){if(statusFor(s,side,'bleed'))statusDamage(s,side,'bleed',1);return side==='player'?s.hp<=0:s.battle.enemy.hp<=0;}
function beginStatusTurn(s,side){const b=s.battle;if(statusFor(s,side,'burn'))statusDamage(s,side,'burn',1);if(side==='player'&&statusFor(s,side,'corrosion')&&b.playerShield>0){b.playerShield--;emit(s,'status','effect',side,'부식 · 보호막 -1');log(s,'effect','부식으로 보호막 1이 사라졌다.');}if(statusFor(s,side,'shock')){if(side==='player'&&ensurePathState(s).casting){ensurePathState(s).casting=null;emit(s,'status','effect','player','감전 · 주문 끊김');}if(side==='player')for(const id of Object.keys(b.cooldowns))b.cooldowns[id]++;emit(s,'status','effect',side,'감전 · 기술 봉쇄');log(s,'effect','감전으로 이번 행동에는 기본 공격과 방어만 사용할 수 있다.');} }
export function effectiveStats(s){const inCombat=s.scene==='battle'||(s.scene==='growth'&&s.journey?.growthReturn==='battle');const stats=inCombat&&s.battle?s.battle.stats:combatStats(s),m=inCombat?statusModifiers(s,'player'):{attack:0,defense:0,accuracy:0};const buffs=inCombat?techniqueBuffs(s):{attack:0,defense:0,accuracy:0,evasion:0};return {...stats,attack:Math.max(1,stats.attack-m.attack+buffs.attack),defense:Math.max(0,stats.defense-m.defense+buffs.defense),accuracy:Math.max(.05,Math.min(.99,stats.accuracy-m.accuracy+buffs.accuracy)),evasion:Math.max(0,Math.min(.85,stats.evasion+buffs.evasion))};}
function innerTurn(s){
 const b=s.battle,e=b.enemy,p=weaponProfiles[s.weapon];if(!b.command)for(const id of Object.keys(b.cooldowns))b.cooldowns[id]=Math.max(0,b.cooldowns[id]-1);
 const known=statusModifiers(s,'player').skillLocked?[]:legacyAbilities(s).filter(a=>s.loadout.includes(a.id));
 let chosen=b.command?known.find(a=>a.id===b.command):null;
 const ready=a=>!b.cooldowns[a.id]&&s.energy>=a.cost;
 const nextEnemyRound=b.first==='player'?b.round:b.round+1,heavySoon=!!e.casting||nextEnemyRound%(e.heavyEvery||3)===0;
 const support=new Set(['counter','flow-counter','guard','aegis','focus','mend']);
 if(!b.command){
 if(s.hp<=maxHp(s)*.5)chosen=known.find(a=>a.id==='mend'&&ready(a));
 if(!chosen&&s.energy<2)chosen=known.find(a=>a.id==='focus'&&ready(a));
 if(!chosen&&(heavySoon||s.hp<=maxHp(s)*.4)&&!b.counter&&b.playerShield<2)chosen=['flow-counter','aegis','counter','guard'].map(id=>known.find(a=>a.id===id)).find(a=>a&&ready(a));
 chosen??=known.find(a=>ready(a)&&!support.has(a.id));
 if(!chosen&&heavySoon&&b.playerShield<2){b.playerShield+=2;gainVigor(s,1);s.energy=Math.min(maxEnergy(s),s.energy+Math.max(0,1-statusModifiers(s,'player').recovery));emit(s,'guard','player','player','기본 방어',2);log(s,'player','기본 방어 — 강한 공격에 대비해 피해를 2 막는다.',{skill:'기본 방어'});return;}
 if(!chosen&&s.energy<Math.max(2,...known.map(a=>a.cost))&&known.some(a=>!support.has(a.id))&&b.turn%3===0){const amount=Math.min(maxEnergy(s)-s.energy,(s.path==='outer'?3:2)-statusModifiers(s,'player').recovery);s.energy+=amount;gainVigor(s,1);b.playerShield++;emit(s,'recover','player','player','회복 호흡',amount);log(s,'player',`${s.path==='outer'?'외부의 숨을 다시 끌어온다':'호흡을 가다듬어 숨을 모은다'}. 숨 +${amount}, 보호막 +1.`,{skill:'회복 호흡'});return;}
 }
 if(chosen){const stored=ensurePathState(s);stored.release=['focus','mend'].includes(chosen.id)?0:stored.vigor;if(stored.release){stored.vigor=0;emit(s,'status','player','player','축기 '+stored.release+' 방출');}s.energy-=chosen.cost;b.cooldowns[chosen.id]=b.command?chosen.cooldown:['counter','signature','flow-counter','focus','mend','tempest'].includes(chosen.id)?3:2;
  if(chosen.id==='mend'){const gain=Math.min(Math.floor(recoveryPower(s,chosen)*statusModifiers(s,'player').healing),maxHp(s)-s.hp);s.hp+=gain;emit(s,'heal','player','player',chosen.name,gain);log(s,'player',`${chosen.name}. 체력 ${gain} 회복.`,{skill:chosen.name});return;}
  if(chosen.id==='focus'){gainVigor(s,2);const gain=Math.min(Math.max(0,recoveryPower(s,chosen)-statusModifiers(s,'player').recovery),maxEnergy(s)-s.energy);s.energy+=gain;emit(s,'recover','player','player',chosen.name,gain);log(s,'player',`${chosen.name}. 숨 ${gain} 회복.`,{skill:chosen.name});return;}
  if(['counter','flow-counter','guard','aegis'].includes(chosen.id)){const amount=shieldPower(s,chosen,ensurePathState(s).release);b.counterPower=ensurePathState(s).release;b.playerShield+=amount;b.counter=['counter','flow-counter'].includes(chosen.id);b.counterElement=chosen.id==='flow-counter';emit(s,'guard','player','player',chosen.name,amount);log(s,'player',`${chosen.name}. 보호막 +${amount}${b.counter?' · 반격 태세':''}.`,{skill:chosen.name});return;}
  if(bleedOnAttack(s,'player'))return;
  const elemental=chosen.id==='element',signature=chosen.id==='signature';
  const hit=strike(s,attackPower(s,chosen,b.stats.attack,ensurePathState(s).release),{pierce:s.element==='쇠'||(!elemental&&s.weapon==='도'),accuracy:signature&&s.flags.includes('art-insight')?.15:!elemental&&s.weapon==='활'?.12:0});
  let text=hit.miss?`${chosen.name} — 적이 궤적을 벗어났다.`:`${chosen.name} — ${hit.damage} 피해${hit.critical?' · 치명타':''}.`;
  emit(s,hit.miss?'dodge':'skill','player','enemy',chosen.name,hit.damage||0,{critical:!!hit.critical});
  if(hit.blocked)emit(s,'block','enemy','enemy','적의 방어',hit.blocked);
  if(!hit.miss){text+=' '+elementEffect(s);if(signature&&s.flags.includes('art-control')){b.playerShield+=2+chosen.rank;emit(s,'guard','player','player','고른 숨의 수비',2+chosen.rank);}if(!elemental){if((s.weapon==='맨손'||['chain','tempest'].includes(chosen.id))&&e.hp>0){const extraHits=chosen.id==='tempest'?2:1;for(let n=0;n<extraHits&&e.hp>0;n++){const impact=damageEnemy(s,Math.max(1,Math.floor(hit.damage/2)));text+=` 연타 ${impact.damage} 피해.`;emit(s,'attack','player','enemy','연속 타격',impact.damage);if(impact.absorbed)emit(s,'block','enemy','enemy','적 보호막',impact.absorbed);}}if(s.weapon==='검'){b.playerShield++;emit(s,'guard','player','player','검의 흘리기',1);}if(s.weapon==='창')e.weaken=2;if(s.weapon==='지팡이'){b.playerShield+=2;emit(s,'guard','player','player','지팡이의 수비',2);}}}
  log(s,'player',text,{skill:chosen.name});
 }else{if(bleedOnAttack(s,'player'))return;const hit=strike(s,b.stats.attack,{accuracy:s.weapon==='활'?.07:0});gainVigor(s,1);emit(s,hit.miss?'dodge':'attack','player','enemy',p.basic,hit.damage||0,{critical:!!hit.critical});if(hit.blocked)emit(s,'block','enemy','enemy','적의 방어',hit.blocked);log(s,'player',hit.miss?`${p.basic} — 빗나갔다.`:`${p.basic} — ${hit.damage} 피해${hit.critical?' · 치명타':''}.`,{skill:p.basic});}
}
function gainVigor(s,amount){const p=ensurePathState(s);if(s.path!=='inner')return;const before=p.vigor;p.vigor=Math.min(3,p.vigor+amount);if(p.vigor>before)emit(s,'status','player','player','축기 '+p.vigor+'/3');}
function outerGuard(s){s.battle.playerShield+=2;emit(s,'guard','player','player','기본 방어',2);log(s,'player','기본 방어 — 다음 주문을 펼칠 틈을 지킨다.',{skill:'기본 방어'});}
function setField(s,turns,ward=false){ensurePathState(s).field={turns,element:s.element,ward};emit(s,'status','player','enemy',s.element+'결 영역 · '+turns+'회 유지');}
function releaseSpell(s,a){
 const b=s.battle,e=b.enemy;const hits=attackHits(s,a);
 const shield=a.id==='signature'&&s.flags.includes('art-control')?4+a.rank:0;if(shield){b.playerShield+=shield;emit(s,'guard','player','player','유지 결계',shield);}
 if(bleedOnAttack(s,'player'))return;
 for(let i=0;i<hits&&e.hp>0;i++){
  const hit=strike(s,attackPower(s,a,b.stats.attack,0,i),{pierce:['infused','signature'].includes(a.id)||s.element==='쇠'||s.weapon==='창'||s.weapon==='검',accuracy:s.weapon==='활'?.16:.05});
  emit(s,hit.miss?'dodge':'skill','player','enemy',a.name+(hits>1?' · '+(i+1)+'탄':''),hit.damage||0,{critical:!!hit.critical,magic:true});
  if(hit.blocked)emit(s,'block','enemy','enemy','적의 방어',hit.blocked);
  log(s,'player',a.name+' 발동 — '+(hit.miss?'투사체가 빗나갔다.':hit.damage+' 피해.'),{skill:a.name});
  if(!hit.miss){elementEffect(s);if(s.weapon==='도'){const impact=damageEnemy(s,2+a.rank);emit(s,'skill','player','enemy','파열하는 매개',impact.damage,{magic:true});if(impact.absorbed)emit(s,'block','enemy','enemy','적 보호막',impact.absorbed);}if(s.weapon==='맨손'){e.weaken=2;emit(s,'status','player','enemy','수인의 속박 · 위력 약화');}if(s.weapon==='지팡이'){b.playerShield+=2;emit(s,'guard','player','player','매개의 안정',2);}}
 }
 if(['element','infused','tempest'].includes(a.id)||a.id==='signature')setField(s,a.id==='tempest'?3:2,a.id==='signature'&&s.flags.includes('art-control'));
 if(a.id==='signature'&&s.flags.includes('art-insight')){e.disrupted=2;e.counterReady=false;emit(s,'status','player','enemy','술식 파훼 · 강타 봉쇄');}
}
function outerTurn(s){
 const b=s.battle,p=ensurePathState(s);if(!b.command)for(const id of Object.keys(b.cooldowns))b.cooldowns[id]=Math.max(0,b.cooldowns[id]-1);
 if(!b.command&&p.renewal>0)renewalTurn(s);
 if(p.casting){const pending=p.casting;
  if(statusModifiers(s,'player').skillLocked){p.casting=null;emit(s,'status','enemy','player','감전 · 주문 끊김');log(s,'player','감전으로 준비한 주문의 연결이 끊겼다.');}
  else if(!b.command||b.command==='release'){p.casting=null;const current=legacyAbilities(s).find(a=>a.id===pending.id);if(current){b.cooldowns[current.id]=b.command?current.cooldown:['signature','tempest'].includes(current.id)?3:2;releaseSpell(s,current);return;}}
 }
 const known=statusModifiers(s,'player').skillLocked?[]:legacyAbilities(s).filter(a=>s.loadout.includes(a.id)),ready=a=>!b.cooldowns[a.id]&&s.energy>=a.cost;
 const next=b.first==='player'?b.round:b.round+1,heavySoon=!!b.enemy.casting||next%(b.enemy.heavyEvery||3)===0;
 let chosen=b.command?known.find(a=>a.id===b.command):null;if(!b.command){if(s.hp<=maxHp(s)*.5&&!p.renewal)chosen=known.find(a=>a.id==='mend'&&ready(a));
 if(!chosen&&s.energy<2)chosen=known.find(a=>a.id==='focus'&&ready(a));
 if(!chosen&&(heavySoon||s.hp<=maxHp(s)*.4))chosen=known.find(a=>['counter','flow-counter','guard','aegis'].includes(a.id)&&ready(a));
 chosen??=known.find(a=>a.mode==='cast'&&ready(a));
 if(chosen&&chosen.mode==='cast'&&heavySoon&&b.playerShield<2&&!b.enemy.disrupted){outerGuard(s);return;}
 }
 if(chosen){s.energy-=chosen.cost;
  if(chosen.mode==='cast'){p.casting={id:chosen.id,name:chosen.name,cost:chosen.cost};emit(s,'cast','player','player',chosen.name+' 준비',0,{magic:true});log(s,'player',chosen.name+' 준비 — 다음 내 행동에 발동한다. 주변 숨 -'+chosen.cost+'.',{skill:chosen.name+' 준비'});return;}
  b.cooldowns[chosen.id]=b.command?chosen.cooldown:3;
  if(chosen.mode==='disrupt'){const shield=shieldPower(s,chosen);b.enemy.disrupted=(chosen.id==='flow-counter'?2:1)+Math.floor(chosen.rank/2);b.enemy.counterReady=false;b.playerShield+=shield;emit(s,'guard','player','player',chosen.name,shield);emit(s,'status','player','enemy','강타·반격 준비 봉쇄');if(chosen.id==='flow-counter')inflict(s,'enemy',s.element);log(s,'player',chosen.name+' — 적의 강타와 반격 준비를 막는다.',{skill:chosen.name});return;}
  if(chosen.mode==='ward'){const amount=shieldPower(s,chosen);b.playerShield+=amount;if(chosen.id==='aegis')setField(s,3,true);emit(s,'guard','player','player',chosen.name,amount);log(s,'player',chosen.name+' — 보호막 '+amount+'.',{skill:chosen.name});return;}
  if(chosen.mode==='renew'){p.renewal=3;p.renewalPower=recoveryPower(s,chosen);emit(s,'status','player','player','생기 순환 · 3회 유지');log(s,'player',chosen.name+' — 다음 세 행동에 회복을 유지한다.',{skill:chosen.name});return;}
  if(chosen.mode==='focus'){const gain=Math.min(Math.max(0,3+chosen.rank-statusModifiers(s,'player').recovery),maxEnergy(s)-s.energy);s.energy+=gain;emit(s,'recover','player','player',chosen.name,gain);log(s,'player',chosen.name+' — 주변 숨 '+gain+' 인도.',{skill:chosen.name});return;}
 }
 if(!b.command&&heavySoon&&b.playerShield<2){outerGuard(s);return;}
 if(bleedOnAttack(s,'player'))return;const hit=strike(s,b.stats.attack,{accuracy:s.weapon==='활'?.07:0});emit(s,hit.miss?'dodge':'attack','player','enemy',weaponProfiles[s.weapon].basic,hit.damage||0);if(hit.blocked)emit(s,'block','enemy','enemy','적의 방어',hit.blocked);log(s,'player',weaponProfiles[s.weapon].basic+' — '+(hit.miss?'빗나갔다.':hit.damage+' 피해.'),{skill:weaponProfiles[s.weapon].basic});
}
function manualAction(s){
 const b=s.battle,p=ensurePathState(s),id=b.command,a=abilities(s).find(a=>a.id===id),m=statusModifiers(s,'player');
 const api={maxHp,maxEnergy,pathState:ensurePathState,effectiveStats,emit,log,strike,bleedOnAttack};
 if(id==='release'&&p.casting){const prepared=abilities(s).find(k=>k.id===p.casting.id);if(prepared?.technique){p.casting=null;executeTechnique(s,prepared,api,{release:true});return;}}
 if(a?.technique){executeTechnique(s,a,api);return;}
 if(id==='defend'){b.playerShield+=2;gainVigor(s,1);if(s.path==='inner')s.energy=Math.min(maxEnergy(s),s.energy+Math.max(0,1-m.recovery));emit(s,'guard','player','player','기본 방어',2);log(s,'player','기본 방어 · 보호막 +2'+(s.path==='inner'?' · 축기 +1 · 내부 숨 +1':''));return;}
 if(id==='breathe'){const gain=Math.min(maxEnergy(s)-s.energy,Math.max(0,2-m.recovery));s.energy+=gain;gainVigor(s,1);emit(s,'recover','player','player','호흡 고르기',gain);log(s,'player','호흡 고르기 · 숨 +'+gain);return;}
 if(id==='basic'){if(bleedOnAttack(s,'player'))return;const hit=strike(s,b.stats.attack+techniqueBuffs(s).attack+(b.empower||0),{accuracy:s.weapon==='활'?.07:0});b.empower=0;gainVigor(s,1);emit(s,hit.miss?'dodge':'attack','player','enemy',weaponProfiles[s.weapon].basic,hit.damage||0);if(hit.blocked)emit(s,'block','enemy','enemy','적의 방어',hit.blocked);log(s,'player',weaponProfiles[s.weapon].basic+' · '+(hit.miss?'빗나감':hit.damage+' 피해'));return;}
 if(a&&['purify','stance','detonate','ascend'].includes(id)){
  s.energy-=a.cost;b.cooldowns[id]=a.cooldown;
  const rank=a.rank||0;
  if(id==='purify'){const count=Object.values(b.statuses.player).reduce((n,x)=>n+(x.stacks||1),0);b.statuses.player={};const shield=count*2+Math.floor(s.control/2)+rank;b.playerShield+=shield;emit(s,'guard','player','player',a.name,shield);log(s,'player',a.name+' · 상태이상 정화 · 보호막 +'+shield);}
  if(id==='stance'){b.empower=2+s.insight*.5+rank;b.freeUsed=true;emit(s,'status','player','player',a.name);log(s,'player',a.name+' · 다음 공격 위력 +'+b.empower+' · 턴 소모 없음');}
  if(id==='detonate'){if(bleedOnAttack(s,'player'))return;const count=Object.values(b.statuses.enemy).reduce((n,x)=>n+(x.stacks||1),0);b.statuses.enemy={};const hit=strike(s,b.stats.attack+4+s.control+count*3+rank*2+(b.empower||0),{pierce:true,accuracy:.15});b.empower=0;emit(s,'skill','player','enemy',a.name,hit.damage||0);log(s,'player',a.name+' · 상태 '+count+'중첩 소모 · '+(hit.miss?'빗나감':hit.damage+' 피해'));}
  if(id==='ascend'){s.energy=maxEnergy(s);const shield=4+(s.path==='outer'?s.control:s.skill)+rank;b.playerShield+=shield;if(s.path==='inner')gainVigor(s,3);else setField(s,3,true);emit(s,'guard','player','player',a.name,shield);log(s,'player',a.name+' · 숨 완전 회복 · 보호막 +'+shield);}
  return;
 }
 const boost=id==='release'||s.path==='inner'&&a&&['attack','ultimate'].includes(categoryOf(a.id))?b.empower||0:0;
 b.stats.attack+=boost;
 try{if(s.path==='outer')outerTurn(s);else innerTurn(s);}finally{b.stats.attack-=boost;if(boost)b.empower=0;}
}
function renewalTurn(s){const p=ensurePathState(s);p.renewal--;const gain=Math.min(Math.floor((p.renewalPower||2)*statusModifiers(s,'player').healing),maxHp(s)-s.hp);s.hp+=gain;emit(s,'heal','player','player','생기 순환',gain);log(s,'player','유지 중인 순환술로 체력 '+gain+' 회복.');}
function playerTurn(s){const p=ensurePathState(s);if(s.path==='outer'){const gain=Math.min(Math.max(0,1-statusModifiers(s,'player').recovery),maxEnergy(s)-s.energy);if(gain){s.energy+=gain;emit(s,'recover','player','player','주변 숨 유입',gain);}if(s.battle.command){if(p.renewal>0)renewalTurn(s);manualAction(s);}else outerTurn(s);}else if(s.battle.command)manualAction(s);else innerTurn(s);}
function enemyTurn(s){const b=s.battle,e=b.enemy,p=ensurePathState(s);if(p.field){const field=p.field;if(field.ward){b.playerShield++;emit(s,'guard','player','player','유지 결계 보충',1);}inflict(s,'enemy',field.element);field.turns--;log(s,'player','유지한 '+field.element+'결 영역이 적을 감싼다.');if(field.turns<=0)p.field=null;}if(e.stun>0){e.stun--;emit(s,'stun','enemy','enemy','경직');log(s,'enemy','적이 번개의 경직으로 움직이지 못했다.');return;}
 if(b.round===1&&b.stats.range>0){emit(s,'move','enemy','enemy','거리 좁히기');log(s,'enemy',`${s.weapon}의 사거리 때문에 적이 접근에 한 차례를 썼다.`);return;}
 if(!e.disrupted&&!statusModifiers(s,'enemy').skillLocked&&e.counterEvery&&b.round%e.counterEvery===0&&!e.counterReady){e.counterReady=true;emit(s,'guard','enemy','enemy','우두머리의 반격 태세');log(s,'enemy','우두머리가 칼을 거두고 반격을 준비한다.');return;}
 const locked=e.disrupted||statusModifiers(s,'enemy').skillLocked;let released=false;
 if(locked&&e.casting){e.casting=null;emit(s,'status','player','enemy','교란 · 적 주문 끊김');log(s,'enemy','교란 때문에 모아 둔 주문의 연결이 끊겼다.');}
 if(!locked&&e.casting){released=true;e.casting=null;}
 if(!locked&&!released&&e.wardEvery&&b.round%e.wardEvery===0){e.shield=Math.min(12,(e.shield||0)+e.wardAmount);emit(s,'guard','enemy','enemy','가짜 인장 보호막',e.wardAmount);log(s,'enemy','가짜 인장에 숨이 모여 보호막을 '+e.wardAmount+' 보충했다.');return;}
 if(!locked&&!released&&e.castEvery&&b.round%e.castEvery===0){e.casting={name:e.castName};emit(s,'cast','enemy','enemy',e.castName+' 준비',0,{magic:true});log(s,'enemy',e.castName+' 준비 — 다음 적 행동에 발동한다.');return;}
 if(bleedOnAttack(s,'enemy'))return;
 if(statusModifiers(s,'enemy').accuracy&&random(b)<statusModifiers(s,'enemy').accuracy){emit(s,'dodge','enemy','player','흔들림 · 빗나감');log(s,'enemy','흔들리는 자세 때문에 공격이 빗나갔다.');return;}
 if(random(b)<effectiveStats(s).evasion){emit(s,'dodge','enemy','player','회피');log(s,'enemy',`${e.weapon||'짧은 칼'}이 허공을 가른다. 공격을 피했다.`);return;}
 const heavy=released||(!e.disrupted&&!statusModifiers(s,'enemy').skillLocked&&b.round%(e.heavyEvery||3)===0);let power=Math.max(1,e.attack-statusModifiers(s,'enemy').attack)+(released?e.castPower:heavy?(e.heavyBonus??2):0);if(e.weaken>0){e.weaken--;power=Math.max(1,power-2);}power=Math.max(1,power-effectiveStats(s).defense);
 const block=Math.min(b.playerShield,power);b.playerShield-=block;const damage=power-block;s.hp=Math.max(0,s.hp-damage);
 let text=`${released?e.castName:heavy?'적의 강한 공격':e.weapon||'적의 짧은 칼'} — ${damage} 피해${block?`, 보호막이 ${block} 흡수`:''}.`;
 emit(s,heavy?'skill':'attack','enemy','player',released?e.castName:heavy?'강한 내려찍기':e.weapon||'짧은 칼',damage,{blocked:block,magic:released});if(block)emit(s,'block','player','player','보호막 흡수',block);
 if(s.path==='outer'&&heavy&&damage>=3&&ensurePathState(s).casting){ensurePathState(s).casting=null;emit(s,'status','enemy','player','강타 · 주문 끊김');log(s,'enemy','강타에 흐름이 끊겨 준비한 주문이 무너졌다.');}
 if(heavy&&damage>0&&e.element){text+=' '+inflict(s,'player',e.element);}
 if(b.counter&&s.hp>0&&!bleedOnAttack(s,'player')){b.counter=false;const hit=strike(s,b.stats.attack+techniqueBuffs(s).attack+1+(b.counterPower||0),{accuracy:.12});emit(s,hit.miss?'dodge':'counter','player','enemy',b.counterMagic?'술식 반사':b.counterElement?'결의 반격':'간파 반격',hit.damage||0,{magic:!!b.counterMagic});text+=hit.miss?' 반격은 빗나갔다.':` 반격으로 ${hit.damage} 피해.`;if(!hit.miss&&b.counterElement)text+=' '+elementEffect(s);if(!hit.miss&&b.counterStatus){addTechniqueStatus(s,'enemy',b.counterStatus,1);text+=' '+statusRules[b.counterStatus].name+' 반격.';}b.counterStatus=null;b.counterPower=0;b.counterElement=false;}log(s,'enemy',text);}
export function tickBattle(state){
 const s=structuredClone(state);const b=s.battle;if(s.scene!=='battle'||!b||b.outcome)return s;
 ensureStatuses(b);ensurePathState(s);b.effects=[];b.turn++;beginStatusTurn(s,b.actor);finish(s);if(b.outcome)return s;const acting=b.actor;if(b.actor==='player')beginTechniqueTurn(s,{maxHp,emit});if(b.actor==='player'){playerTurn(s);passiveTurn(s);if(b.enemy.counterReady&&!b.enemy.disrupted&&!statusModifiers(s,'enemy').skillLocked&&b.enemy.hp>0&&s.hp>0&&b.effects.some(e=>e.actor==='player'&&['attack','skill'].includes(e.kind))){b.enemy.counterReady=false;const power=Math.max(1,b.enemy.attack-1-statusModifiers(s,'enemy').attack-effectiveStats(s).defense),blocked=Math.min(power,b.playerShield);b.playerShield-=blocked;const damage=power-blocked;s.hp=Math.max(0,s.hp-damage);emit(s,'counter','enemy','player','우두머리의 역습',damage);if(blocked)emit(s,'block','player','player','보호막 흡수',blocked);log(s,'enemy',`우두머리의 역습 — ${damage} 피해${blocked?`, 보호막이 ${blocked} 흡수`:''}.`);}}else enemyTurn(s);if(acting==='player')finishTechniqueTurn(s);decayStatuses(s,acting);if(acting==='enemy'&&b.enemy.disrupted)b.enemy.disrupted--;finish(s);
 if(!b.outcome){if(b.actor!==b.first)b.round++;b.actor=b.actor==='player'?'enemy':'player';finish(s);}
 return s;
}
export function fastForward(state){let s=structuredClone(state);for(let n=0;n<110&&!s.battle.outcome;n++)s=tickBattle(s);return s;}
export function battleActions(s){
 const b=s.battle;if(s.scene!=='battle'||!b||b.outcome)return [];
 const basic=[{id:'basic',name:'기본 공격',description:'위력 '+effectiveStats(s).attack+(s.path==='inner'?' · 축기 +1':''),cost:0},{id:'defend',name:'기본 방어',description:'보호막 +2'+(s.path==='inner'?' · 축기 +1 · 숨 +1':''),cost:0},{id:'breathe',name:'호흡 고르기',description:'숨 +2'+(s.path==='inner'?' · 축기 +1':''),cost:0}];
 if(b.pathState?.casting)basic.unshift({id:'release',name:b.pathState.casting.name+' 발동',description:'준비한 주문을 발동합니다.',cost:0,disabled:!!statusModifiers(s,'player').skillLocked,reason:statusModifiers(s,'player').skillLocked?'감전 중':''});
 return [...basic,...abilities(s).filter(a=>s.loadout?.includes(a.id)).map(a=>{const healthCost=a.technique?.ops.filter(o=>o.kind==='selfDamage').reduce((n,o)=>n+o.value,0)||0;const uses=(b.skillUses?.[a.id]||0),cooldown=b.cooldowns[a.id]||0,reason=s.hp<=healthCost?'체력 부족':b.round<a.readyTurn?a.readyTurn+'턴부터 사용':cooldown?'대기 '+cooldown+'턴':a.uses&&uses>=a.uses?'사용 횟수 소진':statusModifiers(s,'player').skillLocked?'감전 · 기술 봉쇄':a.mode==='cast'&&b.pathState?.casting?'준비한 주문이 있습니다':a.free&&b.freeUsed?'이번 턴에 이미 사용':s.energy<a.cost?'숨 부족':'';return {...a,remaining:a.uses?a.uses-uses:null,disabled:!!reason,reason};})].map(a=>({...a,disabled:a.disabled||b.actor!=='player'}));
}
export function settleEnemy(state){let s=structuredClone(state);if(s.scene==='battle'&&s.battle&&!s.battle.outcome&&s.battle.actor==='enemy')s=tickBattle(s);return s;}
export function playTurn(state,id){
 const option=battleActions(state).find(a=>a.id===id);if(!option||option.disabled)throw Error(option?.reason||'지금 선택할 수 없는 행동입니다.');
 let s=structuredClone(state),b=s.battle;b.skillUses??={};
 if(option.free){b.effects=[];b.command=id;b.freeUsed=true;manualAction(s);delete b.command;b.skillUses[id]=(b.skillUses[id]||0)+1;return s;}
 for(const key of Object.keys(b.cooldowns))b.cooldowns[key]=Math.max(0,b.cooldowns[key]-1);
 b.freeUsed=false;b.command=id;
 if(option.uses)b.skillUses[id]=(b.skillUses[id]||0)+1;
 s=tickBattle(s);delete s.battle.command;
 const own=[...(s.battle.effects||[])];if(!s.battle.outcome)s=settleEnemy(s);
 if(s.battle.turn!==b.turn+1)s.battle.effects=[...own,...s.battle.effects].map((e,i)=>({...e,id:s.battle.turn+'-'+i}));
 return s;
}
