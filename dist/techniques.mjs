import {combatAttribute} from './attributes.mjs';
// Authored weapon actions, path operation, and element-specific interactions.
// These three layers form 84 distinct, sixteen-technique loadout catalogs.
const P=(ratio=1,stat='skill',factor=.5,flat=2)=>({ratio,stat,factor,flat});
const O=(kind,value=1,extra={})=>({kind,value,...extra});
const S=(status,value=1,side='enemy')=>O('status',value,{status,side});
const B=(stat,value,turns=2)=>O('buff',value,{stat,turns});
const C=(status,value,into='power',side='enemy')=>O('consume',value,{status,into,side});
const H=(name,power,ops=[],extra={})=>({name,power,ops,...extra});
const D=(name,ops,extra={})=>H(name,null,ops,extra);
export const weaponTechniques={
 맨손:[
  H('연환장',P(.55),[],{hits:2}),H('파심권',P(.9,'skill',.8),[O('disrupt',1)]),H('쇄맥지',P(.75,'insight',.8),[O('mark',2)]),H('붕산각',P(1.3,'skill',.7),[O('shieldBreak',3)]),
  D('맞받아치기',[O('shield',2),O('counter',3)]),D('유연보',[B('evasion',.25),O('charge',1)]),D('잡아 넘기기',[O('shield',2),O('stun',1)]),D('철신공',[O('shield',5),B('defense',1)]),
  D('단전 고르기',[O('energy',3),O('charge',1)]),D('혈맥 조율',[O('heal',4),O('cleanse',1,{statuses:['bleed']})]),D('빈틈 읽기',[O('mark',3),B('accuracy',.12)]),D('발경 준비',[O('empower',3)],{free:true}),
  H('백열연환',P(.5,'skill',.4),[],{hits:5}),H('역혈붕권',P(1.5),[O('missingPower',.8)]),D('금강반탄',[O('shield',8),O('counter',8)]),H('잠룡승천',P(1.2,'skill',1),[O('consumeMark',3),O('stun',1)])
 ],
 검:[
  H('흘림검',P(),[O('shield',1)]),H('정밀 찌르기',P(.9,'insight',.8),[],{accuracy:.2,pierce:true}),H('연섬',P(.5,'skill',.5),[],{hits:3}),H('파훼검',P(1,'control',.7),[O('disrupt',1),O('shieldBreak',4)]),
  D('검막 반격',[O('shield',3),O('counter',2)]),D('유수보',[B('evasion',.2),B('accuracy',.08)]),D('검의 원',[O('shield',4),O('cleanse',1,{statuses:['unsteady']})]),D('간파 수비',[O('shield',3),O('disrupt',2)]),
  D('검심 호흡',[O('energy',3),B('accuracy',.05)]),D('상처 봉합',[O('heal',3),O('shield',2)]),D('검로 관찰',[O('mark',2),B('attack',1)]),D('일섬 예비',[O('empower',4)],{free:true}),
  H('무영일섬',P(1.8,'insight',1),[],{pierce:true,accuracy:.15}),H('천류검무',P(.65,'skill',.5),[O('shield',3)],{hits:4}),D('역천검벽',[O('shield',7),O('counter',7),B('accuracy',.1)]),H('절맥검결',P(1.3,'control',1),[O('consumeMark',4),O('disrupt',2)])
 ],
 도:[
  H('중단 베기',P(1.3,'skill',.8),[],{pierce:true}),H('혈흔 가르기',P(1.1),[S('bleed',1)]),H('철갑 파쇄',P(1.2),[O('shieldBreak',6)]),H('결사 내려치기',P(1.7,'skill',1),[O('selfDamage',2)]),
  D('도신 받기',[O('shield',4),O('counter',4)]),D('무게 버티기',[O('shield',5),B('evasion',-.08)]),D('날 세운 수비',[O('shield',2),O('counter',5,{status:'bleed'})]),D('강철 자세',[B('defense',2),O('shield',2)]),
  D('거친 호흡',[O('energy',4),O('selfDamage',1)]),D('핏줄 동여매기',[O('heal',3),O('cleanse',1,{statuses:['bleed','poison']})]),D('파갑 예고',[O('shieldBreak',4),O('mark',2)]),D('사력 집중',[O('empower',6),O('selfDamage',1)],{free:true}),
  H('단산일도',P(2,'skill',1.1),[O('shieldBreak',8)],{pierce:true}),H('혈해난무',P(.8),[S('bleed',2)],{hits:3}),H('역경참',P(1.2),[O('missingPower',1.2)]),H('파군참수',P(1.4,'skill',1),[C('bleed',4),O('disrupt',2)])
 ],
 창:[
  H('관통 찌르기',P(1,'skill',.7),[],{pierce:true}),H('퇴로 봉쇄',P(.9,'insight',.6),[O('disrupt',1),O('mark',1)]),H('이중 창격',P(.65),[],{hits:2}),H('회전 휩쓸기',P(1.15),[B('evasion',.12)]),
  D('창끝 견제',[O('shield',2),O('counter',3),O('mark',1)]),D('거리 벌리기',[B('evasion',.25),O('energy',1)]),D('회전 방벽',[O('shield',5),O('shieldBreak',2)]),D('봉쇄 진형',[O('shield',3),O('disrupt',2)]),
  D('호흡 잇기',[O('energy',3),O('mark',1)]),D('진형 정비',[O('heal',3),B('defense',1)]),D('사거리 재기',[O('mark',3),B('accuracy',.1)]),D('일점 조준',[O('empower',4),O('mark',1)],{free:true}),
  H('일점천공',P(1.6,'insight',.8),[O('consumeMark',4)],{pierce:true}),H('낙성창우',P(.7),[O('shieldBreak',5)],{hits:4}),D('만인저지',[O('shield',8),O('counter',6),O('disrupt',1)]),H('용린회격',P(1.5,'skill',.8),[O('stun',1),B('evasion',.2)])
 ],
 활:[
  H('집중 사격',P(1,'insight',.8),[],{accuracy:.2}),H('표식 화살',P(.8,'insight',.6),[O('mark',2)]),H('속사',P(.5,'skill',.5),[],{hits:3}),H('철갑 관통시',P(1.2,'skill',.8),[O('shieldBreak',3)],{pierce:true}),
  D('회피 사격',[B('evasion',.25),O('counter',2)]),D('연막 후퇴',[B('evasion',.2),O('disrupt',1)]),D('덫 놓기',[O('shield',2),O('stun',1)]),D('은폐 엄호',[O('shield',4),B('accuracy',.12)]),
  D('화살 고르기',[O('energy',3),B('accuracy',.08)]),D('야전 치료',[O('heal',4),O('cleanse',1,{statuses:['poison']})]),D('약점 추적',[O('mark',4)]),D('심호흡 조준',[O('empower',3),B('accuracy',.15)],{free:true}),
  H('낙성의 한 발',P(1.6,'insight',1),[O('consumeMark',5)],{pierce:true,accuracy:.2}),H('천우난사',P(.5,'insight',.4),[],{hits:6}),D('허수아비 전술',[O('shield',5),B('evasion',.35),O('counter',5)]),H('사냥의 종결',P(1.2,'insight',1),[O('missingEnemyPower',.2),O('disrupt',2)])
 ],
 지팡이:[
  H('회류 타격',P(.9,'control',.8),[O('shield',2)]),H('파동 발사',P(1.1,'control',1),[O('mark',1)]),H('봉인의 낙인',P(.75,'insight',.8),[O('disrupt',2)]),H('반향 삼격',P(.5,'control',.5),[],{hits:3}),
  D('원형 결계',[O('shield',5)]),D('역류 방호',[O('shield',3),O('counter',2),O('energy',1)]),D('정신 장막',[O('shield',3),O('cleanse',1,{statuses:['shock','unsteady']})]),D('결계 재생',[O('shield',2),O('renew',2)]),
  D('매개 정렬',[O('energy',4)]),D('생기 회류',[O('heal',3),O('renew',1)]),D('술식 분석',[O('mark',2),O('disrupt',1)]),D('공명 증폭',[O('empower',4),O('shield',1)],{free:true}),
  H('만류붕괴',P(1.5,'control',1.4),[O('shieldBreak',6)]),H('천환유성',P(.65,'control',.5),[O('shield',3)],{hits:4}),D('불멸의 성역',[O('shield',8),O('renew',3),O('cleanse',1)]),H('원류 역전',P(1.1,'control',1),[O('consumeMark',4),O('energy',3)])
 ]
};
// Each index has a different elemental interaction, not a universal on-hit tag.
export const elementTechniques={
 물:{prefix:'수맥',spell:'빙류',ops:[
  [S('chill')],[S('chill',2),O('shield',1)],[C('chill',2),O('shield',2)],[S('chill'),O('heal',1)],
  [O('counterStatus',1,{status:'chill'})],[O('cleanse',1,{statuses:['burn']}),O('shield',2)],[O('renew',1)],[S('chill'),O('disrupt',1)],
  [O('cleanse',1,{statuses:['burn']})],[O('cleanse',1,{statuses:['burn','poison']}),O('heal',1)],[O('convert',2,{status:'chill',into:'energy',side:'enemy'})],[B('defense',1,2)],
  [C('chill',4),O('stun',1)],[S('chill',3),O('shield',3)],[O('cleanse',1),O('renew',2)],[O('field',3,{element:'물',ward:true})]
 ]},
 불:{prefix:'염맥',spell:'화류',ops:[
  [S('burn')],[S('burn',2)],[C('burn',3)],[S('burn',1,'player'),S('burn',2)],
  [O('counterStatus',1,{status:'burn'})],[O('convert',3,{status:'burn',into:'shield',side:'player'})],[S('burn',2),O('selfDamage',1)],[O('shield',3),S('burn',1,'player')],
  [S('burn',1,'player'),O('energy',1)],[O('convert',3,{status:'burn',into:'heal',side:'player'})],[O('transfer',1,{status:'burn'})],[O('empower',2),S('burn',1,'player')],
  [C('burn',5)],[S('burn',3),S('burn',1,'player')],[O('transfer',2,{status:'burn'}),O('shield',3)],[O('field',3,{element:'불'}),O('empower',3)]
 ]},
 흙:{prefix:'지맥',spell:'암류',ops:[
  [S('corrosion')],[O('shieldBreak',3),S('corrosion')],[O('shieldToPower',.5)],[C('corrosion',3)],
  [O('shield',2)],[B('defense',1,3)],[O('counterStatus',1,{status:'corrosion'})],[O('shield',3),B('evasion',-.05)],
  [O('shield',2)],[O('shield',3)],[O('convert',3,{status:'corrosion',into:'shield',side:'enemy'})],[O('empower',1),O('shield',2)],
  [C('corrosion',5),O('shieldBreak',6)],[S('corrosion',2),O('shield',3)],[O('shield',5),B('defense',2)],[O('field',3,{element:'흙',ward:true})]
 ]},
 바람:{prefix:'풍맥',spell:'선풍',ops:[
  [S('unsteady')],[O('mark',1),B('accuracy',.08)],[O('consumeMark',2)],[S('unsteady',2),B('evasion',.08)],
  [B('evasion',.12)],[O('energy',1),S('unsteady')],[O('counterStatus',1,{status:'unsteady'})],[B('evasion',.2)],
  [B('evasion',.1)],[O('cleanse',1,{statuses:['unsteady','chill']})],[O('mark',2),O('disrupt',1)],[B('accuracy',.15),O('empower',1)],
  [O('consumeMark',4)],[S('unsteady',3),B('evasion',.15)],[O('disrupt',2),B('evasion',.25)],[O('field',3,{element:'바람'}),O('mark',3)]
 ]},
 나무:{prefix:'목맥',spell:'생류',ops:[
  [S('poison')],[S('poison'),O('heal',1)],[C('poison',3),O('heal',2)],[S('poison',2),O('drain',.15)],
  [O('counterStatus',1,{status:'poison'})],[O('renew',1)],[O('cleanse',1,{statuses:['poison']})],[O('shield',1),O('renew',1)],
  [O('energy',1),O('heal',1)],[O('heal',2),O('cleanse',1,{statuses:['poison']})],[O('convert',3,{status:'poison',into:'heal',side:'enemy'})],[O('renew',1)],
  [C('poison',5),O('drain',.3)],[S('poison',3),O('renew',2)],[O('cleanse',1),O('heal',3)],[O('field',3,{element:'나무',ward:true})]
 ]},
 쇠:{prefix:'금맥',spell:'강류',ops:[
  [S('bleed')],[O('shieldBreak',2),S('bleed',2)],[C('bleed',3)],[S('bleed'),O('mark',2)],
  [O('counterStatus',1,{status:'bleed'})],[O('shield',2),O('cleanse',1,{statuses:['bleed']})],[O('shieldBreak',3)],[O('counter',2)],
  [O('cleanse',1,{statuses:['bleed']})],[O('convert',3,{status:'bleed',into:'heal',side:'player'})],[O('transfer',1,{status:'bleed'})],[O('empower',2),B('accuracy',.05)],
  [C('bleed',5)],[S('bleed',3),O('shieldBreak',4)],[O('counter',4),O('shield',3)],[O('convert',4,{status:'bleed',into:'shield',side:'enemy'}),O('empower',3)]
 ]},
 번개:{prefix:'뇌맥',spell:'섬뢰',ops:[
  [O('mark',1),S('shock')],[S('shock'),O('disrupt',1)],[O('consumeMark',2),B('accuracy',.1)],[O('shieldBreak',3),S('shock')],
  [O('counterStatus',1,{status:'shock'})],[O('disrupt',1)],[O('cleanse',1,{statuses:['shock']}),O('energy',1)],[S('shock'),O('shield',1)],
  [O('energy',1),O('mark',1)],[O('cleanse',1,{statuses:['shock','chill']})],[O('mark',2),S('shock')],[O('empower',2),B('accuracy',.1)],
  [O('consumeMark',5),S('shock')],[S('shock'),O('disrupt',2)],[O('counter',4),O('counterStatus',1,{status:'shock'})],[O('field',3,{element:'번개'}),O('energy',2)]
 ]}
};
export const pathTechniques={
 inner:[
  {spendCharge:true},{spendCharge:true,ops:[O('charge',1)]},{spendCharge:true},{spendCharge:true,chargeFactor:3},
  {ops:[O('charge',1)]},{ops:[O('charge',1)]},{ops:[O('charge',1)]},{spendCharge:true,chargeInto:'shield'},
  {ops:[O('charge',2)]},{ops:[O('charge',1)]},{ops:[O('charge',1)]},{ops:[O('charge',1)]},
  {spendCharge:true,chargeFactor:3},{spendCharge:true,chargeFactor:2},{spendCharge:true,chargeInto:'shield'},{ops:[O('charge',3),O('energy',2)]}
 ],
 outer:[
  {cast:true},{cast:true,ops:[O('field',2)]},{cast:true},{cast:true,spendResonance:true},
  {ops:[O('disrupt',1)]},{ops:[O('resonance',1)]},{ops:[O('resonance',1)]},{ops:[O('field',2,{ward:true})]},
  {ops:[O('resonance',2)]},{ops:[O('renew',1)]},{ops:[O('disrupt',1)]},{ops:[O('resonance',1)]},
  {cast:true,spendResonance:true},{cast:true,ops:[O('field',3)]},{ops:[O('field',2,{ward:true})]},{ops:[O('resonance',3),O('energy',2),O('field',3)]}
 ]
};
const ids=['weapon','element','chain','infused','counter','guard','flow-counter','aegis','focus','mend','purify','stance','signature','tempest','detonate','ascend'];
const categories=['attack','defense','special','ultimate'];
const labels={attack:'공격',defense:'수비',special:'특수',ultimate:'궁극기'};
const outerNames={맨손:['수인연탄','파심인','쇄맥낙인','붕산파','반사수인','유운결','구속수인','철신장막','수인정렬','혈맥순환','공명간파','수인증폭','백열수인진','역혈공명','금강반사경','잠룡현신'],검:['검궤유도탄','정밀술검','삼중검영','파훼술검','역류검막','유수장막','검영결계','술식간파','검궤정렬','생기검막','검로공명','섬광예비','무영술검','천류검진','역천검계','절맥검진'],도:['중단도탄','혈흔도인','철갑분해','결사파열','도탄반사','중력장막','혈인방호','강철술갑','거친인도','혈흔봉합','파갑낙인','사력공명','단산붕괴','혈해도진','역경파열','파군도진'],창:['관통술창','퇴로결박','이중창영','회전술창','창영반사','원거리결','회전술벽','봉쇄결계','창궤인도','진형순환','사거리공명','일점정렬','천공술창','낙성창진','만인봉쇄','용린회진'],활:['유도술시','추적낙인','분기술시','철갑술시','반사술시','연막교란','구속진','은폐결계','시궤정렬','야전순환','약점낙인','심호흡공명','낙성술시','천우술진','허상분신','사냥의인장'],지팡이:['회류탄','파동술','봉인낙인','삼중반향','원형술벽','역류결계','정신술막','재생술벽','매개인도','생기순환','술식해석','매개증폭','만류술진','천환유성진','불멸성역','원류역전진']};
export function techniqueCatalog(s){
 if(!weaponTechniques[s.weapon]||!pathTechniques[s.path]||!elementTechniques[s.element])return [];
 return weaponTechniques[s.weapon].map((base,index)=>{
  const path=pathTechniques[s.path][index],element=elementTechniques[s.element],category=categories[Math.floor(index/4)],rank=s.journey?.skillRanks?.[ids[index]]||0;
  const power=base.power?{...base.power}:null,ops=[...base.ops,...element.ops[index],...(path.ops||[])];
  const name=(s.path==='outer'?element.spell+' '+outerNames[s.weapon][index]:element.prefix+' '+base.name)+(rank?' +'+rank:'');
  const cost=category==='special'?(index===8?0:index===11?1:2):category==='ultimate'?3:category==='defense'?1:2;
  const spec={...base,...path,power,ops,rank,index};
  return {id:ids[index],name,category,kind:labels[category],cost,cooldown:category==='ultimate'?5:base.free?4:category==='special'?3:2,readyTurn:category==='ultimate'?2:0,minLevel:category==='ultimate'?3:['chain','mend'].includes(ids[index])?2:index%4<2?1:2,uses:category==='ultimate'?2:base.free?4:null,free:!!base.free,rank,mode:path.cast?'cast':'instant',technique:spec,description:describeTechnique(s,spec),...({chain:{stat:s.path==='outer'?'control':'skill',min:2},mend:{stat:'control',min:2},infused:{ingredients:['weapon','element'],labels:['무기 기술','결의 기술']},'flow-counter':{ingredients:['element','counter'],labels:['결의 기술','반격']},aegis:{ingredients:['guard','element'],labels:['수비','결의 기술']},tempest:{ingredients:['chain','infused'],labels:['연속격','합격']}}[ids[index]]||{})};
 });
}
export function scalar(s,a,value){if(typeof value==='number')return value;const v=value||{};return (v.ratio||0)*(a.baseAttack||0)+combatAttribute(s,v.stat)*(v.factor||0)+(v.flat||0);}
const statNames={skill:'근력',control:'지능',insight:'민첩'};
export function powerFormula(p){return [p.ratio?'전투 위력 × '+p.ratio:'',p.factor?statNames[p.stat]+' × '+p.factor:'',p.flat?String(p.flat):'','강화 × 1.5'].filter(Boolean).join(' + ');}
const statusNames={chill:'냉기',burn:'화상',corrosion:'부식',unsteady:'흔들림',poison:'중독',bleed:'출혈',shock:'감전'};
export function describeTechnique(s,spec){
 const ops=spec.ops.map(o=>{const v=o.value+(['shield','heal','energy','counter','empower'].includes(o.kind)?spec.rank||0:0)+(o.kind==='heal'?Math.floor(combatAttribute(s,'charisma')/10):0),n=statusNames[o.status]||'모든 상태',side=o.side==='player'?'자신':'적';switch(o.kind){
  case 'status':return side+' '+n+' '+v+'중첩';case 'shield':return '보호막 +'+v;case 'heal':return '체력 +'+v;case 'energy':return '숨 +'+v;case 'renew':return '3회 유지 회복 '+v;case 'counter':return '반격 위력에 +'+v;case 'counterStatus':return '반격 적중 시 '+n+' '+v+'중첩';case 'disrupt':return '강타·주문 교란 '+v+'회';case 'stun':return '적 경직 '+v+'회';case 'mark':return '추적 표식 +'+v;case 'consumeMark':return '표식 소모 · 중첩당 위력 +'+v;case 'consume':return side+' '+n+' 소모 · 중첩당 위력 +'+v;case 'convert':return side+' '+n+' 소모 · 중첩당 '+({shield:'보호막',heal:'회복',energy:'숨'}[o.into])+' +'+v;case 'transfer':return '자신의 '+n+'을 '+v+'배로 적에게 이전';case 'buff':return ({attack:'위력',defense:'방어',accuracy:'명중',evasion:'회피'}[o.stat])+' '+(v>0?'+':'')+(Math.abs(v)<1?Math.round(v*100)+'%p':v)+' · '+o.turns+'회';case 'empower':return '다음 공격 위력 +'+v;case 'shieldBreak':return '적 보호막 -'+v;case 'selfDamage':return '자신의 체력 -'+v;case 'missingPower':return '잃은 체력 × '+v+' 추가 위력';case 'missingEnemyPower':return '적이 잃은 체력 × '+v+' 추가 위력';case 'shieldToPower':return '보호막을 모두 소모 · 소모량 × '+v+' 추가 위력';case 'cleanse':return (o.statuses?o.statuses.map(x=>statusNames[x]).join('·'):'모든 상태이상')+' 정화';case 'drain':return '실제 타격 피해 '+Math.round(v*100)+'% 회복';case 'charge':return s.path==='inner'?'축기 +'+v:'';case 'resonance':return '공명 +'+v+' (최대 3)';case 'field':return (o.element||s.element)+' 영역 '+v+'회'+(o.ward?' · 보호막 보충':'');default:throw Error('Unknown technique operation '+o.kind);
 }}).filter(Boolean);
 return [spec.power?'타격 '+(spec.hits||1)+'회'+(spec.pierce?' · 방어 관통':''):'',spec.cast?'주문 준비 후 직접 발동':'즉시 발동',spec.spendCharge?'축기 소모 · '+(spec.chargeInto==='shield'?'보호막':'위력')+' 강화':'',spec.spendResonance?'공명 소모 · 중첩당 위력 +3':'',...ops].filter(Boolean).join(' / ');
}
