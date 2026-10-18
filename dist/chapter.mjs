import {routeTemplate,routePlan,PRE_BOSS_STEPS} from './routes.mjs';
import {campaignFor,secondEvents} from './campaign.mjs';
import {maxHp,maxEnergy} from './combat.mjs';

export const stops=routeTemplate(1);
export const TOTAL_STOPS=PRE_BOSS_STEPS;
export const stopsFor=s=>s.journey?.route?.plan||routeTemplate(s.journey?.chapter||1);
export const optionPoolFor=(s,index=s.journey.route.used)=>routeTemplate(s.journey?.chapter||1)[index]?.options||[];
export const kindLabels={fight:'전투',story:'이벤트',shop:'상점',rest:'휴식',mentor:'가르침',forge:'공방',boss:'보스'};
export function awardExperience(s,amount){const j=s.journey;j.xp+=amount;let levels=0;while(j.xp>=6+(j.level-1)*3){j.xp-=6+(j.level-1)*3;j.level++;j.points++;levels++;}return levels;}
const opt=(id,title,hint='',disabled=false)=>({id,title,hint,disabled});
function checkpoint(s){const copy=structuredClone(s);delete copy.journey.route;copy.scene='hub';copy.battle=null;Object.assign(copy.journey,{active:null,reward:null,history:[],cleared:[],runs:0,complete:false});copy.hp=maxHp(copy);copy.energy=maxEnergy(copy);return copy;}
export function ensureRoute(s,legacy=false){const j=s.journey;if(!j)return;j.chapter??=1;if(j.route){const r=j.route;if(r.checkpoint?.journey)r.checkpoint.journey.chapter??=j.chapter;if(r.version!==2||!r.plan){r.plan=routePlan(s);r.total=TOTAL_STOPS;r.version=2;if(r.ended||r.current?.kind==='boss')r.used=TOTAL_STOPS;if(r.current?.kind==='boss')r.current.step=TOTAL_STOPS+1;}return;}
 const seed=checkpoint(s);let used=0,current=null,ended=null;
 if(legacy){const paidTitles=new Set(['상점에서 장비와 소모품을 살핀다','새 기술을 배우거나 조합한다','공방에서 무기와 방호구를 손본다','샘가에서 충분히 쉰다','솔바람 산길','옛 취수로','안개 고갯길']);used=Math.min(TOTAL_STOPS,Math.max(j.history?.length||0,s.journal.filter(e=>paidTitles.has(e.choice)).length));
  if(j.complete){used=TOTAL_STOPS;ended='victory';}
  else if(['combat','battle','reward'].includes(s.scene)&&j.active){const boss=j.active==='pass';used=boss?TOTAL_STOPS:Math.max(1,used);current={id:'legacy-fight',kind:boss?'boss':'fight',zone:j.active,name:boss?'봉쇄대의 우두머리':'진행 중이던 전투',step:used};}
  else if(['shop','school','synthesis','forge'].includes(s.scene)){used=Math.max(1,used);current={id:'legacy-visit',kind:s.scene==='shop'?'shop':s.scene==='forge'?'forge':'mentor',name:'진행 중이던 방문',step:used};}
 }
 j.route={version:2,plan:routePlan(s),total:TOTAL_STOPS,used,current,ended,intel:[],history:current&&current.kind!=='boss'?[{...current,outcome:'진행 중'}]:[],checkpoint:seed,migrated:legacy};
 if(legacy)s.last='장비와 성장 기록을 유지한 채 제한된 여정으로 전환했습니다. 중간 선택 '+used+'/'+TOTAL_STOPS+'회 사용.';
}
export function optionsFor(s){const r=s.journey?.route;return r&&!r.ended&&!r.current&&r.used<TOTAL_STOPS?stopsFor(s)[r.used].options:[];}
export function finishVisit(s,outcome='완료'){const r=s.journey.route;if(r.current&&r.current.kind!=='boss'){const entry=r.history.find(e=>e.step===r.current.step);if(entry&&entry.outcome==='진행 중')entry.outcome=outcome;}r.current=null;s.journey.active=null;s.scene='hub';}
export function enterOption(s,id){const r=s.journey.route;const option=optionsFor(s).find(o=>'node-'+o.id===id);if(!option)throw new Error('지금 선택할 수 없는 여정');r.used++;r.current={...option,step:r.used};r.history.push({...r.current,outcome:'진행 중'});s.last=option.name+'을 선택했다. · 중간 선택 '+r.used+'/'+r.total+'회 사용';
 if(option.kind==='rest'){s.hp=maxHp(s);s.energy=maxEnergy(s);s.last='한 번의 여정을 휴식에 썼다. 체력과 숨을 모두 회복했다.';finishVisit(s);}
 if(option.kind==='fight'){s.journey.active=option.zone;s.journey.runs++;s.flags=s.flags.filter(f=>!['advantage','guarded'].includes(f));s.scene='combat';}
 if(option.kind==='story')s.scene='chapter-event';
 if(option.kind==='shop')s.scene='shop';if(option.kind==='mentor')s.scene='school';if(option.kind==='forge')s.scene='forge';return s;
}
export function resetChapter(s){const fresh=structuredClone(s.journey.route.checkpoint);fresh.version=6;ensureRoute(fresh);fresh.last='챕터 시작 시점으로 돌아왔다. 이전 도전에서 얻은 보상과 성장은 누적되지 않는다.';return fresh;}
export function chapterScene(s){const j=s.journey,r=j?.route;if(!r)return null;const chapter=campaignFor(s);
 if(['hub','map'].includes(s.scene)){
  if(r.ended)return {chapter:5,title:r.ended==='victory'?'여정의 마지막에 남은 것':'이번 여정은 여기까지',text:[r.ended==='victory'?chapter.success:chapter.failure],choices:[...(j.complete?[opt('read-letter',chapter.id===1?'구해 낸 전령의 밀서를 읽는다':'청운문에 밀서를 전달한다','챕터의 결말')]:[]),opt('open-bag','현재 장비와 소지품을 확인한다','챕터 보상과 장비 확인'),opt('retry-chapter','챕터를 처음부터 다시 도전한다','시작 시점 복원 · 보상과 성장 누적 없음')]};
  if(r.used>=r.total)return {chapter:5,title:'마지막 길, '+chapter.bossName,text:['고갯길 끝에서 '+chapter.bossName+'가 기다린다.'],choices:[opt('challenge-boss','이 준비로 마지막 보스에게 도전한다','챕터의 마지막 전투 · 패배하면 이번 도전 종료'),opt('open-bag','남은 소모품과 장비를 점검한다','여정 추가 소모 없음'),opt('open-growth','남은 성장점을 배분한다',`성장점 ${j.points} · 여정 추가 소모 없음`)]};
  return {chapter:5,title:stopsFor(s)[r.used].name+' · 어디로 향할 것인가',text:[chapter.intro],choices:[...optionsFor(s).map(o=>opt('node-'+o.id,kindLabels[o.kind],'',false)),opt('open-bag','장착과 소모품을 확인한다','현재 소지품만 사용 · 여정 소모 없음'),opt('open-growth','이미 얻은 성장점을 배분한다',`성장점 ${j.points} · 여정 소모 없음`)]};
 }
 if(s.scene==='chapter-failed')return {chapter:5,title:chapter.id===1?'고갯길을 넘지 못한 날':'수문이 닫힌 새벽',text:['준비한 힘은 여기까지였다. '+chapter.bossName+'는 여전히 길을 지키고 있다.','같은 성장 상태로 전투와 휴식을 반복할 수는 없다. 다시 도전하면 이 챕터를 시작했을 때의 능력과 소지품으로 돌아가 아홉 단계를 다시 진행한다.'],choices:[opt('retry-chapter','이번 선택을 돌아보고 다시 도전한다','챕터 시작 상태 복원 · 이번 보상과 성장 초기화')]};
 if(s.scene==='chapter-event'){const event=r.current?.event;
  if(chapter.id===2){const data=secondEvents[event];if(!data)throw Error('알 수 없는 사건');return {chapter:6,title:data.title,text:[...data.text,...(event==='isol-watch'&&s.relations.includes('isol-injured')?['이솔의 팔에는 다리에서 입은 상처가 남아 있었다. 그가 등불을 다른 손으로 옮겨 쥐었다.']:[])],choices:data.choices.map(c=>opt('event-'+c.id,c.title,'',(c.effects.hp<0&&s.hp<=-c.effects.hp)||(c.effects.energy<0&&s.energy<-c.effects.energy)))};}
  if(event==='caravan')return {chapter:5,title:'길가에 멈춰 선 행상',text:['바퀴가 부서진 수레 옆에서 행상이 짐을 붙들고 있었다. 손을 보태거나, 남은 물자를 나누거나, 길에 대해 물을 수 있다.','행상인이 당신을 돌아보았다.'],choices:[opt('event-lift','무거운 짐을 옮겨 주고 품삯을 받는다','체력 -2 · 엽전 +8 · 강화석 +1',s.hp<=2),opt('event-supply','남는 약초와 물을 나누어 받는다','약초 +1 · 숨 +2'),opt('event-observe','수레를 습격한 흔적을 살핀다','통찰 +1')]};
  if(event==='shrine')return {chapter:5,title:'바위에 남은 수련의 흔적',text:['오래된 호흡의 자국이 샘가 바위에 남아 있었다. 숨을 맞춰 볼 수도, 주변의 재료를 모을 수도 있다.'],choices:[opt('event-breathe','남은 숨을 써서 호흡의 흔적을 따라간다','숨 -2 · 제어 +1',s.energy<2),opt('event-salvage','위험한 바위틈에서 재료를 꺼낸다','체력 -2 · 강화석 +2 · 엽전 +4',s.hp<=2),opt('event-heal','샘물로 상처를 돌본다','체력 +4')]};
  return {chapter:5,title:'먼저 돌아온 정찰자의 경고',text:['부상당한 정찰자가 고갯길의 칼자국을 그려 보였다. 우두머리는 일정한 간격으로 강하게 내려찍고, 잠시 칼을 거둘 때는 반격을 노린다고 했다.'],choices:[opt('event-intel','우두머리의 강한 공격을 피할 요령을 듣는다','보스의 강한 공격 추가 위력 1 감소'),opt('event-training','정찰자의 발디딤을 따라 배운다','숙련 +1 · 실전 경험 +2'),opt('event-cache','정찰자가 남겨 둔 보급품을 받는다','약초 +1 · 청숨환 +1')]};
 }
 return null;
}
export function chapterChoose(s,id){const j=s.journey,r=j.route,chapter=campaignFor(s);
 if(id.startsWith('node-'))return enterOption(s,id);
 if(id==='retry-chapter')return resetChapter(s);
 if(id==='open-bag'){j.bagReturn='hub';s.scene='bag';return s;}if(id==='open-growth'){s.scene='growth';return s;}
 if(id==='read-letter'){s.scene='chapter-end';return s;}
 if(id==='challenge-boss'){if(r.used<r.total||r.ended||r.current)throw new Error('아직 마지막 전투가 아니다');r.current={kind:'boss',zone:chapter.boss,name:chapter.bossName,step:r.total+1};j.active=chapter.boss;j.runs++;s.scene='combat';s.last='마지막 보스전';return s;}
 if(s.scene==='chapter-event'){
  if(chapter.id===2){const c=secondEvents[r.current.event].choices.find(c=>'event-'+c.id===id),e=c.effects;for(const k of ['control','skill','insight'])s[k]+=e[k]||0;s.hp=Math.min(maxHp(s),s.hp+(e.hp||0));s.energy=Math.min(maxEnergy(s),s.energy+(e.energy||0));for(const k of ['gold','ore','herbs'])j[k]+=e[k]||0;if(e.tonic)j.inventory.tonic=(j.inventory.tonic||0)+e.tonic;if(e.xp)awardExperience(s,e.xp);if(e.intel&&!r.intel.includes(e.intel))r.intel.push(e.intel);if(e.relation&&!s.relations.includes(e.relation))s.relations.push(e.relation);s.last=c.result;finishVisit(s);return s;}
  if(id==='event-lift'){s.hp-=2;j.gold+=8;j.ore++;}if(id==='event-supply'){j.herbs++;s.energy=Math.min(maxEnergy(s),s.energy+2);}if(id==='event-observe')s.insight++;
  if(id==='event-breathe'){s.energy-=2;s.control++;}if(id==='event-salvage'){s.hp-=2;j.ore+=2;j.gold+=4;}if(id==='event-heal')s.hp=Math.min(maxHp(s),s.hp+4);
  if(id==='event-intel'&&!r.intel.includes('read-pattern'))r.intel.push('read-pattern');if(id==='event-training'){s.skill++;awardExperience(s,2);}if(id==='event-cache'){j.herbs++;j.inventory.breath=(j.inventory.breath||0)+1;}
  s.last={ 'event-lift':'짐을 옮기고 품삯을 받았다. · 체력 -2, 엽전 +8, 강화석 +1','event-supply':'남는 물자를 나누어 받았다. · 약초 +1, 숨 +2','event-observe':'습격의 흔적에서 새로운 움직임을 읽었다. · 통찰 +1','event-breathe':'수련의 흔적을 몸에 새겼다. · 숨 -2, 제어 +1','event-salvage':'바위틈에서 재료를 꺼냈다. · 체력 -2, 강화석 +2, 엽전 +4','event-heal':'샘물로 상처를 돌보았다. · 체력 +4','event-intel':'정찰자의 요령을 익혔다. · 보스 강타의 추가 위력 -1','event-training':'정찰자의 발디딤을 익혔다. · 숙련 +1, 경험 +2','event-cache':'정찰자가 남긴 보급품을 받았다. · 약초 +1, 청숨환 +1'}[id];finishVisit(s);return s;
 }
 throw new Error('알 수 없는 챕터 행동');
}
