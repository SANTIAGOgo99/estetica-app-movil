# Verificación del 19 de noviembre

## Instalador

- [APK 1.0.0](https://expo.dev/artifacts/eas/beAodsUy9xzXW6jSwZRqyqz6eM5N-1uPmaEoeJIyEAw.apk).
- [Compilación EAS terminada](https://expo.dev/accounts/appmovilestetica/projects/estetica-clientes/builds/6953a647-0856-4125-afca-f40b1d20539d).
- [Tamaño, SHA-256 e identificador Android](apk.json).
- [Manifest decodificado con JADX 1.5.7](AndroidManifest.xml).
- [Inspección DEX y módulo de pinning](apk-inspection.json).

El paquete contiene 19,564 clases; 11,407 tienen nombres simples de uno o dos
caracteres. Esto acredita nombres ofuscados, no imposibilidad de análisis.
La extracción completa de recursos de JADX se interrumpió por falta de espacio;
se conservó el manifest y se retiraron los recursos temporales. No se ejecutó MobSF.

El APK se subió desde el árbol de trabajo. La referencia Git de EAS corresponde
al commit anterior a la compilación. Su SHA-256 identifica el archivo entregado.
EAS generó y administra las credenciales de firma. La instalación en dispositivo
y la verificación criptográfica independiente de firma quedan pendientes.

## API y base real

- [13 comprobaciones en la versión de prueba](backend-live.json).
- [13 comprobaciones en producción](backend-production-live.json).
- Commit backend: `760e0042094dcb637e83e1e65a4683e649148318`.
- API: `https://esteticaa-backend-five.vercel.app/api`.
- Despliegue: `dpl_3VLDahPP1NCmqCiPM8Xc6yfMs69k`.

Se comprobaron consentimiento, registro, inicio de sesión, consulta/corrección de
perfil, preferencias persistidas, refresh rotativo y rechazo de reutilización,
eliminación propia y rechazo posterior de tokens. Las cuentas sintéticas se
anonimizaron al terminar. Los reportes no contienen contraseñas ni tokens.

## Interfaz con API simulada

Tres casos web aprobados en Chromium con presentación Pixel 7:

| Caso | Comprobación | Captura |
| --- | --- | --- |
| ARCO-01 | Corrección con contraseña y confirmación del servidor | [Datos corregidos](datos-corregidos.png) |
| ARCO-02 | Retirar promociones y conservar preferencia al reabrir | [Oposición guardada](oposicion-guardada.png) |
| ARCO-03 | Eliminación requiere contraseña/confirmación y cierra sesión tras respuesta | [Confirmación](confirmacion-eliminar-cuenta.png) |

Son datos ficticios y pruebas web, no Android nativo.
[Evidencia anterior](../noviembre-2026/README.md).

## Transporte y límites

[Cadena TLS y hashes SPKI verificados](certificate-chain.json). Dos pins SHA-256
para el host exacto. El APK incluye marcadores SslPublicKeyPinning, pinning-error y
Certificate pinning failure!. La inspección estática no sustituye interceptación
en Android.

Pendientes: instalación y recorridos Android Debug/Release, prueba anti-MitM,
almacenamiento nativo, permisos heredados, análisis completo JADX/MobSF,
avisos de dependencias y envío/revisión de Google Play.

[Tabla de avance y demostración](../../noviembre/liberacion-2026-11-19.md).
