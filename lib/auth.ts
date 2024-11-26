import jwt from 'jsonwebtoken';
import { EntityType } from '@prisma/client';

export interface JwtPayload {
  entityId: number;
  entityType: EntityType;
}

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined.');
  }
  return secret;
}

const JWT_SECRET = getJWTSecret();

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (err) {
    throw new Error('Invalid or expired token');
  }
}

export function extractTokenFromHeader(authHeader: string | null): string {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authorization header missing or incorrect');
  }
  return authHeader.split(' ')[1];
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '180d' });
}