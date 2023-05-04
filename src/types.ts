export type LoginResponseData = {
  accessJwt: string;
  did: string;
  email?: string;
  handle: string;
  refreshJwt: string;
};

export type RefreshJwt = {
  exp: number;
  iat: number;
  jti: string; // long random key
  scope: "com.atproto.refresh";
  sub: string; // did
};

export type AccessJwt = {
  exp: number;
  iat: number;
  scope: string;
  sub: string;
};
