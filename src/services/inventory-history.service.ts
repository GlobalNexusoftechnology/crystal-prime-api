import { AppDataSource } from "../utils/data-source";
import { Material } from "../entities/material.entity";
import AppError from "../utils/appError";
import { DeepPartial } from "typeorm";
import { InventoryHistory } from "../entities/inventory.history.entity";

interface IInventoryHistoryInput {
  material_id: string;
  date: string;
  used: number;
  notes?: string;
}

const inventoryHistoryRepo = AppDataSource.getRepository(InventoryHistory);
const materialRepo = AppDataSource.getRepository(Material);

export const InventoryHistoryService = () => {
  const createHistory = async (data: IInventoryHistoryInput) => {
    const { material_id, date, used, notes } = data;

    const material = await materialRepo.findOne({
      where: { id: material_id, deleted: false },
    });
    if (!material) throw new AppError(404, "Material not found");

    const history = inventoryHistoryRepo.create({
      material,
      date,
      used,
      notes,
    });

    return await inventoryHistoryRepo.save(history);
  };

  const getAllHistory = async () => {
    return await inventoryHistoryRepo.find({
      where: { deleted: false },
      relations: ["material"],
      order: { date: "DESC" },
    });
  };

  const getHistoryById = async (id: string) => {
    const history = await inventoryHistoryRepo.findOne({
      where: { id, deleted: false },
      relations: ["material"],
    });

    if (!history) throw new AppError(404, "Inventory history not found");
    return history;
  };

  const updateHistory = async (
    id: string,
    data: DeepPartial<IInventoryHistoryInput>
  ) => {
    const history = await inventoryHistoryRepo.findOne({
      where: { id, deleted: false },
      relations: ["material"],
    });

    if (!history) throw new AppError(404, "Inventory history not found");

    if (data.material_id) {
      const material = await materialRepo.findOne({
        where: { id: data.material_id, deleted: false },
      });
      if (!material) throw new AppError(404, "Material not found");
      history.material = material;
    }

    if (data.date !== undefined) history.date = data.date;
    if (data.used !== undefined) history.used = data.used;
    if (data.notes !== undefined) history.notes = data.notes ?? null;

    return await inventoryHistoryRepo.save(history);
  };

  const deleteHistory = async (id: string) => {
    const history = await inventoryHistoryRepo.findOne({
      where: { id, deleted: false },
    });
    if (!history) throw new AppError(404, "Inventory history not found");

    history.deleted = true;
    await inventoryHistoryRepo.save(history);
    return true;
  };

  // ✅ Get All by Material ID
  const getAllHistoryByMaterialId = async (materialId: string) => {
    return await inventoryHistoryRepo.find({
      where: {
        deleted: false,
        material: { id: materialId },
      },
      relations: ["material"],
      order: { date: "DESC" },
    });
  };


  return {
    createHistory,
    getAllHistory,
    getHistoryById,
    updateHistory,
    deleteHistory,
    getAllHistoryByMaterialId
  };
};
