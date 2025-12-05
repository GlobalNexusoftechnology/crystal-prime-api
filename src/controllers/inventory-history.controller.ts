import { Request, Response, NextFunction } from "express"

import { AppError } from "../utils"
import {
  createInventoryHistory as createInventoryHistorySchema,
  updateInventoryHistory as updateInventoryHistorySchema,
} from "schemas/inventory-history.schema"
import { InventoryHistoryService } from "services/inventory-history"

const service = InventoryHistoryService()

// ✅ Create
export const createInventoryHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsedData = createInventoryHistorySchema.parse(req.body)

    const payload = {
      material_id: parsedData.material_id,
      date: parsedData.date,
      used: parsedData.used,
      notes: parsedData.notes,
    }

    const result = await service.createHistory(payload)

    return res.status(201).json({
      status: "success",
      message: "Inventory history created",
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

// ✅ Get All (optionally by materialId ?materialId=...)
export const getAllInventoryHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { materialId } = req.query

    let result

    if (materialId) {
      result = await service.getAllHistoryByMaterialId(materialId as string)
    } else {
      result = await service.getAllHistory()
    }

    return res.status(200).json({
      status: "success",
      message: "Inventory history fetched",
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

// ✅ Get by ID
export const getInventoryHistoryById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params

    const result = await service.getHistoryById(id)

    if (!result) {
      throw new AppError(404, "Inventory history record not found")
    }

    return res.status(200).json({
      status: "success",
      message: "Inventory history fetched by id",
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

// ✅ Update
export const updateInventoryHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const parsedData = updateInventoryHistorySchema.parse(req.body)

    const payload = {
      date: parsedData.date,
      used: parsedData.used,
      notes: parsedData.notes,
      // if you also want to allow changing material:
      // material_id: parsedData.material_id,
    }

    const result = await service.updateHistory(id, payload)

    if (!result) {
      throw new AppError(404, "Inventory history record not found")
    }

    return res.status(200).json({
      status: "success",
      message: "Inventory history updated",
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

// ✅ Delete
export const deleteInventoryHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params

    const deleted = await service.deleteHistory(id)

    if (!deleted) {
      throw new AppError(404, "Inventory history record not found")
    }

    return res.status(200).json({
      status: "success",
      message: "Inventory history deleted",
    })
  } catch (error) {
    next(error)
  }
}
