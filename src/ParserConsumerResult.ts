import { type Rule } from "@/Helper";

export class ParserConsumerResult {
  public constructor(
    public rule: Rule,
    public offset: number,
    public matches?:
      | Array<ParserConsumerResult | string>
      | ParserConsumerResult
      | string
  ) {}
}
