import { PageToken } from "../entities/page-token.entity";
import { AppDataSource } from "../utils/data-source";

const PAGE_ID = process.env.META_PAGE_ID!;
const APP_ID = process.env.META_APP_ID!;
const APP_SECRET = process.env.META_APP_SECRET!;
const FB_API_BASE = process.env.META_DATA_SOURCE_ENDPOINT!; 

const pageTokenRepo = AppDataSource.getRepository(PageToken);

// Save or update token in DB
export const saveToken = async (token: string, expiresIn?: number) => {
  let pageToken = await pageTokenRepo.findOne({ where: {} });

  const expiryDate = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

  if (pageToken) {
    pageToken.token = token;
    pageToken.expiresAt = expiryDate;
  } else {
    pageToken = pageTokenRepo.create({ token, expiresAt: expiryDate });
  }

  await pageTokenRepo.save(pageToken);
  return pageToken;
};

// Get current valid token (renew if close to expiry)
export const getValidToken = async (): Promise<string> => {
  const pageToken = await pageTokenRepo.findOne({ where: {} });

  if (!pageToken) {
    throw new Error("No page access token found. Run init script first.");
  }

  // Renew if less than 5 days left
  if (pageToken.expiresAt && pageToken.expiresAt.getTime() - Date.now() < 5 * 24 * 60 * 60 * 1000) {
    console.log("🔄 Token close to expiry, renewing...");
    return await renewToken(pageToken.token);
  }

  return pageToken.token;
};

// Renew token (using fetch)
export const renewToken = async (currentToken: string): Promise<string> => {
  try {
    const params = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: APP_ID,
      client_secret: APP_SECRET,
      fb_exchange_token: currentToken,
    });

    const res = await fetch(`${FB_API_BASE}/oauth/access_token?${params.toString()}`, {
      method: "GET",
    });

    if (!res.ok) {
      const errData = await res.json();
      console.error("❌ Failed to renew token:", errData);
      throw new Error(errData.error?.message || "Failed to renew token");
    }

    const data = await res.json();
    const newToken = data.access_token;
    const expiresIn = data.expires_in;

    await saveToken(newToken, expiresIn);

    console.log("✅ Token renewed successfully");
    return newToken;
  } catch (err: any) {
    console.error("❌ Error renewing token:", err.message);
    throw err;
  }
};
