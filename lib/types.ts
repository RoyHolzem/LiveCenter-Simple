export type Role = 'user' | 'assistant' | 'system';

export type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
};

export type PresenceState = 'idle' | 'processing' | 'typing' | 'error';

export type TelecomView = 'incidents' | 'events' | 'planned-works';

export type LabeledValue = {
  label: string;
  value: string;
};

export type TelecomRecord = {
  recordId: string;
  entityType: string;
  title: string;
  summary: string;
  status: string;
  severity: string;
  priority: string;
  typeCode: string;
  companyName: string;
  customerName: string;
  customerContactName: string;
  customerEmail: string;
  customerPhone: string;
  city: string;
  networkRegion: string;
  networkCountry: string;
  operatorName: string;
  serviceType: string;
  networkSegment: string;
  fiberId: string;
  circuitId: string;
  siteCode: string;
  startTime: string;
  endTime?: string;
  createdAt: string;
  updatedAt: string;
  customerText: string;
  highlights: LabeledValue[];
  facts: LabeledValue[];
};

export type TelecomApiResponse = {
  ok: boolean;
  view: TelecomView;
  items: TelecomRecord[];
  count: number;
  error?: string;
};
