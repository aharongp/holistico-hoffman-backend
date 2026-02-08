export class VerifyPasswordResetDto {
  email!: string;
  code!: string;
  newPassword!: string;
  token!: string;
}
