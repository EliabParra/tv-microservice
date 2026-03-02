import { Request, Response, NextFunction } from "express";

/**
 * Middleware que valida y extrae la cabecera `x-device-ip` de cada petición.
 * Si el header está ausente o no tiene formato IPv4 válido, responde 400 Bad Request.
 * Si es válido, adjunta la IP a `res.locals.deviceIp` para uso de los controladores.
 */
export const deviceMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const deviceIp = req.header("x-device-ip");

  if (!deviceIp) {
    res.status(400).json({
      success: false,
      error:
        "Missing required header: x-device-ip (IP address of the target Fire TV device)",
    });
    return;
  }

  // Validación básica de formato IPv4
  const ipv4Regex =
    /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.){3}(25[0-5]|(2[0-4]|1\d|[1-9]|)\d)$/;
  if (!ipv4Regex.test(deviceIp)) {
    res.status(400).json({
      success: false,
      error: `Invalid header value for x-device-ip: "${deviceIp}" is not a valid IPv4 address`,
    });
    return;
  }

  res.locals.deviceIp = deviceIp;
  next();
};
