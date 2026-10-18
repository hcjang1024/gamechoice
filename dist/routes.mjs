import {seeded,sample} from './random.mjs';
const place=(id,kind,name,extra={})=>({id,kind,name,...extra});
export const PRE_BOSS_STEPS=8;
export const CHAPTER_STEPS=9;
export function routeTemplate(chapter=1){
 const second=chapter===2,image=second?'cheongun':'courtyard';
 return Array.from({length:8},(_,i)=>{
  const stage=i+1;
  if(stage===4||stage===8)return {name:stage===4?'길 위의 쉼터':'보스 앞 쉼터',options:[place('rest','rest','숨을 고르는 자리',{image:second?'cheongun':'spring'})]};
  const late=stage===2||stage>=5,zone=second?(late?'canal-sentry':'alley'):(late?'waterway':'trail');
  const fight=place('fight-'+(zone==='canal-sentry'?'sentry':zone),'fight',second?(late?'수로의 추적자':'골목의 독침꾼'):(late?'취수로의 방패병':'산길의 매복꾼'),{zone,image});
  const events=second?[['story-ledger','city-ledger','분실된 운송 장부'],['story-watermarks','watermarks','수문의 인장'],['story-watch','isol-watch','이솔과의 밤 경계']]:[['story-caravan','caravan','멈춰 선 행상'],['story-shrine','shrine','수련의 흔적'],['story-scout','scout','정찰자의 경고']];
  const event=events[stage===1?0:stage===3?1:stage>=5?2:1];
  return {name:(second?'청운문 아래':'전령의 흔적')+' · '+stage+'단계',options:[fight,place(event[0],'story',event[2],{event:event[1],image}),place('forge','forge','길 위의 공방',{image}),place('shop','shop','작은 장터',{image})]};
 });
}
export function routePlan(s){
 const random=seeded([s.name,s.path,s.weapon,s.element,s.journey?.chapter||1,'route-v2'].join('|'));
 return routeTemplate(s.journey?.chapter||1).map(stop=>({...stop,options:stop.options.length===1?stop.options:sample(stop.options,2,random)}));
}

