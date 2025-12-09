// src/services/client-details.service.ts
import { AppDataSource } from "../utils/data-source";
import { ClientDetails } from "../entities/clients-details.entity";
import { Clients } from "../entities/clients.entity";
import AppError from "../utils/appError";

interface ClientDetailsInput {
    client_id?: string;
    client_contact?: string;
    contact_person?: string;
    email?: string;
    other_contact?: string;
    designation?: string;
}

const clientDetailsRepo = AppDataSource.getRepository(ClientDetails);
const clientRepo = AppDataSource.getRepository(Clients);

export const ClientDetailsService = () => {
    //  Create
    const createClientDetail = async (data: ClientDetailsInput) => {
        const {
            client_id,
            client_contact,
            contact_person,
            email,
            other_contact,
            designation,
        } = data;

        const client = await clientRepo.findOneBy({ id: client_id });
        if (!client) throw new AppError(404, "Client not found");

        const detail = clientDetailsRepo.create({
            client,
            client_contact,
            contact_person,
            email,
            other_contact,
            designation,
        });

        return await clientDetailsRepo.save(detail);
    };

    //  Get All
    const getAllClientDetails = async () => {
        const data = await clientDetailsRepo.find({
            relations: ["client"],
            order: { created_at: "DESC" },
        });
        return data;
    };

    //  Get By ID
    const getClientDetailById = async (id: string) => {
        const detail = await clientDetailsRepo.findOne({
            where: { id },
            relations: ["client"],
        });

        if (!detail) throw new AppError(404, "Client detail not found");
        return detail;
    };

    //  Update
    const updateClientDetail = async (id: string, data: Partial<ClientDetailsInput>) => {
        const detail = await clientDetailsRepo.findOne({
            where: { id },
            relations: ["client"],
        });

        if (!detail) throw new AppError(404, "Client detail not found");

        if (data.client_id) {
            const client = await clientRepo.findOneBy({ id: data.client_id });
            if (!client) throw new AppError(404, "Client not found");
            detail.client = client;
        }

        if (data.client_contact !== undefined) detail.client_contact = data.client_contact;
        if (data.contact_person !== undefined) detail.contact_person = data.contact_person;
        if (data.email !== undefined) detail.email = data.email;
        if (data.other_contact !== undefined) detail.other_contact = data.other_contact;
        if (data.designation !== undefined) detail.designation = data.designation;

        return await clientDetailsRepo.save(detail);
    };

    //  Delete
    const deleteClientDetail = async (id: string) => {
        const detail = await clientDetailsRepo.findOneBy({ id });
        if (!detail) throw new AppError(404, "Client detail not found");

        detail.deleted = true;
        detail.deleted_at = new Date();

        await clientDetailsRepo.remove(detail);
        return detail;
    };

    return {
        createClientDetail,
        getAllClientDetails,
        getClientDetailById,
        updateClientDetail,
        deleteClientDetail,
    };
};
