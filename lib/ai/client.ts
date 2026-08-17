import Anthropic from "@anthropic-ai/sdk";
import { ANTHROPIC_API_KEY } from "./config";

export function createAnthropic(): Anthropic {
  return new Anthropic({ apiKey: ANTHROPIC_API_KEY });
}
