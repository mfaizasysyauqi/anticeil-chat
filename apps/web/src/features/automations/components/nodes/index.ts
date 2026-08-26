import { TriggerNode } from './TriggerNode';
import { AIAgentNode } from './AIAgentNode';
import { ConnectorNode } from './ConnectorNode';
import { LogicNode } from './LogicNode';
import { HttpNode } from './HttpNode';
import { CodeNode } from './CodeNode';
import { DatabaseNode } from './DatabaseNode';
import { EmailNode } from './EmailNode';
import { DelayNode } from './DelayNode';
import { TransformNode } from './TransformNode';
import { SpreadsheetNode } from './SpreadsheetNode';
import { StorageNode } from './StorageNode';
import { StickyNoteNode } from './StickyNoteNode';

export const nodeTypes = {
  triggerNode: TriggerNode,
  aiAgentNode: AIAgentNode,
  connectorNode: ConnectorNode,
  logicNode: LogicNode,
  httpNode: HttpNode,
  codeNode: CodeNode,
  databaseNode: DatabaseNode,
  emailNode: EmailNode,
  delayNode: DelayNode,
  transformNode: TransformNode,
  spreadsheetNode: SpreadsheetNode,
  storageNode: StorageNode,
  stickyNoteNode: StickyNoteNode,
};

export * from './TriggerNode';
export * from './AIAgentNode';
export * from './ConnectorNode';
export * from './LogicNode';
export * from './HttpNode';
export * from './CodeNode';
export * from './DatabaseNode';
export * from './EmailNode';
export * from './DelayNode';
export * from './TransformNode';
export * from './SpreadsheetNode';
export * from './StorageNode';
