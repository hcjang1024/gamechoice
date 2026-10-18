// Require allocation at scene boundaries, including when resuming an older save.
export function enforceGrowth(s){
 const j=s.journey;if(!j)return s;
 if(j.points>0&&s.scene==='growth')j.growthReturn??='hub';
 if(j.points>0&&s.scene!=='growth'){
  j.growthReturn=s.scene;s.scene='growth';
 }else if(j.points===0&&s.scene==='growth'&&j.growthReturn){s.scene=j.growthReturn;delete j.growthReturn;}
 return s;
}
