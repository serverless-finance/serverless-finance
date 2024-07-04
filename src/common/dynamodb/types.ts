enum DatabaseObject {
  Account = "account",
  Transaction = "transaction",
}

enum DatabaseField {
  PK = "PK",
  SK = "SK",
  CreatedAt = "CreatedAt",
  Type = "ObjectType",
  AccountName = "AccountName",
  AccountBalance = "AccountBalance",
  Data = "Data",
  TransactionTimestamp = "TransactionTimestamp",
  TransactionVolume = "TransactionVolume",
}

enum GSI {
  ByType = "ByType",
}

export { DatabaseField, DatabaseObject, GSI };
