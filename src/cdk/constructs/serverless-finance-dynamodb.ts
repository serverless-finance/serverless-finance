import { Construct } from "constructs";
import { AttributeType, BillingMode, ProjectionType, Table } from "aws-cdk-lib/aws-dynamodb";
import { RemovalPolicy } from "aws-cdk-lib";
import { Config } from "../config";
import { DatabaseField, GSI } from "../../common/dynamodb/types";

export interface ServerlessFinanceDatabaseProps {
  tableName: string;
}

export class ServerlessFinanceDatabase extends Construct {
  public readonly table: Table;

  constructor(scope: Construct, id: string, props: ServerlessFinanceDatabaseProps) {
    super(scope, id);

    const config = new Config();

    // create ddb table
    this.table = new Table(this, "ServerlessFinanceDatabase", {
      tableName: props.tableName,
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: config.env == "dev" ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,

      partitionKey: {
        name: DatabaseField.PK,
        type: AttributeType.STRING,
      },
      sortKey: {
        name: DatabaseField.SK,
        type: AttributeType.STRING,
      },
    });

    this.table.addGlobalSecondaryIndex({
      indexName: GSI.ByType,
      partitionKey: {
        name: DatabaseField.Type,
        type: AttributeType.STRING,
      },
      sortKey: {
        name: DatabaseField.PK,
        type: AttributeType.STRING,
      },
      projectionType: ProjectionType.ALL,
    });
  }
}
