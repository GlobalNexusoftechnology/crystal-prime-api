import { EntityManager, ILike } from "typeorm";
import { AppDataSource } from "../utils/data-source";
import { Material } from "../entities/material.entity";
import AppError from "../utils/appError";
import ExcelJS from "exceljs";
import { MaterialBrand, MaterialType } from "../entities";

const repo = AppDataSource.getRepository(Material);
const brandRepo = AppDataSource.getRepository(MaterialBrand);
const typeRepo = AppDataSource.getRepository(MaterialType);

export const MaterialService = () => {
  const createMaterial = async (data: any) => {
    return await AppDataSource.transaction(async (transactionalEntityManager) => {
      
      if(data?.code){
        const exit = await repo.findOne({
          where: {
            code: data?.code,
            deleted: false,
          }
        })
        if(exit){
          throw new AppError(409, `Material with code ${data?.code} already exist.`);
        }
      }

      if (data?.materialBrandId) {
        const brand = await brandRepo.findOne({
          where: { id: data?.materialBrandId, deleted: false },
        });
        data.materialBrand = brand ? brand : undefined;
      }

      if (data?.materialTypeId) {
        const type = await typeRepo.findOne({
          where: { id: data?.materialTypeId, deleted: false },
        });
        data.materialType = type ? type : undefined;
      }

      const material = repo.create(data);
      const savedMaterial = await transactionalEntityManager.save(material);

      return savedMaterial;
    });
  };

  const getAllMaterials = async (filters: any = {}) => {
    const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
    const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
    const skip = (page - 1) * limit;
    const searchText = filters.searchText;

    const qb = repo
      .createQueryBuilder("material")
      .leftJoinAndSelect("material.materialBrand", "materialBrand")
      .leftJoinAndSelect("material.materialType", "materialType")
      .where("material.deleted = false");

    if (searchText) {
      qb.andWhere(
        "(material.name ILIKE :searchText OR material.code ILIKE :searchText)",
        { searchText: `%${searchText}%` }
      );
    }

    const [materials, total] = await qb
      .orderBy("material.created_at", "DESC")
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: materials,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  };

  const getMaterialById = async (id: string) => {
    const material = await repo.findOne({
      where: { id, deleted: false },
      relations: ["materialBrand", "materialType"],
    });
    if (!material) throw new AppError(404, "Material not found");
    return material;
  };

  const updateMaterial = async (id: string, data: any) => {
  return await AppDataSource.transaction(async (transactionalEntityManager) => {
    const material = await getMaterialById(id);

    if (data?.materialBrandId) {
      const brand = await brandRepo.findOne({
        where: { id: data?.materialBrandId, deleted: false },
      });
      data.materialBrand = brand ? brand : material.materialBrand;
    }

    if (data?.materialTypeId) {
      const type = await typeRepo.findOne({
        where: { id: data?.materialTypeId, deleted: false },
      });
      data.materialType = type ? type : material.materialType;
    }

    if (data?.code) {
      if (material.code !== data?.code) {
        const exit = await repo.findOne({
          where: {
            code: data?.code,
            deleted: false,
          },
        });
        if (exit) {
          throw new AppError(
            409,
            `Material with code ${data?.code} already exist.`
          );
        }
      }
    }

    Object.assign(material, data);
    const updatedMaterial = await transactionalEntityManager.save(material);

    return updatedMaterial;
  });
};

  const softDeleteMaterial = async (id: string) => {
    const material = await getMaterialById(id);
    material.deleted = true;
    return await repo.save(material);
  };

const updateMaterialAvailability = async (
  materialId: string,
  quantityChange: number,
  transactionalEntityManager?: EntityManager
) => {
  const repoToUse = transactionalEntityManager?.getRepository(Material) || repo;

  const material = await repoToUse.findOne({
    where: { id: materialId, deleted: false },
    lock: { mode: "pessimistic_write" }
  });

  if (!material) {
    throw new AppError(404, "Material not found");
  }

  const newQuantity = (material.quantity || 0) + quantityChange;
  if (newQuantity < 0) {
    throw new AppError(400, `Insufficient material quantity for ${material.name}`);
  }

  material.quantity = newQuantity;
  return await repoToUse.save(material);
};


  // Get materials for export with pagination support
  const getMaterialsForExport = async (filters: any = {}) => {
    const searchText = filters.searchText;

    const qb = repo
      .createQueryBuilder("material")
      .leftJoinAndSelect("material.materialBrand", "materialBrand")
      .leftJoinAndSelect("material.materialType", "materialType")
      .where("material.deleted = false");

    if (searchText) {
      qb.andWhere(
        "(material.name ILIKE :searchText OR material.code ILIKE :searchText)",
        { searchText: `%${searchText}%` }
      );
    }

    return await qb
      .orderBy("material.created_at", "DESC")
      .getMany();
  };

  // Export Materials to Excel
  const exportMaterialsToExcel = async (filters: any = {}) => {
    const materials = await getMaterialsForExport(filters);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Materials");
    worksheet.columns = [
      { header: "S.No", key: "sno", width: 8 },
      { header: "Name", key: "name", width: 20 },
      { header: "Code", key: "code", width: 15 },
      { header: "Brand", key: "brand", width: 15 },
      { header: "Size", key: "size", width: 10 },
      { header: "UOM", key: "uom", width: 10 },
      { header: "Pressure", key: "pressure", width: 10 },
      { header: "HSN", key: "hsn", width: 10 },
      { header: "Type", key: "type", width: 10 },
      { header: "GST", key: "gst", width: 10 },
      { header: "Purchase Price", key: "purchase_price", width: 15 },
      { header: "Sales Price", key: "sales_price", width: 15 },
      { header: "Sales Description", key: "sales_description", width: 30 },
      {
        header: "Purchase Description",
        key: "purchase_description",
        width: 30,
      },
      { header: "Alias", key: "alias", width: 15 },
      { header: "Quantity", key: "quantity", width: 10 },
      { header: "Photos", key: "photos", width: 40 },
    ];
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
    materials.forEach((m: any, index: number) => {
      worksheet.addRow({
        sno: index + 1,
        name: m.name,
        code: m.code,
        brand: m.materialBrand?.name || "",
        size: m.size,
        uom: m.uom,
        pressure: m.pressure,
        hsn: m.hsn,
        type: m.materialType?.name || "",
        gst: m.gst,
        purchase_price: m.purchase_price,
        sales_price: m.sales_price,
        sales_description: m.sales_description,
        purchase_description: m.purchase_description,
        alias: m.alias,
        quantity: m.quantity ?? 0,
        photos: m.photos ? m.photos.join(", ") : "",
      });
    });
    return workbook;
  };

  // Generate Material Template
  const generateMaterialTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Materials Template");
    worksheet.columns = [
      { header: "Name", key: "name", width: 20 },
      { header: "Code", key: "code", width: 15 },
      { header: "Brand", key: "brand", width: 15 },
      { header: "Size", key: "size", width: 10 },
      { header: "UOM", key: "uom", width: 10 },
      { header: "Pressure", key: "pressure", width: 10 },
      { header: "HSN", key: "hsn", width: 10 },
      { header: "Type", key: "type", width: 10 },
      { header: "GST", key: "gst", width: 10 },
      { header: "Purchase Price", key: "purchase_price", width: 15 },
      { header: "Sales Price", key: "sales_price", width: 15 },
      { header: "Sales Description", key: "sales_description", width: 30 },
      {
        header: "Purchase Description",
        key: "purchase_description",
        width: 30,
      },
      { header: "Alias", key: "alias", width: 15 },
      { header: "Quantity", key: "quantity", width: 10 },
      // { header: "Photos (comma separated URLs)", key: "photos", width: 40 },
    ];
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
    return workbook;
  };

  // Upload Materials from Excel
