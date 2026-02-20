import { randomUUID } from "node:crypto";

export interface PartnerApiKey {
  id: string;
  clientId: string;
  label: string;
  keyId: string;
  keySecret: string;
  createdAt: string;
}

export interface PartnerProject {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  createdAt: string;
}

const apiKeys: PartnerApiKey[] = [];
const projects: PartnerProject[] = [];

export function createApiKey(clientId: string, label: string): PartnerApiKey {
  const keyRecord: PartnerApiKey = {
    id: randomUUID(),
    clientId,
    label,
    keyId: `pk_${randomUUID().replace(/-/g, "")}`,
    keySecret: `sk_${randomUUID().replace(/-/g, "")}`,
    createdAt: new Date().toISOString()
  };

  apiKeys.unshift(keyRecord);
  return keyRecord;
}

export function listApiKeys(clientId?: string): PartnerApiKey[] {
  return apiKeys.filter((key) => (clientId ? key.clientId === clientId : true));
}

export function createPartnerProject(clientId: string, name: string, description?: string): PartnerProject {
  const project: PartnerProject = {
    id: randomUUID(),
    clientId,
    name,
    description: description ?? null,
    createdAt: new Date().toISOString()
  };

  projects.unshift(project);
  return project;
}

export function listPartnerProjects(clientId?: string): PartnerProject[] {
  return projects.filter((project) => (clientId ? project.clientId === clientId : true));
}

export function clearPublicApiStore(): void {
  apiKeys.length = 0;
  projects.length = 0;
}
