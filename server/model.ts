import { Agent } from "@cline/sdk";
import type { AgentModel } from "@cline/agents";

/** Model settings from env. Shared by the audit agent and the screenshot reader. */
export interface ModelConfig {
  providerId: string;
  modelId: string;
  visionModelId: string;
  apiKey?: string;
}

export function modelConfigFromEnv(env: NodeJS.ProcessEnv = process.env): ModelConfig | null {
  const providerId = env.MODEL_PROVIDER?.trim();
  const modelId = env.MODEL_ID?.trim();
  if (!providerId || !modelId) return null;
  return {
    providerId,
    modelId,
    visionModelId: env.VISION_MODEL_ID?.trim() || modelId,
    apiKey: env.API_KEY?.trim() || undefined,
  };
}

/** Either a real provider (from env) or an injected stub model for tests. */
export type ModelSource = { kind: "provider"; config: ModelConfig; vision?: boolean } | { kind: "stub"; model: AgentModel };

type AgentOptions = Omit<ConstructorParameters<typeof Agent>[0], "providerId" | "modelId" | "apiKey" | "model">;

export function createAgent(source: ModelSource, options: AgentOptions): Agent {
  if (source.kind === "stub") return new Agent({ ...options, model: source.model } as ConstructorParameters<typeof Agent>[0]);
  const { config, vision } = source;
  return new Agent({
    ...options,
    providerId: config.providerId,
    modelId: vision ? config.visionModelId : config.modelId,
    apiKey: config.apiKey,
  } as ConstructorParameters<typeof Agent>[0]);
}
