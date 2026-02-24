export type Variables = {
  requestId: string;
  authId: string;
  userId: string;
  sanitizedBody: Record<string, unknown>;
};

export type HonoEnv = {
  Variables: Variables;
};
