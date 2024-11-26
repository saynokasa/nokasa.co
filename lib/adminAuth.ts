export function verifyAdminSecret(authHeader: string | null): boolean {
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) {
      throw new Error('ADMIN_SECRET is not defined.');
    }
  
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Authorization header missing or incorrect');
    }
  
    const token = authHeader.split(' ')[1];
    return token === adminSecret;
  }