import {items,itemFor,itemCount,slots,manuals,recipes,canUseItem,ensureWorkshop} from './workshop.mjs';
import {abilities,abilityCatalog,grantAbility,maxHp,maxEnergy} from './combat.mjs';
const opt=(id,title,hint='',disabled=false)=>({id,title,hint,disabled});
export function lessonsFor(s){const known=abilities(s).map(a=>a.id);return [...abilityCatalog(s).filter(a=>['weapon','element','counter'].includes(a.id)).map(a=>({...a,price:6,requirement:'기본 수련',stat:null,min:0})),...manuals].filter(a=>!known.includes(a.id));}
export function marketScene(s){const j=s.journey;if(!j)return null;
 if(s.scene==='shop')return {chapter:5,title:'길가의 작은 상점',text:['행상인은 펼쳐 놓은 물건마다 서로 다른 쓰임을 설명했다. 빠르게 움직일 것인가, 오래 버틸 것인가. 같은 무기도 준비에 따라 다르게 싸운다.','장비는 구입한 뒤 소지품에서 장착한다. 같은 부위에는 하나씩만 착용할 수 있다. 소모품은 여정이나 전투 준비 중 사용한다.'],choices:[...items.map(i=>opt('buy-item-'+i.id,i.name,`${i.description} · 엽전 ${i.price}`,j.gold<i.price||(i.type==='equipment'&&itemCount(j,i.id)>0))),opt('open-bag','소지품을 확인하고 장착한다'),opt('to-hub','방문을 마치고 다음 갈림길로 간다')]};
 if(s.scene==='bag')return {chapter:5,title:'지금 손에 쥔 것들',text:['구입한 장비를 부위별로 장착하고, 필요한 소모품을 사용하자. 도구와 방호구의 보강 효과는 별도로 유지된다.','도구유·방호 가루·속행향은 다음 전투 한 번에만 적용된다. 사용한 준비 효과는 전투를 시작할 때 소모된다.'],choices:[...items.filter(i=>itemCount(j,i.id)>0).map(i=>opt((i.type==='equipment'?'equip-item-':'use-item-')+i.id,i.name,i.type==='equipment'?`${slots[i.slot]} · ${i.description}`:`${i.description} · ${itemCount(j,i.id)}개`,i.type==='consumable'&&!canUseItem(s,i))),opt('bag-back',j.bagReturn==='combat'?'전투 준비로 돌아간다':j.bagReturn==='shop'?'방문 중인 상점으로 돌아간다':'여정으로 돌아간다')]};
 if(s.scene==='school')return {chapter:5,title:'다른 움직임을 배우는 자리',text:['여울원의 교관은 당신이 아직 배우지 않은 움직임을 짚어 주었다. 배운 기술은 무기와 길에 맞춰 사용할 수 있다.','먼저 기술을 익힌 뒤, 기술 조합실에서 두 가르침을 연결할 수 있다. 조합하더라도 원래 기술은 사라지지 않는다.'],choices:[...lessonsFor(s).map(a=>opt('learn-'+a.id,a.name,`${a.description} · ${a.requirement} · 엽전 ${a.price}`,j.learned.includes(a.id)||j.gold<a.price||(a.stat&&s[a.stat]<a.min))),opt('open-synthesis','배운 기술을 조합한다','재료 기술과 결과를 확인한 뒤 새로운 기술 습득'),opt('to-hub','방문을 마치고 다음 갈림길로 간다')]};
 if(s.scene==='synthesis'){const known=abilities(s).map(a=>a.id);return {chapter:5,title:'두 가르침 사이의 새 길',text:['무기의 궤적에 결을 싣고, 흘려낸 힘을 반격으로 잇는다. 새로운 기술은 이미 배운 것들 사이에서 시작된다.','재료 기술을 모두 알아야 조합할 수 있다. 엽전과 강화석만 소모하며, 결과 기술을 익힌 뒤 전투 준비에서 장착할 수 있다.'],choices:[...recipes.map(a=>opt('combine-'+a.id,`${s.element}결 · ${a.name}`,`${a.labels.join(' + ')} → ${a.description} · 엽전 ${a.gold}, 강화석 ${a.ore}`,j.learned.includes(a.id)||a.ingredients.some(id=>!known.includes(id))||j.gold<a.gold||j.ore<a.ore)),opt('open-school','다른 기술을 배우러 간다'),opt('to-hub','방문을 마치고 다음 갈림길로 간다')]};}
 return null;
}
export function marketChoose(s,id){const j=s.journey;ensureWorkshop(j);
 if(id==='to-hub'){s.scene='hub';j.active=null;return s;}
 if(id==='open-bag'){j.bagReturn='hub';s.scene='bag';return s;}
 if(id==='bag-back'){s.scene=['combat','shop','school','synthesis','forge','growth'].includes(j.bagReturn)?j.bagReturn:'hub';return s;}
 if(id==='open-school'){s.scene='school';return s;}
 if(id==='open-synthesis'){s.scene='synthesis';return s;}
 if(id.startsWith('buy-item-')){const item=itemFor(id.slice(9));j.gold-=item.price;if(item.id==='herb')j.herbs++;else j.inventory[item.id]=(j.inventory[item.id]||0)+1;s.last=item.name+'을 구입했다. · 엽전 -'+item.price;return s;}
 if(id.startsWith('equip-item-')){const item=itemFor(id.slice(11));if(j.equipped[item.slot]===item.id){delete j.equipped[item.slot];s.last=item.name+'을 해제했다.';}else{j.equipped[item.slot]=item.id;s.last=item.name+'을 장착했다. · '+item.description;}s.hp=Math.min(s.hp,maxHp(s));s.energy=Math.min(s.energy,maxEnergy(s));return s;}
 if(id.startsWith('use-item-')){const item=itemFor(id.slice(9));if(item.id==='herb')j.herbs--;else j.inventory[item.id]--;if(item.heal)s.hp=Math.min(maxHp(s),s.hp+item.heal);if(item.energy)s.energy=Math.min(maxEnergy(s),s.energy+item.energy);if(item.buff)j.prepBuffs[item.buff]=item.amount;s.last=item.name+' 사용 · '+item.description;return s;}
 if(id.startsWith('learn-')){const a=lessonsFor(s).find(a=>a.id===id.slice(6));j.gold-=a.price;if(['weapon','element','counter'].includes(a.id))grantAbility(s,a.id);else{j.learned.push(a.id);grantAbility(s,a.id);}s.last=a.name+' 습득'+(s.loadout.includes(a.id)?' · 자동 장착':' · 전투 준비에서 기술을 교체해 장착하세요');return s;}
 if(id.startsWith('combine-')){const a=recipes.find(a=>a.id===id.slice(8));j.gold-=a.gold;j.ore-=a.ore;j.learned.push(a.id);grantAbility(s,a.id);s.last=`새 기술 습득 · ${s.element}결 · ${a.name}. 재료 기술은 그대로 사용할 수 있다. ${s.loadout.includes(a.id)?'자동 장착.':'전투 준비에서 교체해 장착하세요.'}`;return s;}
 throw new Error('알 수 없는 공방 행동');
}
