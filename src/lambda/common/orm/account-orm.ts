import { ConditionalCheckFailedException, DynamoDBClient, ReturnValue } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DeleteCommandInput,
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandInput,
  PutCommand,
  PutCommandInput,
  QueryCommand,
  QueryCommandInput,
  UpdateCommand,
  UpdateCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { DatabaseField, DatabaseObject, GSI } from "../../../common/dynamodb/types";
import { NotFoundError, ORMError } from "./errors";
import { generateId } from "../../../common/id";

interface AccountMutable {
  name?: string;
  data?: object;
}

interface Account extends AccountMutable {
  id: string;
  createdAt: Date;
  balance: number;
}

// mapping of account properties to dynamodb fields
const AccountFieldMapping = {
  name: DatabaseField.AccountName,
  createdAt: DatabaseField.CreatedAt,
  data: DatabaseField.Data,
};

class AccountORM {
  table: string;
  documentClient: DynamoDBDocumentClient;

  constructor(table: string) {
    this.table = table;

    const ddbClient = new DynamoDBClient();
    this.documentClient = DynamoDBDocumentClient.from(ddbClient);
  }

  ddbItemToAccount(item: Record<string, any>): Account {
    return {
      id: item[DatabaseField.PK],
      name: item[DatabaseField.AccountName],
      createdAt: item[DatabaseField.CreatedAt],
      balance: item[DatabaseField.AccountBalance],
      data: item[DatabaseField.Data],
    };
  }

  public async getOne(id: string): Promise<Account> {
    const getParams: GetCommandInput = {
      TableName: this.table,
      Key: {
        [DatabaseField.PK]: `${DatabaseObject.Account}#${id}`,
        [DatabaseField.SK]: `${DatabaseObject.Account}#${id}`,
      },
    };

    try {
      const result = await this.documentClient.send(new GetCommand(getParams));

      if (!result.Item) {
        return Promise.reject(new NotFoundError(DatabaseObject.Account, id));
      }

      return this.ddbItemToAccount(result.Item);
    } catch (error) {
      return Promise.reject(new ORMError(DatabaseObject.Account, "error while getting account", error));
    }
  }

  public async getAll(): Promise<Account[]> {
    const queryParams: QueryCommandInput = {
      TableName: this.table,
      IndexName: GSI.ByType,
      KeyConditionExpression: `${DatabaseField.Type} = :type`,
      ExpressionAttributeValues: {
        ":type": DatabaseObject.Account,
      },
    };

    try {
      const result = await this.documentClient.send(new QueryCommand(queryParams));

      if (!result.Items) {
        // not items returned
        return [];
      }

      return result.Items.map((r) => this.ddbItemToAccount(r));
    } catch (error) {
      return Promise.reject(new ORMError(DatabaseObject.Account, "error while getting account", error));
    }
  }

  public async create(data: AccountMutable): Promise<Account> {
    // create new id
    const accountId = generateId();
    const createdAt = new Date();

    const putParams: PutCommandInput = {
      TableName: this.table,
      Item: {
        [DatabaseField.PK]: `${DatabaseObject.Account}#${accountId}`,
        [DatabaseField.SK]: `${DatabaseObject.Account}#${accountId}`,
        [DatabaseField.CreatedAt]: createdAt.toISOString(),
        [DatabaseField.Type]: DatabaseObject.Account,
        [DatabaseField.AccountName]: data.name,
        [DatabaseField.Data]: data.data,
        [DatabaseField.AccountBalance]: 0.0,
      },
    };

    try {
      await this.documentClient.send(new PutCommand(putParams));

      return {
        id: accountId,
        name: data.name,
        createdAt: createdAt,
        data: data.data,
        balance: 0.0,
      };
    } catch (error) {
      return Promise.reject(new ORMError(DatabaseObject.Account, "error while creating account", error));
    }
  }

  public async delete(id: string): Promise<Account> {
    const deleteParams: DeleteCommandInput = {
      TableName: this.table,
      Key: {
        [DatabaseField.PK]: `${DatabaseObject.Account}#${id}`,
        [DatabaseField.SK]: `${DatabaseObject.Account}#${id}`,
      },
      ConditionExpression: `attribute_exists(${DatabaseField.PK})`,
      ReturnValues: ReturnValue.ALL_OLD,
    };

    try {
      const result = await this.documentClient.send(new DeleteCommand(deleteParams));

      if (!result.Attributes) {
        return Promise.reject(new ORMError(DatabaseObject.Account, `error while deleting account ${id}`));
      }

      return this.ddbItemToAccount(result.Attributes);
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        // account with id does not exist
        return Promise.reject(new NotFoundError(DatabaseObject.Account, id));
      }

      return Promise.reject(new ORMError(DatabaseObject.Account, `error while deleting account ${id}`, error));
    }
  }

  public async put(id: string, data: AccountMutable): Promise<Account> {
    // build update expression
    const updateExpressionComponents = [];
    const expressionValues: Record<string, any> = {};

    for (const field of Object.keys(data)) {
      updateExpressionComponents.push(`${AccountFieldMapping[field as keyof AccountMutable]} = :${field}`);

      expressionValues[`:${field}`] = data[field as keyof AccountMutable];
    }

    const updateParams: UpdateCommandInput = {
      TableName: this.table,
      Key: {
        [DatabaseField.PK]: `${DatabaseObject.Account}#${id}`,
        [DatabaseField.SK]: `${DatabaseObject.Account}#${id}`,
      },
      UpdateExpression: `set ${updateExpressionComponents.join(", ")}`,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: "ALL_NEW",
    };

    try {
      const result = await this.documentClient.send(new UpdateCommand(updateParams));

      if (!result.Attributes) {
        return Promise.reject(new ORMError(DatabaseObject.Account, `error while updating account ${id}`));
      }

      return this.ddbItemToAccount(result.Attributes);
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        // account with id does not exist
        return Promise.reject(new NotFoundError(DatabaseObject.Account, id));
      }

      return Promise.reject(new ORMError(DatabaseObject.Account, `error while updating account ${id}`, error));
    }
  }
}

export { Account, AccountMutable, AccountORM };
