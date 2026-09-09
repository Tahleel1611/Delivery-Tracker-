import { Router } from 'express';
import { patchDeliveryStatus } from '../controllers/driver.controller';
import { uploadProofOfDelivery } from '../controllers/pod.controller';
import { requireDriverAuth } from '../middleware/auth';
import multer from 'multer';
import { env } from '../config/env';

export const deliveryRouter = Router();

const podUpload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: env.POD_MAX_FILE_SIZE_BYTES, files: 1 },
	fileFilter: (_request, file, callback) => {
		callback(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype));
	}
});

deliveryRouter.patch('/:deliveryId/status', requireDriverAuth, patchDeliveryStatus);
deliveryRouter.post('/:deliveryId/pod', requireDriverAuth, podUpload.single('image'), uploadProofOfDelivery);