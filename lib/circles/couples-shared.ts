import { capacityCategory, capacityMinutes, formatCapacityMinutes } from "@/lib/journey/applied-capacity";
export const coupleReflections = [
 {key:"architect",name:"Architect",color:"#D4A451",activities:"Completed tasks, submissions, presentations, sign-off"},
 {key:"artisan",name:"Artisan",color:"#647C9B",activities:"Strategy, design, improvement, assessment"},
 {key:"shepherd",name:"Shepherd",color:"#739D5E",activities:"Social activities, meetings, debate, mission"},
 {key:"steward",name:"Steward",color:"#5A496B",activities:"Details, research, proof, organizing"},
] as const;
export type CoupleSharedMember={id:string;name:string;designId:Record<typeof coupleReflections[number]["key"],number>|null;gifts:string[]};
/** Presentation only: preserve saved raw points, canonical capacity bands and 16-hour allocation. */
export function coupleCapacityDetail(member:CoupleSharedMember){return coupleReflections.map(row=>{const score=member.designId?.[row.key]??null;return {...row,score,band:capacityCategory(score),time:score===null?null:formatCapacityMinutes(capacityMinutes(score))};});}

/** Capacity visuals use the current 100-point/max60 allocation contract only.
 * Imported incompatible raw scores stay saved privately, never silently rescaled. */
export function eligibleCoupleCapacity(points:CoupleSharedMember["designId"]){
 if(!points)return null;
 const values=Object.values(points);
 return values.length===4&&values.every(value=>Number.isInteger(value)&&value>=0&&value<=60)&&values.reduce((sum,value)=>sum+value,0)===100?points:null;
}
