// Existing combat/economy tests specify a build. Control the draft seed in those
// fixtures so that their requested legal reward is actually offered. Randomness,
// persistence and rejecting rewards that were not offered are tested separately
// in growth-draft.test.mjs using the unmodified engine choose().
import {choose} from './dist/engine.mjs';
import {enforceGrowth} from './dist/progression.mjs';
import {ensureGrowthDraft,growthChoices,growthPool} from './dist/growth.mjs';
export function withGrowthChoice(state,id){
 const s=enforceGrowth(structuredClone(state));
 if(s.scene!=='growth'||s.journey.points<1||!['grow-','study-','hone-','claim-item-'].some(p=>id.startsWith(p)))return s;
 if(growthChoices(s).some(c=>c.id===id))return s;
 const pool=growthPool(s);if(![...pool.skills,...pool.stats,...pool.items].some(c=>c.id===id))return s;
 const seed=s.journey.growthSeed;
 for(let i=1;i<=2000;i++){delete s.journey.growthDraft;s.journey.growthSeed=(Math.imul(i,2654435761)^seed)>>>0||1;ensureGrowthDraft(s);if(growthChoices(s).some(c=>c.id===id))return s;}
 throw Error('No fixture seed offers '+id);
}
export const chooseFixture=(s,id)=>choose(withGrowthChoice(s,id),id);

