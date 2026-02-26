import { Injectable } from '@nestjs/common';
import { BaseAgent } from './base-agent';

@Injectable()
export class AgentRegistryService {
  private agents = new Map<string, BaseAgent>();

  register(name: string, agent: BaseAgent): void {
    this.agents.set(name, agent);
  }

  get(name: string): BaseAgent | undefined {
    return this.agents.get(name);
  }

  getAll(): Map<string, BaseAgent> {
    return this.agents;
  }

  getAgentDescriptions(): string {
    const descriptions: string[] = [];
    for (const [name, agent] of this.agents) {
      descriptions.push(`- **${name}**: ${agent.description}`);
    }
    return descriptions.join('\n');
  }
}
