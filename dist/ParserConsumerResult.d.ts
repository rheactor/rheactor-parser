import { type ParserRule } from "@/ParserRule";
export declare class ParserConsumerResult {
    rule: ParserRule;
    offset: number;
    matches?: string | ParserConsumerResult | (string | ParserConsumerResult | null)[] | null | undefined;
    constructor(rule: ParserRule, offset: number, matches?: string | ParserConsumerResult | (string | ParserConsumerResult | null)[] | null | undefined);
}
