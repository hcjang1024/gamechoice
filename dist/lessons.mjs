import {abilities,abilityCatalog} from './combat.mjs';
import {manualsFor} from './workshop.mjs';
import {passiveCatalog,learnedPassives} from './passives.mjs';
import {seeded,sample,hashSeed} from './random.mjs';
export const lessonLevels={weapon:1,element:1,counter:1,guard:1,focus:1,chain:2,mend:2,'passive-vitality':1,'passive-breath':1,'passive-precision':1,'passive-agility':2,'passive-force':2,'passive-resolve':3};
export function lessonPool(s){
 const j=s.journey;if(!j)return [];
 const known=[...abilities(s),...learnedPassives(s)],catalog=[...abilityCatalog(s).filter(a=>['weapon','element','counter'].includes(a.id)).map(a=>({...a,price:6})),...manualsFor(s),...passiveCatalog(s)];
 return catalog.filter(a=>lessonLevels[a.id]<=(j.level||1)&&(!a.stat||s[a.stat]>=a.min)).flatMap(a=>{
  const learned=known.find(k=>k.id===a.id),rank=learned?.rank||0;if(learned&&rank>=3)return [];
  return [{...(learned||a),price:(a.price||6)+(learned?rank*3:0),upgrade:!!learned,minLevel:lessonLevels[a.id],requirement:'등급 '+lessonLevels[a.id]+(a.stat?' · '+{control:'제어',skill:'숙련',insight:'통찰'}[a.stat]+' '+a.min:'')}];
 });
}
export function lessonsFor(s){
 const j=s.journey;if(!j)return [];
 const r=j.route,visit=[j.chapter||1,r?.current?.step??r?.used??0,r?.current?.id||'legacy'].join(':');
 if(j.lessonOffer?.visit!==visit){
  const random=seeded(j.lessonSeed??hashSeed([s.name,s.path,j.level,visit,'lessons-v1'].join('|')));
  j.lessonOffer={visit,offers:sample(lessonPool(s),3+Math.floor(random()*3),random),bought:[]};
 }
 return j.lessonOffer.offers.map(a=>({...a,bought:j.lessonOffer.bought.includes(a.id)}));
}

