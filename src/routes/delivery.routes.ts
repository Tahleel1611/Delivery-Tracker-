import { Router } from 'express';
import { patchDeliveryStatus } from '../controllers/driver.controller';
import { uploadProofOfDelivery } from '../controllers/pod.controller';
import { requireLegacyApiKey } from '../middleware/api-key';
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

deliveryRouter.patch('/:deliveryId/status', requireLegacyApiKey, patchDeliveryStatus);
deliveryRouter.post('/:deliveryId/pod', requireLegacyApiKey, podUpload.single('image'), uploadProofOfDelivery);