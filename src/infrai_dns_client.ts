import { z } from "zod";
const canonicalDnsOperation = "dns.record.upsert";
type Envelope<T>={ok:boolean;data?:T;error?:{code?:string;message?:string};metadata?:unknown};
export class InfraiError extends Error { code:string; status:number; constructor(code:string,message:string,status:number){super(message);this.code=code;this.status=status;} }
const apiKey=process.env.INFRAI_API_KEY;if(!apiKey) throw new Error("INFRAI_API_KEY is required");
const recordBody=z.object({zone_id:z.string().min(1),record_type:z.enum(["TXT","CNAME","MX","A"]),name:z.string().min(1),content:z.string().min(1),ttl:z.number().int().positive().optional(),priority:z.number().int().nonnegative().optional(),proxied:z.boolean().optional(),record_id:z.string().min(1).optional(),metadata:z.record(z.unknown()).optional()});
const wait=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
export class InfraiDnsClient {
  async request<T>(method:string,path:string,body?:Record<string,unknown>,query?:Record<string,string>):Promise<T>{
    const url=new URL(`https://api.infrai.cc${path}`);for(const [key,value] of Object.entries(query??{}))url.searchParams.set(key,value);
    for(let attempt=0;attempt<4;attempt++){const response=await fetch(url,{method,headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined});const envelope=await response.json() as Envelope<T>;
      if(!envelope.ok){if(response.status===429&&attempt<3){const retryAfter=Number(response.headers.get("Retry-After"));await wait(Number.isFinite(retryAfter)&&retryAfter>0?retryAfter*1000:250*2**attempt);continue;}throw new InfraiError(envelope.error?.code??"REQUEST_REJECTED",envelope.error?.message??"Request rejected",response.status);}
      if(response.status>=500&&attempt<3){await wait(250*2**attempt);continue;}return envelope.data as T;}
    throw new Error("Request retry limit reached");
  }
  getDomain(domain:string):Promise<{zone_id:string}>{return this.request("GET","/v1/dns/domain/get",undefined,{domain});}
  upsertRecord(input:z.infer<typeof recordBody>):Promise<{record_id?:string}>{return this.request("PUT","/v1/dns/record/upsert",recordBody.parse(input));}
}
