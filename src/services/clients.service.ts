import { AppDataSource } from "../utils/data-source";
import { Clients } from "../entities/clients.entity";
import AppError from "../utils/appError";
import { Leads } from "../entities/leads.entity";
import ExcelJS from "exceljs";
import { ClientDetailsService } from "./clients-details.service";
import { ClientDetails } from "entities/clients-details.entity";

interface ClientInput {
  lead_id?: string;
  name: string;
  email?: string;
  contact_number: string;
  address?: string;
  company_name?: string;
  contact_person?: string;
  website?: string;
}

const clientRepo = AppDataSource.getRepository(Clients);
const leadRepo = AppDataSource.getRepository(Leads);

export const ClientService = () => {
  // Create Client
  const createClient = async (data: ClientInput & { client_details?: ClientDetails[] }) => {
    const {
      name,
      email,
      contact_number,
      address,
      lead_id,
      company_name,
      contact_person,
      website,
      client_details,
    } = data;

    let lead = undefined;
    if (lead_id) {
      lead = await leadRepo.findOne({ where: { id: lead_id } });
      if (!lead) throw new AppError(404, "Lead not found");
    }

    const client = clientRepo.create({
      name,
      email,
      contact_number,
      address,
      lead,
      company_name,
      contact_person,
      website,
    });

    const savedClient = await clientRepo.save(client);

    // Create client details if provided
    if (Array.isArray(client_details) && client_details.length > 0) {
      const clientDetailsService = ClientDetailsService();
      for (const detail of client_details) {
        await clientDetailsService.createClientDetail({
          ...detail,
          client_id: savedClient.id,
        });
      }
    }

    return savedClient;
  };

  // Get All Clients
  const getAllClients = async () => {
    const data = await clientRepo.find({
      where: { deleted: false },
      relations: ["lead", "client_details"],
    });

    // return {
    //   data,
    //   total: data.length,
    // };
    return data
  };

  //  Get Client by ID
  const getClientById = async (id: string) => {
    const client = await clientRepo.findOne({
      where: { id, deleted: false },
      relations: ["lead"],
    });

    if (!client) throw new AppError(404, "Client not found");
    return client;
  };

  //  Update Client
  const updateClient = async (id: string, data: Partial<ClientInput> & { client_details?: ClientDetails[] }) => {
    const client = await clientRepo.findOne({ where: { id, deleted: false } });
    if (!client) throw new AppError(404, "Client not found");

    const {
      name,
      email,
      contact_number,
      address,
      lead_id,
      company_name,
      contact_person,
      website,
      client_details,
    } = data;

    if (lead_id) {
      const lead = await leadRepo.findOne({ where: { id: lead_id } });
      if (!lead) throw new AppError(404, "Lead not found");
      client.lead = lead;
    }

    //  Assign updated fields only
    if (name !== undefined) client.name = name;
    if (email !== undefined) client.email = email;
    if (contact_number !== undefined) client.contact_number = contact_number;
    if (address !== undefined) client.address = address;
    if (company_name !== undefined) client.company_name = company_name;
    if (contact_person !== undefined) client.contact_person = contact_person;
    if (website !== undefined) client.website = website;

    const savedClient = await clientRepo.save(client);

    // Update client details if provided
    if (Array.isArray(client_details)) {
      const clientDetailsService = ClientDetailsService();
      for (const detail of client_details) {
        if (detail.deleted && detail.id) {
          await clientDetailsService.deleteClientDetail(detail.id);
          continue;
        }
        if (detail.id) {
          await clientDetailsService.updateClientDetail(detail.id, {
            client_contact: detail.client_contact,
            contact_person: detail.contact_person,
            email: detail.email,
            other_contact: detail.other_contact,
            designation: detail.designation,
          });
        } else {
          await clientDetailsService.createClientDetail({
            ...detail,
            client_id: savedClient.id,
          });
        }
      }
    }

    return savedClient;
  };

  //  Soft Delete
  const softDeleteClient = async (id: string) => {
    const client = await clientRepo.findOne({ where: { id, deleted: false } });
    if (!client) throw new AppError(404, "Client not found");

    client.deleted = true;
    client.deleted_at = new Date();

    return await clientRepo.save(client);
  };


 const exportClientsToExcel = async (
  userId: string,
  userRole: string
): Promise<ExcelJS.Workbook> => {
  const clientRepo = AppDataSource.getRepository(Clients);

  let clients: Clients[];

  if (userRole.toLowerCase() === "admin") {
    clients = await clientRepo.find({
      where: { deleted: false },
      relations: ["lead"],
      order: { created_at: "DESC" },
    });
  } else {
    clients = await clientRepo.find({
      where: { deleted: false },
      relations: ["lead"],
      order: { created_at: "DESC" },
    });
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Clients");

  worksheet.columns = [
    { header: "Sr No", key: "sr_no", width: 6 },
    { header: "Client Name", key: "name", width: 25 },
    { header: "Email", key: "email", width: 30 },
    { header: "Contact Number", key: "contact_number", width: 20 },
    { header: "Company Name", key: "company_name", width: 30 },
    { header: "Website", key: "website", width: 30 },
    { header: "Contact Person", key: "contact_person", width: 25 },
    { header: "Address", key: "address", width: 40 },
    { header: "Created At", key: "created_at", width: 25 },
  ];

  clients.forEach((client, index) => {
    worksheet.addRow({
      sr_no: index + 1,
      name: client.name,
      email: client.email ?? "",
      contact_number: client.contact_number,
      company_name: client.company_name ?? "",
      website: client.website ?? "",
      contact_person: client.contact_person ?? "",
      address: client.address ?? "",
      created_at: client.created_at?.toLocaleString() ?? "",
    });
  });

  return workbook;
};

// services/client.service.ts
const generateClientTemplate = async (): Promise<ExcelJS.Workbook> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Clients");

  worksheet.columns = [
    { header: "name", key: "name", width: 25 },
    { header: "email", key: "email", width: 30 },
    { header: "contact_number", key: "contact_number", width: 20 },
    { header: "company_name", key: "company_name", width: 25 },
    { header: "website", key: "website", width: 30 },
    { header: "contact_person", key: "contact_person", width: 25 },
    { header: "address", key: "address", width: 40 },
    { header: "lead_id", key: "lead_id", width: 36 },
  ];

  return workbook;
};



  return {
    createClient,
    getAllClients,
    getClientById,
    updateClient,
    softDeleteClient,
    exportClientsToExcel,
    generateClientTemplate
  };
};
