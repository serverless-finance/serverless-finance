import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { arrayResponse, errorResponse, objectResponse } from "../common/api";
import { TABLE_NAME } from "../../common/env";
import { AccountMutable, AccountORM } from "../common/orm/account-orm";
import { NotFoundError, ORMError } from "../common/orm/errors";

async function createAccountHandler(
  orm: AccountORM,
  body: AccountMutable
): Promise<APIGatewayProxyResult> {
  try {
    const createdAccount = await orm.create(body);
    return objectResponse(201, createdAccount);
  } catch (error) {
    console.error(error);
    return errorResponse(500, "failed to create account", [error as ORMError]);
  }
}

// function updateAccount(body: object): APIGatewayProxyResult {}
async function listAccountHandler(
  orm: AccountORM
): Promise<APIGatewayProxyResult> {
  try {
    const accounts = await orm.getAll();
    return arrayResponse(200, accounts);
  } catch (error) {
    console.error(error);
    return errorResponse(500, "failed to list accounts", [error as ORMError]);
  }
}

async function deleteAccountHandler(
  orm: AccountORM,
  id: string
): Promise<APIGatewayProxyResult> {
  try {
    const deletedAccount = await orm.delete(id);
    return objectResponse(200, deletedAccount);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return errorResponse(404, `account with id ${id} not found.`, [error]);
    }
    return errorResponse(500, `${error}`, [error as ORMError]);
  }
}

async function updateAccountsHandler(
  orm: AccountORM,
  id: string,
  update: AccountMutable
): Promise<APIGatewayProxyResult> {
  try {
    const updatedAccount = await orm.put(id, update);
    return objectResponse(200, updatedAccount);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return errorResponse(404, `account with id ${id} not found.`, [error]);
    }
    return errorResponse(500, `${error}`, [error as ORMError]);
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

  const accountORM = new AccountORM(process.env[TABLE_NAME]!);

  switch (event.httpMethod) {
    case "POST":
      // create account
      return await createAccountHandler(accountORM, JSON.parse(event.body!));
    case "PUT":
      // update account
      return updateAccountsHandler(
        accountORM,
        event.pathParameters!.id!,
        JSON.parse(event.body!)
      );
    case "DELETE":
      // delete account
      return deleteAccountHandler(accountORM, event.pathParameters!.id!);
    case "GET":
      // get accounts
      return listAccountHandler(accountORM);
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
