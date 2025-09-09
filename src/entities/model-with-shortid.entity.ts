import { Column, BeforeInsert, Index } from "typeorm";
import Model from "./model.entity";
import { AppDataSource } from "../utils/data-source";

export abstract class ModelWithShortId extends Model {
  @Index("idx_short_id")
  @Column({ type: "varchar", length: 30, nullable: true })
  shortId: string;

  // Child entity must set this prefix
  protected abstract prefix: string;

  @BeforeInsert()
  async generateShortId(): Promise<void> {
    if (!this.prefix) {
      throw new Error("Prefix is not defined for this entity.");
    }

    // Save entity class in a variable
    const entityClass = this.constructor as typeof ModelWithShortId;

    await AppDataSource.manager.transaction(async (manager) => {
      const repo = manager.getRepository<ModelWithShortId>(entityClass);

      const lastRecord = await repo
        .createQueryBuilder("entity")
        .withDeleted()
        .setLock("pessimistic_write") // FOR UPDATE
        .where("entity.shortId LIKE :prefix", { prefix: `${this.prefix}%` })
        .orderBy("entity.shortId", "DESC")
        .getOne();

      let nextNumber = 1;

      if (lastRecord?.shortId) {
        const lastNumber = parseInt(lastRecord.shortId.split(this.prefix)[1], 10);
        nextNumber = lastNumber + 1;
      }

      const paddedNumber = String(nextNumber).padStart(4, "0");

      this.shortId = `${this.prefix}${paddedNumber}`;
    });
  }
}