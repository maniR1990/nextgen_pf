export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  name: string;
  password: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResendVerificationDto {
  email: string;
}

export interface SessionUserDto {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: Date | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessJti: string;
  refreshJti: string;
}
