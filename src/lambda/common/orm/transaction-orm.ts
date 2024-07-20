import { DatabaseCommonType, ORMBase } from "./orm-base";
import { DatabaseField, DatabaseObject } from "../../../common/dynamodb/types";

interface TransactionMutable {
  title?: string;
  data?: object;
  volume?: number;
  timestamp?: Date;
}

interface Transaction extends TransactionMutable, DatabaseCommonType {}

class TransactionORM extends ORMBase<TransactionMutable, Transaction> {
  constructor(table: string) {
    super({
      databaseFieldMapping: {
        title: DatabaseField.TransactionTitle,
        data: DatabaseField.Data,
        volume: DatabaseField.TransactionVolume,
        timestamp: DatabaseField.TransactionTimestamp,
      },
      tableName: table,
      typeName: DatabaseObject.Transaction,
    });
  }

  parseDatabaseItem(item: Record<string, any>): Transaction {
    return {
      id: item[DatabaseField.PK],
      createdAt: item[DatabaseField.CreatedAt],
      title: item[DatabaseField.TransactionTitle],
      data: item[DatabaseField.Data],
      timestamp: item[DatabaseField.TransactionTimestamp],
      volume: item[DatabaseField.TransactionVolume],
    };
  }
}

export { TransactionORM, Transaction, TransactionMutable };
