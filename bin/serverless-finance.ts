#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ServerlessFinanceApiStack } from "../lib/serverless-finance-api-stack";
import { Config } from "./config";
import { Tags } from "aws-cdk-lib";
import { ServerlessFinanceResourcesStack } from "../lib/serverless-finance-resources-stack";

const config = new Config();

const app = new cdk.App();

// setup resources
new ServerlessFinanceResourcesStack(app, "ServerlessFinanceResources");

// setup backend
new ServerlessFinanceApiStack(app, "ServerlessFinanceApi", {
  env: {
    region: config.region,
  },
});

// add default tags to app
Tags.of(app).add("iac", "cdk");
Tags.of(app).add("project", "serverless-finance");
Tags.of(app).add("environment", config.env);
Tags.of(app).add("owner", config.owner);
Tags.of(app).add("cost-center", config.costCenter);
