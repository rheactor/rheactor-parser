"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.Parser=void 0;const e=require("./Helper");const r=require("./ParserConsumer");const t=require("./ParserRule");class s{rulesMap=new Map;ruleInitial;tokensMap=new Map([[e.separatorToken,[(0,e.regexpSticky)(e.separatorWhitespace)]]]);rulesLastIdentifier;constructor(e){this.ruleInitial=e?.ruleInitial}separator(r){this.tokensMap.delete(e.separatorToken);if(r!==false){this.token(e.separatorToken,r)}}token(r,t){const s=(0,e.getTokenIdentifier)(r);if(this.tokensMap.has(r)){throw new Error(`token "${s}" already defined`)}if(this.rulesMap.size){throw new Error(`token "${s}" must be declared before rules`)}const i=Array.isArray(t)?t:t===undefined&&typeof r==="string"?[r]:[t];this.tokensMap.set(r,i.map(r=>{if(r instanceof RegExp){return(0,e.isRegexpOptimizable)(r)?r.source:(0,e.regexpSticky)(r)}return r}))}tokens(...e){for(const r of e){this.token(r)}}rule(r,t){return this.rulePush(r,t,e.RuleSeparatorMode.OPTIONAL)}ruleStrict(r,t){return this.rulePush(r,t,e.RuleSeparatorMode.DISALLOWED)}ruleSeparated(r,t){return this.rulePush(r,t,e.RuleSeparatorMode.MANDATORY)}rulePush(r,s,i){if(!this.rulesMap.has(r)){this.rulesMap.set(r,[]);this.ruleInitial??=r;if(this.tokensMap.has(r)){throw new Error(`rule is using identifier "${r}" reserved for token`)}}else if(this.rulesLastIdentifier!==undefined&&this.rulesLastIdentifier!==r){throw new Error(`rule "${r}" must be declared sequentially`)}const n=Array.isArray(s)?s:[s];if(!n.length){throw new Error(`rule "${r}" must define at least one term`)}if(!(0,e.matchIdentifier)(r)){throw new Error(`rule "${r}" does not have a valid identifier`)}const a=new t.ParserRule(n.map(r=>{if(r instanceof RegExp){return(0,e.isRegexpOptimizable)(r)?{literal:r.source}:(0,e.regexpSticky)(r)}return r}),i);this.rulesLastIdentifier=r;this.rulesMap.get(r).push(a);return a}parse(e){if(this.rulesMap.size===0){throw new Error("no rule specified")}return new r.ParserConsumer(this,e).consume()}}exports.Parser=s;