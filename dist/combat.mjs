// Combat is deterministic and serializable so reloading cannot reroll a fight.
export const weaponProfiles={
 '맨손':{attack:1,speed:4,guard:1,range:0,basic:'장타',art:'연환장',description:'빠른 연타 · 두 번째 타격은 절반 위력'},
 '검':{attack:2,speed:3,guard:1,range:0,basic:'베기',art:'흘림검',description:'공격 뒤 다음 피해 1 감소'},
 '도':{attack:3,speed:1,guard:0,range:0,basic:'내려베기',art:'단절도',description:'높은 위력 · 적 방어 무시'},
 '창':{attack:2,speed:2,guard:1,range:1,basic:'찌르기',art:'관통창',description:'첫 접근 저지 · 다음 적 공격 약화'},
 '활':{attack:2,speed:4,guard:0,range:2,basic:'사격',art:'집중시',description:'먼 거리에서 선공 · 높은 명중률'},
 '지팡이':{attack:1,speed:2,guard:2,range:1,basic:'후려치기',art:'회류봉',description:'공격 뒤 보호막 2 획득'}
};
export const elementDescriptions={물:'유연한 흐름 · 기술 사용 시 보호막 1',불:'연소 · 다음 두 번의 적 행동마다 피해 1',흙:'단단한 결 · 기술 사용 시 보호막 2',바람:'흐름 가속 · 회피율 증가',나무:'회복하는 결 · 기술 사용 시 체력 1 회복',쇠:'벼린 결 · 기술이 적 방어를 관통',번개:'섬광 · 기술 추가 피해 1, 간헐적 경직'};
export const maxHp=s=>10+Math.max(0,(s.journey?.level||1)-1)*2;
export const maxEnergy=s=>6+Math.floor(Math.max(0,(s.journey?.level||1)-1)/2);
export function abilities(s){
 if(!s.path||!s.weapon)return [];
 const p=weaponProfiles[s.weapon],outer=s.path==='outer';
 const list=[{id:'weapon',name:outer?`${s.element}결 · ${p.art}`:p.art,cost:2,description:p.description,kind:'무기 기술'}];
 if(s.control>=2)list.push({id:'element',name:`${s.element}결 · ${outer?'숨의 파동':'결의 발경'}`,cost:2,description:elementDescriptions[s.element],kind:outer?'마법':'내공 기술'});
 if(s.insight>=2)list.push({id:'counter',name:'간파 반격',cost:1,description:'다음 공격 피해 감소 · 반격 태세',kind:'방어 기술'});
 const signature=s.flags.find(f=>/^art-(control|skill|insight)$/.test(f));
 if(signature)list.push({id:'signature',name:`${s.element}결 · ${{'art-control':'고른 숨','art-skill':'첫 궤적','art-insight':'읽는 흐름'}[signature]}`,cost:3,description:'서장에서 얻은 깨달음 · 강한 일격과 자신만의 운용',kind:'고유 기술'});
 return list.map(a=>({...a,rank:s.journey?.skillRanks[a.id]||0,name:a.name+((s.journey?.skillRanks[a.id]||0)>0?' +'+s.journey.skillRanks[a.id]:'')}));
}
export function combatStats(s){const p=weaponProfiles[s.weapon];return {attack:(s.path==='inner'?2+Math.floor(s.skill/2):1+Math.floor(s.control/2))+p.attack+(s.journey?.gear||0)+Math.floor((s.journey?.level||1)/2),defense:p.guard+Math.floor(s.control/3)+(s.journey?.armor||0),speed:p.speed+Math.floor(s.insight/2)+(s.element==='바람'?2:0),accuracy:Math.min(.97,.83+s.skill*.025+s.insight*.02),evasion:Math.min(.35,s.insight*.025+(s.element==='바람'?.12:0)),...{range:p.range}};}
function random(b){let x=b.seed;x^=x<<13;x^=x>>>17;x^=x<<5;b.seed=x>>>0;return b.seed/4294967296;}
function seedFor(s){let n=2166136261;for(const c of `${s.name}|${s.path}|${s.element}|${s.weapon}|${s.journal.length}`)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0||1;}
export function beginBattle(state,config={}){
 const s=structuredClone(state);const stats=combatStats(s);const ids=abilities(s).map(a=>a.id);
 s.loadout=(s.loadout?.filter(id=>ids.includes(id))??ids).slice(0,2);
 const enemy={name:'다리의 약탈자',hp:25,attack:3,defense:1,speed:3,weapon:'짧은 칼',heavyEvery:3,heavyBonus:2,...config.enemy};
 const first=stats.speed>=enemy.speed||s.flags.includes('advantage')?'player':'enemy';
 s.scene='battle';s.last='';s.battle={version:1,context:config.context||'prologue',zone:config.zone||null,seed:seedFor(s),round:1,actor:first,first,enemy:{...enemy,maxHp:enemy.hp,burn:0,stun:0,weaken:0},playerShield:0,counter:false,cooldowns:{},turn:0,outcome:null,log:[],start:{hp:s.hp,energy:s.energy},stats};
 log(s,'system',`${s.name} · ${s.weapon} / ${s.path==='inner'?'내공 운용':'외부 숨 인도'}. ${first==='player'?'당신이 먼저 움직인다.':'적이 먼저 거리를 좁힌다.'}`);
 return s;
}
function log(s,actor,text,extra={}){const b=s.battle;b.log.push({round:b.round,actor,text,hp:s.hp,energy:s.energy,enemyHp:b.enemy.hp,shield:b.playerShield,...extra});}
function finish(s){const b=s.battle;if(b.enemy.hp<=0){b.outcome='victory';if(!s.flags.includes('won'))s.flags.push('won');log(s,'system',`${b.enemy.name}을 물리쳤다. 승리.`);}else if(s.hp<=0){b.outcome='defeat';log(s,'system',b.context==='journey'?'더는 자세를 유지할 수 없다. 순찰대의 도움으로 전장에서 벗어났다.':'더는 자세를 유지할 수 없다. 이솔이 퇴로를 열었다.');}else if(b.round>24){b.outcome='retreat';log(s,'system','싸움이 길어졌다. 힘을 더 잃기 전에 안전한 곳으로 물러났다.');}}
function strike(s,power,{pierce=false,accuracy=0}={}){const b=s.battle,e=b.enemy;if(random(b)>Math.min(.99,b.stats.accuracy+accuracy))return {damage:0,miss:true};const critical=random(b)<.08+s.insight*.015;const damage=Math.max(1,Math.round(power+(critical?2:0))-(pierce?0:e.defense));e.hp=Math.max(0,e.hp-damage);return {damage,critical};}
function elementEffect(s){const b=s.battle,e=b.enemy;switch(s.element){case '물':b.playerShield++;return '물의 흐름이 보호막 1을 만든다.';case '불':e.burn=2;return '불씨가 남아 두 번의 행동 동안 연소한다.';case '흙':b.playerShield+=2;return '흙의 결이 보호막 2를 만든다.';case '바람':return '바람의 결로 몸놀림이 가벼워진다.';case '나무':{const gain=Math.min(1,maxHp(s)-s.hp);s.hp+=gain;return `나무의 결로 체력 ${gain} 회복.`;}case '쇠':return '쇠의 결이 방어를 꿰뚫는다.';case '번개':if(random(b)<.35){e.stun=1;return '번개가 적을 경직시켰다.';}return '번개가 타격에 추가 피해를 싣는다.';}}
function playerTurn(s){
 const b=s.battle,e=b.enemy,p=weaponProfiles[s.weapon];for(const id of Object.keys(b.cooldowns))b.cooldowns[id]=Math.max(0,b.cooldowns[id]-1);
 const known=abilities(s).filter(a=>s.loadout.includes(a.id));
 let chosen;
 if(s.hp<=maxHp(s)*.4&&!b.counter&&b.playerShield<2)chosen=known.find(a=>a.id==='counter'&&!b.cooldowns[a.id]&&s.energy>=a.cost);
 chosen??=known.find(a=>!b.cooldowns[a.id]&&s.energy>=a.cost&&a.id!=='counter');
 if(!chosen&&s.energy<Math.max(2,...known.map(a=>a.cost))&&known.some(a=>a.id!=='counter')&&b.turn%3===0){const amount=Math.min(maxEnergy(s)-s.energy,s.path==='outer'?3:2);s.energy+=amount;b.playerShield++;log(s,'player',`${s.path==='outer'?'외부의 숨을 다시 끌어온다':'호흡을 가다듬어 숨을 모은다'}. 숨 +${amount}, 보호막 +1.`,{skill:'회복 호흡'});return;}
 if(chosen){s.energy-=chosen.cost;b.cooldowns[chosen.id]=['counter','signature'].includes(chosen.id)?3:2;
  if(chosen.id==='counter'){b.counter=true;b.playerShield+=2+chosen.rank;log(s,'player',`간파 반격. 공격의 방향을 읽고 반격을 준비한다. 보호막 +${2+chosen.rank}.`,{skill:chosen.name});return;}
  const elemental=chosen.id==='element',signature=chosen.id==='signature';const boost=(signature?4+Math.max(s.control,s.skill):elemental?2+s.control+s.insight*.5:2+s.skill*.5)+chosen.rank*1.5;
  const hit=strike(s,b.stats.attack+boost+(s.element==='번개'?1:0),{pierce:s.element==='쇠'||(!elemental&&s.weapon==='도'),accuracy:signature&&s.flags.includes('art-insight')?.15:!elemental&&s.weapon==='활'?.12:0});
  let text=hit.miss?`${chosen.name} — 적이 궤적을 벗어났다.`:`${chosen.name} — ${hit.damage} 피해${hit.critical?' · 치명타':''}.`;
  if(!hit.miss){text+=' '+elementEffect(s);if(signature&&s.flags.includes('art-control'))b.playerShield+=2+chosen.rank;if(!elemental){if(s.weapon==='맨손'&&e.hp>0){const second=Math.max(1,Math.floor(hit.damage/2));e.hp=Math.max(0,e.hp-second);text+=` 연타 ${second} 피해.`;}if(s.weapon==='검')b.playerShield++;if(s.weapon==='창')e.weaken=2;if(s.weapon==='지팡이')b.playerShield+=2;}}
  log(s,'player',text,{skill:chosen.name});
 }else{const hit=strike(s,b.stats.attack,{accuracy:s.weapon==='활'?.07:0});log(s,'player',hit.miss?`${p.basic} — 빗나갔다.`:`${p.basic} — ${hit.damage} 피해${hit.critical?' · 치명타':''}.`,{skill:p.basic});}
}
function enemyTurn(s){const b=s.battle,e=b.enemy;if(e.burn>0){e.burn--;e.hp=Math.max(0,e.hp-1);log(s,'effect','남은 불씨가 적에게 연소 피해 1을 준다.');if(e.hp<=0)return;}if(e.stun>0){e.stun--;log(s,'enemy','적이 번개의 경직으로 움직이지 못했다.');return;}
 if(b.round===1&&b.stats.range>0){log(s,'enemy',`${s.weapon}의 사거리 때문에 적이 접근에 한 차례를 썼다.`);return;}
 if(random(b)<b.stats.evasion){log(s,'enemy',`${e.weapon||'짧은 칼'}이 허공을 가른다. 공격을 피했다.`);return;}
 const heavy=b.round%(e.heavyEvery||3)===0;let power=e.attack+(heavy?(e.heavyBonus??2):0);if(e.weaken>0){e.weaken--;power=Math.max(1,power-2);}power=Math.max(1,power-b.stats.defense);
 const block=Math.min(b.playerShield,power);b.playerShield-=block;const damage=power-block;s.hp=Math.max(0,s.hp-damage);
 let text=`${heavy?'적의 강한 공격':e.weapon||'적의 짧은 칼'} — ${damage} 피해${block?`, 보호막이 ${block} 흡수`:''}.`;
 if(b.counter&&s.hp>0){b.counter=false;const hit=strike(s,b.stats.attack+1,{accuracy:.12});text+=hit.miss?' 반격은 빗나갔다.':` 반격으로 ${hit.damage} 피해.`;}log(s,'enemy',text);}
export function tickBattle(state){
 const s=structuredClone(state);const b=s.battle;if(s.scene!=='battle'||!b||b.outcome)return s;
 b.turn++;if(b.actor==='player')playerTurn(s);else enemyTurn(s);finish(s);
 if(!b.outcome){if(b.actor!==b.first)b.round++;b.actor=b.actor==='player'?'enemy':'player';finish(s);}
 return s;
}
export function fastForward(state){let s=structuredClone(state);for(let n=0;n<110&&!s.battle.outcome;n++)s=tickBattle(s);return s;}
