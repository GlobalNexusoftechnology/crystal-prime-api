import cron from 'node-cron';
import { AppDataSource } from '../utils/data-source';

export const setupTicketCronJobs = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('Running ticket auto-closing cron job...');
      await closeInactiveTickets();
      await closeResolvedTickets();
      console.log('Ticket auto-closing cron job completed.');
    } catch (error) {
      console.error('Error in ticket auto-closing cron job:', error);
    }
  });
};

const closeInactiveTickets = async () => {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const result = await AppDataSource.query(`
    WITH last_comments AS (
      SELECT 
        tc.ticket_id,
        MAX(tc.created_at) as last_comment_date
      FROM ticket_comments tc
      GROUP BY tc.ticket_id
    ),
    client_comments AS (
      SELECT 
        tc.ticket_id,
        MAX(tc.created_at) as last_client_comment_date
      FROM ticket_comments tc
      INNER JOIN users u ON u.id = tc.user_id
      INNER JOIN roles r ON r.id = u.role_id
      WHERE LOWER(r.role) LIKE '%client%'
      GROUP BY tc.ticket_id
    ),
    tickets_to_close AS (
      SELECT t.id 
      FROM tickets t
      INNER JOIN last_comments lc ON lc.ticket_id = t.id
      LEFT JOIN client_comments cc ON cc.ticket_id = t.id
      WHERE LOWER(t.status) IN ('open', 'in progress')
      AND t.deleted = false
      AND lc.last_comment_date < $1
      AND (cc.last_client_comment_date IS NULL OR cc.last_client_comment_date < $1)
    )
    UPDATE tickets 
    SET status = 'Closed', 
        updated_at = NOW()
    WHERE id IN (SELECT id FROM tickets_to_close)
    RETURNING id
  `, [threeDaysAgo]);
    console.log(result);
  console.log(`Closed ${result?.[1] || 0} tickets due to client inactivity`);
};

const closeResolvedTickets = async () => {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const result = await AppDataSource.query(`
    UPDATE tickets 
    SET status = 'Closed', 
        updated_at = NOW()
    WHERE LOWER(status) = 'completed' 
    AND deleted = false 
    AND updated_at <= $1
    RETURNING id
  `, [threeDaysAgo]);
     console.log(result);
  console.log(`Closed ${result?.[1] || 0} completed tickets automatically`);
};