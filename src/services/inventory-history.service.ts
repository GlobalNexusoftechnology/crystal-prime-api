import { DeepPartial } from "typeorm";
import { Inventory } from "../entities/inventory.entity";
import { InventoryHistory } from "../entities/inventory.history.entity";
import AppError from "../utils/appError";
import { AppDataSource } from "../utils/data-source";

interface IInventoryHistoryInput {
  material_id: string;
  date: string;
  used: number;
  notes?: string;
}

const inventoryHistoryRepo = AppDataSource.getRepository(InventoryHistory);
const materialRepo = AppDataSource.getRepository(Inventory);

export const InventoryHistoryService = () => {
  const createHistory = async (data: IInventoryHistoryInput) => {
    const { material_id, date, used, notes } = data;

    const inventory = await materialRepo.findOne({
      where: { id: material_id, deleted: false },
    });

    console.log("data", data);
    console.log("inventory", inventory);

    if (!inventory) {
      throw new AppError(404, "Inventory not found");
    }

    // Ensure quantity is a number (fallback to 0 just in case)
    const currentQuantity = inventory.quantity ?? 0;

    // ❌ If used > available quantity → throw error
    if (used > currentQuantity) {
      throw new AppError(
        400,
        `Used quantity (${used}) cannot be greater than available quantity (${currentQuantity}).`,
      );
    }

    // ✅ Update material quantity
    inventory.quantity = currentQuantity - used;
    await materialRepo.save(inventory);

    // ✅ Create history record
    const history = inventoryHistoryRepo.create({
      inventory,
      date,
      used,
      notes,
    });

    return await inventoryHistoryRepo.save(history);
  };

  const getAllHistory = async () => {
    return await inventoryHistoryRepo.find({
      where: { deleted: false },
      relations: ["inventory"],
      order: { date: "DESC" },
    });
  };

  // const getHistoryById = async (id: string) => {
  //   const history = await inventoryHistoryRepo.findOne({
  //     where: { id, deleted: false },
  //     relations: ["inventory"],
  //   });

  //   console.log("history", history);

  //   if (!history) throw new AppError(404, "Inventory history not found");
  //   return history;
  // };

  const getHistoryById = async (inventoryId: string) => {
    const history = await inventoryHistoryRepo.find({
      where: { deleted: false },
      order: { date: "DESC" },
    });

    // 🔥 Manual filtering
    return history.filter((item: any) => item.inventoryId === inventoryId);
  };

  const updateHistory = async (
    id: string,
    data: DeepPartial<IInventoryHistoryInput>,
  ) => {
    const history = await inventoryHistoryRepo.findOne({
      where: { id, deleted: false },
      relations: ["inventory"],
    });

    if (!history) throw new AppError(404, "Inventory history not found");

    if (data.material_id) {
      const inventory = await materialRepo.findOne({
        where: { id: data.material_id, deleted: false },
      });
      if (!inventory) throw new AppError(404, "Material not found");
      history.inventory = inventory;
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
        inventory: { id: materialId },
      },
      relations: ["inventory"],
      order: { date: "DESC" },
    });
  };

  return {
    createHistory,
    getAllHistory,
    getHistoryById,
    updateHistory,
    deleteHistory,
    getAllHistoryByMaterialId,
  };
};
