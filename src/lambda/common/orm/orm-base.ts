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
import { ConditionalCheckFailedException, DynamoDBClient, ReturnValue } from "@aws-sdk/client-dynamodb";
import { DatabaseField, DatabaseObject, GSI } from "../../../common/dynamodb/types";
import { NotFoundError, ORMError } from "./errors";
import { generateId } from "../../../common/id";

interface DatabaseCommonType {
  id: string;
  createdAt: Date;
}

interface ORMProps {
  tableName: string;
  typeName: DatabaseObject;
  databaseFieldMapping: Record<string, any>;
}

abstract class ORMBase<MutableFields extends {}, Datatype extends DatabaseCommonType & MutableFields> {
  typeFieldMapping: Record<string, any>;
  table: string;
  type: string;
  documentClient: DynamoDBDocumentClient;

  protected constructor(props: ORMProps) {
    this.typeFieldMapping = props.databaseFieldMapping;
    this.table = props.tableName;
    this.type = props.typeName;

    const ddbClient = new DynamoDBClient();
    this.documentClient = DynamoDBDocumentClient.from(ddbClient);
  }

  abstract parseDatabaseItem(item: Record<string, any>): Datatype;

  public async getOne(id: string): Promise<Datatype> {
    const getParams: GetCommandInput = {
      TableName: this.table,
      Key: {
        [DatabaseField.PK]: `${this.type}#${id}`,
        [DatabaseField.SK]: `${this.type}#${id}`,
      },
    };

    try {
      const result = await this.documentClient.send(new GetCommand(getParams));

      if (!result.Item) {
        return Promise.reject(new NotFoundError(this.type, id));
      }

      return this.parseDatabaseItem(result.Item);
    } catch (error) {
      return Promise.reject(new ORMError(this.type, `error while getting ${this.type}`, error));
    }
  }

  public async getAll(): Promise<Datatype[]> {
    const queryParams: QueryCommandInput = {
      TableName: this.table,
      IndexName: GSI.ByType,
      KeyConditionExpression: `${DatabaseField.Type} = :type`,
      ExpressionAttributeValues: {
        ":type": this.type,
      },
    };

    try {
      const result = await this.documentClient.send(new QueryCommand(queryParams));

      if (!result.Items) {
        // not items returned
        return [];
      }

      return result.Items.map((r) => this.parseDatabaseItem(r));
    } catch (error) {
      return Promise.reject(new ORMError(this.type, `error while getting ${this.type}`, error));
    }
  }

  public async create(data: MutableFields, defaultValues?: MutableFields): Promise<Datatype> {
    // create new id
    const id = generateId();
    const createdAt = new Date();

    // basic fields every item has
    const itemToCreate = {
      [DatabaseField.PK]: `${this.type}#${id}`,
      [DatabaseField.SK]: `${this.type}#${id}`,
      [DatabaseField.CreatedAt]: createdAt.toISOString(),
      [DatabaseField.Type]: this.type,
    };

    // add default properties
    if (defaultValues) {
      for (const key of Object.keys(defaultValues)) {
        const mappingKey = this.typeFieldMapping[key];
        Object.assign(itemToCreate, {
          [mappingKey]: defaultValues[key as keyof typeof defaultValues],
        });
      }
    }

    // add type specific properties
    for (const key of Object.keys(data)) {
      const mappingKey = this.typeFieldMapping[key];
      Object.assign(itemToCreate, {
        [mappingKey]: data[key as keyof typeof data],
      });
    }

    const putParams: PutCommandInput = {
      TableName: this.table,
      Item: itemToCreate,
    };

    try {
      await this.documentClient.send(new PutCommand(putParams));

      // workaround as there is no way to return the created item from ddb client
      return await this.getOne(id);
    } catch (error) {
      return Promise.reject(new ORMError(DatabaseObject.Account, "error while creating account", error));
    }
  }

  public async put(id: string, data: MutableFields): Promise<Datatype> {
    // build update expression
    const updateExpressionComponents = [];
    const expressionValues: Record<string, any> = {};

    for (const field of Object.keys(data)) {
      updateExpressionComponents.push(
        `${this.typeFieldMapping[field as keyof typeof this.typeFieldMapping]} = :${field}`
      );

      expressionValues[`:${field}`] = data[field as keyof typeof data];
    }

    const updateParams: UpdateCommandInput = {
      TableName: this.table,
      Key: {
        [DatabaseField.PK]: `${this.type}#${id}`,
        [DatabaseField.SK]: `${this.type}#${id}`,
      },
      UpdateExpression: `set ${updateExpressionComponents.join(", ")}`,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: "ALL_NEW",
    };

    try {
      const result = await this.documentClient.send(new UpdateCommand(updateParams));

      if (!result.Attributes) {
        return Promise.reject(new ORMError(DatabaseObject.Account, `error while updating ${this.type} ${id}`));
      }

      return this.parseDatabaseItem(result.Attributes);
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        // account with id does not exist
        return Promise.reject(new NotFoundError(this.type, id));
      }

      return Promise.reject(new ORMError(this.type, `error while updating ${this.type} ${id}`, error));
    }
  }

  public async delete(id: string): Promise<Datatype> {
    const deleteParams: DeleteCommandInput = {
      TableName: this.table,
      Key: {
        [DatabaseField.PK]: `${this.type}#${id}`,
        [DatabaseField.SK]: `${this.type}#${id}`,
      },
      ConditionExpression: `attribute_exists(${DatabaseField.PK})`,
      ReturnValues: ReturnValue.ALL_OLD,
    };

    try {
      const result = await this.documentClient.send(new DeleteCommand(deleteParams));

      if (!result.Attributes) {
        return Promise.reject(new ORMError(this.type, `error while deleting ${this.type} ${id}`));
      }

      return this.parseDatabaseItem(result.Attributes);
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        // account with id does not exist
        return Promise.reject(new NotFoundError(this.type, id));
      }

      return Promise.reject(new ORMError(this.type, `error while deleting ${this.type} ${id}`, error));
    }
  }
}

export { DatabaseCommonType, ORMBase };
