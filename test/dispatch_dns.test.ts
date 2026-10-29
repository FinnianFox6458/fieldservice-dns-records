import test from "node:test";
import assert from "node:assert/strict";
import { dispatchRequest, followUpDecision } from "../src/dispatch_dns_example.ts";
test("completed work with photos and a requested follow-up stays open",()=>{const input=dispatchRequest.parse({domain:"example.com",technician:"tech-17",status:"complete",photoCount:2,followUp:true});assert.equal(followUpDecision(input),"follow-up");});
test("a completed work order without photos closes",()=>{const input=dispatchRequest.parse({domain:"example.com",technician:"tech-17",status:"complete",photoCount:0,followUp:true});assert.equal(followUpDecision(input),"close");});
