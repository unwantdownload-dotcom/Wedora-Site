ALTER TABLE public.business_settings
  ALTER COLUMN phone SET DEFAULT '+94 78 359 0222',
  ALTER COLUMN whatsapp SET DEFAULT '+94 78 359 0222';

UPDATE public.business_settings
SET
  phone = CASE WHEN phone = '+94 77 123 4567' THEN '+94 78 359 0222' ELSE phone END,
  whatsapp = CASE WHEN whatsapp = '+94 77 123 4567' THEN '+94 78 359 0222' ELSE whatsapp END
WHERE id = 'default'
  AND (phone = '+94 77 123 4567' OR whatsapp = '+94 77 123 4567');
