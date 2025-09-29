export interface JwtPayload {
  sub: number;
  role?: string | null;
  email?: string | null;
}
