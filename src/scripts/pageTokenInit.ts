require('dotenv').config();
import { saveToken } from "../services/page-token.service";
import { AppDataSource } from "../utils/data-source";

const FIRST_TOKEN = process.env.META_PAGE_ACCESS_TOKEN!;

const init = async () => {
  await AppDataSource.initialize();

  try {
    await saveToken(FIRST_TOKEN, 60 * 24 * 60 * 60); 
    console.log("✅ Token saved successfully");
  } catch (err) {
    console.error("❌ Error saving token:", err);
  } finally {
    await AppDataSource.destroy();
  }
};

init();
