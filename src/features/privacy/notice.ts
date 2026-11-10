// Cambiar la versión cuando cambien las finalidades o el contenido del aviso.
export const PRIVACY_NOTICE_VERSION = "2026-11-10";

export function requirePrivacyConsent(accepted: boolean, version: string) {
  if (accepted !== true || version !== PRIVACY_NOTICE_VERSION)
    throw new Error("Lee y acepta el aviso de privacidad para crear tu cuenta.");
}
