import { NotificationService } from '../services/notification.service';
import { NotificationType } from '../entities/notification.entity';

const notificationService = NotificationService();

export const sendNotification = async (
  userId: string,
  type: NotificationType,
  message: string,
  metadata?: Record<string, any>
) => {
  try {
    return await notificationService.createNotification(
      userId,
      type,
      message,
      metadata
    );
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

// Helper functions for common notification types
export const sendTaskAssignedNotification = async (
  userId: string,
  taskName: string,
  taskId: string,
  assignedBy: string
) => {
  return await sendNotification(
    userId,
    NotificationType.TASK_ASSIGNED,
    `You have been assigned a new task: ${taskName}`,
    {
      taskId,
      taskName,
      assignedBy
    }
  );
};

export const sendLeadStatusChangedNotification = async (
  userId: string,
  leadId: string,
  leadName: string,
  oldStatus: string,
  newStatus: string
) => {
  return await sendNotification(
    userId,
    NotificationType.LEAD_STATUS_CHANGED,
    `Lead status changed from ${oldStatus} to ${newStatus}`,
    {
      leadId,
      leadName,
      oldStatus,
      newStatus
    }
  );
};

export const sendFollowupCreatedNotification = async (
  userId: string,
  followupId: string,
  leadId: string,
  leadName: string,
  dueDate: Date
) => {
  return await sendNotification(
    userId,
    NotificationType.FOLLOWUP_CREATED,
    `New followup created for lead: ${leadName}`,
    {
      followupId,
      leadId,
      leadName,
      dueDate
    }
  );
}; 