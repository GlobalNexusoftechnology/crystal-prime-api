/* eslint-disable @typescript-eslint/no-explicit-any */
import cron from "node-cron";
import axios from "axios";
import nodemailer from "nodemailer";
import { format, subDays } from "date-fns"; // npm i date-fns

/**
 * Update these
 */
const API_BASE = "http://194.164.151.17:3000/api/reports/leads";
const MAIL_FROM = '"GNT Reports" <giganexustechnologyllp@gmail.com>';
const MAIL_TO = "ahmedfaiz868@gmail.com"; // comma-separated allowed

const SMTP_CONFIG = {
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // use STARTTLS
  auth: {
    user: "giganexustechnologyllp@gmail.com",
    pass: "lkkzsjycdupfmhbb", // ensure this is a valid App Password
  },
  // optional: increase timeout/pool in production
  // pool: true,
  // tls: { rejectUnauthorized: false } // only if you have cert issues (not recommended normally)
};

/**
 * Columns definition (same fields you shared).
 */
const leadsListColumn = [
  { header: "STATUS", accessor: "status_id" },
  { header: "FIRST NAME", accessor: "first_name" },
  { header: "LAST NAME", accessor: "last_name" },
  { header: "COMPANY", accessor: "company" },
  { header: "PHONE", accessor: "phone" },
  { header: "OTHER CONTACT", accessor: "other_contact" },
  { header: "EMAIL", accessor: "email" },
  { header: "LOCATION", accessor: "location" },
  { header: "BUDGET", accessor: "budget" },
  { header: "POSSIBILITY OF CONVERSION", accessor: "possibility_of_conversion" },
  { header: "REQUIREMENT", accessor: "requirement" },
  { header: "SOURCE", accessor: "source_id" },
  { header: "TYPE", accessor: "type_id" },
  { header: "ASSIGNED TO", accessor: "assigned_to" },
] as const;

function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildHtmlTable(leads: any[] = []): string {
  const style = `
    table { border-collapse: collapse; width: 100%; font-family: Arial, Helvetica, sans-serif; font-size: 14px; }
    th, td { border: 1px solid #e6e6e6; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #f5f5f5; font-weight: 600; }
    .badge { display:inline-block; padding:4px 10px; border-radius:999px; color:#fff; font-size:13px; }
  `;

  const headersHtml = leadsListColumn.map((c) => `<th>${escapeHtml(String(c.header))}</th>`).join("");

  const rowsHtml = leads.length
    ? leads
        .map((row: any, idx: number) => {
          const cells = leadsListColumn
            .map((col) => {
              const key = col.accessor as string;
              const cellVal = row[key];

              if (key === "status_id") {
                const color = row.status_color || "#6b7280";
                const statusText = escapeHtml(String(cellVal ?? ""));
                return `<td><span class="badge" style="background:${color}">${statusText}</span></td>`;
              }

              if (key === "possibility_of_conversion") {
                const val = row[key];
                return `<td>${val || val === 0 ? escapeHtml(String(val) + "%") : "-"}</td>`;
              }

              if (cellVal === null || cellVal === undefined || cellVal === "") {
                return `<td>-</td>`;
              }
              return `<td>${escapeHtml(String(cellVal))}</td>`;
            })
            .join("");

          const srNo = idx + 1;
          return `<tr><td style="text-align:center; font-weight:600;">${srNo}</td>${cells}</tr>`;
        })
        .join("")
    : `<tr><td colspan="${1 + leadsListColumn.length}" style="text-align:center;padding:20px">No records</td></tr>`;

  const thead = `<thead><tr><th style="text-align:center;min-width:5rem">Sr No</th>${headersHtml}</tr></thead>`;

  return `
    <html>
      <head>
        <meta charset="utf-8"/>
        <style>${style}</style>
      </head>
      <body>
        <h3>Daily Leads Report</h3>
        <div>Generated on: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</div>
        <div style="margin-top:10px; overflow:auto;">
          <table>${thead}<tbody>${rowsHtml}</tbody></table>
        </div>
      </body>
    </html>
  `;
}

/**
 * Send report for a given date (YYYY-MM-DD)
 * Exposed so you can call it immediately to test.
 */
export async function sendDailyReportFor(dateStr?: string) {
  const date = dateStr ? new Date(dateStr) : subDays(new Date(), 1);
  const fromDate = format(date, "yyyy-MM-dd");
  const toDate = fromDate;
  const apiUrl = `${API_BASE}?fromDate=${fromDate}&toDate=${toDate}`;

  const transporter = nodemailer.createTransport(SMTP_CONFIG);

  try {
    // quick transporter verification -> will throw if auth/conn fails
    await transporter.verify();
    console.log("SMTP transporter verified ✅");
  } catch (vErr: any) {
    console.error("SMTP verify failed — check credentials/network:", vErr && vErr.message ? vErr.message : vErr);
    throw vErr;
  }

  try {
    console.log("Fetching leads from API:", apiUrl);
    const response = await axios.get(apiUrl, { timeout: 30000 });
    console.log("API status:", response.status);

    // log top-level shape so you can adapt to actual API response
    console.log("API response keys:", Object.keys(response.data || {}));

    const leads = Array.isArray(response.data) ? response.data : response.data?.data ?? [];
    console.log(`Leads fetched: ${Array.isArray(leads) ? leads.length : "not-array"}`);

    const html = buildHtmlTable(leads);

    const info = await transporter.sendMail({
      from: MAIL_FROM,
      to: MAIL_TO,
      subject: `Daily Leads Report — ${fromDate}`,
      html,
    });

    console.log(`Email sent: messageId=${info.messageId} accepted=${JSON.stringify(info.accepted)}`);
    return info;
  } catch (err: any) {
    console.error("Error sending daily report:", err?.response?.data ?? err?.message ?? err);
    throw err;
  }
}

/**
 * Setup cron: runs at 20:00 (8 PM) Asia/Kolkata **every day**
 * Cron expression: "0 20 * * *" -> minute=0 hour=20 every day
 */
export const setupDailyReportCron = () => {
  // If you want to test immediately during development, you can temporarily use:
  // cronExpression = "*/1 * * * *"  // runs every minute (use only for dev/test)
  const cronExpression = "* * * * *"; // 8:00 PM IST daily

  cron.schedule(
    cronExpression,
    async () => {
      console.log("⏳ Running Daily Leads Cron (scheduled job)...");
      try {
        await sendDailyReportFor(); // uses yesterday by default
      } catch (e) {
        console.error("Cron job failed:", e ?? e);
      }
    },
    { timezone: "Asia/Kolkata" }
  );

  console.log(`✅ Daily Leads Cron scheduled: ${cronExpression} Asia/Kolkata`);
};

// For quick local test you can call sendDailyReportFor() manually from your bootstrap file or REPL:
// (async () => { await sendDailyReportFor(); })();
