import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { errorResponse, objectResponse } from "../common/api";
import { DatabaseField, DatabaseObject } from "../../common/dynamodb/types";
import generateId from "../../common/id";
import { DynamoDB } from "aws-sdk";
import { TABLE_NAME } from "../../common/env";
import { DocumentClient } from "aws-sdk/lib/dynamodb/document_client";
import PutItemInput = DocumentClient.PutItemInput;

interface CreateAccountBody {
  name: string;
}

const documentClient = new DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
});

async function createAccount(
  body: CreateAccountBody
): Promise<APIGatewayProxyResult> {
  // create new id
  const accountId = generateId();
  const createdAt = new Date().toISOString();

  const insertParams: PutItemInput = {
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
    await documentClient.put(insertParams).promise();
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
// function listAccount(): APIGatewayProxyResult {
//   return arrayResponse(0, []);
// }
// function deleteAccount(body: object): APIGatewayProxyResult {}

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
    // return deleteAccount(JSON.parse(event.body!));
    case "GET":
    // get account
    // return listAccount();
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
