export type Credentials = { email: string; password: string };
export type LoginErrors = { email?: string; password?: string };

export function validateCredentials({ email, password }: Credentials): LoginErrors {
  const errors: LoginErrors = {};
  if (!email.trim()) errors.email = 'Escribe tu correo electrónico.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Revisa el formato de tu correo electrónico.';
  }
  if (!password.trim()) errors.password = 'Escribe tu contraseña.';
  return errors;
}
