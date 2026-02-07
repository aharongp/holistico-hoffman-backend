export class RegisterDto {
  email!: string;
  password!: string;
  firstName!: string;
  lastName!: string;
  role?: string | null;
  nationalId?: string | null;
  insuranceNumber?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  contactPhone?: string | null;
}
