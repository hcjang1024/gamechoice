import {scalar,powerFormula,describeTechnique} from './techniques.mjs';
import {applyStatus,statusFor,statusRules,statusModifiers} from './statuses.mjs';
const scalable=new Set(['shield','heal','energy','counter','empower']);
export const operationValue=(a,o)=>o.value+(scalable.has(o.kind)?a.rank||0:0);
export function techniquePower(s,a,base){return scalar(s,{baseAttack:base},a.technique.power)+(a.rank||0)*1.5;}
export function techniqueBuffs(s){const out={attack:0,defense:0,accuracy:0,evasion:0};for(const b of s.battle?.techniqueState?.buffs||[])if(b.turns>0)out[b.stat]+=b.value;return out;}
export function ensureTechniqueState(s){return s.battle.techniqueState??={buffs:[],mark:0,markTurns:0,regen:[],resonance:0};}
export function finishTechniqueTurn(s){const t=ensureTechniqueState(s);for(const b of t.buffs)b.turns--;t.buffs=t.buffs.filter(b=>b.turns>0);if(t.markTurns>0&&!--t.markTurns)t.mark=0;}
export function beginTechniqueTurn(s,api){const t=ensureTechniqueState(s);for(const r of t.regen){const gain=Math.min(api.maxHp(s)-s.hp,Math.floor(r.value*statusModifiers(s,'player').healing));s.hp+=gain;if(gain)api.emit(s,'heal','player','player','기술의 유지 회복',gain);r.turns--;}t.regen=t.regen.filter(r=>r.turns>0);}
export function addTechniqueStatus(s,side,id,count=1){return applyStatus(s,side,id,{stacks:count,extend:true});}
export function executeTechnique(s,a,api,{release=false}={}){
 const b=s.battle,p=api.pathState(s),t=ensureTechniqueState(s),spec=a.technique,notes=[];
 if(spec.cast&&!release){s.energy-=a.cost;p.casting={id:a.id,name:a.name,cost:a.cost};t.resonance=Math.min(3,t.resonance+1);api.emit(s,'cast','player','player',a.name+' 준비');api.log(s,'player',a.name+' 준비 · 다음 내 턴에 발동 가능 · 공명 '+t.resonance+'/3');return;}
 if(!release)s.energy-=a.cost;
 b.cooldowns[a.id]=a.cooldown;
 let power=spec.power?techniquePower(s,a,b.stats.attack+techniqueBuffs(s).attack):0;
 if(spec.spendCharge&&s.path==='inner'){const charge=p.vigor||0;p.vigor=0;if(spec.chargeInto==='shield'){b.playerShield+=charge*2;notes.push('축기 '+charge+' → 보호막 '+charge*2);}else{power+=charge*(spec.chargeFactor||2);notes.push('축기 '+charge+' 방출');}}
 if(spec.spendResonance){power+=t.resonance*3;notes.push('공명 '+t.resonance+' 소모');t.resonance=0;}
 let drain=0,counterStatus=null;
 const countStatus=(side,id)=>id==='all'?Object.values(b.statuses[side]).reduce((sum,r)=>sum+r.stacks,0):statusFor(s,side,id)?.stacks||0;
 for(const o of spec.ops){const v=operationValue(a,o),side=o.side||'enemy';switch(o.kind){
  case 'consume':{const count=countStatus(side,o.status);power+=count*v;delete b.statuses[side][o.status];notes.push((statusRules[o.status]?.name||'상태')+' '+count+'중첩 소모');break;}
  case 'convert':{const count=countStatus(side,o.status);delete b.statuses[side][o.status];const amount=count*v;if(o.into==='shield')b.playerShield+=amount;else if(o.into==='energy')s.energy=Math.min(api.maxEnergy(s),s.energy+amount);else s.hp=Math.min(api.maxHp(s),s.hp+Math.floor(amount*statusModifiers(s,'player').healing));notes.push('상태 '+count+'중첩 전환');break;}
  case 'transfer':{const count=countStatus('player',o.status);delete b.statuses.player[o.status];if(count)addTechniqueStatus(s,'enemy',o.status,count*v);notes.push('상태 '+count+'중첩 이전');break;}
  case 'mark':t.mark=Math.min(6,t.mark+v);t.markTurns=4;notes.push('표식 '+t.mark);break;
  case 'consumeMark':power+=t.mark*v;notes.push('표식 '+t.mark+' 소모');t.mark=0;t.markTurns=0;break;
  case 'shieldToPower':power+=b.playerShield*v;notes.push('보호막 '+b.playerShield+' 소모');b.playerShield=0;break;
  case 'missingPower':power+=(api.maxHp(s)-s.hp)*v;break;
  case 'missingEnemyPower':power+=(b.enemy.maxHp-b.enemy.hp)*v;break;
  case 'drain':drain+=v;break;
  case 'selfDamage':s.hp=Math.max(0,s.hp-v);api.emit(s,'bleed','player','player','기술의 대가',v);break;
  case 'cleanse':for(const key of o.statuses||Object.keys(b.statuses.player))delete b.statuses.player[key];notes.push('상태 정화');break;
  case 'shield':b.playerShield+=v;api.emit(s,'guard','player','player',a.name,v);notes.push('보호막 +'+v);break;
  case 'heal':{const gain=Math.min(api.maxHp(s)-s.hp,Math.floor(v*statusModifiers(s,'player').healing));s.hp+=gain;api.emit(s,'heal','player','player',a.name,gain);notes.push('체력 +'+gain);break;}
  case 'energy':{const gain=Math.min(api.maxEnergy(s)-s.energy,Math.max(0,v-statusModifiers(s,'player').recovery));s.energy+=gain;api.emit(s,'recover','player','player',a.name,gain);notes.push('숨 +'+gain);break;}
  case 'renew':t.regen.push({value:v,turns:3});notes.push('유지 회복 '+v+' × 3회');break;
  case 'buff':{const existing=t.buffs.find(r=>r.id===a.id&&r.stat===o.stat);if(existing){existing.value=o.value;existing.turns=o.turns+1;}else t.buffs.push({id:a.id,stat:o.stat,value:o.value,turns:o.turns+1});notes.push('능력 보정 '+o.turns+'회');break;}
  case 'empower':b.empower=(b.empower||0)+v;notes.push('다음 공격 +'+v);break;
  case 'counter':b.counter=true;b.counterMagic=s.path==='outer';b.counterPower=(b.counterPower||0)+v;notes.push(s.path==='outer'?'술식 반사 준비':'반격 준비');if(o.status)counterStatus=o.status;break;
  case 'counterStatus':counterStatus=o.status;b.counter=true;notes.push('속성 반격');break;
  case 'shieldBreak':{const lost=Math.min(b.enemy.shield||0,v);b.enemy.shield=(b.enemy.shield||0)-lost;if(lost)api.emit(s,'status','player','enemy','보호막 파쇄',lost);break;}
  case 'charge':if(s.path==='inner'){p.vigor=Math.min(3,(p.vigor||0)+v);notes.push('축기 '+p.vigor+'/3');}break;
  case 'resonance':t.resonance=Math.min(3,t.resonance+v);notes.push('공명 '+t.resonance+'/3');break;
  case 'disrupt':b.enemy.disrupted=Math.max(b.enemy.disrupted||0,v);b.enemy.counterReady=false;break;
  case 'stun':b.enemy.stun=Math.max(b.enemy.stun||0,v);break;
  case 'field':p.field={turns:o.value,element:o.element||s.element,ward:!!o.ward};notes.push(p.field.element+' 영역 '+o.value+'회');break;
  case 'status':break; // Applied on a successful strike, or immediately for support.
  default:throw Error('Unknown operation '+o.kind);
 }}
 if(counterStatus)b.counterStatus=counterStatus;
 let total=0,landed=!spec.power;
 if(spec.power&&s.hp>0&&!api.bleedOnAttack(s,'player')){
  power+=b.empower||0;b.empower=0;
  for(let hit=0;hit<(spec.hits||1)&&b.enemy.hp>0;hit++){
   const result=api.strike(s,power,{pierce:!!spec.pierce,accuracy:spec.accuracy||0});total+=result.damage||0;landed||=!result.miss;api.emit(s,result.miss?'dodge':'skill','player','enemy',a.name+(spec.hits>1?' · '+(hit+1)+'타':''),result.damage||0,{magic:s.path==='outer',critical:!!result.critical});if(result.blocked)api.emit(s,'block','enemy','enemy','적의 방어',result.blocked);
  }
  notes.unshift('타격 '+total+' 피해');if(drain&&total){const gain=Math.min(api.maxHp(s)-s.hp,Math.floor(total*drain*statusModifiers(s,'player').healing));s.hp+=gain;notes.push('흡수 회복 +'+gain);}
 }
 for(const o of spec.ops.filter(o=>o.kind==='status'))if(o.side==='player'||landed){addTechniqueStatus(s,o.side||'enemy',o.status,o.value);api.emit(s,'status','player',o.side||'enemy',statusRules[o.status].name+' '+o.value+'중첩');}
 api.log(s,'player',a.name+' · '+notes.join(' · '),{skill:a.name});
}
export function techniqueInsight(s,a,base){
 const spec={...a.technique,rank:a.rank||0},power=spec.power?techniquePower(s,a,base):0,description=describeTechnique(s,spec);
 return {value:spec.power?'타격 위력 '+Number(power.toFixed(2))+' × '+(spec.hits||1)+'회':description,formula:spec.power?powerFormula(spec.power)+(spec.spendCharge?' + 축기 × '+(spec.chargeFactor||2):'')+(spec.spendResonance?' + 소모 공명 × 3':''):'고정 효과 · 보호막/즉시 회복/숨/반격/공격 강화는 각 기본값 + 강화 단계',notes:description+' / 표식은 최대 6중첩, 공명은 최대 3중첩. 실제 타격은 방어·보호막·명중·치명타를 반영합니다.'};
}
