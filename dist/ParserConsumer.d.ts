import { type Parser } from "@/Parser";
export declare class ParserConsumer {
    parser: Parser;
    input: string;
    private offsetLead;
    private readonly transformations;
    constructor(parser: Parser, input: string);
    consume(): any;
    private applyTransformation;
    private consumeToken;
    private consumeSeparator;
    private consumeRule;
}
