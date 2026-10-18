import {growthChoices,applyGrowth} from './growth.mjs';
import {campaignFor,secondZones} from './campaign.mjs';
import {enforceGrowth} from './progression.mjs';
import {beginBattle,abilities,abilityCatalog,grantAbility,combatStats,maxHp,maxEnergy} from './combat.mjs';
import {ensureWorkshop} from './workshop.mjs';
import {marketScene,marketChoose} from './market.mjs';
import {ensureRoute,chapterScene,chapterChoose,finishVisit,awardExperience} from './chapter.mjs';
export const zones=[
 {id:'trail',name:'솔바람 산길',subtitle:'흩어진 발자국',image:'courtyard',danger:'초급',description:'여울원 아래 산길. 전령이 떨어뜨린 짐이 발견됐다. 길목을 노리는 매복꾼을 넘어 흔적을 찾는다.',enemy:{element:'쇠',name:'산길의 매복꾼',hp:20,attack:2,defense:0,speed:4,weapon:'단검',heavyEvery:3,heavyBonus:2},reward:{xp:4,gold:5,ore:1},clue:'찢어진 전령의 소매에서 옛 수로의 진흙이 묻어 나왔다.'},
 {id:'waterway',name:'옛 취수로',subtitle:'가로막힌 흐름',image:'spring',danger:'중급',description:'오래된 취수로를 장악한 방패병. 단단한 방어를 뚫거나 결의 효과를 활용할 준비가 필요하다.',enemy:{element:'흙',name:'수로의 방패병',hp:32,attack:3,defense:2,speed:2,weapon:'방패 밀치기',heavyEvery:3,heavyBonus:2},reward:{xp:6,gold:8,ore:2},clue:'전령의 인장이 발견됐다. 그를 데려간 자들은 고갯길에서 봉쇄대를 기다린다.'},
 {id:'pass',name:'안개 고갯길',subtitle:'전령이 사라진 자리',image:'bridge',danger:'우두머리',description:'봉쇄대의 우두머리가 포로를 지킨다. 두 공방마다 몰아치는 강한 공격과 반격 태세에 대비해야 한다.',enemy:{element:'번개',name:'봉쇄대의 우두머리',hp:44,attack:4,defense:2,speed:4,weapon:'넓은 칼',heavyEvery:2,heavyBonus:3,counterEvery:3},reward:{xp:10,gold:14,ore:3},clue:'묶여 있던 전령을 구했다. 밀서에는 “승천지를 묻는 자들을 경계하라”는 경고가 남아 있었다.'}
];
const opt=(id,title,hint='',disabled=false)=>({id,title,hint,disabled});
export const xpNeeded=j=>6+(j.level-1)*3;
export const zoneFor=id=>[...zones,...secondZones].find(z=>z.id===id);
export function startJourney(state){
 const s=structuredClone(state);s.version=6;s.journey={chapter:1,completedChapters:[],level:1,xp:0,points:1,gold:8,ore:2,herbs:2,gear:0,armor:0,skillRanks:{},cleared:[],runs:0,active:null,reward:null,history:[],complete:false};
 ensureWorkshop(s.journey);s.scene='hub';s.battle=null;s.flags=s.flags.filter(x=>!['advantage','guarded'].includes(x));s.hp=maxHp(s);s.energy=maxEnergy(s);ensureRoute(s);
 s.last='첫 의뢰 · 사라진 전령';return enforceGrowth(s);
}
export function advanceChapter(state){const s=structuredClone(state),j=s.journey;if(!j||campaignFor(s).id!==1||s.scene!=='chapter-end'||!j.complete||j.route.ended!=='victory')throw Error('다음 챕터로 이동할 수 없습니다.');j.completedChapters??=[];j.completedChapters.push({chapter:1,title:'사라진 전령',level:j.level,choices:j.route.history.map(h=>({step:h.step,kind:h.kind,outcome:h.outcome}))});delete j.route;Object.assign(j,{chapter:2,active:null,reward:null,history:[],cleared:[],runs:0,complete:false});delete j.growthReturn;j.gold+=8;j.herbs++;s.battle=null;s.scene='hub';s.hp=maxHp(s);s.energy=maxEnergy(s);s.flags=s.flags.filter(f=>!['advantage','guarded'].includes(f));ensureRoute(s);s.last='두 번째 챕터가 시작됐다. 성장과 장비를 이어받았다. · 여비 엽전 +8, 약초 +1';return enforceGrowth(s);}
export function journeyScene(s){
 const j=s.journey;if(!j)return null;const campaign=campaignFor(s);
 const chapter=chapterScene(s);if(chapter)return chapter;
 const market=marketScene(s);if(market)return market;
 const z=zoneFor(j.active),boss=j.route.current?.kind==='boss';
 switch(s.scene){
 case 'combat':return {chapter:5,title:z.name+' · '+(boss?'마지막 보스':z.subtitle),text:[z.description,`${z.enemy.name}이 길을 막았다. ${z.enemy.weapon}의 움직임을 살피고, 가져온 기술을 점검하자.`],choices:[opt('start-battle',boss?'마지막 보스전을 시작한다':'이 구성으로 전투를 시작한다','자동 전투 · 전투 종료 시 숨 회복'),opt('use-herb','약초로 상처를 돌본다',`체력 6 회복 · 남은 약초 ${j.herbs}`,j.herbs<1||s.hp>=maxHp(s)),opt('open-bag','장비와 소모품을 점검한다','현재 소지품만 사용 · 추가 여정 소모 없음'),opt('to-hub',boss?'마지막 준비 화면으로 돌아간다':'전투를 포기하고 다음 갈림길로 간다',boss?'휴식·상점 방문 불가 · 장착과 성장점만 정비':'')]};
 case 'battle':return {chapter:5,title:s.battle.outcome?`${z.name} · ${{victory:'승리',defeat:'전투 불능',retreat:'후퇴'}[s.battle.outcome]}`:z.name+'의 전투',text:[],choices:s.battle.outcome?[opt('continue','전투 결과와 보상을 확인한다',s.battle.outcome==='victory'?'승리 보상을 정산하고 여정을 이어간다':boss?'보스를 넘지 못했다. 이번 챕터 도전 종료':'이 전투의 보상 없이 남은 여정을 이어간다')]:[]};
 case 'reward':return {chapter:5,title:j.reward.outcome==='victory'?'싸움이 남긴 것':'잃은 기회와 남은 길',text:j.reward.outcome==='victory'?[j.reward.first?zoneFor(j.reward.zone).clue:'익숙한 적을 넘었지만, 여정의 한 칸은 돌아오지 않는다. 얻은 보상으로 다음 선택을 준비해야 한다.',j.reward.levels?`실전 등급이 ${j.level}이 되었다. 최대 체력이 늘었고 성장점을 얻었다.`:'체력과 숨을 확인하고 다음 길을 고르자.']:['전투의 보상은 얻지 못했고, 한 번의 선택은 이미 지나갔다. 순찰대가 퇴로를 열어 주었지만 새 힘을 보태 주지는 못했다.','남은 소모품을 쓰거나, 뒤에 나타나는 휴식 기회를 골라 여정을 이어갈 수 있다.'],choices:[...(j.complete?[opt('read-letter',campaign.id===1?'구해 낸 전령에게 밀서를 받는다':'청운문에 경고를 전한다','마지막 보스 격파 · 챕터 완료')]:[]),opt('to-hub',j.complete?'챕터 결과를 확인한다':'다음 갈림길로 나아간다',j.complete?'추가 전투·상점·휴식 없음':'남은 선택을 확인하고 한 곳을 고른다')]};
 case 'forge':return {chapter:5,title:'한 번뿐인 화덕 앞에서',text:['장인은 들고 온 도구와 방호구를 살폈다.','화덕의 불길이 타오른다.'],choices:[opt('upgrade-gear',`${s.weapon==='맨손'?'권갑':s.weapon} 보강 +${j.gear} → +${j.gear+1}`,j.gear>=3?'최대 보강 완료':`위력 +1 · 엽전 ${6*(j.gear+1)}, 강화석 1`,j.gear>=3||j.gold<6*(j.gear+1)||j.ore<1),opt('upgrade-armor',`방호구 보강 +${j.armor} → +${j.armor+1}`,j.armor>=2?'최대 보강 완료':`방어 +1 · 엽전 ${8*(j.armor+1)}, 강화석 2`,j.armor>=2||j.gold<8*(j.armor+1)||j.ore<2),opt('open-school','가르침을 살핀다','등급에 맞는 무작위 가르침'),opt('open-synthesis','기술을 합성한다',''),opt('buy-herb','장인이 남겨 둔 약초를 산다','엽전 3 · 체력 6 회복용',j.gold<3),opt('to-hub','정비를 마치고 다음 갈림길로 간다','')]};
 case 'growth':return {chapter:5,title:j.points>0?'세 가능성 중 하나를 고르세요':'성장의 기록',text:[`실전 등급 ${j.level}. 남은 성장점 ${j.points}점. 제시된 기술·능력치·아이템 중 하나를 고르면 성장점 1을 사용한다.`,'배운 기술이 다시 나타나면 강화한다. 선택하지 않은 두 보상은 사라지고, 점수가 남으면 새로운 세 보상을 제시한다.'],choices:growthChoices(s)};
 case 'chapter-end':if(campaign.id===2)return {chapter:6,title:'산문 안으로 전해진 경고',text:['도시의 지붕 너머로 산문의 종이 울렸다. 청운문의 접객 제자는 밀서의 인장을 확인하고 당신과 이솔을 문밖의 작은 뜰로 안내했다.','“여울원에서 왔군요. 우리가 쓰는 표식을 흉내 낸 자들이 있었다니…… 전해 주신 경고는 위로 올리겠습니다.” 승천지의 검과 샘은 아직 그 자리에 있었다.','당신은 청운문의 제자가 된 것이 아니라, 먼 길을 건너 경고를 전한 사람이었다. 다음 소식을 기다리는 동안 이번 여정을 돌아볼 수 있다.'],quote:'“길을 열어 준 이름을 기억하겠습니다.”',choices:[opt('to-hub','두 번째 챕터의 결과로 돌아간다','')]};return {chapter:5,title:'경고는 이제 당신의 손에',text:['전령은 밀서를 건네고는 한동안 숨을 골랐다. “청운문의 승천지를 찾는 자들이 있었어. 내가 본 것을 전하려다가 붙잡혔지.”','아홉 단계의 여정과 마지막 싸움을 거쳐, 경고는 마침내 길을 얻었다.',`빈 명부에 이름을 적던 제자 ${s.name}. 이제 당신은 다음 소식을 직접 가져갈 사람이다.`],quote:'“다음 길은 청운문으로 이어진다.”',choices:[opt('next-journey','청운문으로 향한다','두 번째 챕터 시작'),opt('to-hub','첫 챕터의 결과로 돌아간다','이 챕터의 추가 성장과 반복 전투는 종료')]};
 default:return null;
 }
}
export function journeyChoose(s,id){
 const j=s.journey,r=j.route;
 if(id==='next-journey')return advanceChapter(s);
 if(chapterScene(s))return chapterChoose(s,id);
 if(id==='read-letter'&&j.complete){s.scene='chapter-end';return s;}
 if(id==='to-hub'){
  if(r.current?.kind==='boss'){r.current=null;j.active=null;s.scene='hub';}else finishVisit(s,s.scene==='combat'?'전투 포기':'완료');
  s.last='';return s;
 }
 if(id==='open-bag'){j.bagReturn=s.scene==='combat'?'combat':s.scene;s.scene='bag';return s;}
 if(marketScene(s))return marketChoose(s,id);
 if(s.scene==='combat'){
  if(id==='start-battle'){const z=zoneFor(j.active),enemy={...z.enemy};if(r.current.elite){enemy.hp+=6;enemy.attack++;}if(r.current.kind==='boss'&&r.intel.includes('read-pattern'))enemy.heavyBonus=Math.max(0,enemy.heavyBonus-1);if(r.current.kind==='boss'&&r.intel.includes('cut-seal')){enemy.shield=Math.max(0,(enemy.shield||0)-3);enemy.wardAmount=Math.max(1,(enemy.wardAmount||0)-2);}if(r.current.kind==='boss'&&r.intel.includes('shared-watch'))enemy.castPower=Math.max(0,(enemy.castPower||0)-1);return beginBattle(s,{enemy,context:'journey',zone:z.id});}
  if(id==='use-herb'){j.herbs--;s.hp=Math.min(maxHp(s),s.hp+6);s.last='약초를 썼다. · 체력 6 회복';return s;}
 }
 if(s.scene==='forge'){
  if(id==='open-school'){s.scene='school';return s;}if(id==='open-synthesis'){s.scene='synthesis';return s;}
  if(id==='upgrade-gear'){j.gold-=6*(j.gear+1);j.ore--;j.gear++;s.last=`도구 보강 +${j.gear} · 위력 +1`;}
  if(id==='upgrade-armor'){j.gold-=8*(j.armor+1);j.ore-=2;j.armor++;s.last=`방호구 보강 +${j.armor} · 방어 +1`;}
  if(id==='buy-herb'){j.gold-=3;j.herbs++;s.last='약초 꾸러미 하나를 챙겼다.';}return s;
 }
 if(s.scene==='growth')return applyGrowth(s,id);
 if(s.scene==='battle'){
  if(s.battle.rewarded)throw new Error('이미 정산한 전투');
  const z=zoneFor(s.battle.zone),won=s.battle.outcome==='victory',first=won&&!j.cleared.includes(z.id),boss=r.current?.kind==='boss',elite=r.current?.elite;
  const reward={zone:z.id,outcome:s.battle.outcome,first,xp:won?z.reward.xp+(elite?2:0):0,gold:won?z.reward.gold+(elite?3:0):0,ore:won?z.reward.ore+(elite?1:0):0,levels:0};
  if(won){j.gold+=reward.gold;j.ore+=reward.ore;reward.levels=awardExperience(s,reward.xp);if(first)j.cleared.push(z.id);if(first)j.herbs++;}
  else s.hp=Math.max(1,s.hp);
  s.battle.rewarded=true;j.reward=reward;j.history.push({zone:z.id,outcome:s.battle.outcome,turns:s.battle.turn,level:j.level});j.history=j.history.slice(-30);
  if(boss){r.ended=won?'victory':'defeat';r.bossOutcome=s.battle.outcome;j.complete=won;s.scene=won?'reward':'chapter-failed';}
  else{s.scene='reward';const entry=r.history.find(e=>e.step===r.current?.step);if(entry)entry.outcome=won?'승리':'패배';}
  s.last=won?'승리 보상을 정산했다.':boss?'마지막 보스를 넘지 못해 이번 도전이 끝났다.':'전투의 보상을 얻지 못했고, 사용한 선택은 복구되지 않는다.';return s;
 }
 throw new Error('알 수 없는 여정 행동');
}
