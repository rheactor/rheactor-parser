import { type ParserRule } from "@/ParserRule";

export class ParserConsumerResult {
  public constructor(
    public rule: ParserRule,
    public offset: number,
    public matches?:
      | Array<ParserConsumerResult | string>
      | ParserConsumerResult
      | string
  ) {}
}
