import { APIGatewayProxyResult } from "aws-lambda";

function objectResponse(code: number, data: object): APIGatewayProxyResult {
  return {
    statusCode: code,
    body: JSON.stringify({
      data: data,
    }),
  };
}

function formatError(error: Error) {
  return {
    message: error.message,
  };
}

/**
 * create paginated data for API response.
 * @param startIndex start index of paginated data
 * @param totalItems total items in paginated data
 * @param data paginated data to be sent in API response.
 * @returns paginated data object.
 * @example
 * createPaginatedData(request, 1, 10, [{ id: 1 }])
 */
function createPaginatedData(startIndex: number, totalItems: number, data: object[]) {
  return {
    apiVersion: 1,
    data: {
      currentItemCount: data.length,
      startIndex,
      totalItems,
      items: data,
    },
  };
}

function errorResponse(code: number, message: string, errors: Error[]): APIGatewayProxyResult {
  const errorObjects = [];
  if (errors.length > 0) {
    // format errors to object
    for (const e of errors) {
      errorObjects.push(formatError(e));
    }
  }

  return {
    statusCode: code,
    body: JSON.stringify({
      error: {
        code: code,
        message: message,
        errors: errorObjects,
      },
    }),
  };
}

function paginatedArrayResponse(
  code: number,
  startIndex: number,
  totalItems: number,
  data: object[]
): APIGatewayProxyResult {
  return {
    statusCode: code,
    body: JSON.stringify({
      data: {
        currentItemCount: data.length,
        startIndex,
        totalItems,
        items: data,
      },
    }),
  };
}

function arrayResponse(code: number, data: object[]): APIGatewayProxyResult {
  return {
    statusCode: code,
    body: JSON.stringify({
      data: {
        currentItemCount: data.length,
        startIndex: 0,
        totalItems: data.length,
        items: data,
      },
    }),
  };
}

export { objectResponse, errorResponse, paginatedArrayResponse, arrayResponse };
