import { z } from "zod";
import { InfraiDnsClient } from "./infrai_dns_client.ts";
export const dispatchRequest=z.object({domain:z.string().min(1),technician:z.string().min(1),status:z.enum(["assigned","en_route","complete"]),photoCount:z.number().int().nonnegative(),followUp:z.boolean()});
export type DispatchRequest=z.infer<typeof dispatchRequest>;
export function followUpDecision(input:DispatchRequest):"follow-up"|"close"{return input.status==="complete"&&input.photoCount>0&&input.followUp?"follow-up":"close";}
export async function publishDispatchDns(input:DispatchRequest):Promise<{zoneId:string;decision:string}>{const request=dispatchRequest.parse(input);const client=new InfraiDnsClient();const {zone_id:zoneId}=await client.getDomain(request.domain);await client.upsertRecord({zone_id:zoneId,record_type:"TXT",name:`_dispatch.${request.domain}`,content:JSON.stringify({technician:request.technician,status:request.status,photoCount:request.photoCount,followUp:request.followUp}),ttl:300,record_id:`dispatch-${request.technician}`});return {zoneId,decision:followUpDecision(request)};}
if(process.argv[1]?.endsWith("dispatch_dns_example.ts")){const result=await publishDispatchDns({domain:"example.com",technician:"tech-17",status:"complete",photoCount:2,followUp:true});console.log(JSON.stringify(result));}
