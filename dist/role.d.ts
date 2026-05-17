import type { PersonaConfig, RoleFile } from './types.js';
export declare function isSafeRoleName(name: unknown): name is string;
/**
 * Throw a recognizable error for an unsafe role name. Call this at MCP
 * tool entry points so malformed input fails fast with a clear message
 * rather than silently resolving to a wrong path.
 */
export declare function assertSafeRoleName(name: unknown): asserts name is string;
export declare function readRole(_config: PersonaConfig, name: string): string;
export declare function listRoles(_config: PersonaConfig): RoleFile[];
export declare function writeRole(_config: PersonaConfig, name: string, content: string): void;
export declare function getActiveRole(_config: PersonaConfig): string | null;
export declare function setActiveRole(_config: PersonaConfig, name: string | null): void;
export declare function buildRoleContext(content: string): string;
