import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { AuthorizationType, RestApi } from "aws-cdk-lib/aws-apigateway";
import { ApiLambda } from "../constructs/api-lambda";
import { TABLE_NAME } from "../../common/env";
import { Table } from "aws-cdk-lib/aws-dynamodb";

export interface ServerlessFinanceApiStackProps extends cdk.StackProps {
  databaseTable: Table;
}

export class ServerlessFinanceApiStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props?: ServerlessFinanceApiStackProps
  ) {
    super(scope, id, props);

    // create rest api
    const restApi = new RestApi(this, "serverless-finance", {
      restApiName: "serverless-finance",
    });

    const accountLambda = new ApiLambda(this, "AccountCRUD", {
      lambda: "crud-accounts",
      name: "crud-accounts",
      memory: 256,
      env: {
        [TABLE_NAME]: props?.databaseTable.tableName,
      },
    });
    // set permissions for lambda
    props?.databaseTable.grantReadWriteData(accountLambda.lambda);

    const accountsEndpoint = restApi.root.addResource("accounts");
    accountsEndpoint.addMethod("POST", accountLambda.lambdaIntegration, {
      apiKeyRequired: false,
      authorizationType: AuthorizationType.NONE,
    });
  }
}
