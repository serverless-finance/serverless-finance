import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { arrayResponse, errorResponse, objectResponse } from "../common/api";
import {
  DatabaseField,
  DatabaseObject,
  GSI,
} from "../../common/dynamodb/types";
import { generateId } from "../../common/id";
import { TABLE_NAME } from "../../common/env";
import {
  ConditionalCheckFailedException,
  DynamoDBClient,
  ReturnValue,
} from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DeleteCommandInput,
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandInput,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";

interface CreateAccountBody {
  name: string;
}

const ddbClient = new DynamoDBClient();
const documentClient = DynamoDBDocumentClient.from(ddbClient);

function ddbItemToAccount(item: Record<string, any>): Account {
  return {
    id: item[DatabaseField.PK],
    name: item[DatabaseField.AccountName],
    createdAt: item[DatabaseField.CreatedAt],
    data: item[DatabaseField.Data],
  };
}

async function createAccount(
  body: CreateAccountBody
): Promise<APIGatewayProxyResult> {
  // create new id
  const accountId = generateId();
  const createdAt = new Date().toISOString();

  const insertParams: PutCommandInput = {
    TableName: process.env[TABLE_NAME]!,
    Item: {
      [DatabaseField.PK]: `${DatabaseObject.Account}#${accountId}`,
      [DatabaseField.SK]: `${DatabaseObject.Account}#${accountId}`,
      [DatabaseField.CreatedAt]: createdAt,
      [DatabaseField.Type]: DatabaseObject.Account,
      [DatabaseField.AccountName]: body.name,
      [DatabaseField.AccountBalance]: 0.0,
    },
  };

  try {
    await documentClient.send(new PutCommand(insertParams));
    return objectResponse(201, {
      id: accountId,
      name: body.name,
      createdAt,
      balance: 0.0,
    });
  } catch (error) {
    console.error(error);
    return errorResponse(500, "failed to create account", []);
  }
}

// function updateAccount(body: object): APIGatewayProxyResult {}
async function listAccount(): Promise<APIGatewayProxyResult> {
  const queryParams: QueryCommandInput = {
    TableName: process.env[TABLE_NAME]!,
    IndexName: GSI.ByType,
    KeyConditionExpression: `${DatabaseField.Type} = :typeVal`,
    ExpressionAttributeValues: {
      ":typeVal": DatabaseObject.Account,
    },
  };

  const result = await documentClient.send(new QueryCommand(queryParams));

  const accounts: Account[] = [];
  for (const account of result.Items!) {
    accounts.push(ddbItemToAccount(account));
  }

  return arrayResponse(200, accounts);
}

async function deleteAccount(id: string): Promise<APIGatewayProxyResult> {
  const deleteParams: DeleteCommandInput = {
    TableName: process.env[TABLE_NAME]!,
    Key: {
      [DatabaseField.PK]: `${DatabaseObject.Account}#${id}`,
      [DatabaseField.SK]: `${DatabaseObject.Account}#${id}`,
    },
    ConditionExpression: `attribute_exists(${DatabaseField.PK})`,
    ReturnValues: ReturnValue.ALL_OLD,
  };

  try {
    const data = await documentClient.send(new DeleteCommand(deleteParams));
    return objectResponse(200, ddbItemToAccount(data.Attributes!));
  } catch (error) {
    if (error instanceof ConditionalCheckFailedException) {
      return errorResponse(404, `account with id ${id} not found.`, []);
    }
    return errorResponse(500, `${error}`, []);
  }
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod in ["POST", "PUT", "DELETE"] && !event.body) {
    throw new Error("Empty event body");
  }

  if (!process.env[TABLE_NAME]) {
    throw new Error(`${TABLE_NAME} environment variable doesn't exist`);
  }

  switch (event.httpMethod) {
    case "POST":
      // create account
      return await createAccount(JSON.parse(event.body!));
    case "PUT":
    // update account
    // return updateAccount(JSON.parse(event.body!));
    case "DELETE":
      // delete account
      return deleteAccount(event.pathParameters!.id!);
    case "GET":
      // get accounts
      return listAccount();
    default:
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          msg: `Invalid request type ${event.httpMethod}`,
        }),
      };
  }
};
