import { DatabaseCommonType, ORMBase } from "./orm-base";
import { DatabaseField, DatabaseObject } from "../../../common/dynamodb/types";

interface AccountMutable {
  name?: string;
  data?: object;
  balance?: number;
}

interface Account extends AccountMutable, DatabaseCommonType {}

class AccountORM extends ORMBase<AccountMutable, Account> {
  constructor(table: string) {
    super({
      tableName: table,
      typeName: DatabaseObject.Account,
      databaseFieldMapping: {
        name: DatabaseField.AccountName,
        data: DatabaseField.Data,
        balance: DatabaseField.AccountBalance,
      },
    });
  }

  parseDatabaseItem(item: Record<string, any>): Account {
    return {
      id: item[DatabaseField.PK],
      createdAt: item[DatabaseField.CreatedAt],
      name: item[DatabaseField.AccountName],
      data: item[DatabaseField.Data],
      balance: item[DatabaseField.AccountBalance],
    };
  }
}

export { Account, AccountMutable, AccountORM };
