
const envApiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!envApiUrl && process.env.NODE_ENV === 'production') {
  throw new Error(
    'NEXT_PUBLIC_API_URL must be configured in production',
  );
}

export const API_URL = (
  envApiUrl ?? 'http://localhost:8000'
).replace(/\/+$/, '');
