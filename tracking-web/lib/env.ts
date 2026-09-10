const productionRequired = ['AUTH_SECRET', 'DATABASE_URL', 'OCI_S3_ENDPOINT', 'OCI_S3_BUCKET', 'OCI_S3_ACCESS_KEY', 'OCI_S3_SECRET_KEY', 'EMAIL_SERVER', 'EMAIL_FROM'] as const;

export function validateProductionEnvironment() {
  if (process.env.NODE_ENV !== 'production') return;
  const missing = productionRequired.filter((key) => !process.env[key]);
  if (missing.length > 0) throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
}