const uploadMaterialsFromExcelService = async (fileBuffer: Buffer) => {
  const workbook = new ExcelJS.Workbook();
  // temporary type casting
  const fileBufferTypeCasting = fileBuffer as any;
  await workbook.xlsx.load(fileBufferTypeCasting);

  const worksheet = workbook.worksheets[0];
  const headers: string[] = [];

  worksheet.getRow(1).eachCell((cell) => {
    headers.push(cell.text.toLowerCase().trim().replace(/\s+/g, "_"));
  });

  const materialsToInsert: any[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header row
    const materialData: any = {};
    headers.forEach((header, colIndex) => {
      const cell = row.getCell(colIndex + 1);
      materialData[header] = cell.text || "";
    });
    // const imageContaner = materialData['photos_(comma_separated_urls)'];

    // Parse photos as array
    // if (imageContaner) {      
    //   const imageArray = imageContaner?.richText ? imageContaner?.richText : null;

    //   if(imageArray){
    //     const container: string[] = [];

    //     imageArray.forEach((u: any) => {
    //       if(u?.text !== ','){
    //         container.push(u?.text ?? "")
    //       }
    //     })
    //      materialData.photos = container;
    //   }else{
    //           materialData.photos = materialData['photos_(comma_separated_urls)']
    //     ?.split(",")
    //     ?.map((s: string) => s.trim())
    //     ?.filter(Boolean);
    //   }
      
    // } else {
    //   materialData.photos = [];
    // }

    // Parse quantity
  materialData.quantity = materialData.quantity ? Number(materialData.quantity) : 0;

    materialsToInsert.push(materialData);
  });

  const savedMaterials = [];

  for (const data of materialsToInsert) {
    let brandEntity: MaterialBrand | undefined;
    let typeEntity: MaterialType | undefined;

    if(data?.code){
        const exit = await repo.findOne({
          where: {
            code: data?.code,
            deleted: false,
          }
        })
        if(exit){
          throw new AppError(409, `Material with code ${data?.code} already exist.`);
        }
      }

    if (data.brand) {
      const brand = await brandRepo.findOne({
        where: { name: ILike(data.brand), deleted: false },
      });
      if(!brand){
        throw new AppError(404, `Brand ${data.brand} not found`);
      }
      brandEntity = brand;
    }

    if (data.type) {
     const type  = await typeRepo.findOne({
        where: { name: ILike(data.type), deleted: false },
      });

      if(!type){
        throw new AppError(404, `Type ${data.type} not found`);
      }
      typeEntity = type;
    }

    const material = repo.create({
      name: data.name,
      code: data.code,
      materialBrand: brandEntity,
      materialType: typeEntity,
      size: data.size,
      uom: data.uom,
      pressure: data.pressure,
      hsn: data.hsn,
      gst: data.gst,
      purchase_price: data.purchase_price
        ? Number(data.purchase_price)
        : undefined,
      sales_price: data.sales_price ? Number(data.sales_price) : undefined,
      sales_description: data.sales_description,
      purchase_description: data.purchase_description,
      alias: data.alias,
      quantity: data.quantity ?? 0,
      photos: [],
    });

    const saved = await repo.save(material);
    savedMaterials.push(saved);
  }

  return { total: savedMaterials.length, materials: savedMaterials };
};

  return {
    createMaterial,
    updateMaterialAvailability,
    getAllMaterials,
    getMaterialsForExport,
    getMaterialById,
    updateMaterial,
    softDeleteMaterial,
    exportMaterialsToExcel,
    generateMaterialTemplate,
    uploadMaterialsFromExcelService,
  };
};
