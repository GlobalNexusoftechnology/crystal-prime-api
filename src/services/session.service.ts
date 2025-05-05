import { Session } from "../entities/session.entity";
import { AppDataSource } from "../utils/data-source";

const sessionRepository = AppDataSource.getRepository(Session);

/**
 * Creates a new session for the user.
 */
export const createSession = async (
  userId: string,
  ipAddress: string,
  userAgent: string
) => {
  const session = sessionRepository.create({ userId, ipAddress, userAgent });
  return await sessionRepository.save(session);
};

/**
 * Finds an active session by user ID.
 */
export const findSessionByUserId = async (userId: string) => {
  return await sessionRepository.findOne({
    where: { userId, isExpired: false },
  });
};

/**
 * Expires a session by session ID.
 */
export const expireSession = async (sessionId: string) => {
  return await sessionRepository.update(sessionId, { isExpired: true });
};

/**
 * Deletes all sessions for a user by user ID.
 */
export const deleteSessionByUserId = async (userId: string) => {
  return await sessionRepository.delete({ userId });
};
