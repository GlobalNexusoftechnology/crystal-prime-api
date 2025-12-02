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
  secure: false,
  auth: {
    user: "giganexustechnologyllp@gmail.com",
    pass: "lkkzsjycdupfmhbb",
  },
};

/**
 * Columns definition (same fields you shared).
 * Keep these in sync with your frontend if you change column ordering.
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

/**
 * Build the HTML table using the columns above and leads data.
 */
function buildHtmlTable(leads: any[]): string {
  // Table styles - minimal inline so email clients render nicely
  const style = `
    table { border-collapse: collapse; width: 100%; font-family: Arial, Helvetica, sans-serif; font-size: 14px; }
    th, td { border: 1px solid #e6e6e6; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #f5f5f5; font-weight: 600; }
    .badge { display:inline-block; padding:4px 10px; border-radius:999px; color:#fff; font-size:13px; }
  `;

  const headersHtml = leadsListColumn
    .map((c) => `<th>${escapeHtml(String(c.header))}</th>`)
    .join("");

  const rowsHtml = leads.length
    ? leads
        .map((row: any, idx: number) => {
          const cells = leadsListColumn
            .map((col) => {
              const key = col.accessor as string;
              const cellVal = row[key];

              // custom rendering similar to your table behaviour
              if (key === "status_id") {
                const color = row.status_color || "#6b7280"; // fallback gray
                const statusText = escapeHtml(String(cellVal ?? ""));
                return `<td><span class="badge" style="background:${color}">${statusText}</span></td>`;
              }

              if (key === "possibility_of_conversion") {
                const val = row[key];
                return `<td>${val || val === 0 ? escapeHtml(String(val) + "%") : "-"}</td>`;
              }

              // default: show hyphen for null/undefined/empty
              if (cellVal === null || cellVal === undefined || cellVal === "") {
                return `<td>-</td>`;
              }
              return `<td>${escapeHtml(String(cellVal))}</td>`;
            })
            .join("");

          // add Sr No as first column (1-based)
          const srNo = idx + 1;
          return `<tr><td style="text-align:center; font-weight:600;">${srNo}</td>${cells}</tr>`;
        })
        .join("")
    : `<tr><td colspan="${1 + leadsListColumn.length}" style="text-align:center;padding:20px">No records</td></tr>`;

  // We include a Sr No header as your UI shows it
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

/** small helper to avoid XSS-like issues in email text */
function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Main setup function to be called on app bootstrap
 */
export const setupDailyReportCron = () => {
  // schedule: everyday at 8:00 PM IST
  cron.schedule(
    "* * * * *",
    
    async () => {
      console.log("⏳ Running Daily Leads Cron (8 PM IST)...");

      // decide date range - here: yesterday (IST)
      const yesterday = subDays(new Date(), 1);
      const fromDate = format(yesterday, "yyyy-MM-dd");
      const toDate = format(yesterday, "yyyy-MM-dd");

      const apiUrl = `${API_BASE}?fromDate=${fromDate}&toDate=${toDate}`;

      try {
        const response = await axios.get(apiUrl, {
          timeout: 30_000,
          // if your API needs auth add headers here
        });

        const leads = Array.isArray(response.data) ? response.data : response.data?.data ?? [];

        // build email HTML
        const html = buildHtmlTable(leads);

        // create transporter & send
        const transporter = nodemailer.createTransport(SMTP_CONFIG);

        await transporter.sendMail({
          from: MAIL_FROM,
          to: MAIL_TO,
          subject: `Daily Leads Report — ${fromDate}`,
          html,
        });

        console.log(`✅ Daily Leads email sent for ${fromDate}. rows=${leads.length}`);
      } catch (err: any) {
        console.error("❌ Daily Leads Cron failed:", err?.message || err);
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  console.log("✅ Daily Leads Cron scheduled: 8:00 PM Asia/Kolkata");
};
