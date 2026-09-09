import type { RequestHandler } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { driverLoginSchema } from '../schemas/auth.schema';
import { signDriverToken } from '../middleware/auth';

export const loginDriver: RequestHandler = async (request, response, next) => {
  try {
    const { driverId } = driverLoginSchema.parse(request.body);
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      select: { id: true, name: true, status: true }
    });

    if (!driver || driver.status !== 'ACTIVE') {
      throw new AppError(401, 'DRIVER_LOGIN_FAILED', 'The driver is not active or does not exist.');
    }

    response.status(200).json({
      data: { accessToken: signDriverToken(driver.id), driver },
      requestId: request.requestId
    });
  } catch (error) {
    next(error);
  }
};