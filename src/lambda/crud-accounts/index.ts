import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { arrayResponse, errorResponse, objectResponse } from "../common/api";
import { TABLE_NAME } from "../../common/env";
import { AccountMutable, AccountORM } from "../common/orm/account-orm";
import { NotFoundError, ORMError } from "../common/orm/errors";
import { Logger } from "@aws-lambda-powertools/logger";
import {
  extractDataFromEnvelope,
  API_GATEWAY_REST,
} from "@aws-lambda-powertools/jmespath/envelopes";

const logger = new Logger();

async function createAccountHandler(
  orm: AccountORM,
  body: AccountMutable
): Promise<APIGatewayProxyResult> {
  try {
    const createdAccount = await orm.create(body);

    logger.debug(`created new account ${createdAccount.id}`, {
      data: createdAccount,
    });
    return objectResponse(201, createdAccount);
  } catch (error) {
    logger.error("failed to create account", error as Error);
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
    logger.error("failed to list accounts", error as Error);
    return errorResponse(500, "failed to list accounts", [error as ORMError]);
  }
}

async function deleteAccountHandler(
  orm: AccountORM,
  id: string
): Promise<APIGatewayProxyResult> {
  try {
    const deletedAccount = await orm.delete(id);

    logger.debug(`deleted account ${id}`, { data: deletedAccount });

    return objectResponse(200, deletedAccount);
  } catch (error) {
    logger.error(`failed to delete account ${id}`, error as Error);

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

    logger.debug(`deleted account ${id}`, { data: updatedAccount });

    return objectResponse(200, updatedAccount);
  } catch (error) {
    logger.error(`failed to update account ${id}`, error as Error);

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
    throw new Error(`${TABLE_NAME} environment variable does not exist`);
  }

  logger.debug(`using dynamodb table ${process.env[TABLE_NAME]}`);

  const accountORM = new AccountORM(process.env[TABLE_NAME]!);

  logger.debug("event body", { data: event.body });
  logger.debug("event path params", { data: event.pathParameters });

  switch (event.httpMethod) {
    case "POST":
      // create account
      const data = extractDataFromEnvelope<AccountMutable>(
        event,
        API_GATEWAY_REST
      );
      return await createAccountHandler(accountORM, data);
    case "PUT":
      // update account
      const update = extractDataFromEnvelope<AccountMutable>(
        event,
        API_GATEWAY_REST
      );
      return updateAccountsHandler(
        accountORM,
        event.pathParameters!.id!,
        update
      );
    case "DELETE":
      // delete account
      return deleteAccountHandler(accountORM, event.pathParameters!.id!);
    case "GET":
      // get accounts
      return listAccountHandler(accountORM);
    default:
      logger.error("method did not match");

      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          msg: `Invalid request type ${event.httpMethod}`,
        }),
      };
  }
};
