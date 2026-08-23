import { TriggerNode } from './TriggerNode';
import { AIAgentNode } from './AIAgentNode';
import { ConnectorNode } from './ConnectorNode';
import { LogicNode } from './LogicNode';

export const nodeTypes = {
  triggerNode: TriggerNode,
  aiAgentNode: AIAgentNode,
  connectorNode: ConnectorNode,
  logicNode: LogicNode,
};

export * from './TriggerNode';
export * from './AIAgentNode';
export * from './ConnectorNode';
export * from './LogicNode';
