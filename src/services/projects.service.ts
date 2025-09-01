import { AppDataSource } from "../utils/data-source";
import { Project, ProjectStatus } from "../entities/projects.entity";
import { Clients } from "../entities/clients.entity";
import AppError from "../utils/appError";
import { LeadTypeService } from "./lead-types.service";
import { mergeDateWithCurrentTime } from "../utils";
import { MilestoneService } from "./project-milestone.service";
import { ProjectTaskService } from "./project-task.service";
import { User } from "entities";

interface ProjectInput {
  client_id?: string;
  name: string;
  description: string;
  project_type?: string; 
  status?: ProjectStatus;
  budget?: number;
  cost_of_labour?: number,
  overhead_cost?: number,
  extra_cost?: number,
  estimated_cost?: number;
  actual_cost?: number;
  start_date?: Date;
  end_date?: Date;
  actual_start_date?: Date;
  actual_end_date?: Date;
  renewal_type?: string | null;
  renewal_date?: Date;
  is_renewal?: boolean;
}

const ProjectRepo = AppDataSource.getRepository(Project);
const clientRepo = AppDataSource.getRepository(Clients);
const leadTypeService = LeadTypeService();
const milestoneService = MilestoneService();
const taskService = ProjectTaskService();

export const ProjectService = () => {
  const getQueryRunner = () => {
    return AppDataSource.createQueryRunner();
  };

  // Helper function to calculate actual cost
  const calculateActualCost = (
    costOfLabour?: number | string,
    overheadCost?: number | string,
    actualStartDate?: Date | string,
    actualEndDate?: Date | string,
    extraCost?: number | string
  ): number | null => {
    const labour = Number(costOfLabour) || 0;
    const overhead = Number(overheadCost) || 0;
    const extra = Number(extraCost) || 0;
    if (!actualStartDate || !actualEndDate) return null;
    const startDateObj = typeof actualStartDate === 'string' ? new Date(actualStartDate) : actualStartDate;
    const endDateObj = typeof actualEndDate === 'string' ? new Date(actualEndDate) : actualEndDate;
    if (!(startDateObj instanceof Date) || isNaN(startDateObj.getTime()) || !(endDateObj instanceof Date) || isNaN(endDateObj.getTime())) {
      return null;
    }
    const msPerDay = 1000 * 60 * 60 * 24;
    const start = new Date(startDateObj).setHours(0,0,0,0);
    const end = new Date(endDateObj).setHours(0,0,0,0);
    let days = Math.floor((end - start) / msPerDay) + 1;
    if (days < 1) days = 1;
    const total = (labour + overhead) * days + extra;
    return total > 0 ? total : null;
  };

  // Create Project
  const createProject = async (data: ProjectInput, queryRunner?: any) => {
    const {
      client_id,
      name,
      description,
      project_type,
      status,
      budget,
      cost_of_labour,
      overhead_cost,
      extra_cost,
      estimated_cost,
      actual_cost,
      start_date,
      end_date,
      actual_start_date,
      actual_end_date,
      renewal_type,
      renewal_date,
      is_renewal,
    } = data;

    let client;
    if (client_id) {
      client = queryRunner
        ? await queryRunner.manager.findOne(Clients, { where: { id: client_id } })
        : await clientRepo.findOne({ where: { id: client_id } });
      if (!client) throw new AppError(404, "Client not found");
    }

    let leadType;
    if (project_type) {
      leadType = await leadTypeService.getLeadTypeById(project_type);
      if (!leadType) throw new AppError(400, "Invalid project type");
    }

    // Calculate actual cost automatically
    const calculatedActualCost = calculateActualCost(
      cost_of_labour,
      overhead_cost,
      actual_start_date,
      actual_end_date,
      extra_cost
    );

    const repo = queryRunner ? queryRunner.manager.getRepository(Project) : ProjectRepo;
    const project = repo.create({
      name,
      description,
      project_type: leadType,
      status: status || ProjectStatus.OPEN,
      budget,
      cost_of_labour,
      overhead_cost,
      extra_cost,
      estimated_cost,
      actual_cost: calculatedActualCost,
      start_date: mergeDateWithCurrentTime(start_date),
      end_date: mergeDateWithCurrentTime(end_date),
      actual_start_date,
      actual_end_date,
      renewal_type,
      renewal_date,
      is_renewal,
      client,
    });

    const savedProject = await repo.save(project);

    // Automatically create Support Milestone only (task will be created when first ticket is generated)
    try {
      // Create Support Milestone
      const supportMilestone = await milestoneService.createMilestone({
        name: "Support",
        description: "Support and maintenance milestone for ongoing project support",
        status: "Open",
        project_id: savedProject.id,
        start_date: new Date(),
        end_date: savedProject.end_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now if no end date
      }, queryRunner);

    } catch (error) {
      console.error("Error creating support milestone:", error);
      // Don't fail the project creation if milestone/task creation fails
    }

    return savedProject;
  };

  // Get All Projects
  const getAllProject = async (userId?: string, userRole?: string, user?: User) => {
    // If admin, return all projects
    if (userRole && userRole.toLowerCase() === 'admin') {
      return await ProjectRepo.find({
        where: { deleted: false },
        order: { created_at: "DESC" },
        relations: [
          "client",
          "milestones",
          "milestones.tasks",
          "milestones.tickets",
          "attachments",
          "attachments.uploaded_by",
          "project_type"
        ],
      });
    }

    // If client role, return only projects for that client
  if (userRole && userRole.toLowerCase() === 'client') {
    console.log(user)
  const currentClient = await clientRepo.findOne({
    where: { user: { id: user?.id }, deleted: false },
  });

  if (!currentClient) {
    throw new AppError(404, "Client not found for this user.");
  }

  return await ProjectRepo.find({
    where: { 
      client: { id: currentClient.id },
      deleted: false 
    },
    order: { created_at: "DESC" },
    relations: [
      "client",
      "milestones",
      "milestones.tasks",
      "milestones.tickets",
      "attachments",
      "attachments.uploaded_by",
      "project_type"
    ],
  });
}


    // Otherwise, return only projects where user is assigned to a milestone or task
    // Use QueryBuilder for complex joins
    const qb = ProjectRepo.createQueryBuilder("project")
      .leftJoinAndSelect("project.client", "client")
      .leftJoinAndSelect("project.milestones", "milestones")
      .leftJoinAndSelect("milestones.tasks", "tasks")
      .leftJoinAndSelect("milestones.tickets", "tickets")
      .leftJoinAndSelect("project.attachments", "attachments")
      .leftJoinAndSelect("attachments.uploaded_by", "uploaded_by")
      .where("project.deleted = false")
      .andWhere(
        "milestones.assigned_to = :userId OR tasks.assigned_to = :userId",
        { userId }
      )
      .orderBy("project.created_at", "DESC");

    return await qb.getMany();
  };



  // Get Project by ID
  const getProjectById = async (id: string) => {
    const project = await ProjectRepo.findOne({
      where: { id, deleted: false },
      relations: [
        "client",
        "milestones",
        "milestones.tasks",
        "milestones.tickets",
        "attachments",
        "attachments.uploaded_by",
        "project_type"
      ],
    });

    if (!project) throw new AppError(404, "Project record not found");
    return project;
  };

  // Update Project
  const updateProject = async (id: string, data: Partial<ProjectInput>, queryRunner?: any) => {
    const repo = queryRunner ? queryRunner.manager.getRepository(Project) : ProjectRepo;
    const clientRepository = queryRunner ? queryRunner.manager.getRepository(Clients) : clientRepo;
    const project = await repo.findOne({
      where: { id, deleted: false },
      relations: ["client"],
    });
    if (!project) throw new AppError(404, "Project record not found");

    const {
      client_id,
      name,
      description,
      project_type,
      status,
      budget,
      cost_of_labour,
      overhead_cost,
      extra_cost,
      estimated_cost,
      actual_cost,
      start_date,
      end_date,
      actual_start_date,
      actual_end_date,
      renewal_type,
      renewal_date,
      is_renewal,
    } = data;

    if (client_id) {
      const client = await clientRepository.findOne({ where: { id: client_id } });
      if (!client) throw new AppError(404, "Client not found");
      project.client = client;
    }

    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (project_type !== undefined) {
      let leadTypeUpdate;
      if (project_type) {
        leadTypeUpdate = await leadTypeService.getLeadTypeById(project_type);
        if (!leadTypeUpdate) throw new AppError(400, "Invalid project type");
        project.project_type = leadTypeUpdate;
      }
    }
    if (status !== undefined) project.status = status;
    if (budget !== undefined) project.budget = budget;
    if (cost_of_labour !== undefined) project.cost_of_labour = cost_of_labour;
    if (overhead_cost !== undefined) project.overhead_cost = overhead_cost;
    if (extra_cost !== undefined) project.extra_cost = extra_cost;
    if (estimated_cost !== undefined) project.estimated_cost = estimated_cost;
    
    // Auto-calculate actual cost if cost_of_labour, overhead_cost, actual_start_date, actual_end_date, or extra_cost is updated
    if (
      cost_of_labour !== undefined ||
      overhead_cost !== undefined ||
      actual_start_date !== undefined ||
      actual_end_date !== undefined ||
      extra_cost !== undefined
    ) {
      const newLabourCost = cost_of_labour !== undefined ? cost_of_labour : project.cost_of_labour;
      const newOverheadCost = overhead_cost !== undefined ? overhead_cost : project.overhead_cost;
      const newActualStartDate = actual_start_date !== undefined ? actual_start_date : project.actual_start_date;
      const newActualEndDate = actual_end_date !== undefined ? actual_end_date : project.actual_end_date;
      const newExtraCost = extra_cost !== undefined ? extra_cost : project.extra_cost;
      project.actual_cost = calculateActualCost(
        newLabourCost,
        newOverheadCost,
        newActualStartDate,
        newActualEndDate,
        newExtraCost
      );
    } else if (actual_cost !== undefined) {
      // Allow manual override if none of the above are being updated
      project.actual_cost = actual_cost;
    }
    
    if (start_date !== undefined) project.start_date = mergeDateWithCurrentTime(start_date);
    if (end_date !== undefined) project.end_date = mergeDateWithCurrentTime(end_date);
    if (actual_start_date !== undefined)
      project.actual_start_date = actual_start_date;
    if (actual_end_date !== undefined)
      project.actual_end_date = actual_end_date;
    if (renewal_type !== undefined) project.renewal_type = renewal_type as any;
    if (renewal_date !== undefined) project.renewal_date = renewal_date;
    if (is_renewal !== undefined) project.is_renewal = is_renewal;

    return await repo.save(project);
  };

  // Soft Delete Project
  const softDeleteProject = async (id: string) => {
    const project = await ProjectRepo.findOne({
      where: { id, deleted: false },
    });
    if (!project) throw new AppError(404, "Project record not found");

    project.deleted = true;
    project.deleted_at = new Date();

    return await ProjectRepo.save(project);
  };

  // Aggregate project counts by status, filtered by user for non-admins (using joins, no entity change)
  const getProjectStatusCounts = async (userId?: string, role?: string) => {
    const qb = ProjectRepo.createQueryBuilder("project")
      .select(["project.status AS status", "COUNT(DISTINCT project.id)::int AS count"])
      .where("project.deleted = false");
    
    if (role && role.toLowerCase() === 'client' && userId) {
      // For client role, filter by client's projects
      qb.leftJoin("project.client", "client")
        .leftJoin("client.user", "user")
        .andWhere("user.id = :userId", { userId });
    } else if (role !== "admin" && role !== "Admin" && userId) {
      // For other non-admin roles, filter by assignments
      qb.leftJoin("project.milestones", "milestones")
        .leftJoin("milestones.tasks", "tasks")
        .andWhere(
          "milestones.assigned_to = :userId OR tasks.assigned_to = :userId",
          { userId }
        );
    }
    return await qb.groupBy("project.status").getRawMany();
  };

  // Get All Projects
  const getAllProjectDashboard = async (userId?: string, userRole?: string) => {
    // If admin, return all projects
    if (userRole && userRole.toLowerCase() === 'admin') {
      return await ProjectRepo.find({
        where: { deleted: false },
        order: { created_at: "DESC" },
        relations: [
          "client",
          "milestones",
          "milestones.tasks",
          "attachments",
          "attachments.uploaded_by",
          "project_type"
        ],
      });
    }

    // If client role, return only projects for that client
    if (userRole && userRole.toLowerCase() === 'client') {
      return await ProjectRepo.find({
        where: { 
          client: { user: { id: userId } },
          deleted: false 
        },
        order: { created_at: "DESC" },
        relations: [
          "client",
          "milestones",
          "milestones.tasks",
          "attachments",
          "attachments.uploaded_by",
          "project_type"
        ],
      });
    }

    // Otherwise, return only projects where user is assigned to a milestone or task
    // Use QueryBuilder for complex joins
    const qb = ProjectRepo.createQueryBuilder("project")
      .leftJoinAndSelect("project.client", "client")
      .leftJoinAndSelect("project.milestones", "milestones")
      .leftJoinAndSelect("milestones.tasks", "tasks")
      .leftJoinAndSelect("project.attachments", "attachments")
      .leftJoinAndSelect("attachments.uploaded_by", "uploaded_by")
      .where("project.deleted = false")
      .andWhere(
        "milestones.assigned_to = :userId OR tasks.assigned_to = :userId",
        { userId }
      )
      .orderBy("project.created_at", "DESC");

    return await qb.getMany();
  };

  return {
    getAllProjectDashboard,
    createProject,
    getAllProject,
    getProjectById,
    updateProject,
    softDeleteProject,
    getQueryRunner,
    getProjectStatusCounts,
  };
};
