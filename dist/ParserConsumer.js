"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.ParserConsumer=void 0;const e=require("@/Helper");const t=require("@/ParserConsumerResult");const r=require("@/ParserError");class s{parser;input;offsetLead;transformations=new Map;constructor(e,t){this.parser=e;this.input=t}consume(){const t=this.consumeRule(this.parser.ruleInitial);if(this.input){if(this.offsetLead===undefined||this.offsetLead!==this.input.length){const t=(0,e.matchAny)(this.input,this.offsetLead)?.[0];const r=Math.max(0,this.offsetLead??0);throw new Error(`unexpected "${t}" at offset ${r}`)}else if(t===undefined){throw new Error(`unexpected "${(0,e.matchAny)(this.input)?.[0]}" at offset 0`)}}else if(this.offsetLead===undefined){throw new Error(`unexpected empty input`)}return this.applyTransformation(t)}applyTransformation(e){const r=this.transformations.get(e);if(r!==undefined){return r}if(typeof e.matches==="string"){return e.rule.transformer?.(e.matches)??e.matches}if(Array.isArray(e.matches)){const r=e.matches.map(e=>e instanceof t.ParserConsumerResult?this.applyTransformation(e):e);return e.rule.transformer?.(...r)??r}if(e.matches instanceof t.ParserConsumerResult){const t=this.applyTransformation(e.matches);return e.rule.transformer?.(...Array.isArray(t)?t:[t])??t}return e.rule.transformer?.()??e.matches}consumeToken(t,r){const s=this.parser.tokensMap.get(t);if(s){for(const t of s){if(t instanceof RegExp){const s=(0,e.match)(t,this.input,r);if(s!==null){return s[0].length}}else if(this.input.startsWith(t,r)){return t.length}}}return null}consumeSeparator(t,r){if(t.separatorMode!==e.RuleSeparatorMode.DISALLOWED){const s=this.consumeToken(e.separatorToken,r);if(s!==null){this.offsetLead=Math.max(r+s,this.offsetLead??0);return s}if(t.separatorMode===e.RuleSeparatorMode.MANDATORY){throw new e.MandatorySeparatorError}}return 0}consumeRule(s,n=0,i=[s]){if((0,e.hasCircularPath)(i)){return undefined}const o=this.parser.rulesMap.get(s);const a=new Map;e:for(const f of o){const u=f.terms.length;let h;let c=n;for(let t=0;t<u;t++){const r=f.terms[t];try{c+=this.consumeSeparator(f,c)}catch(r){if(r instanceof e.MandatorySeparatorError&&t!==0){continue e}}if(r instanceof RegExp){const t=(0,e.match)(r,this.input,c);if(t){if(Array.isArray(h)){if(t.length>1){const[,...e]=t;h.push(...e)}else{h.push(t[0])}}else if(t.length>1){const[,...e]=t;if(h===undefined){if(e.length===1){[h]=e}else{h=[...e]}}else{h=[h,...e]}}else if(h===undefined){[h]=t}else{h=[h,t[0]]}c+=t[0].length;this.offsetLead=Math.max(c,this.offsetLead??0);continue}continue e}else if((0,e.isTokenIdentifier)(r)){if(this.parser.tokensMap.has(r)){const e=this.consumeToken(r,c);if(e===null){continue e}c+=e;this.offsetLead=Math.max(c,this.offsetLead??0);continue}if(typeof r==="string"&&this.parser.rulesMap.has(r)){if(t===0&&r===s){continue e}const e=`${r}:${c}`;const o=a.get(e);const f=o??(n===c?this.consumeRule(r,c,[...i,r]):this.consumeRule(r,c));if(!o){a.set(e,f)}if(f!==undefined){if(Array.isArray(h)){h.push(f)}else if(h===undefined){h=f}else{h=[h,f]}({offset:c}=f);continue}continue e}}else if(r&&"literal"in r){if(this.input.startsWith(r.literal,c)){if(Array.isArray(h)){h.push(r.literal)}else if(h===undefined){h=r.literal}else{h=[h,r.literal]}c+=r.literal.length;this.offsetLead=Math.max(c,this.offsetLead??0);continue}continue e}else{h??=null;continue}const u=(0,e.getTokenIdentifier)(r);const l=o.length>1?`${s}[${o.indexOf(f)}]`:s;throw new Error(`unknown term "${u}" at rule "${l}"`)}if(f.separatorMode!==e.RuleSeparatorMode.MANDATORY){c+=this.consumeSeparator(f,c)}this.offsetLead??=0;const l=new t.ParserConsumerResult(f,c,h);if(f.validator){const t=this.applyTransformation(l);const s=f.validator(...Array.isArray(t)?t:[t]);this.transformations.set(l,t);if(s===false){return undefined}else if(s instanceof Error){const t=(0,e.matchAny)(this.input,n)?.[0];throw r.ParserError.from(s.message,{cause:s.cause},`unexpected "${t}"`,n)}}return l}return undefined}}exports.ParserConsumer=s;