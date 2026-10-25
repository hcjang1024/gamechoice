// Existing combat/economy tests specify a build. Control the draft seed in those
// fixtures so that their requested legal reward is actually offered. Randomness,
// persistence and rejecting rewards that were not offered are tested separately
// in growth-draft.test.mjs using the unmodified engine choose().
import {optionPoolFor} from './dist/chapter.mjs';
import {lessonPool,lessonsFor} from './dist/lessons.mjs';
import {choose} from './dist/engine.mjs';
import {enforceGrowth} from './dist/progression.mjs';
import {ensureGrowthDraft,growthChoices,growthPool} from './dist/growth.mjs';
export function withGrowthChoice(state,id){
 const s=enforceGrowth(structuredClone(state));
 if(s.scene!=='growth'||s.journey.points<1||!['grow-','study-','hone-','claim-item-'].some(p=>id.startsWith(p)))return s;
 if(growthChoices(s).some(c=>c.id===id))return s;
 const pool=growthPool(s);if(![...pool.skills,...pool.abilities,...pool.stats,...pool.items].some(c=>c.id===id))return s;
 const seed=s.journey.growthSeed;
 for(let i=1;i<=2000;i++){delete s.journey.growthDraft;s.journey.growthSeed=(Math.imul(i,2654435761)^seed)>>>0||1;ensureGrowthDraft(s);if(growthChoices(s).some(c=>c.id===id))return s;}
 throw Error('No fixture seed offers '+id);
}
// Fixed-build tests control route and lesson randomness; the expedition tests
// use raw engine choices to check visibility, quotas and anti-reroll behavior.
export function withRouteChoice(state,id){
 const s=structuredClone(state),r=s.journey?.route;if(!r||!['hub','map'].includes(s.scene)||r.current||r.ended||!id.startsWith('node-'))return s;
 const pool=optionPoolFor(s),wanted=pool.find(o=>'node-'+o.id===id);if(!wanted)return s;
 if(!r.plan[r.used].options.some(o=>o.id===wanted.id))r.plan[r.used].options=[wanted,...pool.filter(o=>o.kind!==wanted.kind).slice(0,1)];
 return s;
}
export function withLessonChoice(state,id){
 const s=structuredClone(state);if(s.scene!=='school'||!id.startsWith('learn-'))return s;
 const wanted=id.slice(6),pool=lessonPool(s);if(!pool.some(a=>a.id===wanted))return s;
 if(lessonsFor(s).some(a=>a.id===wanted)||s.journey.lessonOffer.bought.length)return s;
 const preferred=[...new Set([wanted,...['guard','element','chain','passive-vitality'].filter(id=>pool.some(a=>a.id===id))])];
 const selected=preferred.map(id=>pool.find(a=>a.id===id));for(const a of pool)if(selected.length<3&&!selected.some(k=>k.id===a.id))selected.push(a);s.journey.lessonOffer.offers=selected.slice(0,5);return s;
}
export const chooseFixture=(s,id)=>choose(withLessonChoice(withRouteChoice(withGrowthChoice(s,id),id),id),id);

