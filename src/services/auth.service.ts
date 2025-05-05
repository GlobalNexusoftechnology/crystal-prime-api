import { signJwt } from '../utils/jwt';
import { User } from '../entities/user.entity';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generates access and refresh tokens for a user.
 */
export const signTokens = async (user: User): Promise<Tokens> => {
  const accessToken = signJwt(
    { sub: user.id },
    'accessTokenPrivateKey',
    { expiresIn: '15m' }
  );

  const refreshToken = signJwt(
    { sub: user.id },
    'refreshTokenPrivateKey',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};
