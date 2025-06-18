import { AppDataSource } from "../utils/data-source";
import { Clients } from "../entities/clients.entity";
import AppError from "../utils/appError";
import { Leads } from "../entities/leads.entity";

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
  const createClient = async (data: ClientInput) => {
    const {
      name,
      email,
      contact_number,
      address,
      lead_id,
      company_name,
      contact_person,
      website,
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

    return await clientRepo.save(client);
  };

  // Get All Clients
  const getAllClients = async () => {
    const data = await clientRepo.find({
      where: { deleted: false },
      relations: ["lead"],
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
  const updateClient = async (id: string, data: Partial<ClientInput>) => {
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

    return await clientRepo.save(client);
  };

  //  Soft Delete
  const softDeleteClient = async (id: string) => {
    const client = await clientRepo.findOne({ where: { id, deleted: false } });
    if (!client) throw new AppError(404, "Client not found");

    client.deleted = true;
    client.deleted_at = new Date();

    return await clientRepo.save(client);
  };

  return {
    createClient,
    getAllClients,
    getClientById,
    updateClient,
    softDeleteClient,
  };
};
