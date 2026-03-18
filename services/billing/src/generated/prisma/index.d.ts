
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Invoice
 * 
 */
export type Invoice = $Result.DefaultSelection<Prisma.$InvoicePayload>
/**
 * Model Payment
 * 
 */
export type Payment = $Result.DefaultSelection<Prisma.$PaymentPayload>
/**
 * Model InvoiceInstallment
 * 
 */
export type InvoiceInstallment = $Result.DefaultSelection<Prisma.$InvoiceInstallmentPayload>
/**
 * Model Expense
 * 
 */
export type Expense = $Result.DefaultSelection<Prisma.$ExpensePayload>
/**
 * Model ExpenseBudget
 * 
 */
export type ExpenseBudget = $Result.DefaultSelection<Prisma.$ExpenseBudgetPayload>
/**
 * Model LoyaltyAccount
 * 
 */
export type LoyaltyAccount = $Result.DefaultSelection<Prisma.$LoyaltyAccountPayload>
/**
 * Model CreditTransaction
 * 
 */
export type CreditTransaction = $Result.DefaultSelection<Prisma.$CreditTransactionPayload>
/**
 * Model Vendor
 * 
 */
export type Vendor = $Result.DefaultSelection<Prisma.$VendorPayload>
/**
 * Model VendorContract
 * 
 */
export type VendorContract = $Result.DefaultSelection<Prisma.$VendorContractPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const InvoiceStatus: {
  DRAFT: 'DRAFT',
  ISSUED: 'ISSUED',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  VOID: 'VOID'
};

export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus]


export const PaymentStatus: {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
};

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus]

}

export type InvoiceStatus = $Enums.InvoiceStatus

export const InvoiceStatus: typeof $Enums.InvoiceStatus

export type PaymentStatus = $Enums.PaymentStatus

export const PaymentStatus: typeof $Enums.PaymentStatus

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Invoices
 * const invoices = await prisma.invoice.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Invoices
   * const invoices = await prisma.invoice.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.invoice`: Exposes CRUD operations for the **Invoice** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Invoices
    * const invoices = await prisma.invoice.findMany()
    * ```
    */
  get invoice(): Prisma.InvoiceDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.payment`: Exposes CRUD operations for the **Payment** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Payments
    * const payments = await prisma.payment.findMany()
    * ```
    */
  get payment(): Prisma.PaymentDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.invoiceInstallment`: Exposes CRUD operations for the **InvoiceInstallment** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more InvoiceInstallments
    * const invoiceInstallments = await prisma.invoiceInstallment.findMany()
    * ```
    */
  get invoiceInstallment(): Prisma.InvoiceInstallmentDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.expense`: Exposes CRUD operations for the **Expense** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Expenses
    * const expenses = await prisma.expense.findMany()
    * ```
    */
  get expense(): Prisma.ExpenseDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.expenseBudget`: Exposes CRUD operations for the **ExpenseBudget** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ExpenseBudgets
    * const expenseBudgets = await prisma.expenseBudget.findMany()
    * ```
    */
  get expenseBudget(): Prisma.ExpenseBudgetDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.loyaltyAccount`: Exposes CRUD operations for the **LoyaltyAccount** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more LoyaltyAccounts
    * const loyaltyAccounts = await prisma.loyaltyAccount.findMany()
    * ```
    */
  get loyaltyAccount(): Prisma.LoyaltyAccountDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.creditTransaction`: Exposes CRUD operations for the **CreditTransaction** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CreditTransactions
    * const creditTransactions = await prisma.creditTransaction.findMany()
    * ```
    */
  get creditTransaction(): Prisma.CreditTransactionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.vendor`: Exposes CRUD operations for the **Vendor** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Vendors
    * const vendors = await prisma.vendor.findMany()
    * ```
    */
  get vendor(): Prisma.VendorDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.vendorContract`: Exposes CRUD operations for the **VendorContract** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more VendorContracts
    * const vendorContracts = await prisma.vendorContract.findMany()
    * ```
    */
  get vendorContract(): Prisma.VendorContractDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.19.2
   * Query Engine version: c2990dca591cba766e3b7ef5d9e8a84796e47ab7
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Invoice: 'Invoice',
    Payment: 'Payment',
    InvoiceInstallment: 'InvoiceInstallment',
    Expense: 'Expense',
    ExpenseBudget: 'ExpenseBudget',
    LoyaltyAccount: 'LoyaltyAccount',
    CreditTransaction: 'CreditTransaction',
    Vendor: 'Vendor',
    VendorContract: 'VendorContract'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "invoice" | "payment" | "invoiceInstallment" | "expense" | "expenseBudget" | "loyaltyAccount" | "creditTransaction" | "vendor" | "vendorContract"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Invoice: {
        payload: Prisma.$InvoicePayload<ExtArgs>
        fields: Prisma.InvoiceFieldRefs
        operations: {
          findUnique: {
            args: Prisma.InvoiceFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.InvoiceFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>
          }
          findFirst: {
            args: Prisma.InvoiceFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.InvoiceFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>
          }
          findMany: {
            args: Prisma.InvoiceFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>[]
          }
          create: {
            args: Prisma.InvoiceCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>
          }
          createMany: {
            args: Prisma.InvoiceCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.InvoiceCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>[]
          }
          delete: {
            args: Prisma.InvoiceDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>
          }
          update: {
            args: Prisma.InvoiceUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>
          }
          deleteMany: {
            args: Prisma.InvoiceDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.InvoiceUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.InvoiceUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>[]
          }
          upsert: {
            args: Prisma.InvoiceUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>
          }
          aggregate: {
            args: Prisma.InvoiceAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateInvoice>
          }
          groupBy: {
            args: Prisma.InvoiceGroupByArgs<ExtArgs>
            result: $Utils.Optional<InvoiceGroupByOutputType>[]
          }
          count: {
            args: Prisma.InvoiceCountArgs<ExtArgs>
            result: $Utils.Optional<InvoiceCountAggregateOutputType> | number
          }
        }
      }
      Payment: {
        payload: Prisma.$PaymentPayload<ExtArgs>
        fields: Prisma.PaymentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PaymentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PaymentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>
          }
          findFirst: {
            args: Prisma.PaymentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PaymentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>
          }
          findMany: {
            args: Prisma.PaymentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>[]
          }
          create: {
            args: Prisma.PaymentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>
          }
          createMany: {
            args: Prisma.PaymentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PaymentCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>[]
          }
          delete: {
            args: Prisma.PaymentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>
          }
          update: {
            args: Prisma.PaymentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>
          }
          deleteMany: {
            args: Prisma.PaymentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PaymentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PaymentUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>[]
          }
          upsert: {
            args: Prisma.PaymentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>
          }
          aggregate: {
            args: Prisma.PaymentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePayment>
          }
          groupBy: {
            args: Prisma.PaymentGroupByArgs<ExtArgs>
            result: $Utils.Optional<PaymentGroupByOutputType>[]
          }
          count: {
            args: Prisma.PaymentCountArgs<ExtArgs>
            result: $Utils.Optional<PaymentCountAggregateOutputType> | number
          }
        }
      }
      InvoiceInstallment: {
        payload: Prisma.$InvoiceInstallmentPayload<ExtArgs>
        fields: Prisma.InvoiceInstallmentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.InvoiceInstallmentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoiceInstallmentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.InvoiceInstallmentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoiceInstallmentPayload>
          }
          findFirst: {
            args: Prisma.InvoiceInstallmentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoiceInstallmentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.InvoiceInstallmentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoiceInstallmentPayload>
          }
          findMany: {
            args: Prisma.InvoiceInstallmentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoiceInstallmentPayload>[]
          }
          create: {
            args: Prisma.InvoiceInstallmentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoiceInstallmentPayload>
          }
          createMany: {
            args: Prisma.InvoiceInstallmentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.InvoiceInstallmentCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoiceInstallmentPayload>[]
          }
          delete: {
            args: Prisma.InvoiceInstallmentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoiceInstallmentPayload>
          }
          update: {
            args: Prisma.InvoiceInstallmentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoiceInstallmentPayload>
          }
          deleteMany: {
            args: Prisma.InvoiceInstallmentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.InvoiceInstallmentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.InvoiceInstallmentUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoiceInstallmentPayload>[]
          }
          upsert: {
            args: Prisma.InvoiceInstallmentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoiceInstallmentPayload>
          }
          aggregate: {
            args: Prisma.InvoiceInstallmentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateInvoiceInstallment>
          }
          groupBy: {
            args: Prisma.InvoiceInstallmentGroupByArgs<ExtArgs>
            result: $Utils.Optional<InvoiceInstallmentGroupByOutputType>[]
          }
          count: {
            args: Prisma.InvoiceInstallmentCountArgs<ExtArgs>
            result: $Utils.Optional<InvoiceInstallmentCountAggregateOutputType> | number
          }
        }
      }
      Expense: {
        payload: Prisma.$ExpensePayload<ExtArgs>
        fields: Prisma.ExpenseFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ExpenseFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExpensePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ExpenseFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExpensePayload>
          }
          findFirst: {
            args: Prisma.ExpenseFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExpensePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ExpenseFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExpensePayload>
          }
          findMany: {
            args: Prisma.ExpenseFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExpensePayload>[]
          }
          create: {
            args: Prisma.ExpenseCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExpensePayload>
          }
          createMany: {
            args: Prisma.ExpenseCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ExpenseCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExpensePayload>[]
          }
          delete: {
            args: Prisma.ExpenseDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExpensePayload>
          }
          update: {
            args: Prisma.ExpenseUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExpensePayload>
          }
          deleteMany: {
            args: Prisma.ExpenseDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ExpenseUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ExpenseUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExpensePayload>[]
          }
          upsert: {
            args: Prisma.ExpenseUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExpensePayload>
          }
          aggregate: {
            args: Prisma.ExpenseAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateExpense>
          }
          groupBy: {
            args: Prisma.ExpenseGroupByArgs<ExtArgs>
            result: $Utils.Optional<ExpenseGroupByOutputType>[]
          }
          count: {
            args: Prisma.ExpenseCountArgs<ExtArgs>
            result: $Utils.Optional<ExpenseCountAggregateOutputType> | number
          }
        }
      }
      ExpenseBudget: {
        payload: Prisma.$ExpenseBudgetPayload<ExtArgs>
        fields: Prisma.ExpenseBudgetFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ExpenseBudgetFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExpenseBudgetPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ExpenseBudgetFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExpenseBudgetPayload>
          }
          findFirst: {
            args: Prisma.ExpenseBudgetFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExpenseBudgetPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ExpenseBudgetFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExpenseBudgetPayload>
          }
          findMany: {
            args: Prisma.ExpenseBudgetFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExpenseBudgetPayload>[]
          }
          create: {
            args: Prisma.ExpenseBudgetCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExpenseBudgetPayload>
          }
          createMany: {
            args: Prisma.ExpenseBudgetCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ExpenseBudgetCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExpenseBudgetPayload>[]
          }
          delete: {
            args: Prisma.ExpenseBudgetDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExpenseBudgetPayload>
          }
          update: {
            args: Prisma.ExpenseBudgetUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExpenseBudgetPayload>
          }
          deleteMany: {
            args: Prisma.ExpenseBudgetDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ExpenseBudgetUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ExpenseBudgetUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExpenseBudgetPayload>[]
          }
          upsert: {
            args: Prisma.ExpenseBudgetUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExpenseBudgetPayload>
          }
          aggregate: {
            args: Prisma.ExpenseBudgetAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateExpenseBudget>
          }
          groupBy: {
            args: Prisma.ExpenseBudgetGroupByArgs<ExtArgs>
            result: $Utils.Optional<ExpenseBudgetGroupByOutputType>[]
          }
          count: {
            args: Prisma.ExpenseBudgetCountArgs<ExtArgs>
            result: $Utils.Optional<ExpenseBudgetCountAggregateOutputType> | number
          }
        }
      }
      LoyaltyAccount: {
        payload: Prisma.$LoyaltyAccountPayload<ExtArgs>
        fields: Prisma.LoyaltyAccountFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LoyaltyAccountFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoyaltyAccountPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LoyaltyAccountFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoyaltyAccountPayload>
          }
          findFirst: {
            args: Prisma.LoyaltyAccountFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoyaltyAccountPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LoyaltyAccountFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoyaltyAccountPayload>
          }
          findMany: {
            args: Prisma.LoyaltyAccountFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoyaltyAccountPayload>[]
          }
          create: {
            args: Prisma.LoyaltyAccountCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoyaltyAccountPayload>
          }
          createMany: {
            args: Prisma.LoyaltyAccountCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LoyaltyAccountCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoyaltyAccountPayload>[]
          }
          delete: {
            args: Prisma.LoyaltyAccountDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoyaltyAccountPayload>
          }
          update: {
            args: Prisma.LoyaltyAccountUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoyaltyAccountPayload>
          }
          deleteMany: {
            args: Prisma.LoyaltyAccountDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LoyaltyAccountUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.LoyaltyAccountUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoyaltyAccountPayload>[]
          }
          upsert: {
            args: Prisma.LoyaltyAccountUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoyaltyAccountPayload>
          }
          aggregate: {
            args: Prisma.LoyaltyAccountAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLoyaltyAccount>
          }
          groupBy: {
            args: Prisma.LoyaltyAccountGroupByArgs<ExtArgs>
            result: $Utils.Optional<LoyaltyAccountGroupByOutputType>[]
          }
          count: {
            args: Prisma.LoyaltyAccountCountArgs<ExtArgs>
            result: $Utils.Optional<LoyaltyAccountCountAggregateOutputType> | number
          }
        }
      }
      CreditTransaction: {
        payload: Prisma.$CreditTransactionPayload<ExtArgs>
        fields: Prisma.CreditTransactionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CreditTransactionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreditTransactionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CreditTransactionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreditTransactionPayload>
          }
          findFirst: {
            args: Prisma.CreditTransactionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreditTransactionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CreditTransactionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreditTransactionPayload>
          }
          findMany: {
            args: Prisma.CreditTransactionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreditTransactionPayload>[]
          }
          create: {
            args: Prisma.CreditTransactionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreditTransactionPayload>
          }
          createMany: {
            args: Prisma.CreditTransactionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CreditTransactionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreditTransactionPayload>[]
          }
          delete: {
            args: Prisma.CreditTransactionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreditTransactionPayload>
          }
          update: {
            args: Prisma.CreditTransactionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreditTransactionPayload>
          }
          deleteMany: {
            args: Prisma.CreditTransactionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CreditTransactionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CreditTransactionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreditTransactionPayload>[]
          }
          upsert: {
            args: Prisma.CreditTransactionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreditTransactionPayload>
          }
          aggregate: {
            args: Prisma.CreditTransactionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCreditTransaction>
          }
          groupBy: {
            args: Prisma.CreditTransactionGroupByArgs<ExtArgs>
            result: $Utils.Optional<CreditTransactionGroupByOutputType>[]
          }
          count: {
            args: Prisma.CreditTransactionCountArgs<ExtArgs>
            result: $Utils.Optional<CreditTransactionCountAggregateOutputType> | number
          }
        }
      }
      Vendor: {
        payload: Prisma.$VendorPayload<ExtArgs>
        fields: Prisma.VendorFieldRefs
        operations: {
          findUnique: {
            args: Prisma.VendorFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VendorPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.VendorFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VendorPayload>
          }
          findFirst: {
            args: Prisma.VendorFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VendorPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.VendorFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VendorPayload>
          }
          findMany: {
            args: Prisma.VendorFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VendorPayload>[]
          }
          create: {
            args: Prisma.VendorCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VendorPayload>
          }
          createMany: {
            args: Prisma.VendorCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.VendorCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VendorPayload>[]
          }
          delete: {
            args: Prisma.VendorDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VendorPayload>
          }
          update: {
            args: Prisma.VendorUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VendorPayload>
          }
          deleteMany: {
            args: Prisma.VendorDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.VendorUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.VendorUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VendorPayload>[]
          }
          upsert: {
            args: Prisma.VendorUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VendorPayload>
          }
          aggregate: {
            args: Prisma.VendorAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateVendor>
          }
          groupBy: {
            args: Prisma.VendorGroupByArgs<ExtArgs>
            result: $Utils.Optional<VendorGroupByOutputType>[]
          }
          count: {
            args: Prisma.VendorCountArgs<ExtArgs>
            result: $Utils.Optional<VendorCountAggregateOutputType> | number
          }
        }
      }
      VendorContract: {
        payload: Prisma.$VendorContractPayload<ExtArgs>
        fields: Prisma.VendorContractFieldRefs
        operations: {
          findUnique: {
            args: Prisma.VendorContractFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VendorContractPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.VendorContractFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VendorContractPayload>
          }
          findFirst: {
            args: Prisma.VendorContractFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VendorContractPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.VendorContractFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VendorContractPayload>
          }
          findMany: {
            args: Prisma.VendorContractFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VendorContractPayload>[]
          }
          create: {
            args: Prisma.VendorContractCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VendorContractPayload>
          }
          createMany: {
            args: Prisma.VendorContractCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.VendorContractCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VendorContractPayload>[]
          }
          delete: {
            args: Prisma.VendorContractDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VendorContractPayload>
          }
          update: {
            args: Prisma.VendorContractUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VendorContractPayload>
          }
          deleteMany: {
            args: Prisma.VendorContractDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.VendorContractUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.VendorContractUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VendorContractPayload>[]
          }
          upsert: {
            args: Prisma.VendorContractUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VendorContractPayload>
          }
          aggregate: {
            args: Prisma.VendorContractAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateVendorContract>
          }
          groupBy: {
            args: Prisma.VendorContractGroupByArgs<ExtArgs>
            result: $Utils.Optional<VendorContractGroupByOutputType>[]
          }
          count: {
            args: Prisma.VendorContractCountArgs<ExtArgs>
            result: $Utils.Optional<VendorContractCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    invoice?: InvoiceOmit
    payment?: PaymentOmit
    invoiceInstallment?: InvoiceInstallmentOmit
    expense?: ExpenseOmit
    expenseBudget?: ExpenseBudgetOmit
    loyaltyAccount?: LoyaltyAccountOmit
    creditTransaction?: CreditTransactionOmit
    vendor?: VendorOmit
    vendorContract?: VendorContractOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type InvoiceCountOutputType
   */

  export type InvoiceCountOutputType = {
    payments: number
    installments: number
  }

  export type InvoiceCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    payments?: boolean | InvoiceCountOutputTypeCountPaymentsArgs
    installments?: boolean | InvoiceCountOutputTypeCountInstallmentsArgs
  }

  // Custom InputTypes
  /**
   * InvoiceCountOutputType without action
   */
  export type InvoiceCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InvoiceCountOutputType
     */
    select?: InvoiceCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * InvoiceCountOutputType without action
   */
  export type InvoiceCountOutputTypeCountPaymentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PaymentWhereInput
  }

  /**
   * InvoiceCountOutputType without action
   */
  export type InvoiceCountOutputTypeCountInstallmentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: InvoiceInstallmentWhereInput
  }


  /**
   * Count Type LoyaltyAccountCountOutputType
   */

  export type LoyaltyAccountCountOutputType = {
    transactions: number
  }

  export type LoyaltyAccountCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    transactions?: boolean | LoyaltyAccountCountOutputTypeCountTransactionsArgs
  }

  // Custom InputTypes
  /**
   * LoyaltyAccountCountOutputType without action
   */
  export type LoyaltyAccountCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoyaltyAccountCountOutputType
     */
    select?: LoyaltyAccountCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * LoyaltyAccountCountOutputType without action
   */
  export type LoyaltyAccountCountOutputTypeCountTransactionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CreditTransactionWhereInput
  }


  /**
   * Count Type VendorCountOutputType
   */

  export type VendorCountOutputType = {
    contracts: number
  }

  export type VendorCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    contracts?: boolean | VendorCountOutputTypeCountContractsArgs
  }

  // Custom InputTypes
  /**
   * VendorCountOutputType without action
   */
  export type VendorCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VendorCountOutputType
     */
    select?: VendorCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * VendorCountOutputType without action
   */
  export type VendorCountOutputTypeCountContractsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VendorContractWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Invoice
   */

  export type AggregateInvoice = {
    _count: InvoiceCountAggregateOutputType | null
    _avg: InvoiceAvgAggregateOutputType | null
    _sum: InvoiceSumAggregateOutputType | null
    _min: InvoiceMinAggregateOutputType | null
    _max: InvoiceMaxAggregateOutputType | null
  }

  export type InvoiceAvgAggregateOutputType = {
    amountCents: number | null
  }

  export type InvoiceSumAggregateOutputType = {
    amountCents: bigint | null
  }

  export type InvoiceMinAggregateOutputType = {
    id: string | null
    clientId: string | null
    projectId: string | null
    number: string | null
    description: string | null
    lineItems: string | null
    billingPeriod: string | null
    costCenter: string | null
    amountCents: bigint | null
    currency: string | null
    status: $Enums.InvoiceStatus | null
    issuedAt: Date | null
    dueAt: Date | null
    paidAt: Date | null
    pdfFileId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type InvoiceMaxAggregateOutputType = {
    id: string | null
    clientId: string | null
    projectId: string | null
    number: string | null
    description: string | null
    lineItems: string | null
    billingPeriod: string | null
    costCenter: string | null
    amountCents: bigint | null
    currency: string | null
    status: $Enums.InvoiceStatus | null
    issuedAt: Date | null
    dueAt: Date | null
    paidAt: Date | null
    pdfFileId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type InvoiceCountAggregateOutputType = {
    id: number
    clientId: number
    projectId: number
    number: number
    description: number
    lineItems: number
    billingPeriod: number
    costCenter: number
    amountCents: number
    currency: number
    status: number
    issuedAt: number
    dueAt: number
    paidAt: number
    pdfFileId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type InvoiceAvgAggregateInputType = {
    amountCents?: true
  }

  export type InvoiceSumAggregateInputType = {
    amountCents?: true
  }

  export type InvoiceMinAggregateInputType = {
    id?: true
    clientId?: true
    projectId?: true
    number?: true
    description?: true
    lineItems?: true
    billingPeriod?: true
    costCenter?: true
    amountCents?: true
    currency?: true
    status?: true
    issuedAt?: true
    dueAt?: true
    paidAt?: true
    pdfFileId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type InvoiceMaxAggregateInputType = {
    id?: true
    clientId?: true
    projectId?: true
    number?: true
    description?: true
    lineItems?: true
    billingPeriod?: true
    costCenter?: true
    amountCents?: true
    currency?: true
    status?: true
    issuedAt?: true
    dueAt?: true
    paidAt?: true
    pdfFileId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type InvoiceCountAggregateInputType = {
    id?: true
    clientId?: true
    projectId?: true
    number?: true
    description?: true
    lineItems?: true
    billingPeriod?: true
    costCenter?: true
    amountCents?: true
    currency?: true
    status?: true
    issuedAt?: true
    dueAt?: true
    paidAt?: true
    pdfFileId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type InvoiceAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Invoice to aggregate.
     */
    where?: InvoiceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Invoices to fetch.
     */
    orderBy?: InvoiceOrderByWithRelationInput | InvoiceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: InvoiceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Invoices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Invoices.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Invoices
    **/
    _count?: true | InvoiceCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: InvoiceAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: InvoiceSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: InvoiceMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: InvoiceMaxAggregateInputType
  }

  export type GetInvoiceAggregateType<T extends InvoiceAggregateArgs> = {
        [P in keyof T & keyof AggregateInvoice]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateInvoice[P]>
      : GetScalarType<T[P], AggregateInvoice[P]>
  }




  export type InvoiceGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: InvoiceWhereInput
    orderBy?: InvoiceOrderByWithAggregationInput | InvoiceOrderByWithAggregationInput[]
    by: InvoiceScalarFieldEnum[] | InvoiceScalarFieldEnum
    having?: InvoiceScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: InvoiceCountAggregateInputType | true
    _avg?: InvoiceAvgAggregateInputType
    _sum?: InvoiceSumAggregateInputType
    _min?: InvoiceMinAggregateInputType
    _max?: InvoiceMaxAggregateInputType
  }

  export type InvoiceGroupByOutputType = {
    id: string
    clientId: string
    projectId: string | null
    number: string
    description: string | null
    lineItems: string | null
    billingPeriod: string | null
    costCenter: string | null
    amountCents: bigint
    currency: string
    status: $Enums.InvoiceStatus
    issuedAt: Date | null
    dueAt: Date | null
    paidAt: Date | null
    pdfFileId: string | null
    createdAt: Date
    updatedAt: Date
    _count: InvoiceCountAggregateOutputType | null
    _avg: InvoiceAvgAggregateOutputType | null
    _sum: InvoiceSumAggregateOutputType | null
    _min: InvoiceMinAggregateOutputType | null
    _max: InvoiceMaxAggregateOutputType | null
  }

  type GetInvoiceGroupByPayload<T extends InvoiceGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<InvoiceGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof InvoiceGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], InvoiceGroupByOutputType[P]>
            : GetScalarType<T[P], InvoiceGroupByOutputType[P]>
        }
      >
    >


  export type InvoiceSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    clientId?: boolean
    projectId?: boolean
    number?: boolean
    description?: boolean
    lineItems?: boolean
    billingPeriod?: boolean
    costCenter?: boolean
    amountCents?: boolean
    currency?: boolean
    status?: boolean
    issuedAt?: boolean
    dueAt?: boolean
    paidAt?: boolean
    pdfFileId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    payments?: boolean | Invoice$paymentsArgs<ExtArgs>
    installments?: boolean | Invoice$installmentsArgs<ExtArgs>
    _count?: boolean | InvoiceCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["invoice"]>

  export type InvoiceSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    clientId?: boolean
    projectId?: boolean
    number?: boolean
    description?: boolean
    lineItems?: boolean
    billingPeriod?: boolean
    costCenter?: boolean
    amountCents?: boolean
    currency?: boolean
    status?: boolean
    issuedAt?: boolean
    dueAt?: boolean
    paidAt?: boolean
    pdfFileId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["invoice"]>

  export type InvoiceSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    clientId?: boolean
    projectId?: boolean
    number?: boolean
    description?: boolean
    lineItems?: boolean
    billingPeriod?: boolean
    costCenter?: boolean
    amountCents?: boolean
    currency?: boolean
    status?: boolean
    issuedAt?: boolean
    dueAt?: boolean
    paidAt?: boolean
    pdfFileId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["invoice"]>

  export type InvoiceSelectScalar = {
    id?: boolean
    clientId?: boolean
    projectId?: boolean
    number?: boolean
    description?: boolean
    lineItems?: boolean
    billingPeriod?: boolean
    costCenter?: boolean
    amountCents?: boolean
    currency?: boolean
    status?: boolean
    issuedAt?: boolean
    dueAt?: boolean
    paidAt?: boolean
    pdfFileId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type InvoiceOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "clientId" | "projectId" | "number" | "description" | "lineItems" | "billingPeriod" | "costCenter" | "amountCents" | "currency" | "status" | "issuedAt" | "dueAt" | "paidAt" | "pdfFileId" | "createdAt" | "updatedAt", ExtArgs["result"]["invoice"]>
  export type InvoiceInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    payments?: boolean | Invoice$paymentsArgs<ExtArgs>
    installments?: boolean | Invoice$installmentsArgs<ExtArgs>
    _count?: boolean | InvoiceCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type InvoiceIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type InvoiceIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $InvoicePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Invoice"
    objects: {
      payments: Prisma.$PaymentPayload<ExtArgs>[]
      installments: Prisma.$InvoiceInstallmentPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      clientId: string
      projectId: string | null
      number: string
      description: string | null
      lineItems: string | null
      billingPeriod: string | null
      costCenter: string | null
      amountCents: bigint
      currency: string
      status: $Enums.InvoiceStatus
      issuedAt: Date | null
      dueAt: Date | null
      paidAt: Date | null
      pdfFileId: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["invoice"]>
    composites: {}
  }

  type InvoiceGetPayload<S extends boolean | null | undefined | InvoiceDefaultArgs> = $Result.GetResult<Prisma.$InvoicePayload, S>

  type InvoiceCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<InvoiceFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: InvoiceCountAggregateInputType | true
    }

  export interface InvoiceDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Invoice'], meta: { name: 'Invoice' } }
    /**
     * Find zero or one Invoice that matches the filter.
     * @param {InvoiceFindUniqueArgs} args - Arguments to find a Invoice
     * @example
     * // Get one Invoice
     * const invoice = await prisma.invoice.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends InvoiceFindUniqueArgs>(args: SelectSubset<T, InvoiceFindUniqueArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Invoice that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {InvoiceFindUniqueOrThrowArgs} args - Arguments to find a Invoice
     * @example
     * // Get one Invoice
     * const invoice = await prisma.invoice.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends InvoiceFindUniqueOrThrowArgs>(args: SelectSubset<T, InvoiceFindUniqueOrThrowArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Invoice that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceFindFirstArgs} args - Arguments to find a Invoice
     * @example
     * // Get one Invoice
     * const invoice = await prisma.invoice.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends InvoiceFindFirstArgs>(args?: SelectSubset<T, InvoiceFindFirstArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Invoice that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceFindFirstOrThrowArgs} args - Arguments to find a Invoice
     * @example
     * // Get one Invoice
     * const invoice = await prisma.invoice.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends InvoiceFindFirstOrThrowArgs>(args?: SelectSubset<T, InvoiceFindFirstOrThrowArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Invoices that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Invoices
     * const invoices = await prisma.invoice.findMany()
     * 
     * // Get first 10 Invoices
     * const invoices = await prisma.invoice.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const invoiceWithIdOnly = await prisma.invoice.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends InvoiceFindManyArgs>(args?: SelectSubset<T, InvoiceFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Invoice.
     * @param {InvoiceCreateArgs} args - Arguments to create a Invoice.
     * @example
     * // Create one Invoice
     * const Invoice = await prisma.invoice.create({
     *   data: {
     *     // ... data to create a Invoice
     *   }
     * })
     * 
     */
    create<T extends InvoiceCreateArgs>(args: SelectSubset<T, InvoiceCreateArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Invoices.
     * @param {InvoiceCreateManyArgs} args - Arguments to create many Invoices.
     * @example
     * // Create many Invoices
     * const invoice = await prisma.invoice.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends InvoiceCreateManyArgs>(args?: SelectSubset<T, InvoiceCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Invoices and returns the data saved in the database.
     * @param {InvoiceCreateManyAndReturnArgs} args - Arguments to create many Invoices.
     * @example
     * // Create many Invoices
     * const invoice = await prisma.invoice.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Invoices and only return the `id`
     * const invoiceWithIdOnly = await prisma.invoice.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends InvoiceCreateManyAndReturnArgs>(args?: SelectSubset<T, InvoiceCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Invoice.
     * @param {InvoiceDeleteArgs} args - Arguments to delete one Invoice.
     * @example
     * // Delete one Invoice
     * const Invoice = await prisma.invoice.delete({
     *   where: {
     *     // ... filter to delete one Invoice
     *   }
     * })
     * 
     */
    delete<T extends InvoiceDeleteArgs>(args: SelectSubset<T, InvoiceDeleteArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Invoice.
     * @param {InvoiceUpdateArgs} args - Arguments to update one Invoice.
     * @example
     * // Update one Invoice
     * const invoice = await prisma.invoice.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends InvoiceUpdateArgs>(args: SelectSubset<T, InvoiceUpdateArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Invoices.
     * @param {InvoiceDeleteManyArgs} args - Arguments to filter Invoices to delete.
     * @example
     * // Delete a few Invoices
     * const { count } = await prisma.invoice.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends InvoiceDeleteManyArgs>(args?: SelectSubset<T, InvoiceDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Invoices.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Invoices
     * const invoice = await prisma.invoice.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends InvoiceUpdateManyArgs>(args: SelectSubset<T, InvoiceUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Invoices and returns the data updated in the database.
     * @param {InvoiceUpdateManyAndReturnArgs} args - Arguments to update many Invoices.
     * @example
     * // Update many Invoices
     * const invoice = await prisma.invoice.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Invoices and only return the `id`
     * const invoiceWithIdOnly = await prisma.invoice.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends InvoiceUpdateManyAndReturnArgs>(args: SelectSubset<T, InvoiceUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Invoice.
     * @param {InvoiceUpsertArgs} args - Arguments to update or create a Invoice.
     * @example
     * // Update or create a Invoice
     * const invoice = await prisma.invoice.upsert({
     *   create: {
     *     // ... data to create a Invoice
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Invoice we want to update
     *   }
     * })
     */
    upsert<T extends InvoiceUpsertArgs>(args: SelectSubset<T, InvoiceUpsertArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Invoices.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceCountArgs} args - Arguments to filter Invoices to count.
     * @example
     * // Count the number of Invoices
     * const count = await prisma.invoice.count({
     *   where: {
     *     // ... the filter for the Invoices we want to count
     *   }
     * })
    **/
    count<T extends InvoiceCountArgs>(
      args?: Subset<T, InvoiceCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], InvoiceCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Invoice.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends InvoiceAggregateArgs>(args: Subset<T, InvoiceAggregateArgs>): Prisma.PrismaPromise<GetInvoiceAggregateType<T>>

    /**
     * Group by Invoice.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends InvoiceGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: InvoiceGroupByArgs['orderBy'] }
        : { orderBy?: InvoiceGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, InvoiceGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetInvoiceGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Invoice model
   */
  readonly fields: InvoiceFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Invoice.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__InvoiceClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    payments<T extends Invoice$paymentsArgs<ExtArgs> = {}>(args?: Subset<T, Invoice$paymentsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    installments<T extends Invoice$installmentsArgs<ExtArgs> = {}>(args?: Subset<T, Invoice$installmentsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InvoiceInstallmentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Invoice model
   */
  interface InvoiceFieldRefs {
    readonly id: FieldRef<"Invoice", 'String'>
    readonly clientId: FieldRef<"Invoice", 'String'>
    readonly projectId: FieldRef<"Invoice", 'String'>
    readonly number: FieldRef<"Invoice", 'String'>
    readonly description: FieldRef<"Invoice", 'String'>
    readonly lineItems: FieldRef<"Invoice", 'String'>
    readonly billingPeriod: FieldRef<"Invoice", 'String'>
    readonly costCenter: FieldRef<"Invoice", 'String'>
    readonly amountCents: FieldRef<"Invoice", 'BigInt'>
    readonly currency: FieldRef<"Invoice", 'String'>
    readonly status: FieldRef<"Invoice", 'InvoiceStatus'>
    readonly issuedAt: FieldRef<"Invoice", 'DateTime'>
    readonly dueAt: FieldRef<"Invoice", 'DateTime'>
    readonly paidAt: FieldRef<"Invoice", 'DateTime'>
    readonly pdfFileId: FieldRef<"Invoice", 'String'>
    readonly createdAt: FieldRef<"Invoice", 'DateTime'>
    readonly updatedAt: FieldRef<"Invoice", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Invoice findUnique
   */
  export type InvoiceFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
    /**
     * Filter, which Invoice to fetch.
     */
    where: InvoiceWhereUniqueInput
  }

  /**
   * Invoice findUniqueOrThrow
   */
  export type InvoiceFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
    /**
     * Filter, which Invoice to fetch.
     */
    where: InvoiceWhereUniqueInput
  }

  /**
   * Invoice findFirst
   */
  export type InvoiceFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
    /**
     * Filter, which Invoice to fetch.
     */
    where?: InvoiceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Invoices to fetch.
     */
    orderBy?: InvoiceOrderByWithRelationInput | InvoiceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Invoices.
     */
    cursor?: InvoiceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Invoices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Invoices.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Invoices.
     */
    distinct?: InvoiceScalarFieldEnum | InvoiceScalarFieldEnum[]
  }

  /**
   * Invoice findFirstOrThrow
   */
  export type InvoiceFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
    /**
     * Filter, which Invoice to fetch.
     */
    where?: InvoiceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Invoices to fetch.
     */
    orderBy?: InvoiceOrderByWithRelationInput | InvoiceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Invoices.
     */
    cursor?: InvoiceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Invoices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Invoices.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Invoices.
     */
    distinct?: InvoiceScalarFieldEnum | InvoiceScalarFieldEnum[]
  }

  /**
   * Invoice findMany
   */
  export type InvoiceFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
    /**
     * Filter, which Invoices to fetch.
     */
    where?: InvoiceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Invoices to fetch.
     */
    orderBy?: InvoiceOrderByWithRelationInput | InvoiceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Invoices.
     */
    cursor?: InvoiceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Invoices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Invoices.
     */
    skip?: number
    distinct?: InvoiceScalarFieldEnum | InvoiceScalarFieldEnum[]
  }

  /**
   * Invoice create
   */
  export type InvoiceCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
    /**
     * The data needed to create a Invoice.
     */
    data: XOR<InvoiceCreateInput, InvoiceUncheckedCreateInput>
  }

  /**
   * Invoice createMany
   */
  export type InvoiceCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Invoices.
     */
    data: InvoiceCreateManyInput | InvoiceCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Invoice createManyAndReturn
   */
  export type InvoiceCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * The data used to create many Invoices.
     */
    data: InvoiceCreateManyInput | InvoiceCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Invoice update
   */
  export type InvoiceUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
    /**
     * The data needed to update a Invoice.
     */
    data: XOR<InvoiceUpdateInput, InvoiceUncheckedUpdateInput>
    /**
     * Choose, which Invoice to update.
     */
    where: InvoiceWhereUniqueInput
  }

  /**
   * Invoice updateMany
   */
  export type InvoiceUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Invoices.
     */
    data: XOR<InvoiceUpdateManyMutationInput, InvoiceUncheckedUpdateManyInput>
    /**
     * Filter which Invoices to update
     */
    where?: InvoiceWhereInput
    /**
     * Limit how many Invoices to update.
     */
    limit?: number
  }

  /**
   * Invoice updateManyAndReturn
   */
  export type InvoiceUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * The data used to update Invoices.
     */
    data: XOR<InvoiceUpdateManyMutationInput, InvoiceUncheckedUpdateManyInput>
    /**
     * Filter which Invoices to update
     */
    where?: InvoiceWhereInput
    /**
     * Limit how many Invoices to update.
     */
    limit?: number
  }

  /**
   * Invoice upsert
   */
  export type InvoiceUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
    /**
     * The filter to search for the Invoice to update in case it exists.
     */
    where: InvoiceWhereUniqueInput
    /**
     * In case the Invoice found by the `where` argument doesn't exist, create a new Invoice with this data.
     */
    create: XOR<InvoiceCreateInput, InvoiceUncheckedCreateInput>
    /**
     * In case the Invoice was found with the provided `where` argument, update it with this data.
     */
    update: XOR<InvoiceUpdateInput, InvoiceUncheckedUpdateInput>
  }

  /**
   * Invoice delete
   */
  export type InvoiceDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
    /**
     * Filter which Invoice to delete.
     */
    where: InvoiceWhereUniqueInput
  }

  /**
   * Invoice deleteMany
   */
  export type InvoiceDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Invoices to delete
     */
    where?: InvoiceWhereInput
    /**
     * Limit how many Invoices to delete.
     */
    limit?: number
  }

  /**
   * Invoice.payments
   */
  export type Invoice$paymentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
    where?: PaymentWhereInput
    orderBy?: PaymentOrderByWithRelationInput | PaymentOrderByWithRelationInput[]
    cursor?: PaymentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PaymentScalarFieldEnum | PaymentScalarFieldEnum[]
  }

  /**
   * Invoice.installments
   */
  export type Invoice$installmentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InvoiceInstallment
     */
    select?: InvoiceInstallmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InvoiceInstallment
     */
    omit?: InvoiceInstallmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInstallmentInclude<ExtArgs> | null
    where?: InvoiceInstallmentWhereInput
    orderBy?: InvoiceInstallmentOrderByWithRelationInput | InvoiceInstallmentOrderByWithRelationInput[]
    cursor?: InvoiceInstallmentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: InvoiceInstallmentScalarFieldEnum | InvoiceInstallmentScalarFieldEnum[]
  }

  /**
   * Invoice without action
   */
  export type InvoiceDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
  }


  /**
   * Model Payment
   */

  export type AggregatePayment = {
    _count: PaymentCountAggregateOutputType | null
    _avg: PaymentAvgAggregateOutputType | null
    _sum: PaymentSumAggregateOutputType | null
    _min: PaymentMinAggregateOutputType | null
    _max: PaymentMaxAggregateOutputType | null
  }

  export type PaymentAvgAggregateOutputType = {
    amountCents: number | null
  }

  export type PaymentSumAggregateOutputType = {
    amountCents: bigint | null
  }

  export type PaymentMinAggregateOutputType = {
    id: string | null
    clientId: string | null
    projectId: string | null
    invoiceId: string | null
    source: string | null
    amountCents: bigint | null
    status: $Enums.PaymentStatus | null
    provider: string | null
    transactionRef: string | null
    paidAt: Date | null
    receiptFileId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PaymentMaxAggregateOutputType = {
    id: string | null
    clientId: string | null
    projectId: string | null
    invoiceId: string | null
    source: string | null
    amountCents: bigint | null
    status: $Enums.PaymentStatus | null
    provider: string | null
    transactionRef: string | null
    paidAt: Date | null
    receiptFileId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PaymentCountAggregateOutputType = {
    id: number
    clientId: number
    projectId: number
    invoiceId: number
    source: number
    amountCents: number
    status: number
    provider: number
    transactionRef: number
    paidAt: number
    receiptFileId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type PaymentAvgAggregateInputType = {
    amountCents?: true
  }

  export type PaymentSumAggregateInputType = {
    amountCents?: true
  }

  export type PaymentMinAggregateInputType = {
    id?: true
    clientId?: true
    projectId?: true
    invoiceId?: true
    source?: true
    amountCents?: true
    status?: true
    provider?: true
    transactionRef?: true
    paidAt?: true
    receiptFileId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PaymentMaxAggregateInputType = {
    id?: true
    clientId?: true
    projectId?: true
    invoiceId?: true
    source?: true
    amountCents?: true
    status?: true
    provider?: true
    transactionRef?: true
    paidAt?: true
    receiptFileId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PaymentCountAggregateInputType = {
    id?: true
    clientId?: true
    projectId?: true
    invoiceId?: true
    source?: true
    amountCents?: true
    status?: true
    provider?: true
    transactionRef?: true
    paidAt?: true
    receiptFileId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type PaymentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Payment to aggregate.
     */
    where?: PaymentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Payments to fetch.
     */
    orderBy?: PaymentOrderByWithRelationInput | PaymentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PaymentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Payments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Payments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Payments
    **/
    _count?: true | PaymentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PaymentAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PaymentSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PaymentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PaymentMaxAggregateInputType
  }

  export type GetPaymentAggregateType<T extends PaymentAggregateArgs> = {
        [P in keyof T & keyof AggregatePayment]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePayment[P]>
      : GetScalarType<T[P], AggregatePayment[P]>
  }




  export type PaymentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PaymentWhereInput
    orderBy?: PaymentOrderByWithAggregationInput | PaymentOrderByWithAggregationInput[]
    by: PaymentScalarFieldEnum[] | PaymentScalarFieldEnum
    having?: PaymentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PaymentCountAggregateInputType | true
    _avg?: PaymentAvgAggregateInputType
    _sum?: PaymentSumAggregateInputType
    _min?: PaymentMinAggregateInputType
    _max?: PaymentMaxAggregateInputType
  }

  export type PaymentGroupByOutputType = {
    id: string
    clientId: string
    projectId: string | null
    invoiceId: string
    source: string | null
    amountCents: bigint
    status: $Enums.PaymentStatus
    provider: string | null
    transactionRef: string | null
    paidAt: Date | null
    receiptFileId: string | null
    createdAt: Date
    updatedAt: Date
    _count: PaymentCountAggregateOutputType | null
    _avg: PaymentAvgAggregateOutputType | null
    _sum: PaymentSumAggregateOutputType | null
    _min: PaymentMinAggregateOutputType | null
    _max: PaymentMaxAggregateOutputType | null
  }

  type GetPaymentGroupByPayload<T extends PaymentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PaymentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PaymentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PaymentGroupByOutputType[P]>
            : GetScalarType<T[P], PaymentGroupByOutputType[P]>
        }
      >
    >


  export type PaymentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    clientId?: boolean
    projectId?: boolean
    invoiceId?: boolean
    source?: boolean
    amountCents?: boolean
    status?: boolean
    provider?: boolean
    transactionRef?: boolean
    paidAt?: boolean
    receiptFileId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    invoice?: boolean | InvoiceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["payment"]>

  export type PaymentSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    clientId?: boolean
    projectId?: boolean
    invoiceId?: boolean
    source?: boolean
    amountCents?: boolean
    status?: boolean
    provider?: boolean
    transactionRef?: boolean
    paidAt?: boolean
    receiptFileId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    invoice?: boolean | InvoiceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["payment"]>

  export type PaymentSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    clientId?: boolean
    projectId?: boolean
    invoiceId?: boolean
    source?: boolean
    amountCents?: boolean
    status?: boolean
    provider?: boolean
    transactionRef?: boolean
    paidAt?: boolean
    receiptFileId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    invoice?: boolean | InvoiceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["payment"]>

  export type PaymentSelectScalar = {
    id?: boolean
    clientId?: boolean
    projectId?: boolean
    invoiceId?: boolean
    source?: boolean
    amountCents?: boolean
    status?: boolean
    provider?: boolean
    transactionRef?: boolean
    paidAt?: boolean
    receiptFileId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type PaymentOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "clientId" | "projectId" | "invoiceId" | "source" | "amountCents" | "status" | "provider" | "transactionRef" | "paidAt" | "receiptFileId" | "createdAt" | "updatedAt", ExtArgs["result"]["payment"]>
  export type PaymentInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    invoice?: boolean | InvoiceDefaultArgs<ExtArgs>
  }
  export type PaymentIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    invoice?: boolean | InvoiceDefaultArgs<ExtArgs>
  }
  export type PaymentIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    invoice?: boolean | InvoiceDefaultArgs<ExtArgs>
  }

  export type $PaymentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Payment"
    objects: {
      invoice: Prisma.$InvoicePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      clientId: string
      projectId: string | null
      invoiceId: string
      source: string | null
      amountCents: bigint
      status: $Enums.PaymentStatus
      provider: string | null
      transactionRef: string | null
      paidAt: Date | null
      receiptFileId: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["payment"]>
    composites: {}
  }

  type PaymentGetPayload<S extends boolean | null | undefined | PaymentDefaultArgs> = $Result.GetResult<Prisma.$PaymentPayload, S>

  type PaymentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PaymentFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PaymentCountAggregateInputType | true
    }

  export interface PaymentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Payment'], meta: { name: 'Payment' } }
    /**
     * Find zero or one Payment that matches the filter.
     * @param {PaymentFindUniqueArgs} args - Arguments to find a Payment
     * @example
     * // Get one Payment
     * const payment = await prisma.payment.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PaymentFindUniqueArgs>(args: SelectSubset<T, PaymentFindUniqueArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Payment that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PaymentFindUniqueOrThrowArgs} args - Arguments to find a Payment
     * @example
     * // Get one Payment
     * const payment = await prisma.payment.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PaymentFindUniqueOrThrowArgs>(args: SelectSubset<T, PaymentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Payment that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentFindFirstArgs} args - Arguments to find a Payment
     * @example
     * // Get one Payment
     * const payment = await prisma.payment.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PaymentFindFirstArgs>(args?: SelectSubset<T, PaymentFindFirstArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Payment that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentFindFirstOrThrowArgs} args - Arguments to find a Payment
     * @example
     * // Get one Payment
     * const payment = await prisma.payment.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PaymentFindFirstOrThrowArgs>(args?: SelectSubset<T, PaymentFindFirstOrThrowArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Payments that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Payments
     * const payments = await prisma.payment.findMany()
     * 
     * // Get first 10 Payments
     * const payments = await prisma.payment.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const paymentWithIdOnly = await prisma.payment.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PaymentFindManyArgs>(args?: SelectSubset<T, PaymentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Payment.
     * @param {PaymentCreateArgs} args - Arguments to create a Payment.
     * @example
     * // Create one Payment
     * const Payment = await prisma.payment.create({
     *   data: {
     *     // ... data to create a Payment
     *   }
     * })
     * 
     */
    create<T extends PaymentCreateArgs>(args: SelectSubset<T, PaymentCreateArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Payments.
     * @param {PaymentCreateManyArgs} args - Arguments to create many Payments.
     * @example
     * // Create many Payments
     * const payment = await prisma.payment.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PaymentCreateManyArgs>(args?: SelectSubset<T, PaymentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Payments and returns the data saved in the database.
     * @param {PaymentCreateManyAndReturnArgs} args - Arguments to create many Payments.
     * @example
     * // Create many Payments
     * const payment = await prisma.payment.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Payments and only return the `id`
     * const paymentWithIdOnly = await prisma.payment.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PaymentCreateManyAndReturnArgs>(args?: SelectSubset<T, PaymentCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Payment.
     * @param {PaymentDeleteArgs} args - Arguments to delete one Payment.
     * @example
     * // Delete one Payment
     * const Payment = await prisma.payment.delete({
     *   where: {
     *     // ... filter to delete one Payment
     *   }
     * })
     * 
     */
    delete<T extends PaymentDeleteArgs>(args: SelectSubset<T, PaymentDeleteArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Payment.
     * @param {PaymentUpdateArgs} args - Arguments to update one Payment.
     * @example
     * // Update one Payment
     * const payment = await prisma.payment.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PaymentUpdateArgs>(args: SelectSubset<T, PaymentUpdateArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Payments.
     * @param {PaymentDeleteManyArgs} args - Arguments to filter Payments to delete.
     * @example
     * // Delete a few Payments
     * const { count } = await prisma.payment.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PaymentDeleteManyArgs>(args?: SelectSubset<T, PaymentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Payments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Payments
     * const payment = await prisma.payment.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PaymentUpdateManyArgs>(args: SelectSubset<T, PaymentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Payments and returns the data updated in the database.
     * @param {PaymentUpdateManyAndReturnArgs} args - Arguments to update many Payments.
     * @example
     * // Update many Payments
     * const payment = await prisma.payment.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Payments and only return the `id`
     * const paymentWithIdOnly = await prisma.payment.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PaymentUpdateManyAndReturnArgs>(args: SelectSubset<T, PaymentUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Payment.
     * @param {PaymentUpsertArgs} args - Arguments to update or create a Payment.
     * @example
     * // Update or create a Payment
     * const payment = await prisma.payment.upsert({
     *   create: {
     *     // ... data to create a Payment
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Payment we want to update
     *   }
     * })
     */
    upsert<T extends PaymentUpsertArgs>(args: SelectSubset<T, PaymentUpsertArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Payments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentCountArgs} args - Arguments to filter Payments to count.
     * @example
     * // Count the number of Payments
     * const count = await prisma.payment.count({
     *   where: {
     *     // ... the filter for the Payments we want to count
     *   }
     * })
    **/
    count<T extends PaymentCountArgs>(
      args?: Subset<T, PaymentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PaymentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Payment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PaymentAggregateArgs>(args: Subset<T, PaymentAggregateArgs>): Prisma.PrismaPromise<GetPaymentAggregateType<T>>

    /**
     * Group by Payment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PaymentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PaymentGroupByArgs['orderBy'] }
        : { orderBy?: PaymentGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PaymentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPaymentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Payment model
   */
  readonly fields: PaymentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Payment.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PaymentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    invoice<T extends InvoiceDefaultArgs<ExtArgs> = {}>(args?: Subset<T, InvoiceDefaultArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Payment model
   */
  interface PaymentFieldRefs {
    readonly id: FieldRef<"Payment", 'String'>
    readonly clientId: FieldRef<"Payment", 'String'>
    readonly projectId: FieldRef<"Payment", 'String'>
    readonly invoiceId: FieldRef<"Payment", 'String'>
    readonly source: FieldRef<"Payment", 'String'>
    readonly amountCents: FieldRef<"Payment", 'BigInt'>
    readonly status: FieldRef<"Payment", 'PaymentStatus'>
    readonly provider: FieldRef<"Payment", 'String'>
    readonly transactionRef: FieldRef<"Payment", 'String'>
    readonly paidAt: FieldRef<"Payment", 'DateTime'>
    readonly receiptFileId: FieldRef<"Payment", 'String'>
    readonly createdAt: FieldRef<"Payment", 'DateTime'>
    readonly updatedAt: FieldRef<"Payment", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Payment findUnique
   */
  export type PaymentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
    /**
     * Filter, which Payment to fetch.
     */
    where: PaymentWhereUniqueInput
  }

  /**
   * Payment findUniqueOrThrow
   */
  export type PaymentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
    /**
     * Filter, which Payment to fetch.
     */
    where: PaymentWhereUniqueInput
  }

  /**
   * Payment findFirst
   */
  export type PaymentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
    /**
     * Filter, which Payment to fetch.
     */
    where?: PaymentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Payments to fetch.
     */
    orderBy?: PaymentOrderByWithRelationInput | PaymentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Payments.
     */
    cursor?: PaymentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Payments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Payments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Payments.
     */
    distinct?: PaymentScalarFieldEnum | PaymentScalarFieldEnum[]
  }

  /**
   * Payment findFirstOrThrow
   */
  export type PaymentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
    /**
     * Filter, which Payment to fetch.
     */
    where?: PaymentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Payments to fetch.
     */
    orderBy?: PaymentOrderByWithRelationInput | PaymentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Payments.
     */
    cursor?: PaymentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Payments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Payments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Payments.
     */
    distinct?: PaymentScalarFieldEnum | PaymentScalarFieldEnum[]
  }

  /**
   * Payment findMany
   */
  export type PaymentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
    /**
     * Filter, which Payments to fetch.
     */
    where?: PaymentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Payments to fetch.
     */
    orderBy?: PaymentOrderByWithRelationInput | PaymentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Payments.
     */
    cursor?: PaymentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Payments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Payments.
     */
    skip?: number
    distinct?: PaymentScalarFieldEnum | PaymentScalarFieldEnum[]
  }

  /**
   * Payment create
   */
  export type PaymentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
    /**
     * The data needed to create a Payment.
     */
    data: XOR<PaymentCreateInput, PaymentUncheckedCreateInput>
  }

  /**
   * Payment createMany
   */
  export type PaymentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Payments.
     */
    data: PaymentCreateManyInput | PaymentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Payment createManyAndReturn
   */
  export type PaymentCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * The data used to create many Payments.
     */
    data: PaymentCreateManyInput | PaymentCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Payment update
   */
  export type PaymentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
    /**
     * The data needed to update a Payment.
     */
    data: XOR<PaymentUpdateInput, PaymentUncheckedUpdateInput>
    /**
     * Choose, which Payment to update.
     */
    where: PaymentWhereUniqueInput
  }

  /**
   * Payment updateMany
   */
  export type PaymentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Payments.
     */
    data: XOR<PaymentUpdateManyMutationInput, PaymentUncheckedUpdateManyInput>
    /**
     * Filter which Payments to update
     */
    where?: PaymentWhereInput
    /**
     * Limit how many Payments to update.
     */
    limit?: number
  }

  /**
   * Payment updateManyAndReturn
   */
  export type PaymentUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * The data used to update Payments.
     */
    data: XOR<PaymentUpdateManyMutationInput, PaymentUncheckedUpdateManyInput>
    /**
     * Filter which Payments to update
     */
    where?: PaymentWhereInput
    /**
     * Limit how many Payments to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Payment upsert
   */
  export type PaymentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
    /**
     * The filter to search for the Payment to update in case it exists.
     */
    where: PaymentWhereUniqueInput
    /**
     * In case the Payment found by the `where` argument doesn't exist, create a new Payment with this data.
     */
    create: XOR<PaymentCreateInput, PaymentUncheckedCreateInput>
    /**
     * In case the Payment was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PaymentUpdateInput, PaymentUncheckedUpdateInput>
  }

  /**
   * Payment delete
   */
  export type PaymentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
    /**
     * Filter which Payment to delete.
     */
    where: PaymentWhereUniqueInput
  }

  /**
   * Payment deleteMany
   */
  export type PaymentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Payments to delete
     */
    where?: PaymentWhereInput
    /**
     * Limit how many Payments to delete.
     */
    limit?: number
  }

  /**
   * Payment without action
   */
  export type PaymentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
  }


  /**
   * Model InvoiceInstallment
   */

  export type AggregateInvoiceInstallment = {
    _count: InvoiceInstallmentCountAggregateOutputType | null
    _avg: InvoiceInstallmentAvgAggregateOutputType | null
    _sum: InvoiceInstallmentSumAggregateOutputType | null
    _min: InvoiceInstallmentMinAggregateOutputType | null
    _max: InvoiceInstallmentMaxAggregateOutputType | null
  }

  export type InvoiceInstallmentAvgAggregateOutputType = {
    number: number | null
    amountCents: number | null
  }

  export type InvoiceInstallmentSumAggregateOutputType = {
    number: number | null
    amountCents: bigint | null
  }

  export type InvoiceInstallmentMinAggregateOutputType = {
    id: string | null
    invoiceId: string | null
    clientId: string | null
    projectId: string | null
    number: number | null
    name: string | null
    amountCents: bigint | null
    dueAt: Date | null
    paidAt: Date | null
    status: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type InvoiceInstallmentMaxAggregateOutputType = {
    id: string | null
    invoiceId: string | null
    clientId: string | null
    projectId: string | null
    number: number | null
    name: string | null
    amountCents: bigint | null
    dueAt: Date | null
    paidAt: Date | null
    status: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type InvoiceInstallmentCountAggregateOutputType = {
    id: number
    invoiceId: number
    clientId: number
    projectId: number
    number: number
    name: number
    amountCents: number
    dueAt: number
    paidAt: number
    status: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type InvoiceInstallmentAvgAggregateInputType = {
    number?: true
    amountCents?: true
  }

  export type InvoiceInstallmentSumAggregateInputType = {
    number?: true
    amountCents?: true
  }

  export type InvoiceInstallmentMinAggregateInputType = {
    id?: true
    invoiceId?: true
    clientId?: true
    projectId?: true
    number?: true
    name?: true
    amountCents?: true
    dueAt?: true
    paidAt?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type InvoiceInstallmentMaxAggregateInputType = {
    id?: true
    invoiceId?: true
    clientId?: true
    projectId?: true
    number?: true
    name?: true
    amountCents?: true
    dueAt?: true
    paidAt?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type InvoiceInstallmentCountAggregateInputType = {
    id?: true
    invoiceId?: true
    clientId?: true
    projectId?: true
    number?: true
    name?: true
    amountCents?: true
    dueAt?: true
    paidAt?: true
    status?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type InvoiceInstallmentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which InvoiceInstallment to aggregate.
     */
    where?: InvoiceInstallmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of InvoiceInstallments to fetch.
     */
    orderBy?: InvoiceInstallmentOrderByWithRelationInput | InvoiceInstallmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: InvoiceInstallmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` InvoiceInstallments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` InvoiceInstallments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned InvoiceInstallments
    **/
    _count?: true | InvoiceInstallmentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: InvoiceInstallmentAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: InvoiceInstallmentSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: InvoiceInstallmentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: InvoiceInstallmentMaxAggregateInputType
  }

  export type GetInvoiceInstallmentAggregateType<T extends InvoiceInstallmentAggregateArgs> = {
        [P in keyof T & keyof AggregateInvoiceInstallment]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateInvoiceInstallment[P]>
      : GetScalarType<T[P], AggregateInvoiceInstallment[P]>
  }




  export type InvoiceInstallmentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: InvoiceInstallmentWhereInput
    orderBy?: InvoiceInstallmentOrderByWithAggregationInput | InvoiceInstallmentOrderByWithAggregationInput[]
    by: InvoiceInstallmentScalarFieldEnum[] | InvoiceInstallmentScalarFieldEnum
    having?: InvoiceInstallmentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: InvoiceInstallmentCountAggregateInputType | true
    _avg?: InvoiceInstallmentAvgAggregateInputType
    _sum?: InvoiceInstallmentSumAggregateInputType
    _min?: InvoiceInstallmentMinAggregateInputType
    _max?: InvoiceInstallmentMaxAggregateInputType
  }

  export type InvoiceInstallmentGroupByOutputType = {
    id: string
    invoiceId: string
    clientId: string
    projectId: string | null
    number: number
    name: string
    amountCents: bigint
    dueAt: Date | null
    paidAt: Date | null
    status: string
    createdAt: Date
    updatedAt: Date
    _count: InvoiceInstallmentCountAggregateOutputType | null
    _avg: InvoiceInstallmentAvgAggregateOutputType | null
    _sum: InvoiceInstallmentSumAggregateOutputType | null
    _min: InvoiceInstallmentMinAggregateOutputType | null
    _max: InvoiceInstallmentMaxAggregateOutputType | null
  }

  type GetInvoiceInstallmentGroupByPayload<T extends InvoiceInstallmentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<InvoiceInstallmentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof InvoiceInstallmentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], InvoiceInstallmentGroupByOutputType[P]>
            : GetScalarType<T[P], InvoiceInstallmentGroupByOutputType[P]>
        }
      >
    >


  export type InvoiceInstallmentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    invoiceId?: boolean
    clientId?: boolean
    projectId?: boolean
    number?: boolean
    name?: boolean
    amountCents?: boolean
    dueAt?: boolean
    paidAt?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    invoice?: boolean | InvoiceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["invoiceInstallment"]>

  export type InvoiceInstallmentSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    invoiceId?: boolean
    clientId?: boolean
    projectId?: boolean
    number?: boolean
    name?: boolean
    amountCents?: boolean
    dueAt?: boolean
    paidAt?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    invoice?: boolean | InvoiceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["invoiceInstallment"]>

  export type InvoiceInstallmentSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    invoiceId?: boolean
    clientId?: boolean
    projectId?: boolean
    number?: boolean
    name?: boolean
    amountCents?: boolean
    dueAt?: boolean
    paidAt?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    invoice?: boolean | InvoiceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["invoiceInstallment"]>

  export type InvoiceInstallmentSelectScalar = {
    id?: boolean
    invoiceId?: boolean
    clientId?: boolean
    projectId?: boolean
    number?: boolean
    name?: boolean
    amountCents?: boolean
    dueAt?: boolean
    paidAt?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type InvoiceInstallmentOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "invoiceId" | "clientId" | "projectId" | "number" | "name" | "amountCents" | "dueAt" | "paidAt" | "status" | "createdAt" | "updatedAt", ExtArgs["result"]["invoiceInstallment"]>
  export type InvoiceInstallmentInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    invoice?: boolean | InvoiceDefaultArgs<ExtArgs>
  }
  export type InvoiceInstallmentIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    invoice?: boolean | InvoiceDefaultArgs<ExtArgs>
  }
  export type InvoiceInstallmentIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    invoice?: boolean | InvoiceDefaultArgs<ExtArgs>
  }

  export type $InvoiceInstallmentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "InvoiceInstallment"
    objects: {
      invoice: Prisma.$InvoicePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      invoiceId: string
      clientId: string
      projectId: string | null
      number: number
      name: string
      amountCents: bigint
      dueAt: Date | null
      paidAt: Date | null
      status: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["invoiceInstallment"]>
    composites: {}
  }

  type InvoiceInstallmentGetPayload<S extends boolean | null | undefined | InvoiceInstallmentDefaultArgs> = $Result.GetResult<Prisma.$InvoiceInstallmentPayload, S>

  type InvoiceInstallmentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<InvoiceInstallmentFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: InvoiceInstallmentCountAggregateInputType | true
    }

  export interface InvoiceInstallmentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['InvoiceInstallment'], meta: { name: 'InvoiceInstallment' } }
    /**
     * Find zero or one InvoiceInstallment that matches the filter.
     * @param {InvoiceInstallmentFindUniqueArgs} args - Arguments to find a InvoiceInstallment
     * @example
     * // Get one InvoiceInstallment
     * const invoiceInstallment = await prisma.invoiceInstallment.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends InvoiceInstallmentFindUniqueArgs>(args: SelectSubset<T, InvoiceInstallmentFindUniqueArgs<ExtArgs>>): Prisma__InvoiceInstallmentClient<$Result.GetResult<Prisma.$InvoiceInstallmentPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one InvoiceInstallment that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {InvoiceInstallmentFindUniqueOrThrowArgs} args - Arguments to find a InvoiceInstallment
     * @example
     * // Get one InvoiceInstallment
     * const invoiceInstallment = await prisma.invoiceInstallment.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends InvoiceInstallmentFindUniqueOrThrowArgs>(args: SelectSubset<T, InvoiceInstallmentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__InvoiceInstallmentClient<$Result.GetResult<Prisma.$InvoiceInstallmentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first InvoiceInstallment that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceInstallmentFindFirstArgs} args - Arguments to find a InvoiceInstallment
     * @example
     * // Get one InvoiceInstallment
     * const invoiceInstallment = await prisma.invoiceInstallment.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends InvoiceInstallmentFindFirstArgs>(args?: SelectSubset<T, InvoiceInstallmentFindFirstArgs<ExtArgs>>): Prisma__InvoiceInstallmentClient<$Result.GetResult<Prisma.$InvoiceInstallmentPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first InvoiceInstallment that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceInstallmentFindFirstOrThrowArgs} args - Arguments to find a InvoiceInstallment
     * @example
     * // Get one InvoiceInstallment
     * const invoiceInstallment = await prisma.invoiceInstallment.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends InvoiceInstallmentFindFirstOrThrowArgs>(args?: SelectSubset<T, InvoiceInstallmentFindFirstOrThrowArgs<ExtArgs>>): Prisma__InvoiceInstallmentClient<$Result.GetResult<Prisma.$InvoiceInstallmentPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more InvoiceInstallments that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceInstallmentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all InvoiceInstallments
     * const invoiceInstallments = await prisma.invoiceInstallment.findMany()
     * 
     * // Get first 10 InvoiceInstallments
     * const invoiceInstallments = await prisma.invoiceInstallment.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const invoiceInstallmentWithIdOnly = await prisma.invoiceInstallment.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends InvoiceInstallmentFindManyArgs>(args?: SelectSubset<T, InvoiceInstallmentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InvoiceInstallmentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a InvoiceInstallment.
     * @param {InvoiceInstallmentCreateArgs} args - Arguments to create a InvoiceInstallment.
     * @example
     * // Create one InvoiceInstallment
     * const InvoiceInstallment = await prisma.invoiceInstallment.create({
     *   data: {
     *     // ... data to create a InvoiceInstallment
     *   }
     * })
     * 
     */
    create<T extends InvoiceInstallmentCreateArgs>(args: SelectSubset<T, InvoiceInstallmentCreateArgs<ExtArgs>>): Prisma__InvoiceInstallmentClient<$Result.GetResult<Prisma.$InvoiceInstallmentPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many InvoiceInstallments.
     * @param {InvoiceInstallmentCreateManyArgs} args - Arguments to create many InvoiceInstallments.
     * @example
     * // Create many InvoiceInstallments
     * const invoiceInstallment = await prisma.invoiceInstallment.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends InvoiceInstallmentCreateManyArgs>(args?: SelectSubset<T, InvoiceInstallmentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many InvoiceInstallments and returns the data saved in the database.
     * @param {InvoiceInstallmentCreateManyAndReturnArgs} args - Arguments to create many InvoiceInstallments.
     * @example
     * // Create many InvoiceInstallments
     * const invoiceInstallment = await prisma.invoiceInstallment.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many InvoiceInstallments and only return the `id`
     * const invoiceInstallmentWithIdOnly = await prisma.invoiceInstallment.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends InvoiceInstallmentCreateManyAndReturnArgs>(args?: SelectSubset<T, InvoiceInstallmentCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InvoiceInstallmentPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a InvoiceInstallment.
     * @param {InvoiceInstallmentDeleteArgs} args - Arguments to delete one InvoiceInstallment.
     * @example
     * // Delete one InvoiceInstallment
     * const InvoiceInstallment = await prisma.invoiceInstallment.delete({
     *   where: {
     *     // ... filter to delete one InvoiceInstallment
     *   }
     * })
     * 
     */
    delete<T extends InvoiceInstallmentDeleteArgs>(args: SelectSubset<T, InvoiceInstallmentDeleteArgs<ExtArgs>>): Prisma__InvoiceInstallmentClient<$Result.GetResult<Prisma.$InvoiceInstallmentPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one InvoiceInstallment.
     * @param {InvoiceInstallmentUpdateArgs} args - Arguments to update one InvoiceInstallment.
     * @example
     * // Update one InvoiceInstallment
     * const invoiceInstallment = await prisma.invoiceInstallment.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends InvoiceInstallmentUpdateArgs>(args: SelectSubset<T, InvoiceInstallmentUpdateArgs<ExtArgs>>): Prisma__InvoiceInstallmentClient<$Result.GetResult<Prisma.$InvoiceInstallmentPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more InvoiceInstallments.
     * @param {InvoiceInstallmentDeleteManyArgs} args - Arguments to filter InvoiceInstallments to delete.
     * @example
     * // Delete a few InvoiceInstallments
     * const { count } = await prisma.invoiceInstallment.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends InvoiceInstallmentDeleteManyArgs>(args?: SelectSubset<T, InvoiceInstallmentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more InvoiceInstallments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceInstallmentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many InvoiceInstallments
     * const invoiceInstallment = await prisma.invoiceInstallment.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends InvoiceInstallmentUpdateManyArgs>(args: SelectSubset<T, InvoiceInstallmentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more InvoiceInstallments and returns the data updated in the database.
     * @param {InvoiceInstallmentUpdateManyAndReturnArgs} args - Arguments to update many InvoiceInstallments.
     * @example
     * // Update many InvoiceInstallments
     * const invoiceInstallment = await prisma.invoiceInstallment.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more InvoiceInstallments and only return the `id`
     * const invoiceInstallmentWithIdOnly = await prisma.invoiceInstallment.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends InvoiceInstallmentUpdateManyAndReturnArgs>(args: SelectSubset<T, InvoiceInstallmentUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InvoiceInstallmentPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one InvoiceInstallment.
     * @param {InvoiceInstallmentUpsertArgs} args - Arguments to update or create a InvoiceInstallment.
     * @example
     * // Update or create a InvoiceInstallment
     * const invoiceInstallment = await prisma.invoiceInstallment.upsert({
     *   create: {
     *     // ... data to create a InvoiceInstallment
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the InvoiceInstallment we want to update
     *   }
     * })
     */
    upsert<T extends InvoiceInstallmentUpsertArgs>(args: SelectSubset<T, InvoiceInstallmentUpsertArgs<ExtArgs>>): Prisma__InvoiceInstallmentClient<$Result.GetResult<Prisma.$InvoiceInstallmentPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of InvoiceInstallments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceInstallmentCountArgs} args - Arguments to filter InvoiceInstallments to count.
     * @example
     * // Count the number of InvoiceInstallments
     * const count = await prisma.invoiceInstallment.count({
     *   where: {
     *     // ... the filter for the InvoiceInstallments we want to count
     *   }
     * })
    **/
    count<T extends InvoiceInstallmentCountArgs>(
      args?: Subset<T, InvoiceInstallmentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], InvoiceInstallmentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a InvoiceInstallment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceInstallmentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends InvoiceInstallmentAggregateArgs>(args: Subset<T, InvoiceInstallmentAggregateArgs>): Prisma.PrismaPromise<GetInvoiceInstallmentAggregateType<T>>

    /**
     * Group by InvoiceInstallment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceInstallmentGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends InvoiceInstallmentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: InvoiceInstallmentGroupByArgs['orderBy'] }
        : { orderBy?: InvoiceInstallmentGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, InvoiceInstallmentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetInvoiceInstallmentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the InvoiceInstallment model
   */
  readonly fields: InvoiceInstallmentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for InvoiceInstallment.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__InvoiceInstallmentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    invoice<T extends InvoiceDefaultArgs<ExtArgs> = {}>(args?: Subset<T, InvoiceDefaultArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the InvoiceInstallment model
   */
  interface InvoiceInstallmentFieldRefs {
    readonly id: FieldRef<"InvoiceInstallment", 'String'>
    readonly invoiceId: FieldRef<"InvoiceInstallment", 'String'>
    readonly clientId: FieldRef<"InvoiceInstallment", 'String'>
    readonly projectId: FieldRef<"InvoiceInstallment", 'String'>
    readonly number: FieldRef<"InvoiceInstallment", 'Int'>
    readonly name: FieldRef<"InvoiceInstallment", 'String'>
    readonly amountCents: FieldRef<"InvoiceInstallment", 'BigInt'>
    readonly dueAt: FieldRef<"InvoiceInstallment", 'DateTime'>
    readonly paidAt: FieldRef<"InvoiceInstallment", 'DateTime'>
    readonly status: FieldRef<"InvoiceInstallment", 'String'>
    readonly createdAt: FieldRef<"InvoiceInstallment", 'DateTime'>
    readonly updatedAt: FieldRef<"InvoiceInstallment", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * InvoiceInstallment findUnique
   */
  export type InvoiceInstallmentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InvoiceInstallment
     */
    select?: InvoiceInstallmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InvoiceInstallment
     */
    omit?: InvoiceInstallmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInstallmentInclude<ExtArgs> | null
    /**
     * Filter, which InvoiceInstallment to fetch.
     */
    where: InvoiceInstallmentWhereUniqueInput
  }

  /**
   * InvoiceInstallment findUniqueOrThrow
   */
  export type InvoiceInstallmentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InvoiceInstallment
     */
    select?: InvoiceInstallmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InvoiceInstallment
     */
    omit?: InvoiceInstallmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInstallmentInclude<ExtArgs> | null
    /**
     * Filter, which InvoiceInstallment to fetch.
     */
    where: InvoiceInstallmentWhereUniqueInput
  }

  /**
   * InvoiceInstallment findFirst
   */
  export type InvoiceInstallmentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InvoiceInstallment
     */
    select?: InvoiceInstallmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InvoiceInstallment
     */
    omit?: InvoiceInstallmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInstallmentInclude<ExtArgs> | null
    /**
     * Filter, which InvoiceInstallment to fetch.
     */
    where?: InvoiceInstallmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of InvoiceInstallments to fetch.
     */
    orderBy?: InvoiceInstallmentOrderByWithRelationInput | InvoiceInstallmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for InvoiceInstallments.
     */
    cursor?: InvoiceInstallmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` InvoiceInstallments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` InvoiceInstallments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of InvoiceInstallments.
     */
    distinct?: InvoiceInstallmentScalarFieldEnum | InvoiceInstallmentScalarFieldEnum[]
  }

  /**
   * InvoiceInstallment findFirstOrThrow
   */
  export type InvoiceInstallmentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InvoiceInstallment
     */
    select?: InvoiceInstallmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InvoiceInstallment
     */
    omit?: InvoiceInstallmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInstallmentInclude<ExtArgs> | null
    /**
     * Filter, which InvoiceInstallment to fetch.
     */
    where?: InvoiceInstallmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of InvoiceInstallments to fetch.
     */
    orderBy?: InvoiceInstallmentOrderByWithRelationInput | InvoiceInstallmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for InvoiceInstallments.
     */
    cursor?: InvoiceInstallmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` InvoiceInstallments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` InvoiceInstallments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of InvoiceInstallments.
     */
    distinct?: InvoiceInstallmentScalarFieldEnum | InvoiceInstallmentScalarFieldEnum[]
  }

  /**
   * InvoiceInstallment findMany
   */
  export type InvoiceInstallmentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InvoiceInstallment
     */
    select?: InvoiceInstallmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InvoiceInstallment
     */
    omit?: InvoiceInstallmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInstallmentInclude<ExtArgs> | null
    /**
     * Filter, which InvoiceInstallments to fetch.
     */
    where?: InvoiceInstallmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of InvoiceInstallments to fetch.
     */
    orderBy?: InvoiceInstallmentOrderByWithRelationInput | InvoiceInstallmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing InvoiceInstallments.
     */
    cursor?: InvoiceInstallmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` InvoiceInstallments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` InvoiceInstallments.
     */
    skip?: number
    distinct?: InvoiceInstallmentScalarFieldEnum | InvoiceInstallmentScalarFieldEnum[]
  }

  /**
   * InvoiceInstallment create
   */
  export type InvoiceInstallmentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InvoiceInstallment
     */
    select?: InvoiceInstallmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InvoiceInstallment
     */
    omit?: InvoiceInstallmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInstallmentInclude<ExtArgs> | null
    /**
     * The data needed to create a InvoiceInstallment.
     */
    data: XOR<InvoiceInstallmentCreateInput, InvoiceInstallmentUncheckedCreateInput>
  }

  /**
   * InvoiceInstallment createMany
   */
  export type InvoiceInstallmentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many InvoiceInstallments.
     */
    data: InvoiceInstallmentCreateManyInput | InvoiceInstallmentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * InvoiceInstallment createManyAndReturn
   */
  export type InvoiceInstallmentCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InvoiceInstallment
     */
    select?: InvoiceInstallmentSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the InvoiceInstallment
     */
    omit?: InvoiceInstallmentOmit<ExtArgs> | null
    /**
     * The data used to create many InvoiceInstallments.
     */
    data: InvoiceInstallmentCreateManyInput | InvoiceInstallmentCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInstallmentIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * InvoiceInstallment update
   */
  export type InvoiceInstallmentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InvoiceInstallment
     */
    select?: InvoiceInstallmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InvoiceInstallment
     */
    omit?: InvoiceInstallmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInstallmentInclude<ExtArgs> | null
    /**
     * The data needed to update a InvoiceInstallment.
     */
    data: XOR<InvoiceInstallmentUpdateInput, InvoiceInstallmentUncheckedUpdateInput>
    /**
     * Choose, which InvoiceInstallment to update.
     */
    where: InvoiceInstallmentWhereUniqueInput
  }

  /**
   * InvoiceInstallment updateMany
   */
  export type InvoiceInstallmentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update InvoiceInstallments.
     */
    data: XOR<InvoiceInstallmentUpdateManyMutationInput, InvoiceInstallmentUncheckedUpdateManyInput>
    /**
     * Filter which InvoiceInstallments to update
     */
    where?: InvoiceInstallmentWhereInput
    /**
     * Limit how many InvoiceInstallments to update.
     */
    limit?: number
  }

  /**
   * InvoiceInstallment updateManyAndReturn
   */
  export type InvoiceInstallmentUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InvoiceInstallment
     */
    select?: InvoiceInstallmentSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the InvoiceInstallment
     */
    omit?: InvoiceInstallmentOmit<ExtArgs> | null
    /**
     * The data used to update InvoiceInstallments.
     */
    data: XOR<InvoiceInstallmentUpdateManyMutationInput, InvoiceInstallmentUncheckedUpdateManyInput>
    /**
     * Filter which InvoiceInstallments to update
     */
    where?: InvoiceInstallmentWhereInput
    /**
     * Limit how many InvoiceInstallments to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInstallmentIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * InvoiceInstallment upsert
   */
  export type InvoiceInstallmentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InvoiceInstallment
     */
    select?: InvoiceInstallmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InvoiceInstallment
     */
    omit?: InvoiceInstallmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInstallmentInclude<ExtArgs> | null
    /**
     * The filter to search for the InvoiceInstallment to update in case it exists.
     */
    where: InvoiceInstallmentWhereUniqueInput
    /**
     * In case the InvoiceInstallment found by the `where` argument doesn't exist, create a new InvoiceInstallment with this data.
     */
    create: XOR<InvoiceInstallmentCreateInput, InvoiceInstallmentUncheckedCreateInput>
    /**
     * In case the InvoiceInstallment was found with the provided `where` argument, update it with this data.
     */
    update: XOR<InvoiceInstallmentUpdateInput, InvoiceInstallmentUncheckedUpdateInput>
  }

  /**
   * InvoiceInstallment delete
   */
  export type InvoiceInstallmentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InvoiceInstallment
     */
    select?: InvoiceInstallmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InvoiceInstallment
     */
    omit?: InvoiceInstallmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInstallmentInclude<ExtArgs> | null
    /**
     * Filter which InvoiceInstallment to delete.
     */
    where: InvoiceInstallmentWhereUniqueInput
  }

  /**
   * InvoiceInstallment deleteMany
   */
  export type InvoiceInstallmentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which InvoiceInstallments to delete
     */
    where?: InvoiceInstallmentWhereInput
    /**
     * Limit how many InvoiceInstallments to delete.
     */
    limit?: number
  }

  /**
   * InvoiceInstallment without action
   */
  export type InvoiceInstallmentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InvoiceInstallment
     */
    select?: InvoiceInstallmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InvoiceInstallment
     */
    omit?: InvoiceInstallmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInstallmentInclude<ExtArgs> | null
  }


  /**
   * Model Expense
   */

  export type AggregateExpense = {
    _count: ExpenseCountAggregateOutputType | null
    _avg: ExpenseAvgAggregateOutputType | null
    _sum: ExpenseSumAggregateOutputType | null
    _min: ExpenseMinAggregateOutputType | null
    _max: ExpenseMaxAggregateOutputType | null
  }

  export type ExpenseAvgAggregateOutputType = {
    amountCents: number | null
  }

  export type ExpenseSumAggregateOutputType = {
    amountCents: bigint | null
  }

  export type ExpenseMinAggregateOutputType = {
    id: string | null
    clientId: string | null
    category: string | null
    subcategory: string | null
    description: string | null
    amountCents: bigint | null
    submittedBy: string | null
    status: string | null
    hasReceipt: boolean | null
    isBillable: boolean | null
    expenseDate: Date | null
    approvedAt: Date | null
    rejectedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ExpenseMaxAggregateOutputType = {
    id: string | null
    clientId: string | null
    category: string | null
    subcategory: string | null
    description: string | null
    amountCents: bigint | null
    submittedBy: string | null
    status: string | null
    hasReceipt: boolean | null
    isBillable: boolean | null
    expenseDate: Date | null
    approvedAt: Date | null
    rejectedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ExpenseCountAggregateOutputType = {
    id: number
    clientId: number
    category: number
    subcategory: number
    description: number
    amountCents: number
    submittedBy: number
    status: number
    hasReceipt: number
    isBillable: number
    expenseDate: number
    approvedAt: number
    rejectedAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ExpenseAvgAggregateInputType = {
    amountCents?: true
  }

  export type ExpenseSumAggregateInputType = {
    amountCents?: true
  }

  export type ExpenseMinAggregateInputType = {
    id?: true
    clientId?: true
    category?: true
    subcategory?: true
    description?: true
    amountCents?: true
    submittedBy?: true
    status?: true
    hasReceipt?: true
    isBillable?: true
    expenseDate?: true
    approvedAt?: true
    rejectedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ExpenseMaxAggregateInputType = {
    id?: true
    clientId?: true
    category?: true
    subcategory?: true
    description?: true
    amountCents?: true
    submittedBy?: true
    status?: true
    hasReceipt?: true
    isBillable?: true
    expenseDate?: true
    approvedAt?: true
    rejectedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ExpenseCountAggregateInputType = {
    id?: true
    clientId?: true
    category?: true
    subcategory?: true
    description?: true
    amountCents?: true
    submittedBy?: true
    status?: true
    hasReceipt?: true
    isBillable?: true
    expenseDate?: true
    approvedAt?: true
    rejectedAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ExpenseAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Expense to aggregate.
     */
    where?: ExpenseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Expenses to fetch.
     */
    orderBy?: ExpenseOrderByWithRelationInput | ExpenseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ExpenseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Expenses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Expenses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Expenses
    **/
    _count?: true | ExpenseCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ExpenseAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ExpenseSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ExpenseMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ExpenseMaxAggregateInputType
  }

  export type GetExpenseAggregateType<T extends ExpenseAggregateArgs> = {
        [P in keyof T & keyof AggregateExpense]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateExpense[P]>
      : GetScalarType<T[P], AggregateExpense[P]>
  }




  export type ExpenseGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ExpenseWhereInput
    orderBy?: ExpenseOrderByWithAggregationInput | ExpenseOrderByWithAggregationInput[]
    by: ExpenseScalarFieldEnum[] | ExpenseScalarFieldEnum
    having?: ExpenseScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ExpenseCountAggregateInputType | true
    _avg?: ExpenseAvgAggregateInputType
    _sum?: ExpenseSumAggregateInputType
    _min?: ExpenseMinAggregateInputType
    _max?: ExpenseMaxAggregateInputType
  }

  export type ExpenseGroupByOutputType = {
    id: string
    clientId: string | null
    category: string
    subcategory: string | null
    description: string
    amountCents: bigint
    submittedBy: string | null
    status: string
    hasReceipt: boolean
    isBillable: boolean
    expenseDate: Date
    approvedAt: Date | null
    rejectedAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: ExpenseCountAggregateOutputType | null
    _avg: ExpenseAvgAggregateOutputType | null
    _sum: ExpenseSumAggregateOutputType | null
    _min: ExpenseMinAggregateOutputType | null
    _max: ExpenseMaxAggregateOutputType | null
  }

  type GetExpenseGroupByPayload<T extends ExpenseGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ExpenseGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ExpenseGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ExpenseGroupByOutputType[P]>
            : GetScalarType<T[P], ExpenseGroupByOutputType[P]>
        }
      >
    >


  export type ExpenseSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    clientId?: boolean
    category?: boolean
    subcategory?: boolean
    description?: boolean
    amountCents?: boolean
    submittedBy?: boolean
    status?: boolean
    hasReceipt?: boolean
    isBillable?: boolean
    expenseDate?: boolean
    approvedAt?: boolean
    rejectedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["expense"]>

  export type ExpenseSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    clientId?: boolean
    category?: boolean
    subcategory?: boolean
    description?: boolean
    amountCents?: boolean
    submittedBy?: boolean
    status?: boolean
    hasReceipt?: boolean
    isBillable?: boolean
    expenseDate?: boolean
    approvedAt?: boolean
    rejectedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["expense"]>

  export type ExpenseSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    clientId?: boolean
    category?: boolean
    subcategory?: boolean
    description?: boolean
    amountCents?: boolean
    submittedBy?: boolean
    status?: boolean
    hasReceipt?: boolean
    isBillable?: boolean
    expenseDate?: boolean
    approvedAt?: boolean
    rejectedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["expense"]>

  export type ExpenseSelectScalar = {
    id?: boolean
    clientId?: boolean
    category?: boolean
    subcategory?: boolean
    description?: boolean
    amountCents?: boolean
    submittedBy?: boolean
    status?: boolean
    hasReceipt?: boolean
    isBillable?: boolean
    expenseDate?: boolean
    approvedAt?: boolean
    rejectedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ExpenseOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "clientId" | "category" | "subcategory" | "description" | "amountCents" | "submittedBy" | "status" | "hasReceipt" | "isBillable" | "expenseDate" | "approvedAt" | "rejectedAt" | "createdAt" | "updatedAt", ExtArgs["result"]["expense"]>

  export type $ExpensePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Expense"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      clientId: string | null
      category: string
      subcategory: string | null
      description: string
      amountCents: bigint
      submittedBy: string | null
      status: string
      hasReceipt: boolean
      isBillable: boolean
      expenseDate: Date
      approvedAt: Date | null
      rejectedAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["expense"]>
    composites: {}
  }

  type ExpenseGetPayload<S extends boolean | null | undefined | ExpenseDefaultArgs> = $Result.GetResult<Prisma.$ExpensePayload, S>

  type ExpenseCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ExpenseFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ExpenseCountAggregateInputType | true
    }

  export interface ExpenseDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Expense'], meta: { name: 'Expense' } }
    /**
     * Find zero or one Expense that matches the filter.
     * @param {ExpenseFindUniqueArgs} args - Arguments to find a Expense
     * @example
     * // Get one Expense
     * const expense = await prisma.expense.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ExpenseFindUniqueArgs>(args: SelectSubset<T, ExpenseFindUniqueArgs<ExtArgs>>): Prisma__ExpenseClient<$Result.GetResult<Prisma.$ExpensePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Expense that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ExpenseFindUniqueOrThrowArgs} args - Arguments to find a Expense
     * @example
     * // Get one Expense
     * const expense = await prisma.expense.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ExpenseFindUniqueOrThrowArgs>(args: SelectSubset<T, ExpenseFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ExpenseClient<$Result.GetResult<Prisma.$ExpensePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Expense that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExpenseFindFirstArgs} args - Arguments to find a Expense
     * @example
     * // Get one Expense
     * const expense = await prisma.expense.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ExpenseFindFirstArgs>(args?: SelectSubset<T, ExpenseFindFirstArgs<ExtArgs>>): Prisma__ExpenseClient<$Result.GetResult<Prisma.$ExpensePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Expense that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExpenseFindFirstOrThrowArgs} args - Arguments to find a Expense
     * @example
     * // Get one Expense
     * const expense = await prisma.expense.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ExpenseFindFirstOrThrowArgs>(args?: SelectSubset<T, ExpenseFindFirstOrThrowArgs<ExtArgs>>): Prisma__ExpenseClient<$Result.GetResult<Prisma.$ExpensePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Expenses that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExpenseFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Expenses
     * const expenses = await prisma.expense.findMany()
     * 
     * // Get first 10 Expenses
     * const expenses = await prisma.expense.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const expenseWithIdOnly = await prisma.expense.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ExpenseFindManyArgs>(args?: SelectSubset<T, ExpenseFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ExpensePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Expense.
     * @param {ExpenseCreateArgs} args - Arguments to create a Expense.
     * @example
     * // Create one Expense
     * const Expense = await prisma.expense.create({
     *   data: {
     *     // ... data to create a Expense
     *   }
     * })
     * 
     */
    create<T extends ExpenseCreateArgs>(args: SelectSubset<T, ExpenseCreateArgs<ExtArgs>>): Prisma__ExpenseClient<$Result.GetResult<Prisma.$ExpensePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Expenses.
     * @param {ExpenseCreateManyArgs} args - Arguments to create many Expenses.
     * @example
     * // Create many Expenses
     * const expense = await prisma.expense.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ExpenseCreateManyArgs>(args?: SelectSubset<T, ExpenseCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Expenses and returns the data saved in the database.
     * @param {ExpenseCreateManyAndReturnArgs} args - Arguments to create many Expenses.
     * @example
     * // Create many Expenses
     * const expense = await prisma.expense.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Expenses and only return the `id`
     * const expenseWithIdOnly = await prisma.expense.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ExpenseCreateManyAndReturnArgs>(args?: SelectSubset<T, ExpenseCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ExpensePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Expense.
     * @param {ExpenseDeleteArgs} args - Arguments to delete one Expense.
     * @example
     * // Delete one Expense
     * const Expense = await prisma.expense.delete({
     *   where: {
     *     // ... filter to delete one Expense
     *   }
     * })
     * 
     */
    delete<T extends ExpenseDeleteArgs>(args: SelectSubset<T, ExpenseDeleteArgs<ExtArgs>>): Prisma__ExpenseClient<$Result.GetResult<Prisma.$ExpensePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Expense.
     * @param {ExpenseUpdateArgs} args - Arguments to update one Expense.
     * @example
     * // Update one Expense
     * const expense = await prisma.expense.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ExpenseUpdateArgs>(args: SelectSubset<T, ExpenseUpdateArgs<ExtArgs>>): Prisma__ExpenseClient<$Result.GetResult<Prisma.$ExpensePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Expenses.
     * @param {ExpenseDeleteManyArgs} args - Arguments to filter Expenses to delete.
     * @example
     * // Delete a few Expenses
     * const { count } = await prisma.expense.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ExpenseDeleteManyArgs>(args?: SelectSubset<T, ExpenseDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Expenses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExpenseUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Expenses
     * const expense = await prisma.expense.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ExpenseUpdateManyArgs>(args: SelectSubset<T, ExpenseUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Expenses and returns the data updated in the database.
     * @param {ExpenseUpdateManyAndReturnArgs} args - Arguments to update many Expenses.
     * @example
     * // Update many Expenses
     * const expense = await prisma.expense.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Expenses and only return the `id`
     * const expenseWithIdOnly = await prisma.expense.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ExpenseUpdateManyAndReturnArgs>(args: SelectSubset<T, ExpenseUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ExpensePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Expense.
     * @param {ExpenseUpsertArgs} args - Arguments to update or create a Expense.
     * @example
     * // Update or create a Expense
     * const expense = await prisma.expense.upsert({
     *   create: {
     *     // ... data to create a Expense
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Expense we want to update
     *   }
     * })
     */
    upsert<T extends ExpenseUpsertArgs>(args: SelectSubset<T, ExpenseUpsertArgs<ExtArgs>>): Prisma__ExpenseClient<$Result.GetResult<Prisma.$ExpensePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Expenses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExpenseCountArgs} args - Arguments to filter Expenses to count.
     * @example
     * // Count the number of Expenses
     * const count = await prisma.expense.count({
     *   where: {
     *     // ... the filter for the Expenses we want to count
     *   }
     * })
    **/
    count<T extends ExpenseCountArgs>(
      args?: Subset<T, ExpenseCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ExpenseCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Expense.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExpenseAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ExpenseAggregateArgs>(args: Subset<T, ExpenseAggregateArgs>): Prisma.PrismaPromise<GetExpenseAggregateType<T>>

    /**
     * Group by Expense.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExpenseGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ExpenseGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ExpenseGroupByArgs['orderBy'] }
        : { orderBy?: ExpenseGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ExpenseGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetExpenseGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Expense model
   */
  readonly fields: ExpenseFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Expense.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ExpenseClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Expense model
   */
  interface ExpenseFieldRefs {
    readonly id: FieldRef<"Expense", 'String'>
    readonly clientId: FieldRef<"Expense", 'String'>
    readonly category: FieldRef<"Expense", 'String'>
    readonly subcategory: FieldRef<"Expense", 'String'>
    readonly description: FieldRef<"Expense", 'String'>
    readonly amountCents: FieldRef<"Expense", 'BigInt'>
    readonly submittedBy: FieldRef<"Expense", 'String'>
    readonly status: FieldRef<"Expense", 'String'>
    readonly hasReceipt: FieldRef<"Expense", 'Boolean'>
    readonly isBillable: FieldRef<"Expense", 'Boolean'>
    readonly expenseDate: FieldRef<"Expense", 'DateTime'>
    readonly approvedAt: FieldRef<"Expense", 'DateTime'>
    readonly rejectedAt: FieldRef<"Expense", 'DateTime'>
    readonly createdAt: FieldRef<"Expense", 'DateTime'>
    readonly updatedAt: FieldRef<"Expense", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Expense findUnique
   */
  export type ExpenseFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Expense
     */
    select?: ExpenseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Expense
     */
    omit?: ExpenseOmit<ExtArgs> | null
    /**
     * Filter, which Expense to fetch.
     */
    where: ExpenseWhereUniqueInput
  }

  /**
   * Expense findUniqueOrThrow
   */
  export type ExpenseFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Expense
     */
    select?: ExpenseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Expense
     */
    omit?: ExpenseOmit<ExtArgs> | null
    /**
     * Filter, which Expense to fetch.
     */
    where: ExpenseWhereUniqueInput
  }

  /**
   * Expense findFirst
   */
  export type ExpenseFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Expense
     */
    select?: ExpenseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Expense
     */
    omit?: ExpenseOmit<ExtArgs> | null
    /**
     * Filter, which Expense to fetch.
     */
    where?: ExpenseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Expenses to fetch.
     */
    orderBy?: ExpenseOrderByWithRelationInput | ExpenseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Expenses.
     */
    cursor?: ExpenseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Expenses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Expenses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Expenses.
     */
    distinct?: ExpenseScalarFieldEnum | ExpenseScalarFieldEnum[]
  }

  /**
   * Expense findFirstOrThrow
   */
  export type ExpenseFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Expense
     */
    select?: ExpenseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Expense
     */
    omit?: ExpenseOmit<ExtArgs> | null
    /**
     * Filter, which Expense to fetch.
     */
    where?: ExpenseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Expenses to fetch.
     */
    orderBy?: ExpenseOrderByWithRelationInput | ExpenseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Expenses.
     */
    cursor?: ExpenseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Expenses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Expenses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Expenses.
     */
    distinct?: ExpenseScalarFieldEnum | ExpenseScalarFieldEnum[]
  }

  /**
   * Expense findMany
   */
  export type ExpenseFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Expense
     */
    select?: ExpenseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Expense
     */
    omit?: ExpenseOmit<ExtArgs> | null
    /**
     * Filter, which Expenses to fetch.
     */
    where?: ExpenseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Expenses to fetch.
     */
    orderBy?: ExpenseOrderByWithRelationInput | ExpenseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Expenses.
     */
    cursor?: ExpenseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Expenses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Expenses.
     */
    skip?: number
    distinct?: ExpenseScalarFieldEnum | ExpenseScalarFieldEnum[]
  }

  /**
   * Expense create
   */
  export type ExpenseCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Expense
     */
    select?: ExpenseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Expense
     */
    omit?: ExpenseOmit<ExtArgs> | null
    /**
     * The data needed to create a Expense.
     */
    data: XOR<ExpenseCreateInput, ExpenseUncheckedCreateInput>
  }

  /**
   * Expense createMany
   */
  export type ExpenseCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Expenses.
     */
    data: ExpenseCreateManyInput | ExpenseCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Expense createManyAndReturn
   */
  export type ExpenseCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Expense
     */
    select?: ExpenseSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Expense
     */
    omit?: ExpenseOmit<ExtArgs> | null
    /**
     * The data used to create many Expenses.
     */
    data: ExpenseCreateManyInput | ExpenseCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Expense update
   */
  export type ExpenseUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Expense
     */
    select?: ExpenseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Expense
     */
    omit?: ExpenseOmit<ExtArgs> | null
    /**
     * The data needed to update a Expense.
     */
    data: XOR<ExpenseUpdateInput, ExpenseUncheckedUpdateInput>
    /**
     * Choose, which Expense to update.
     */
    where: ExpenseWhereUniqueInput
  }

  /**
   * Expense updateMany
   */
  export type ExpenseUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Expenses.
     */
    data: XOR<ExpenseUpdateManyMutationInput, ExpenseUncheckedUpdateManyInput>
    /**
     * Filter which Expenses to update
     */
    where?: ExpenseWhereInput
    /**
     * Limit how many Expenses to update.
     */
    limit?: number
  }

  /**
   * Expense updateManyAndReturn
   */
  export type ExpenseUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Expense
     */
    select?: ExpenseSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Expense
     */
    omit?: ExpenseOmit<ExtArgs> | null
    /**
     * The data used to update Expenses.
     */
    data: XOR<ExpenseUpdateManyMutationInput, ExpenseUncheckedUpdateManyInput>
    /**
     * Filter which Expenses to update
     */
    where?: ExpenseWhereInput
    /**
     * Limit how many Expenses to update.
     */
    limit?: number
  }

  /**
   * Expense upsert
   */
  export type ExpenseUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Expense
     */
    select?: ExpenseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Expense
     */
    omit?: ExpenseOmit<ExtArgs> | null
    /**
     * The filter to search for the Expense to update in case it exists.
     */
    where: ExpenseWhereUniqueInput
    /**
     * In case the Expense found by the `where` argument doesn't exist, create a new Expense with this data.
     */
    create: XOR<ExpenseCreateInput, ExpenseUncheckedCreateInput>
    /**
     * In case the Expense was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ExpenseUpdateInput, ExpenseUncheckedUpdateInput>
  }

  /**
   * Expense delete
   */
  export type ExpenseDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Expense
     */
    select?: ExpenseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Expense
     */
    omit?: ExpenseOmit<ExtArgs> | null
    /**
     * Filter which Expense to delete.
     */
    where: ExpenseWhereUniqueInput
  }

  /**
   * Expense deleteMany
   */
  export type ExpenseDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Expenses to delete
     */
    where?: ExpenseWhereInput
    /**
     * Limit how many Expenses to delete.
     */
    limit?: number
  }

  /**
   * Expense without action
   */
  export type ExpenseDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Expense
     */
    select?: ExpenseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Expense
     */
    omit?: ExpenseOmit<ExtArgs> | null
  }


  /**
   * Model ExpenseBudget
   */

  export type AggregateExpenseBudget = {
    _count: ExpenseBudgetCountAggregateOutputType | null
    _avg: ExpenseBudgetAvgAggregateOutputType | null
    _sum: ExpenseBudgetSumAggregateOutputType | null
    _min: ExpenseBudgetMinAggregateOutputType | null
    _max: ExpenseBudgetMaxAggregateOutputType | null
  }

  export type ExpenseBudgetAvgAggregateOutputType = {
    budgetCents: number | null
    spentCents: number | null
    fiscalYear: number | null
  }

  export type ExpenseBudgetSumAggregateOutputType = {
    budgetCents: bigint | null
    spentCents: bigint | null
    fiscalYear: number | null
  }

  export type ExpenseBudgetMinAggregateOutputType = {
    id: string | null
    category: string | null
    budgetCents: bigint | null
    spentCents: bigint | null
    fiscalYear: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ExpenseBudgetMaxAggregateOutputType = {
    id: string | null
    category: string | null
    budgetCents: bigint | null
    spentCents: bigint | null
    fiscalYear: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ExpenseBudgetCountAggregateOutputType = {
    id: number
    category: number
    budgetCents: number
    spentCents: number
    fiscalYear: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ExpenseBudgetAvgAggregateInputType = {
    budgetCents?: true
    spentCents?: true
    fiscalYear?: true
  }

  export type ExpenseBudgetSumAggregateInputType = {
    budgetCents?: true
    spentCents?: true
    fiscalYear?: true
  }

  export type ExpenseBudgetMinAggregateInputType = {
    id?: true
    category?: true
    budgetCents?: true
    spentCents?: true
    fiscalYear?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ExpenseBudgetMaxAggregateInputType = {
    id?: true
    category?: true
    budgetCents?: true
    spentCents?: true
    fiscalYear?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ExpenseBudgetCountAggregateInputType = {
    id?: true
    category?: true
    budgetCents?: true
    spentCents?: true
    fiscalYear?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ExpenseBudgetAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ExpenseBudget to aggregate.
     */
    where?: ExpenseBudgetWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ExpenseBudgets to fetch.
     */
    orderBy?: ExpenseBudgetOrderByWithRelationInput | ExpenseBudgetOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ExpenseBudgetWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ExpenseBudgets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ExpenseBudgets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ExpenseBudgets
    **/
    _count?: true | ExpenseBudgetCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ExpenseBudgetAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ExpenseBudgetSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ExpenseBudgetMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ExpenseBudgetMaxAggregateInputType
  }

  export type GetExpenseBudgetAggregateType<T extends ExpenseBudgetAggregateArgs> = {
        [P in keyof T & keyof AggregateExpenseBudget]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateExpenseBudget[P]>
      : GetScalarType<T[P], AggregateExpenseBudget[P]>
  }




  export type ExpenseBudgetGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ExpenseBudgetWhereInput
    orderBy?: ExpenseBudgetOrderByWithAggregationInput | ExpenseBudgetOrderByWithAggregationInput[]
    by: ExpenseBudgetScalarFieldEnum[] | ExpenseBudgetScalarFieldEnum
    having?: ExpenseBudgetScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ExpenseBudgetCountAggregateInputType | true
    _avg?: ExpenseBudgetAvgAggregateInputType
    _sum?: ExpenseBudgetSumAggregateInputType
    _min?: ExpenseBudgetMinAggregateInputType
    _max?: ExpenseBudgetMaxAggregateInputType
  }

  export type ExpenseBudgetGroupByOutputType = {
    id: string
    category: string
    budgetCents: bigint
    spentCents: bigint
    fiscalYear: number
    createdAt: Date
    updatedAt: Date
    _count: ExpenseBudgetCountAggregateOutputType | null
    _avg: ExpenseBudgetAvgAggregateOutputType | null
    _sum: ExpenseBudgetSumAggregateOutputType | null
    _min: ExpenseBudgetMinAggregateOutputType | null
    _max: ExpenseBudgetMaxAggregateOutputType | null
  }

  type GetExpenseBudgetGroupByPayload<T extends ExpenseBudgetGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ExpenseBudgetGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ExpenseBudgetGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ExpenseBudgetGroupByOutputType[P]>
            : GetScalarType<T[P], ExpenseBudgetGroupByOutputType[P]>
        }
      >
    >


  export type ExpenseBudgetSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    category?: boolean
    budgetCents?: boolean
    spentCents?: boolean
    fiscalYear?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["expenseBudget"]>

  export type ExpenseBudgetSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    category?: boolean
    budgetCents?: boolean
    spentCents?: boolean
    fiscalYear?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["expenseBudget"]>

  export type ExpenseBudgetSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    category?: boolean
    budgetCents?: boolean
    spentCents?: boolean
    fiscalYear?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["expenseBudget"]>

  export type ExpenseBudgetSelectScalar = {
    id?: boolean
    category?: boolean
    budgetCents?: boolean
    spentCents?: boolean
    fiscalYear?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ExpenseBudgetOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "category" | "budgetCents" | "spentCents" | "fiscalYear" | "createdAt" | "updatedAt", ExtArgs["result"]["expenseBudget"]>

  export type $ExpenseBudgetPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ExpenseBudget"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      category: string
      budgetCents: bigint
      spentCents: bigint
      fiscalYear: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["expenseBudget"]>
    composites: {}
  }

  type ExpenseBudgetGetPayload<S extends boolean | null | undefined | ExpenseBudgetDefaultArgs> = $Result.GetResult<Prisma.$ExpenseBudgetPayload, S>

  type ExpenseBudgetCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ExpenseBudgetFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ExpenseBudgetCountAggregateInputType | true
    }

  export interface ExpenseBudgetDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ExpenseBudget'], meta: { name: 'ExpenseBudget' } }
    /**
     * Find zero or one ExpenseBudget that matches the filter.
     * @param {ExpenseBudgetFindUniqueArgs} args - Arguments to find a ExpenseBudget
     * @example
     * // Get one ExpenseBudget
     * const expenseBudget = await prisma.expenseBudget.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ExpenseBudgetFindUniqueArgs>(args: SelectSubset<T, ExpenseBudgetFindUniqueArgs<ExtArgs>>): Prisma__ExpenseBudgetClient<$Result.GetResult<Prisma.$ExpenseBudgetPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ExpenseBudget that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ExpenseBudgetFindUniqueOrThrowArgs} args - Arguments to find a ExpenseBudget
     * @example
     * // Get one ExpenseBudget
     * const expenseBudget = await prisma.expenseBudget.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ExpenseBudgetFindUniqueOrThrowArgs>(args: SelectSubset<T, ExpenseBudgetFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ExpenseBudgetClient<$Result.GetResult<Prisma.$ExpenseBudgetPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ExpenseBudget that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExpenseBudgetFindFirstArgs} args - Arguments to find a ExpenseBudget
     * @example
     * // Get one ExpenseBudget
     * const expenseBudget = await prisma.expenseBudget.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ExpenseBudgetFindFirstArgs>(args?: SelectSubset<T, ExpenseBudgetFindFirstArgs<ExtArgs>>): Prisma__ExpenseBudgetClient<$Result.GetResult<Prisma.$ExpenseBudgetPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ExpenseBudget that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExpenseBudgetFindFirstOrThrowArgs} args - Arguments to find a ExpenseBudget
     * @example
     * // Get one ExpenseBudget
     * const expenseBudget = await prisma.expenseBudget.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ExpenseBudgetFindFirstOrThrowArgs>(args?: SelectSubset<T, ExpenseBudgetFindFirstOrThrowArgs<ExtArgs>>): Prisma__ExpenseBudgetClient<$Result.GetResult<Prisma.$ExpenseBudgetPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ExpenseBudgets that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExpenseBudgetFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ExpenseBudgets
     * const expenseBudgets = await prisma.expenseBudget.findMany()
     * 
     * // Get first 10 ExpenseBudgets
     * const expenseBudgets = await prisma.expenseBudget.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const expenseBudgetWithIdOnly = await prisma.expenseBudget.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ExpenseBudgetFindManyArgs>(args?: SelectSubset<T, ExpenseBudgetFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ExpenseBudgetPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ExpenseBudget.
     * @param {ExpenseBudgetCreateArgs} args - Arguments to create a ExpenseBudget.
     * @example
     * // Create one ExpenseBudget
     * const ExpenseBudget = await prisma.expenseBudget.create({
     *   data: {
     *     // ... data to create a ExpenseBudget
     *   }
     * })
     * 
     */
    create<T extends ExpenseBudgetCreateArgs>(args: SelectSubset<T, ExpenseBudgetCreateArgs<ExtArgs>>): Prisma__ExpenseBudgetClient<$Result.GetResult<Prisma.$ExpenseBudgetPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ExpenseBudgets.
     * @param {ExpenseBudgetCreateManyArgs} args - Arguments to create many ExpenseBudgets.
     * @example
     * // Create many ExpenseBudgets
     * const expenseBudget = await prisma.expenseBudget.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ExpenseBudgetCreateManyArgs>(args?: SelectSubset<T, ExpenseBudgetCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ExpenseBudgets and returns the data saved in the database.
     * @param {ExpenseBudgetCreateManyAndReturnArgs} args - Arguments to create many ExpenseBudgets.
     * @example
     * // Create many ExpenseBudgets
     * const expenseBudget = await prisma.expenseBudget.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ExpenseBudgets and only return the `id`
     * const expenseBudgetWithIdOnly = await prisma.expenseBudget.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ExpenseBudgetCreateManyAndReturnArgs>(args?: SelectSubset<T, ExpenseBudgetCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ExpenseBudgetPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ExpenseBudget.
     * @param {ExpenseBudgetDeleteArgs} args - Arguments to delete one ExpenseBudget.
     * @example
     * // Delete one ExpenseBudget
     * const ExpenseBudget = await prisma.expenseBudget.delete({
     *   where: {
     *     // ... filter to delete one ExpenseBudget
     *   }
     * })
     * 
     */
    delete<T extends ExpenseBudgetDeleteArgs>(args: SelectSubset<T, ExpenseBudgetDeleteArgs<ExtArgs>>): Prisma__ExpenseBudgetClient<$Result.GetResult<Prisma.$ExpenseBudgetPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ExpenseBudget.
     * @param {ExpenseBudgetUpdateArgs} args - Arguments to update one ExpenseBudget.
     * @example
     * // Update one ExpenseBudget
     * const expenseBudget = await prisma.expenseBudget.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ExpenseBudgetUpdateArgs>(args: SelectSubset<T, ExpenseBudgetUpdateArgs<ExtArgs>>): Prisma__ExpenseBudgetClient<$Result.GetResult<Prisma.$ExpenseBudgetPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ExpenseBudgets.
     * @param {ExpenseBudgetDeleteManyArgs} args - Arguments to filter ExpenseBudgets to delete.
     * @example
     * // Delete a few ExpenseBudgets
     * const { count } = await prisma.expenseBudget.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ExpenseBudgetDeleteManyArgs>(args?: SelectSubset<T, ExpenseBudgetDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ExpenseBudgets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExpenseBudgetUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ExpenseBudgets
     * const expenseBudget = await prisma.expenseBudget.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ExpenseBudgetUpdateManyArgs>(args: SelectSubset<T, ExpenseBudgetUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ExpenseBudgets and returns the data updated in the database.
     * @param {ExpenseBudgetUpdateManyAndReturnArgs} args - Arguments to update many ExpenseBudgets.
     * @example
     * // Update many ExpenseBudgets
     * const expenseBudget = await prisma.expenseBudget.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ExpenseBudgets and only return the `id`
     * const expenseBudgetWithIdOnly = await prisma.expenseBudget.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ExpenseBudgetUpdateManyAndReturnArgs>(args: SelectSubset<T, ExpenseBudgetUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ExpenseBudgetPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ExpenseBudget.
     * @param {ExpenseBudgetUpsertArgs} args - Arguments to update or create a ExpenseBudget.
     * @example
     * // Update or create a ExpenseBudget
     * const expenseBudget = await prisma.expenseBudget.upsert({
     *   create: {
     *     // ... data to create a ExpenseBudget
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ExpenseBudget we want to update
     *   }
     * })
     */
    upsert<T extends ExpenseBudgetUpsertArgs>(args: SelectSubset<T, ExpenseBudgetUpsertArgs<ExtArgs>>): Prisma__ExpenseBudgetClient<$Result.GetResult<Prisma.$ExpenseBudgetPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ExpenseBudgets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExpenseBudgetCountArgs} args - Arguments to filter ExpenseBudgets to count.
     * @example
     * // Count the number of ExpenseBudgets
     * const count = await prisma.expenseBudget.count({
     *   where: {
     *     // ... the filter for the ExpenseBudgets we want to count
     *   }
     * })
    **/
    count<T extends ExpenseBudgetCountArgs>(
      args?: Subset<T, ExpenseBudgetCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ExpenseBudgetCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ExpenseBudget.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExpenseBudgetAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ExpenseBudgetAggregateArgs>(args: Subset<T, ExpenseBudgetAggregateArgs>): Prisma.PrismaPromise<GetExpenseBudgetAggregateType<T>>

    /**
     * Group by ExpenseBudget.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExpenseBudgetGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ExpenseBudgetGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ExpenseBudgetGroupByArgs['orderBy'] }
        : { orderBy?: ExpenseBudgetGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ExpenseBudgetGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetExpenseBudgetGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ExpenseBudget model
   */
  readonly fields: ExpenseBudgetFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ExpenseBudget.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ExpenseBudgetClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ExpenseBudget model
   */
  interface ExpenseBudgetFieldRefs {
    readonly id: FieldRef<"ExpenseBudget", 'String'>
    readonly category: FieldRef<"ExpenseBudget", 'String'>
    readonly budgetCents: FieldRef<"ExpenseBudget", 'BigInt'>
    readonly spentCents: FieldRef<"ExpenseBudget", 'BigInt'>
    readonly fiscalYear: FieldRef<"ExpenseBudget", 'Int'>
    readonly createdAt: FieldRef<"ExpenseBudget", 'DateTime'>
    readonly updatedAt: FieldRef<"ExpenseBudget", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ExpenseBudget findUnique
   */
  export type ExpenseBudgetFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExpenseBudget
     */
    select?: ExpenseBudgetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ExpenseBudget
     */
    omit?: ExpenseBudgetOmit<ExtArgs> | null
    /**
     * Filter, which ExpenseBudget to fetch.
     */
    where: ExpenseBudgetWhereUniqueInput
  }

  /**
   * ExpenseBudget findUniqueOrThrow
   */
  export type ExpenseBudgetFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExpenseBudget
     */
    select?: ExpenseBudgetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ExpenseBudget
     */
    omit?: ExpenseBudgetOmit<ExtArgs> | null
    /**
     * Filter, which ExpenseBudget to fetch.
     */
    where: ExpenseBudgetWhereUniqueInput
  }

  /**
   * ExpenseBudget findFirst
   */
  export type ExpenseBudgetFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExpenseBudget
     */
    select?: ExpenseBudgetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ExpenseBudget
     */
    omit?: ExpenseBudgetOmit<ExtArgs> | null
    /**
     * Filter, which ExpenseBudget to fetch.
     */
    where?: ExpenseBudgetWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ExpenseBudgets to fetch.
     */
    orderBy?: ExpenseBudgetOrderByWithRelationInput | ExpenseBudgetOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ExpenseBudgets.
     */
    cursor?: ExpenseBudgetWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ExpenseBudgets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ExpenseBudgets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ExpenseBudgets.
     */
    distinct?: ExpenseBudgetScalarFieldEnum | ExpenseBudgetScalarFieldEnum[]
  }

  /**
   * ExpenseBudget findFirstOrThrow
   */
  export type ExpenseBudgetFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExpenseBudget
     */
    select?: ExpenseBudgetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ExpenseBudget
     */
    omit?: ExpenseBudgetOmit<ExtArgs> | null
    /**
     * Filter, which ExpenseBudget to fetch.
     */
    where?: ExpenseBudgetWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ExpenseBudgets to fetch.
     */
    orderBy?: ExpenseBudgetOrderByWithRelationInput | ExpenseBudgetOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ExpenseBudgets.
     */
    cursor?: ExpenseBudgetWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ExpenseBudgets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ExpenseBudgets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ExpenseBudgets.
     */
    distinct?: ExpenseBudgetScalarFieldEnum | ExpenseBudgetScalarFieldEnum[]
  }

  /**
   * ExpenseBudget findMany
   */
  export type ExpenseBudgetFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExpenseBudget
     */
    select?: ExpenseBudgetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ExpenseBudget
     */
    omit?: ExpenseBudgetOmit<ExtArgs> | null
    /**
     * Filter, which ExpenseBudgets to fetch.
     */
    where?: ExpenseBudgetWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ExpenseBudgets to fetch.
     */
    orderBy?: ExpenseBudgetOrderByWithRelationInput | ExpenseBudgetOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ExpenseBudgets.
     */
    cursor?: ExpenseBudgetWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ExpenseBudgets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ExpenseBudgets.
     */
    skip?: number
    distinct?: ExpenseBudgetScalarFieldEnum | ExpenseBudgetScalarFieldEnum[]
  }

  /**
   * ExpenseBudget create
   */
  export type ExpenseBudgetCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExpenseBudget
     */
    select?: ExpenseBudgetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ExpenseBudget
     */
    omit?: ExpenseBudgetOmit<ExtArgs> | null
    /**
     * The data needed to create a ExpenseBudget.
     */
    data: XOR<ExpenseBudgetCreateInput, ExpenseBudgetUncheckedCreateInput>
  }

  /**
   * ExpenseBudget createMany
   */
  export type ExpenseBudgetCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ExpenseBudgets.
     */
    data: ExpenseBudgetCreateManyInput | ExpenseBudgetCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ExpenseBudget createManyAndReturn
   */
  export type ExpenseBudgetCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExpenseBudget
     */
    select?: ExpenseBudgetSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ExpenseBudget
     */
    omit?: ExpenseBudgetOmit<ExtArgs> | null
    /**
     * The data used to create many ExpenseBudgets.
     */
    data: ExpenseBudgetCreateManyInput | ExpenseBudgetCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ExpenseBudget update
   */
  export type ExpenseBudgetUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExpenseBudget
     */
    select?: ExpenseBudgetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ExpenseBudget
     */
    omit?: ExpenseBudgetOmit<ExtArgs> | null
    /**
     * The data needed to update a ExpenseBudget.
     */
    data: XOR<ExpenseBudgetUpdateInput, ExpenseBudgetUncheckedUpdateInput>
    /**
     * Choose, which ExpenseBudget to update.
     */
    where: ExpenseBudgetWhereUniqueInput
  }

  /**
   * ExpenseBudget updateMany
   */
  export type ExpenseBudgetUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ExpenseBudgets.
     */
    data: XOR<ExpenseBudgetUpdateManyMutationInput, ExpenseBudgetUncheckedUpdateManyInput>
    /**
     * Filter which ExpenseBudgets to update
     */
    where?: ExpenseBudgetWhereInput
    /**
     * Limit how many ExpenseBudgets to update.
     */
    limit?: number
  }

  /**
   * ExpenseBudget updateManyAndReturn
   */
  export type ExpenseBudgetUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExpenseBudget
     */
    select?: ExpenseBudgetSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ExpenseBudget
     */
    omit?: ExpenseBudgetOmit<ExtArgs> | null
    /**
     * The data used to update ExpenseBudgets.
     */
    data: XOR<ExpenseBudgetUpdateManyMutationInput, ExpenseBudgetUncheckedUpdateManyInput>
    /**
     * Filter which ExpenseBudgets to update
     */
    where?: ExpenseBudgetWhereInput
    /**
     * Limit how many ExpenseBudgets to update.
     */
    limit?: number
  }

  /**
   * ExpenseBudget upsert
   */
  export type ExpenseBudgetUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExpenseBudget
     */
    select?: ExpenseBudgetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ExpenseBudget
     */
    omit?: ExpenseBudgetOmit<ExtArgs> | null
    /**
     * The filter to search for the ExpenseBudget to update in case it exists.
     */
    where: ExpenseBudgetWhereUniqueInput
    /**
     * In case the ExpenseBudget found by the `where` argument doesn't exist, create a new ExpenseBudget with this data.
     */
    create: XOR<ExpenseBudgetCreateInput, ExpenseBudgetUncheckedCreateInput>
    /**
     * In case the ExpenseBudget was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ExpenseBudgetUpdateInput, ExpenseBudgetUncheckedUpdateInput>
  }

  /**
   * ExpenseBudget delete
   */
  export type ExpenseBudgetDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExpenseBudget
     */
    select?: ExpenseBudgetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ExpenseBudget
     */
    omit?: ExpenseBudgetOmit<ExtArgs> | null
    /**
     * Filter which ExpenseBudget to delete.
     */
    where: ExpenseBudgetWhereUniqueInput
  }

  /**
   * ExpenseBudget deleteMany
   */
  export type ExpenseBudgetDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ExpenseBudgets to delete
     */
    where?: ExpenseBudgetWhereInput
    /**
     * Limit how many ExpenseBudgets to delete.
     */
    limit?: number
  }

  /**
   * ExpenseBudget without action
   */
  export type ExpenseBudgetDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExpenseBudget
     */
    select?: ExpenseBudgetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ExpenseBudget
     */
    omit?: ExpenseBudgetOmit<ExtArgs> | null
  }


  /**
   * Model LoyaltyAccount
   */

  export type AggregateLoyaltyAccount = {
    _count: LoyaltyAccountCountAggregateOutputType | null
    _avg: LoyaltyAccountAvgAggregateOutputType | null
    _sum: LoyaltyAccountSumAggregateOutputType | null
    _min: LoyaltyAccountMinAggregateOutputType | null
    _max: LoyaltyAccountMaxAggregateOutputType | null
  }

  export type LoyaltyAccountAvgAggregateOutputType = {
    balancePoints: number | null
    totalEarned: number | null
  }

  export type LoyaltyAccountSumAggregateOutputType = {
    balancePoints: number | null
    totalEarned: number | null
  }

  export type LoyaltyAccountMinAggregateOutputType = {
    id: string | null
    clientId: string | null
    tier: string | null
    balancePoints: number | null
    totalEarned: number | null
    lastActivityAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LoyaltyAccountMaxAggregateOutputType = {
    id: string | null
    clientId: string | null
    tier: string | null
    balancePoints: number | null
    totalEarned: number | null
    lastActivityAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LoyaltyAccountCountAggregateOutputType = {
    id: number
    clientId: number
    tier: number
    balancePoints: number
    totalEarned: number
    lastActivityAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type LoyaltyAccountAvgAggregateInputType = {
    balancePoints?: true
    totalEarned?: true
  }

  export type LoyaltyAccountSumAggregateInputType = {
    balancePoints?: true
    totalEarned?: true
  }

  export type LoyaltyAccountMinAggregateInputType = {
    id?: true
    clientId?: true
    tier?: true
    balancePoints?: true
    totalEarned?: true
    lastActivityAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LoyaltyAccountMaxAggregateInputType = {
    id?: true
    clientId?: true
    tier?: true
    balancePoints?: true
    totalEarned?: true
    lastActivityAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LoyaltyAccountCountAggregateInputType = {
    id?: true
    clientId?: true
    tier?: true
    balancePoints?: true
    totalEarned?: true
    lastActivityAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type LoyaltyAccountAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LoyaltyAccount to aggregate.
     */
    where?: LoyaltyAccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LoyaltyAccounts to fetch.
     */
    orderBy?: LoyaltyAccountOrderByWithRelationInput | LoyaltyAccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LoyaltyAccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LoyaltyAccounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LoyaltyAccounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned LoyaltyAccounts
    **/
    _count?: true | LoyaltyAccountCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: LoyaltyAccountAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: LoyaltyAccountSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LoyaltyAccountMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LoyaltyAccountMaxAggregateInputType
  }

  export type GetLoyaltyAccountAggregateType<T extends LoyaltyAccountAggregateArgs> = {
        [P in keyof T & keyof AggregateLoyaltyAccount]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLoyaltyAccount[P]>
      : GetScalarType<T[P], AggregateLoyaltyAccount[P]>
  }




  export type LoyaltyAccountGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LoyaltyAccountWhereInput
    orderBy?: LoyaltyAccountOrderByWithAggregationInput | LoyaltyAccountOrderByWithAggregationInput[]
    by: LoyaltyAccountScalarFieldEnum[] | LoyaltyAccountScalarFieldEnum
    having?: LoyaltyAccountScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LoyaltyAccountCountAggregateInputType | true
    _avg?: LoyaltyAccountAvgAggregateInputType
    _sum?: LoyaltyAccountSumAggregateInputType
    _min?: LoyaltyAccountMinAggregateInputType
    _max?: LoyaltyAccountMaxAggregateInputType
  }

  export type LoyaltyAccountGroupByOutputType = {
    id: string
    clientId: string
    tier: string
    balancePoints: number
    totalEarned: number
    lastActivityAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: LoyaltyAccountCountAggregateOutputType | null
    _avg: LoyaltyAccountAvgAggregateOutputType | null
    _sum: LoyaltyAccountSumAggregateOutputType | null
    _min: LoyaltyAccountMinAggregateOutputType | null
    _max: LoyaltyAccountMaxAggregateOutputType | null
  }

  type GetLoyaltyAccountGroupByPayload<T extends LoyaltyAccountGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LoyaltyAccountGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LoyaltyAccountGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LoyaltyAccountGroupByOutputType[P]>
            : GetScalarType<T[P], LoyaltyAccountGroupByOutputType[P]>
        }
      >
    >


  export type LoyaltyAccountSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    clientId?: boolean
    tier?: boolean
    balancePoints?: boolean
    totalEarned?: boolean
    lastActivityAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    transactions?: boolean | LoyaltyAccount$transactionsArgs<ExtArgs>
    _count?: boolean | LoyaltyAccountCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["loyaltyAccount"]>

  export type LoyaltyAccountSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    clientId?: boolean
    tier?: boolean
    balancePoints?: boolean
    totalEarned?: boolean
    lastActivityAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["loyaltyAccount"]>

  export type LoyaltyAccountSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    clientId?: boolean
    tier?: boolean
    balancePoints?: boolean
    totalEarned?: boolean
    lastActivityAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["loyaltyAccount"]>

  export type LoyaltyAccountSelectScalar = {
    id?: boolean
    clientId?: boolean
    tier?: boolean
    balancePoints?: boolean
    totalEarned?: boolean
    lastActivityAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type LoyaltyAccountOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "clientId" | "tier" | "balancePoints" | "totalEarned" | "lastActivityAt" | "createdAt" | "updatedAt", ExtArgs["result"]["loyaltyAccount"]>
  export type LoyaltyAccountInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    transactions?: boolean | LoyaltyAccount$transactionsArgs<ExtArgs>
    _count?: boolean | LoyaltyAccountCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type LoyaltyAccountIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type LoyaltyAccountIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $LoyaltyAccountPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "LoyaltyAccount"
    objects: {
      transactions: Prisma.$CreditTransactionPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      clientId: string
      tier: string
      balancePoints: number
      totalEarned: number
      lastActivityAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["loyaltyAccount"]>
    composites: {}
  }

  type LoyaltyAccountGetPayload<S extends boolean | null | undefined | LoyaltyAccountDefaultArgs> = $Result.GetResult<Prisma.$LoyaltyAccountPayload, S>

  type LoyaltyAccountCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<LoyaltyAccountFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: LoyaltyAccountCountAggregateInputType | true
    }

  export interface LoyaltyAccountDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['LoyaltyAccount'], meta: { name: 'LoyaltyAccount' } }
    /**
     * Find zero or one LoyaltyAccount that matches the filter.
     * @param {LoyaltyAccountFindUniqueArgs} args - Arguments to find a LoyaltyAccount
     * @example
     * // Get one LoyaltyAccount
     * const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LoyaltyAccountFindUniqueArgs>(args: SelectSubset<T, LoyaltyAccountFindUniqueArgs<ExtArgs>>): Prisma__LoyaltyAccountClient<$Result.GetResult<Prisma.$LoyaltyAccountPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one LoyaltyAccount that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {LoyaltyAccountFindUniqueOrThrowArgs} args - Arguments to find a LoyaltyAccount
     * @example
     * // Get one LoyaltyAccount
     * const loyaltyAccount = await prisma.loyaltyAccount.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LoyaltyAccountFindUniqueOrThrowArgs>(args: SelectSubset<T, LoyaltyAccountFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LoyaltyAccountClient<$Result.GetResult<Prisma.$LoyaltyAccountPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first LoyaltyAccount that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoyaltyAccountFindFirstArgs} args - Arguments to find a LoyaltyAccount
     * @example
     * // Get one LoyaltyAccount
     * const loyaltyAccount = await prisma.loyaltyAccount.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LoyaltyAccountFindFirstArgs>(args?: SelectSubset<T, LoyaltyAccountFindFirstArgs<ExtArgs>>): Prisma__LoyaltyAccountClient<$Result.GetResult<Prisma.$LoyaltyAccountPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first LoyaltyAccount that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoyaltyAccountFindFirstOrThrowArgs} args - Arguments to find a LoyaltyAccount
     * @example
     * // Get one LoyaltyAccount
     * const loyaltyAccount = await prisma.loyaltyAccount.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LoyaltyAccountFindFirstOrThrowArgs>(args?: SelectSubset<T, LoyaltyAccountFindFirstOrThrowArgs<ExtArgs>>): Prisma__LoyaltyAccountClient<$Result.GetResult<Prisma.$LoyaltyAccountPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more LoyaltyAccounts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoyaltyAccountFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all LoyaltyAccounts
     * const loyaltyAccounts = await prisma.loyaltyAccount.findMany()
     * 
     * // Get first 10 LoyaltyAccounts
     * const loyaltyAccounts = await prisma.loyaltyAccount.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const loyaltyAccountWithIdOnly = await prisma.loyaltyAccount.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LoyaltyAccountFindManyArgs>(args?: SelectSubset<T, LoyaltyAccountFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LoyaltyAccountPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a LoyaltyAccount.
     * @param {LoyaltyAccountCreateArgs} args - Arguments to create a LoyaltyAccount.
     * @example
     * // Create one LoyaltyAccount
     * const LoyaltyAccount = await prisma.loyaltyAccount.create({
     *   data: {
     *     // ... data to create a LoyaltyAccount
     *   }
     * })
     * 
     */
    create<T extends LoyaltyAccountCreateArgs>(args: SelectSubset<T, LoyaltyAccountCreateArgs<ExtArgs>>): Prisma__LoyaltyAccountClient<$Result.GetResult<Prisma.$LoyaltyAccountPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many LoyaltyAccounts.
     * @param {LoyaltyAccountCreateManyArgs} args - Arguments to create many LoyaltyAccounts.
     * @example
     * // Create many LoyaltyAccounts
     * const loyaltyAccount = await prisma.loyaltyAccount.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LoyaltyAccountCreateManyArgs>(args?: SelectSubset<T, LoyaltyAccountCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many LoyaltyAccounts and returns the data saved in the database.
     * @param {LoyaltyAccountCreateManyAndReturnArgs} args - Arguments to create many LoyaltyAccounts.
     * @example
     * // Create many LoyaltyAccounts
     * const loyaltyAccount = await prisma.loyaltyAccount.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many LoyaltyAccounts and only return the `id`
     * const loyaltyAccountWithIdOnly = await prisma.loyaltyAccount.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LoyaltyAccountCreateManyAndReturnArgs>(args?: SelectSubset<T, LoyaltyAccountCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LoyaltyAccountPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a LoyaltyAccount.
     * @param {LoyaltyAccountDeleteArgs} args - Arguments to delete one LoyaltyAccount.
     * @example
     * // Delete one LoyaltyAccount
     * const LoyaltyAccount = await prisma.loyaltyAccount.delete({
     *   where: {
     *     // ... filter to delete one LoyaltyAccount
     *   }
     * })
     * 
     */
    delete<T extends LoyaltyAccountDeleteArgs>(args: SelectSubset<T, LoyaltyAccountDeleteArgs<ExtArgs>>): Prisma__LoyaltyAccountClient<$Result.GetResult<Prisma.$LoyaltyAccountPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one LoyaltyAccount.
     * @param {LoyaltyAccountUpdateArgs} args - Arguments to update one LoyaltyAccount.
     * @example
     * // Update one LoyaltyAccount
     * const loyaltyAccount = await prisma.loyaltyAccount.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LoyaltyAccountUpdateArgs>(args: SelectSubset<T, LoyaltyAccountUpdateArgs<ExtArgs>>): Prisma__LoyaltyAccountClient<$Result.GetResult<Prisma.$LoyaltyAccountPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more LoyaltyAccounts.
     * @param {LoyaltyAccountDeleteManyArgs} args - Arguments to filter LoyaltyAccounts to delete.
     * @example
     * // Delete a few LoyaltyAccounts
     * const { count } = await prisma.loyaltyAccount.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LoyaltyAccountDeleteManyArgs>(args?: SelectSubset<T, LoyaltyAccountDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more LoyaltyAccounts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoyaltyAccountUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many LoyaltyAccounts
     * const loyaltyAccount = await prisma.loyaltyAccount.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LoyaltyAccountUpdateManyArgs>(args: SelectSubset<T, LoyaltyAccountUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more LoyaltyAccounts and returns the data updated in the database.
     * @param {LoyaltyAccountUpdateManyAndReturnArgs} args - Arguments to update many LoyaltyAccounts.
     * @example
     * // Update many LoyaltyAccounts
     * const loyaltyAccount = await prisma.loyaltyAccount.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more LoyaltyAccounts and only return the `id`
     * const loyaltyAccountWithIdOnly = await prisma.loyaltyAccount.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends LoyaltyAccountUpdateManyAndReturnArgs>(args: SelectSubset<T, LoyaltyAccountUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LoyaltyAccountPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one LoyaltyAccount.
     * @param {LoyaltyAccountUpsertArgs} args - Arguments to update or create a LoyaltyAccount.
     * @example
     * // Update or create a LoyaltyAccount
     * const loyaltyAccount = await prisma.loyaltyAccount.upsert({
     *   create: {
     *     // ... data to create a LoyaltyAccount
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the LoyaltyAccount we want to update
     *   }
     * })
     */
    upsert<T extends LoyaltyAccountUpsertArgs>(args: SelectSubset<T, LoyaltyAccountUpsertArgs<ExtArgs>>): Prisma__LoyaltyAccountClient<$Result.GetResult<Prisma.$LoyaltyAccountPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of LoyaltyAccounts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoyaltyAccountCountArgs} args - Arguments to filter LoyaltyAccounts to count.
     * @example
     * // Count the number of LoyaltyAccounts
     * const count = await prisma.loyaltyAccount.count({
     *   where: {
     *     // ... the filter for the LoyaltyAccounts we want to count
     *   }
     * })
    **/
    count<T extends LoyaltyAccountCountArgs>(
      args?: Subset<T, LoyaltyAccountCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LoyaltyAccountCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a LoyaltyAccount.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoyaltyAccountAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends LoyaltyAccountAggregateArgs>(args: Subset<T, LoyaltyAccountAggregateArgs>): Prisma.PrismaPromise<GetLoyaltyAccountAggregateType<T>>

    /**
     * Group by LoyaltyAccount.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoyaltyAccountGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends LoyaltyAccountGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LoyaltyAccountGroupByArgs['orderBy'] }
        : { orderBy?: LoyaltyAccountGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, LoyaltyAccountGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLoyaltyAccountGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the LoyaltyAccount model
   */
  readonly fields: LoyaltyAccountFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for LoyaltyAccount.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LoyaltyAccountClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    transactions<T extends LoyaltyAccount$transactionsArgs<ExtArgs> = {}>(args?: Subset<T, LoyaltyAccount$transactionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CreditTransactionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the LoyaltyAccount model
   */
  interface LoyaltyAccountFieldRefs {
    readonly id: FieldRef<"LoyaltyAccount", 'String'>
    readonly clientId: FieldRef<"LoyaltyAccount", 'String'>
    readonly tier: FieldRef<"LoyaltyAccount", 'String'>
    readonly balancePoints: FieldRef<"LoyaltyAccount", 'Int'>
    readonly totalEarned: FieldRef<"LoyaltyAccount", 'Int'>
    readonly lastActivityAt: FieldRef<"LoyaltyAccount", 'DateTime'>
    readonly createdAt: FieldRef<"LoyaltyAccount", 'DateTime'>
    readonly updatedAt: FieldRef<"LoyaltyAccount", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * LoyaltyAccount findUnique
   */
  export type LoyaltyAccountFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoyaltyAccount
     */
    select?: LoyaltyAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LoyaltyAccount
     */
    omit?: LoyaltyAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoyaltyAccountInclude<ExtArgs> | null
    /**
     * Filter, which LoyaltyAccount to fetch.
     */
    where: LoyaltyAccountWhereUniqueInput
  }

  /**
   * LoyaltyAccount findUniqueOrThrow
   */
  export type LoyaltyAccountFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoyaltyAccount
     */
    select?: LoyaltyAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LoyaltyAccount
     */
    omit?: LoyaltyAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoyaltyAccountInclude<ExtArgs> | null
    /**
     * Filter, which LoyaltyAccount to fetch.
     */
    where: LoyaltyAccountWhereUniqueInput
  }

  /**
   * LoyaltyAccount findFirst
   */
  export type LoyaltyAccountFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoyaltyAccount
     */
    select?: LoyaltyAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LoyaltyAccount
     */
    omit?: LoyaltyAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoyaltyAccountInclude<ExtArgs> | null
    /**
     * Filter, which LoyaltyAccount to fetch.
     */
    where?: LoyaltyAccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LoyaltyAccounts to fetch.
     */
    orderBy?: LoyaltyAccountOrderByWithRelationInput | LoyaltyAccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LoyaltyAccounts.
     */
    cursor?: LoyaltyAccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LoyaltyAccounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LoyaltyAccounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LoyaltyAccounts.
     */
    distinct?: LoyaltyAccountScalarFieldEnum | LoyaltyAccountScalarFieldEnum[]
  }

  /**
   * LoyaltyAccount findFirstOrThrow
   */
  export type LoyaltyAccountFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoyaltyAccount
     */
    select?: LoyaltyAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LoyaltyAccount
     */
    omit?: LoyaltyAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoyaltyAccountInclude<ExtArgs> | null
    /**
     * Filter, which LoyaltyAccount to fetch.
     */
    where?: LoyaltyAccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LoyaltyAccounts to fetch.
     */
    orderBy?: LoyaltyAccountOrderByWithRelationInput | LoyaltyAccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LoyaltyAccounts.
     */
    cursor?: LoyaltyAccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LoyaltyAccounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LoyaltyAccounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LoyaltyAccounts.
     */
    distinct?: LoyaltyAccountScalarFieldEnum | LoyaltyAccountScalarFieldEnum[]
  }

  /**
   * LoyaltyAccount findMany
   */
  export type LoyaltyAccountFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoyaltyAccount
     */
    select?: LoyaltyAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LoyaltyAccount
     */
    omit?: LoyaltyAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoyaltyAccountInclude<ExtArgs> | null
    /**
     * Filter, which LoyaltyAccounts to fetch.
     */
    where?: LoyaltyAccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LoyaltyAccounts to fetch.
     */
    orderBy?: LoyaltyAccountOrderByWithRelationInput | LoyaltyAccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing LoyaltyAccounts.
     */
    cursor?: LoyaltyAccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LoyaltyAccounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LoyaltyAccounts.
     */
    skip?: number
    distinct?: LoyaltyAccountScalarFieldEnum | LoyaltyAccountScalarFieldEnum[]
  }

  /**
   * LoyaltyAccount create
   */
  export type LoyaltyAccountCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoyaltyAccount
     */
    select?: LoyaltyAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LoyaltyAccount
     */
    omit?: LoyaltyAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoyaltyAccountInclude<ExtArgs> | null
    /**
     * The data needed to create a LoyaltyAccount.
     */
    data: XOR<LoyaltyAccountCreateInput, LoyaltyAccountUncheckedCreateInput>
  }

  /**
   * LoyaltyAccount createMany
   */
  export type LoyaltyAccountCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many LoyaltyAccounts.
     */
    data: LoyaltyAccountCreateManyInput | LoyaltyAccountCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * LoyaltyAccount createManyAndReturn
   */
  export type LoyaltyAccountCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoyaltyAccount
     */
    select?: LoyaltyAccountSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the LoyaltyAccount
     */
    omit?: LoyaltyAccountOmit<ExtArgs> | null
    /**
     * The data used to create many LoyaltyAccounts.
     */
    data: LoyaltyAccountCreateManyInput | LoyaltyAccountCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * LoyaltyAccount update
   */
  export type LoyaltyAccountUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoyaltyAccount
     */
    select?: LoyaltyAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LoyaltyAccount
     */
    omit?: LoyaltyAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoyaltyAccountInclude<ExtArgs> | null
    /**
     * The data needed to update a LoyaltyAccount.
     */
    data: XOR<LoyaltyAccountUpdateInput, LoyaltyAccountUncheckedUpdateInput>
    /**
     * Choose, which LoyaltyAccount to update.
     */
    where: LoyaltyAccountWhereUniqueInput
  }

  /**
   * LoyaltyAccount updateMany
   */
  export type LoyaltyAccountUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update LoyaltyAccounts.
     */
    data: XOR<LoyaltyAccountUpdateManyMutationInput, LoyaltyAccountUncheckedUpdateManyInput>
    /**
     * Filter which LoyaltyAccounts to update
     */
    where?: LoyaltyAccountWhereInput
    /**
     * Limit how many LoyaltyAccounts to update.
     */
    limit?: number
  }

  /**
   * LoyaltyAccount updateManyAndReturn
   */
  export type LoyaltyAccountUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoyaltyAccount
     */
    select?: LoyaltyAccountSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the LoyaltyAccount
     */
    omit?: LoyaltyAccountOmit<ExtArgs> | null
    /**
     * The data used to update LoyaltyAccounts.
     */
    data: XOR<LoyaltyAccountUpdateManyMutationInput, LoyaltyAccountUncheckedUpdateManyInput>
    /**
     * Filter which LoyaltyAccounts to update
     */
    where?: LoyaltyAccountWhereInput
    /**
     * Limit how many LoyaltyAccounts to update.
     */
    limit?: number
  }

  /**
   * LoyaltyAccount upsert
   */
  export type LoyaltyAccountUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoyaltyAccount
     */
    select?: LoyaltyAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LoyaltyAccount
     */
    omit?: LoyaltyAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoyaltyAccountInclude<ExtArgs> | null
    /**
     * The filter to search for the LoyaltyAccount to update in case it exists.
     */
    where: LoyaltyAccountWhereUniqueInput
    /**
     * In case the LoyaltyAccount found by the `where` argument doesn't exist, create a new LoyaltyAccount with this data.
     */
    create: XOR<LoyaltyAccountCreateInput, LoyaltyAccountUncheckedCreateInput>
    /**
     * In case the LoyaltyAccount was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LoyaltyAccountUpdateInput, LoyaltyAccountUncheckedUpdateInput>
  }

  /**
   * LoyaltyAccount delete
   */
  export type LoyaltyAccountDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoyaltyAccount
     */
    select?: LoyaltyAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LoyaltyAccount
     */
    omit?: LoyaltyAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoyaltyAccountInclude<ExtArgs> | null
    /**
     * Filter which LoyaltyAccount to delete.
     */
    where: LoyaltyAccountWhereUniqueInput
  }

  /**
   * LoyaltyAccount deleteMany
   */
  export type LoyaltyAccountDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LoyaltyAccounts to delete
     */
    where?: LoyaltyAccountWhereInput
    /**
     * Limit how many LoyaltyAccounts to delete.
     */
    limit?: number
  }

  /**
   * LoyaltyAccount.transactions
   */
  export type LoyaltyAccount$transactionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreditTransaction
     */
    select?: CreditTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CreditTransaction
     */
    omit?: CreditTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreditTransactionInclude<ExtArgs> | null
    where?: CreditTransactionWhereInput
    orderBy?: CreditTransactionOrderByWithRelationInput | CreditTransactionOrderByWithRelationInput[]
    cursor?: CreditTransactionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CreditTransactionScalarFieldEnum | CreditTransactionScalarFieldEnum[]
  }

  /**
   * LoyaltyAccount without action
   */
  export type LoyaltyAccountDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoyaltyAccount
     */
    select?: LoyaltyAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LoyaltyAccount
     */
    omit?: LoyaltyAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoyaltyAccountInclude<ExtArgs> | null
  }


  /**
   * Model CreditTransaction
   */

  export type AggregateCreditTransaction = {
    _count: CreditTransactionCountAggregateOutputType | null
    _avg: CreditTransactionAvgAggregateOutputType | null
    _sum: CreditTransactionSumAggregateOutputType | null
    _min: CreditTransactionMinAggregateOutputType | null
    _max: CreditTransactionMaxAggregateOutputType | null
  }

  export type CreditTransactionAvgAggregateOutputType = {
    points: number | null
  }

  export type CreditTransactionSumAggregateOutputType = {
    points: number | null
  }

  export type CreditTransactionMinAggregateOutputType = {
    id: string | null
    loyaltyAccountId: string | null
    type: string | null
    points: number | null
    description: string | null
    referenceId: string | null
    createdAt: Date | null
  }

  export type CreditTransactionMaxAggregateOutputType = {
    id: string | null
    loyaltyAccountId: string | null
    type: string | null
    points: number | null
    description: string | null
    referenceId: string | null
    createdAt: Date | null
  }

  export type CreditTransactionCountAggregateOutputType = {
    id: number
    loyaltyAccountId: number
    type: number
    points: number
    description: number
    referenceId: number
    createdAt: number
    _all: number
  }


  export type CreditTransactionAvgAggregateInputType = {
    points?: true
  }

  export type CreditTransactionSumAggregateInputType = {
    points?: true
  }

  export type CreditTransactionMinAggregateInputType = {
    id?: true
    loyaltyAccountId?: true
    type?: true
    points?: true
    description?: true
    referenceId?: true
    createdAt?: true
  }

  export type CreditTransactionMaxAggregateInputType = {
    id?: true
    loyaltyAccountId?: true
    type?: true
    points?: true
    description?: true
    referenceId?: true
    createdAt?: true
  }

  export type CreditTransactionCountAggregateInputType = {
    id?: true
    loyaltyAccountId?: true
    type?: true
    points?: true
    description?: true
    referenceId?: true
    createdAt?: true
    _all?: true
  }

  export type CreditTransactionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CreditTransaction to aggregate.
     */
    where?: CreditTransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CreditTransactions to fetch.
     */
    orderBy?: CreditTransactionOrderByWithRelationInput | CreditTransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CreditTransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CreditTransactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CreditTransactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CreditTransactions
    **/
    _count?: true | CreditTransactionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: CreditTransactionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: CreditTransactionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CreditTransactionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CreditTransactionMaxAggregateInputType
  }

  export type GetCreditTransactionAggregateType<T extends CreditTransactionAggregateArgs> = {
        [P in keyof T & keyof AggregateCreditTransaction]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCreditTransaction[P]>
      : GetScalarType<T[P], AggregateCreditTransaction[P]>
  }




  export type CreditTransactionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CreditTransactionWhereInput
    orderBy?: CreditTransactionOrderByWithAggregationInput | CreditTransactionOrderByWithAggregationInput[]
    by: CreditTransactionScalarFieldEnum[] | CreditTransactionScalarFieldEnum
    having?: CreditTransactionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CreditTransactionCountAggregateInputType | true
    _avg?: CreditTransactionAvgAggregateInputType
    _sum?: CreditTransactionSumAggregateInputType
    _min?: CreditTransactionMinAggregateInputType
    _max?: CreditTransactionMaxAggregateInputType
  }

  export type CreditTransactionGroupByOutputType = {
    id: string
    loyaltyAccountId: string
    type: string
    points: number
    description: string | null
    referenceId: string | null
    createdAt: Date
    _count: CreditTransactionCountAggregateOutputType | null
    _avg: CreditTransactionAvgAggregateOutputType | null
    _sum: CreditTransactionSumAggregateOutputType | null
    _min: CreditTransactionMinAggregateOutputType | null
    _max: CreditTransactionMaxAggregateOutputType | null
  }

  type GetCreditTransactionGroupByPayload<T extends CreditTransactionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CreditTransactionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CreditTransactionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CreditTransactionGroupByOutputType[P]>
            : GetScalarType<T[P], CreditTransactionGroupByOutputType[P]>
        }
      >
    >


  export type CreditTransactionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    loyaltyAccountId?: boolean
    type?: boolean
    points?: boolean
    description?: boolean
    referenceId?: boolean
    createdAt?: boolean
    account?: boolean | LoyaltyAccountDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["creditTransaction"]>

  export type CreditTransactionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    loyaltyAccountId?: boolean
    type?: boolean
    points?: boolean
    description?: boolean
    referenceId?: boolean
    createdAt?: boolean
    account?: boolean | LoyaltyAccountDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["creditTransaction"]>

  export type CreditTransactionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    loyaltyAccountId?: boolean
    type?: boolean
    points?: boolean
    description?: boolean
    referenceId?: boolean
    createdAt?: boolean
    account?: boolean | LoyaltyAccountDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["creditTransaction"]>

  export type CreditTransactionSelectScalar = {
    id?: boolean
    loyaltyAccountId?: boolean
    type?: boolean
    points?: boolean
    description?: boolean
    referenceId?: boolean
    createdAt?: boolean
  }

  export type CreditTransactionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "loyaltyAccountId" | "type" | "points" | "description" | "referenceId" | "createdAt", ExtArgs["result"]["creditTransaction"]>
  export type CreditTransactionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    account?: boolean | LoyaltyAccountDefaultArgs<ExtArgs>
  }
  export type CreditTransactionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    account?: boolean | LoyaltyAccountDefaultArgs<ExtArgs>
  }
  export type CreditTransactionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    account?: boolean | LoyaltyAccountDefaultArgs<ExtArgs>
  }

  export type $CreditTransactionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CreditTransaction"
    objects: {
      account: Prisma.$LoyaltyAccountPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      loyaltyAccountId: string
      type: string
      points: number
      description: string | null
      referenceId: string | null
      createdAt: Date
    }, ExtArgs["result"]["creditTransaction"]>
    composites: {}
  }

  type CreditTransactionGetPayload<S extends boolean | null | undefined | CreditTransactionDefaultArgs> = $Result.GetResult<Prisma.$CreditTransactionPayload, S>

  type CreditTransactionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CreditTransactionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CreditTransactionCountAggregateInputType | true
    }

  export interface CreditTransactionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CreditTransaction'], meta: { name: 'CreditTransaction' } }
    /**
     * Find zero or one CreditTransaction that matches the filter.
     * @param {CreditTransactionFindUniqueArgs} args - Arguments to find a CreditTransaction
     * @example
     * // Get one CreditTransaction
     * const creditTransaction = await prisma.creditTransaction.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CreditTransactionFindUniqueArgs>(args: SelectSubset<T, CreditTransactionFindUniqueArgs<ExtArgs>>): Prisma__CreditTransactionClient<$Result.GetResult<Prisma.$CreditTransactionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one CreditTransaction that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CreditTransactionFindUniqueOrThrowArgs} args - Arguments to find a CreditTransaction
     * @example
     * // Get one CreditTransaction
     * const creditTransaction = await prisma.creditTransaction.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CreditTransactionFindUniqueOrThrowArgs>(args: SelectSubset<T, CreditTransactionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CreditTransactionClient<$Result.GetResult<Prisma.$CreditTransactionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CreditTransaction that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CreditTransactionFindFirstArgs} args - Arguments to find a CreditTransaction
     * @example
     * // Get one CreditTransaction
     * const creditTransaction = await prisma.creditTransaction.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CreditTransactionFindFirstArgs>(args?: SelectSubset<T, CreditTransactionFindFirstArgs<ExtArgs>>): Prisma__CreditTransactionClient<$Result.GetResult<Prisma.$CreditTransactionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CreditTransaction that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CreditTransactionFindFirstOrThrowArgs} args - Arguments to find a CreditTransaction
     * @example
     * // Get one CreditTransaction
     * const creditTransaction = await prisma.creditTransaction.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CreditTransactionFindFirstOrThrowArgs>(args?: SelectSubset<T, CreditTransactionFindFirstOrThrowArgs<ExtArgs>>): Prisma__CreditTransactionClient<$Result.GetResult<Prisma.$CreditTransactionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more CreditTransactions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CreditTransactionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CreditTransactions
     * const creditTransactions = await prisma.creditTransaction.findMany()
     * 
     * // Get first 10 CreditTransactions
     * const creditTransactions = await prisma.creditTransaction.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const creditTransactionWithIdOnly = await prisma.creditTransaction.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CreditTransactionFindManyArgs>(args?: SelectSubset<T, CreditTransactionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CreditTransactionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a CreditTransaction.
     * @param {CreditTransactionCreateArgs} args - Arguments to create a CreditTransaction.
     * @example
     * // Create one CreditTransaction
     * const CreditTransaction = await prisma.creditTransaction.create({
     *   data: {
     *     // ... data to create a CreditTransaction
     *   }
     * })
     * 
     */
    create<T extends CreditTransactionCreateArgs>(args: SelectSubset<T, CreditTransactionCreateArgs<ExtArgs>>): Prisma__CreditTransactionClient<$Result.GetResult<Prisma.$CreditTransactionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many CreditTransactions.
     * @param {CreditTransactionCreateManyArgs} args - Arguments to create many CreditTransactions.
     * @example
     * // Create many CreditTransactions
     * const creditTransaction = await prisma.creditTransaction.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CreditTransactionCreateManyArgs>(args?: SelectSubset<T, CreditTransactionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CreditTransactions and returns the data saved in the database.
     * @param {CreditTransactionCreateManyAndReturnArgs} args - Arguments to create many CreditTransactions.
     * @example
     * // Create many CreditTransactions
     * const creditTransaction = await prisma.creditTransaction.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CreditTransactions and only return the `id`
     * const creditTransactionWithIdOnly = await prisma.creditTransaction.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CreditTransactionCreateManyAndReturnArgs>(args?: SelectSubset<T, CreditTransactionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CreditTransactionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a CreditTransaction.
     * @param {CreditTransactionDeleteArgs} args - Arguments to delete one CreditTransaction.
     * @example
     * // Delete one CreditTransaction
     * const CreditTransaction = await prisma.creditTransaction.delete({
     *   where: {
     *     // ... filter to delete one CreditTransaction
     *   }
     * })
     * 
     */
    delete<T extends CreditTransactionDeleteArgs>(args: SelectSubset<T, CreditTransactionDeleteArgs<ExtArgs>>): Prisma__CreditTransactionClient<$Result.GetResult<Prisma.$CreditTransactionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one CreditTransaction.
     * @param {CreditTransactionUpdateArgs} args - Arguments to update one CreditTransaction.
     * @example
     * // Update one CreditTransaction
     * const creditTransaction = await prisma.creditTransaction.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CreditTransactionUpdateArgs>(args: SelectSubset<T, CreditTransactionUpdateArgs<ExtArgs>>): Prisma__CreditTransactionClient<$Result.GetResult<Prisma.$CreditTransactionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more CreditTransactions.
     * @param {CreditTransactionDeleteManyArgs} args - Arguments to filter CreditTransactions to delete.
     * @example
     * // Delete a few CreditTransactions
     * const { count } = await prisma.creditTransaction.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CreditTransactionDeleteManyArgs>(args?: SelectSubset<T, CreditTransactionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CreditTransactions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CreditTransactionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CreditTransactions
     * const creditTransaction = await prisma.creditTransaction.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CreditTransactionUpdateManyArgs>(args: SelectSubset<T, CreditTransactionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CreditTransactions and returns the data updated in the database.
     * @param {CreditTransactionUpdateManyAndReturnArgs} args - Arguments to update many CreditTransactions.
     * @example
     * // Update many CreditTransactions
     * const creditTransaction = await prisma.creditTransaction.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more CreditTransactions and only return the `id`
     * const creditTransactionWithIdOnly = await prisma.creditTransaction.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CreditTransactionUpdateManyAndReturnArgs>(args: SelectSubset<T, CreditTransactionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CreditTransactionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one CreditTransaction.
     * @param {CreditTransactionUpsertArgs} args - Arguments to update or create a CreditTransaction.
     * @example
     * // Update or create a CreditTransaction
     * const creditTransaction = await prisma.creditTransaction.upsert({
     *   create: {
     *     // ... data to create a CreditTransaction
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CreditTransaction we want to update
     *   }
     * })
     */
    upsert<T extends CreditTransactionUpsertArgs>(args: SelectSubset<T, CreditTransactionUpsertArgs<ExtArgs>>): Prisma__CreditTransactionClient<$Result.GetResult<Prisma.$CreditTransactionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of CreditTransactions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CreditTransactionCountArgs} args - Arguments to filter CreditTransactions to count.
     * @example
     * // Count the number of CreditTransactions
     * const count = await prisma.creditTransaction.count({
     *   where: {
     *     // ... the filter for the CreditTransactions we want to count
     *   }
     * })
    **/
    count<T extends CreditTransactionCountArgs>(
      args?: Subset<T, CreditTransactionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CreditTransactionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CreditTransaction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CreditTransactionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CreditTransactionAggregateArgs>(args: Subset<T, CreditTransactionAggregateArgs>): Prisma.PrismaPromise<GetCreditTransactionAggregateType<T>>

    /**
     * Group by CreditTransaction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CreditTransactionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CreditTransactionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CreditTransactionGroupByArgs['orderBy'] }
        : { orderBy?: CreditTransactionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CreditTransactionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCreditTransactionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CreditTransaction model
   */
  readonly fields: CreditTransactionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CreditTransaction.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CreditTransactionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    account<T extends LoyaltyAccountDefaultArgs<ExtArgs> = {}>(args?: Subset<T, LoyaltyAccountDefaultArgs<ExtArgs>>): Prisma__LoyaltyAccountClient<$Result.GetResult<Prisma.$LoyaltyAccountPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the CreditTransaction model
   */
  interface CreditTransactionFieldRefs {
    readonly id: FieldRef<"CreditTransaction", 'String'>
    readonly loyaltyAccountId: FieldRef<"CreditTransaction", 'String'>
    readonly type: FieldRef<"CreditTransaction", 'String'>
    readonly points: FieldRef<"CreditTransaction", 'Int'>
    readonly description: FieldRef<"CreditTransaction", 'String'>
    readonly referenceId: FieldRef<"CreditTransaction", 'String'>
    readonly createdAt: FieldRef<"CreditTransaction", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * CreditTransaction findUnique
   */
  export type CreditTransactionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreditTransaction
     */
    select?: CreditTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CreditTransaction
     */
    omit?: CreditTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreditTransactionInclude<ExtArgs> | null
    /**
     * Filter, which CreditTransaction to fetch.
     */
    where: CreditTransactionWhereUniqueInput
  }

  /**
   * CreditTransaction findUniqueOrThrow
   */
  export type CreditTransactionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreditTransaction
     */
    select?: CreditTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CreditTransaction
     */
    omit?: CreditTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreditTransactionInclude<ExtArgs> | null
    /**
     * Filter, which CreditTransaction to fetch.
     */
    where: CreditTransactionWhereUniqueInput
  }

  /**
   * CreditTransaction findFirst
   */
  export type CreditTransactionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreditTransaction
     */
    select?: CreditTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CreditTransaction
     */
    omit?: CreditTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreditTransactionInclude<ExtArgs> | null
    /**
     * Filter, which CreditTransaction to fetch.
     */
    where?: CreditTransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CreditTransactions to fetch.
     */
    orderBy?: CreditTransactionOrderByWithRelationInput | CreditTransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CreditTransactions.
     */
    cursor?: CreditTransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CreditTransactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CreditTransactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CreditTransactions.
     */
    distinct?: CreditTransactionScalarFieldEnum | CreditTransactionScalarFieldEnum[]
  }

  /**
   * CreditTransaction findFirstOrThrow
   */
  export type CreditTransactionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreditTransaction
     */
    select?: CreditTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CreditTransaction
     */
    omit?: CreditTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreditTransactionInclude<ExtArgs> | null
    /**
     * Filter, which CreditTransaction to fetch.
     */
    where?: CreditTransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CreditTransactions to fetch.
     */
    orderBy?: CreditTransactionOrderByWithRelationInput | CreditTransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CreditTransactions.
     */
    cursor?: CreditTransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CreditTransactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CreditTransactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CreditTransactions.
     */
    distinct?: CreditTransactionScalarFieldEnum | CreditTransactionScalarFieldEnum[]
  }

  /**
   * CreditTransaction findMany
   */
  export type CreditTransactionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreditTransaction
     */
    select?: CreditTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CreditTransaction
     */
    omit?: CreditTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreditTransactionInclude<ExtArgs> | null
    /**
     * Filter, which CreditTransactions to fetch.
     */
    where?: CreditTransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CreditTransactions to fetch.
     */
    orderBy?: CreditTransactionOrderByWithRelationInput | CreditTransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CreditTransactions.
     */
    cursor?: CreditTransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CreditTransactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CreditTransactions.
     */
    skip?: number
    distinct?: CreditTransactionScalarFieldEnum | CreditTransactionScalarFieldEnum[]
  }

  /**
   * CreditTransaction create
   */
  export type CreditTransactionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreditTransaction
     */
    select?: CreditTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CreditTransaction
     */
    omit?: CreditTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreditTransactionInclude<ExtArgs> | null
    /**
     * The data needed to create a CreditTransaction.
     */
    data: XOR<CreditTransactionCreateInput, CreditTransactionUncheckedCreateInput>
  }

  /**
   * CreditTransaction createMany
   */
  export type CreditTransactionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CreditTransactions.
     */
    data: CreditTransactionCreateManyInput | CreditTransactionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CreditTransaction createManyAndReturn
   */
  export type CreditTransactionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreditTransaction
     */
    select?: CreditTransactionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CreditTransaction
     */
    omit?: CreditTransactionOmit<ExtArgs> | null
    /**
     * The data used to create many CreditTransactions.
     */
    data: CreditTransactionCreateManyInput | CreditTransactionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreditTransactionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * CreditTransaction update
   */
  export type CreditTransactionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreditTransaction
     */
    select?: CreditTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CreditTransaction
     */
    omit?: CreditTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreditTransactionInclude<ExtArgs> | null
    /**
     * The data needed to update a CreditTransaction.
     */
    data: XOR<CreditTransactionUpdateInput, CreditTransactionUncheckedUpdateInput>
    /**
     * Choose, which CreditTransaction to update.
     */
    where: CreditTransactionWhereUniqueInput
  }

  /**
   * CreditTransaction updateMany
   */
  export type CreditTransactionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CreditTransactions.
     */
    data: XOR<CreditTransactionUpdateManyMutationInput, CreditTransactionUncheckedUpdateManyInput>
    /**
     * Filter which CreditTransactions to update
     */
    where?: CreditTransactionWhereInput
    /**
     * Limit how many CreditTransactions to update.
     */
    limit?: number
  }

  /**
   * CreditTransaction updateManyAndReturn
   */
  export type CreditTransactionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreditTransaction
     */
    select?: CreditTransactionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CreditTransaction
     */
    omit?: CreditTransactionOmit<ExtArgs> | null
    /**
     * The data used to update CreditTransactions.
     */
    data: XOR<CreditTransactionUpdateManyMutationInput, CreditTransactionUncheckedUpdateManyInput>
    /**
     * Filter which CreditTransactions to update
     */
    where?: CreditTransactionWhereInput
    /**
     * Limit how many CreditTransactions to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreditTransactionIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * CreditTransaction upsert
   */
  export type CreditTransactionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreditTransaction
     */
    select?: CreditTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CreditTransaction
     */
    omit?: CreditTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreditTransactionInclude<ExtArgs> | null
    /**
     * The filter to search for the CreditTransaction to update in case it exists.
     */
    where: CreditTransactionWhereUniqueInput
    /**
     * In case the CreditTransaction found by the `where` argument doesn't exist, create a new CreditTransaction with this data.
     */
    create: XOR<CreditTransactionCreateInput, CreditTransactionUncheckedCreateInput>
    /**
     * In case the CreditTransaction was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CreditTransactionUpdateInput, CreditTransactionUncheckedUpdateInput>
  }

  /**
   * CreditTransaction delete
   */
  export type CreditTransactionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreditTransaction
     */
    select?: CreditTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CreditTransaction
     */
    omit?: CreditTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreditTransactionInclude<ExtArgs> | null
    /**
     * Filter which CreditTransaction to delete.
     */
    where: CreditTransactionWhereUniqueInput
  }

  /**
   * CreditTransaction deleteMany
   */
  export type CreditTransactionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CreditTransactions to delete
     */
    where?: CreditTransactionWhereInput
    /**
     * Limit how many CreditTransactions to delete.
     */
    limit?: number
  }

  /**
   * CreditTransaction without action
   */
  export type CreditTransactionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreditTransaction
     */
    select?: CreditTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CreditTransaction
     */
    omit?: CreditTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreditTransactionInclude<ExtArgs> | null
  }


  /**
   * Model Vendor
   */

  export type AggregateVendor = {
    _count: VendorCountAggregateOutputType | null
    _min: VendorMinAggregateOutputType | null
    _max: VendorMaxAggregateOutputType | null
  }

  export type VendorMinAggregateOutputType = {
    id: string | null
    name: string | null
    category: string | null
    contactName: string | null
    contactEmail: string | null
    status: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type VendorMaxAggregateOutputType = {
    id: string | null
    name: string | null
    category: string | null
    contactName: string | null
    contactEmail: string | null
    status: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type VendorCountAggregateOutputType = {
    id: number
    name: number
    category: number
    contactName: number
    contactEmail: number
    status: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type VendorMinAggregateInputType = {
    id?: true
    name?: true
    category?: true
    contactName?: true
    contactEmail?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type VendorMaxAggregateInputType = {
    id?: true
    name?: true
    category?: true
    contactName?: true
    contactEmail?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type VendorCountAggregateInputType = {
    id?: true
    name?: true
    category?: true
    contactName?: true
    contactEmail?: true
    status?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type VendorAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Vendor to aggregate.
     */
    where?: VendorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Vendors to fetch.
     */
    orderBy?: VendorOrderByWithRelationInput | VendorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: VendorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Vendors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Vendors.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Vendors
    **/
    _count?: true | VendorCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: VendorMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: VendorMaxAggregateInputType
  }

  export type GetVendorAggregateType<T extends VendorAggregateArgs> = {
        [P in keyof T & keyof AggregateVendor]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateVendor[P]>
      : GetScalarType<T[P], AggregateVendor[P]>
  }




  export type VendorGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VendorWhereInput
    orderBy?: VendorOrderByWithAggregationInput | VendorOrderByWithAggregationInput[]
    by: VendorScalarFieldEnum[] | VendorScalarFieldEnum
    having?: VendorScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: VendorCountAggregateInputType | true
    _min?: VendorMinAggregateInputType
    _max?: VendorMaxAggregateInputType
  }

  export type VendorGroupByOutputType = {
    id: string
    name: string
    category: string | null
    contactName: string | null
    contactEmail: string | null
    status: string
    createdAt: Date
    updatedAt: Date
    _count: VendorCountAggregateOutputType | null
    _min: VendorMinAggregateOutputType | null
    _max: VendorMaxAggregateOutputType | null
  }

  type GetVendorGroupByPayload<T extends VendorGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<VendorGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof VendorGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], VendorGroupByOutputType[P]>
            : GetScalarType<T[P], VendorGroupByOutputType[P]>
        }
      >
    >


  export type VendorSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    category?: boolean
    contactName?: boolean
    contactEmail?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    contracts?: boolean | Vendor$contractsArgs<ExtArgs>
    _count?: boolean | VendorCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["vendor"]>

  export type VendorSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    category?: boolean
    contactName?: boolean
    contactEmail?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["vendor"]>

  export type VendorSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    category?: boolean
    contactName?: boolean
    contactEmail?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["vendor"]>

  export type VendorSelectScalar = {
    id?: boolean
    name?: boolean
    category?: boolean
    contactName?: boolean
    contactEmail?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type VendorOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "category" | "contactName" | "contactEmail" | "status" | "createdAt" | "updatedAt", ExtArgs["result"]["vendor"]>
  export type VendorInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    contracts?: boolean | Vendor$contractsArgs<ExtArgs>
    _count?: boolean | VendorCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type VendorIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type VendorIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $VendorPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Vendor"
    objects: {
      contracts: Prisma.$VendorContractPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      category: string | null
      contactName: string | null
      contactEmail: string | null
      status: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["vendor"]>
    composites: {}
  }

  type VendorGetPayload<S extends boolean | null | undefined | VendorDefaultArgs> = $Result.GetResult<Prisma.$VendorPayload, S>

  type VendorCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<VendorFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: VendorCountAggregateInputType | true
    }

  export interface VendorDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Vendor'], meta: { name: 'Vendor' } }
    /**
     * Find zero or one Vendor that matches the filter.
     * @param {VendorFindUniqueArgs} args - Arguments to find a Vendor
     * @example
     * // Get one Vendor
     * const vendor = await prisma.vendor.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends VendorFindUniqueArgs>(args: SelectSubset<T, VendorFindUniqueArgs<ExtArgs>>): Prisma__VendorClient<$Result.GetResult<Prisma.$VendorPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Vendor that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {VendorFindUniqueOrThrowArgs} args - Arguments to find a Vendor
     * @example
     * // Get one Vendor
     * const vendor = await prisma.vendor.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends VendorFindUniqueOrThrowArgs>(args: SelectSubset<T, VendorFindUniqueOrThrowArgs<ExtArgs>>): Prisma__VendorClient<$Result.GetResult<Prisma.$VendorPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Vendor that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VendorFindFirstArgs} args - Arguments to find a Vendor
     * @example
     * // Get one Vendor
     * const vendor = await prisma.vendor.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends VendorFindFirstArgs>(args?: SelectSubset<T, VendorFindFirstArgs<ExtArgs>>): Prisma__VendorClient<$Result.GetResult<Prisma.$VendorPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Vendor that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VendorFindFirstOrThrowArgs} args - Arguments to find a Vendor
     * @example
     * // Get one Vendor
     * const vendor = await prisma.vendor.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends VendorFindFirstOrThrowArgs>(args?: SelectSubset<T, VendorFindFirstOrThrowArgs<ExtArgs>>): Prisma__VendorClient<$Result.GetResult<Prisma.$VendorPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Vendors that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VendorFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Vendors
     * const vendors = await prisma.vendor.findMany()
     * 
     * // Get first 10 Vendors
     * const vendors = await prisma.vendor.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const vendorWithIdOnly = await prisma.vendor.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends VendorFindManyArgs>(args?: SelectSubset<T, VendorFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VendorPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Vendor.
     * @param {VendorCreateArgs} args - Arguments to create a Vendor.
     * @example
     * // Create one Vendor
     * const Vendor = await prisma.vendor.create({
     *   data: {
     *     // ... data to create a Vendor
     *   }
     * })
     * 
     */
    create<T extends VendorCreateArgs>(args: SelectSubset<T, VendorCreateArgs<ExtArgs>>): Prisma__VendorClient<$Result.GetResult<Prisma.$VendorPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Vendors.
     * @param {VendorCreateManyArgs} args - Arguments to create many Vendors.
     * @example
     * // Create many Vendors
     * const vendor = await prisma.vendor.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends VendorCreateManyArgs>(args?: SelectSubset<T, VendorCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Vendors and returns the data saved in the database.
     * @param {VendorCreateManyAndReturnArgs} args - Arguments to create many Vendors.
     * @example
     * // Create many Vendors
     * const vendor = await prisma.vendor.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Vendors and only return the `id`
     * const vendorWithIdOnly = await prisma.vendor.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends VendorCreateManyAndReturnArgs>(args?: SelectSubset<T, VendorCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VendorPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Vendor.
     * @param {VendorDeleteArgs} args - Arguments to delete one Vendor.
     * @example
     * // Delete one Vendor
     * const Vendor = await prisma.vendor.delete({
     *   where: {
     *     // ... filter to delete one Vendor
     *   }
     * })
     * 
     */
    delete<T extends VendorDeleteArgs>(args: SelectSubset<T, VendorDeleteArgs<ExtArgs>>): Prisma__VendorClient<$Result.GetResult<Prisma.$VendorPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Vendor.
     * @param {VendorUpdateArgs} args - Arguments to update one Vendor.
     * @example
     * // Update one Vendor
     * const vendor = await prisma.vendor.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends VendorUpdateArgs>(args: SelectSubset<T, VendorUpdateArgs<ExtArgs>>): Prisma__VendorClient<$Result.GetResult<Prisma.$VendorPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Vendors.
     * @param {VendorDeleteManyArgs} args - Arguments to filter Vendors to delete.
     * @example
     * // Delete a few Vendors
     * const { count } = await prisma.vendor.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends VendorDeleteManyArgs>(args?: SelectSubset<T, VendorDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Vendors.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VendorUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Vendors
     * const vendor = await prisma.vendor.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends VendorUpdateManyArgs>(args: SelectSubset<T, VendorUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Vendors and returns the data updated in the database.
     * @param {VendorUpdateManyAndReturnArgs} args - Arguments to update many Vendors.
     * @example
     * // Update many Vendors
     * const vendor = await prisma.vendor.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Vendors and only return the `id`
     * const vendorWithIdOnly = await prisma.vendor.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends VendorUpdateManyAndReturnArgs>(args: SelectSubset<T, VendorUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VendorPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Vendor.
     * @param {VendorUpsertArgs} args - Arguments to update or create a Vendor.
     * @example
     * // Update or create a Vendor
     * const vendor = await prisma.vendor.upsert({
     *   create: {
     *     // ... data to create a Vendor
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Vendor we want to update
     *   }
     * })
     */
    upsert<T extends VendorUpsertArgs>(args: SelectSubset<T, VendorUpsertArgs<ExtArgs>>): Prisma__VendorClient<$Result.GetResult<Prisma.$VendorPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Vendors.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VendorCountArgs} args - Arguments to filter Vendors to count.
     * @example
     * // Count the number of Vendors
     * const count = await prisma.vendor.count({
     *   where: {
     *     // ... the filter for the Vendors we want to count
     *   }
     * })
    **/
    count<T extends VendorCountArgs>(
      args?: Subset<T, VendorCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], VendorCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Vendor.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VendorAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends VendorAggregateArgs>(args: Subset<T, VendorAggregateArgs>): Prisma.PrismaPromise<GetVendorAggregateType<T>>

    /**
     * Group by Vendor.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VendorGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends VendorGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: VendorGroupByArgs['orderBy'] }
        : { orderBy?: VendorGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, VendorGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetVendorGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Vendor model
   */
  readonly fields: VendorFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Vendor.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__VendorClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    contracts<T extends Vendor$contractsArgs<ExtArgs> = {}>(args?: Subset<T, Vendor$contractsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VendorContractPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Vendor model
   */
  interface VendorFieldRefs {
    readonly id: FieldRef<"Vendor", 'String'>
    readonly name: FieldRef<"Vendor", 'String'>
    readonly category: FieldRef<"Vendor", 'String'>
    readonly contactName: FieldRef<"Vendor", 'String'>
    readonly contactEmail: FieldRef<"Vendor", 'String'>
    readonly status: FieldRef<"Vendor", 'String'>
    readonly createdAt: FieldRef<"Vendor", 'DateTime'>
    readonly updatedAt: FieldRef<"Vendor", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Vendor findUnique
   */
  export type VendorFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vendor
     */
    select?: VendorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Vendor
     */
    omit?: VendorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VendorInclude<ExtArgs> | null
    /**
     * Filter, which Vendor to fetch.
     */
    where: VendorWhereUniqueInput
  }

  /**
   * Vendor findUniqueOrThrow
   */
  export type VendorFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vendor
     */
    select?: VendorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Vendor
     */
    omit?: VendorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VendorInclude<ExtArgs> | null
    /**
     * Filter, which Vendor to fetch.
     */
    where: VendorWhereUniqueInput
  }

  /**
   * Vendor findFirst
   */
  export type VendorFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vendor
     */
    select?: VendorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Vendor
     */
    omit?: VendorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VendorInclude<ExtArgs> | null
    /**
     * Filter, which Vendor to fetch.
     */
    where?: VendorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Vendors to fetch.
     */
    orderBy?: VendorOrderByWithRelationInput | VendorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Vendors.
     */
    cursor?: VendorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Vendors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Vendors.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Vendors.
     */
    distinct?: VendorScalarFieldEnum | VendorScalarFieldEnum[]
  }

  /**
   * Vendor findFirstOrThrow
   */
  export type VendorFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vendor
     */
    select?: VendorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Vendor
     */
    omit?: VendorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VendorInclude<ExtArgs> | null
    /**
     * Filter, which Vendor to fetch.
     */
    where?: VendorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Vendors to fetch.
     */
    orderBy?: VendorOrderByWithRelationInput | VendorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Vendors.
     */
    cursor?: VendorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Vendors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Vendors.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Vendors.
     */
    distinct?: VendorScalarFieldEnum | VendorScalarFieldEnum[]
  }

  /**
   * Vendor findMany
   */
  export type VendorFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vendor
     */
    select?: VendorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Vendor
     */
    omit?: VendorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VendorInclude<ExtArgs> | null
    /**
     * Filter, which Vendors to fetch.
     */
    where?: VendorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Vendors to fetch.
     */
    orderBy?: VendorOrderByWithRelationInput | VendorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Vendors.
     */
    cursor?: VendorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Vendors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Vendors.
     */
    skip?: number
    distinct?: VendorScalarFieldEnum | VendorScalarFieldEnum[]
  }

  /**
   * Vendor create
   */
  export type VendorCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vendor
     */
    select?: VendorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Vendor
     */
    omit?: VendorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VendorInclude<ExtArgs> | null
    /**
     * The data needed to create a Vendor.
     */
    data: XOR<VendorCreateInput, VendorUncheckedCreateInput>
  }

  /**
   * Vendor createMany
   */
  export type VendorCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Vendors.
     */
    data: VendorCreateManyInput | VendorCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Vendor createManyAndReturn
   */
  export type VendorCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vendor
     */
    select?: VendorSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Vendor
     */
    omit?: VendorOmit<ExtArgs> | null
    /**
     * The data used to create many Vendors.
     */
    data: VendorCreateManyInput | VendorCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Vendor update
   */
  export type VendorUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vendor
     */
    select?: VendorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Vendor
     */
    omit?: VendorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VendorInclude<ExtArgs> | null
    /**
     * The data needed to update a Vendor.
     */
    data: XOR<VendorUpdateInput, VendorUncheckedUpdateInput>
    /**
     * Choose, which Vendor to update.
     */
    where: VendorWhereUniqueInput
  }

  /**
   * Vendor updateMany
   */
  export type VendorUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Vendors.
     */
    data: XOR<VendorUpdateManyMutationInput, VendorUncheckedUpdateManyInput>
    /**
     * Filter which Vendors to update
     */
    where?: VendorWhereInput
    /**
     * Limit how many Vendors to update.
     */
    limit?: number
  }

  /**
   * Vendor updateManyAndReturn
   */
  export type VendorUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vendor
     */
    select?: VendorSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Vendor
     */
    omit?: VendorOmit<ExtArgs> | null
    /**
     * The data used to update Vendors.
     */
    data: XOR<VendorUpdateManyMutationInput, VendorUncheckedUpdateManyInput>
    /**
     * Filter which Vendors to update
     */
    where?: VendorWhereInput
    /**
     * Limit how many Vendors to update.
     */
    limit?: number
  }

  /**
   * Vendor upsert
   */
  export type VendorUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vendor
     */
    select?: VendorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Vendor
     */
    omit?: VendorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VendorInclude<ExtArgs> | null
    /**
     * The filter to search for the Vendor to update in case it exists.
     */
    where: VendorWhereUniqueInput
    /**
     * In case the Vendor found by the `where` argument doesn't exist, create a new Vendor with this data.
     */
    create: XOR<VendorCreateInput, VendorUncheckedCreateInput>
    /**
     * In case the Vendor was found with the provided `where` argument, update it with this data.
     */
    update: XOR<VendorUpdateInput, VendorUncheckedUpdateInput>
  }

  /**
   * Vendor delete
   */
  export type VendorDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vendor
     */
    select?: VendorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Vendor
     */
    omit?: VendorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VendorInclude<ExtArgs> | null
    /**
     * Filter which Vendor to delete.
     */
    where: VendorWhereUniqueInput
  }

  /**
   * Vendor deleteMany
   */
  export type VendorDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Vendors to delete
     */
    where?: VendorWhereInput
    /**
     * Limit how many Vendors to delete.
     */
    limit?: number
  }

  /**
   * Vendor.contracts
   */
  export type Vendor$contractsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VendorContract
     */
    select?: VendorContractSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VendorContract
     */
    omit?: VendorContractOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VendorContractInclude<ExtArgs> | null
    where?: VendorContractWhereInput
    orderBy?: VendorContractOrderByWithRelationInput | VendorContractOrderByWithRelationInput[]
    cursor?: VendorContractWhereUniqueInput
    take?: number
    skip?: number
    distinct?: VendorContractScalarFieldEnum | VendorContractScalarFieldEnum[]
  }

  /**
   * Vendor without action
   */
  export type VendorDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vendor
     */
    select?: VendorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Vendor
     */
    omit?: VendorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VendorInclude<ExtArgs> | null
  }


  /**
   * Model VendorContract
   */

  export type AggregateVendorContract = {
    _count: VendorContractCountAggregateOutputType | null
    _avg: VendorContractAvgAggregateOutputType | null
    _sum: VendorContractSumAggregateOutputType | null
    _min: VendorContractMinAggregateOutputType | null
    _max: VendorContractMaxAggregateOutputType | null
  }

  export type VendorContractAvgAggregateOutputType = {
    valueCents: number | null
  }

  export type VendorContractSumAggregateOutputType = {
    valueCents: bigint | null
  }

  export type VendorContractMinAggregateOutputType = {
    id: string | null
    vendorId: string | null
    startAt: Date | null
    endAt: Date | null
    valueCents: bigint | null
    status: string | null
    notes: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type VendorContractMaxAggregateOutputType = {
    id: string | null
    vendorId: string | null
    startAt: Date | null
    endAt: Date | null
    valueCents: bigint | null
    status: string | null
    notes: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type VendorContractCountAggregateOutputType = {
    id: number
    vendorId: number
    startAt: number
    endAt: number
    valueCents: number
    status: number
    notes: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type VendorContractAvgAggregateInputType = {
    valueCents?: true
  }

  export type VendorContractSumAggregateInputType = {
    valueCents?: true
  }

  export type VendorContractMinAggregateInputType = {
    id?: true
    vendorId?: true
    startAt?: true
    endAt?: true
    valueCents?: true
    status?: true
    notes?: true
    createdAt?: true
    updatedAt?: true
  }

  export type VendorContractMaxAggregateInputType = {
    id?: true
    vendorId?: true
    startAt?: true
    endAt?: true
    valueCents?: true
    status?: true
    notes?: true
    createdAt?: true
    updatedAt?: true
  }

  export type VendorContractCountAggregateInputType = {
    id?: true
    vendorId?: true
    startAt?: true
    endAt?: true
    valueCents?: true
    status?: true
    notes?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type VendorContractAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which VendorContract to aggregate.
     */
    where?: VendorContractWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VendorContracts to fetch.
     */
    orderBy?: VendorContractOrderByWithRelationInput | VendorContractOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: VendorContractWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VendorContracts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VendorContracts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned VendorContracts
    **/
    _count?: true | VendorContractCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: VendorContractAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: VendorContractSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: VendorContractMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: VendorContractMaxAggregateInputType
  }

  export type GetVendorContractAggregateType<T extends VendorContractAggregateArgs> = {
        [P in keyof T & keyof AggregateVendorContract]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateVendorContract[P]>
      : GetScalarType<T[P], AggregateVendorContract[P]>
  }




  export type VendorContractGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VendorContractWhereInput
    orderBy?: VendorContractOrderByWithAggregationInput | VendorContractOrderByWithAggregationInput[]
    by: VendorContractScalarFieldEnum[] | VendorContractScalarFieldEnum
    having?: VendorContractScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: VendorContractCountAggregateInputType | true
    _avg?: VendorContractAvgAggregateInputType
    _sum?: VendorContractSumAggregateInputType
    _min?: VendorContractMinAggregateInputType
    _max?: VendorContractMaxAggregateInputType
  }

  export type VendorContractGroupByOutputType = {
    id: string
    vendorId: string
    startAt: Date
    endAt: Date | null
    valueCents: bigint
    status: string
    notes: string | null
    createdAt: Date
    updatedAt: Date
    _count: VendorContractCountAggregateOutputType | null
    _avg: VendorContractAvgAggregateOutputType | null
    _sum: VendorContractSumAggregateOutputType | null
    _min: VendorContractMinAggregateOutputType | null
    _max: VendorContractMaxAggregateOutputType | null
  }

  type GetVendorContractGroupByPayload<T extends VendorContractGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<VendorContractGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof VendorContractGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], VendorContractGroupByOutputType[P]>
            : GetScalarType<T[P], VendorContractGroupByOutputType[P]>
        }
      >
    >


  export type VendorContractSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    vendorId?: boolean
    startAt?: boolean
    endAt?: boolean
    valueCents?: boolean
    status?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    vendor?: boolean | VendorDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["vendorContract"]>

  export type VendorContractSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    vendorId?: boolean
    startAt?: boolean
    endAt?: boolean
    valueCents?: boolean
    status?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    vendor?: boolean | VendorDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["vendorContract"]>

  export type VendorContractSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    vendorId?: boolean
    startAt?: boolean
    endAt?: boolean
    valueCents?: boolean
    status?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    vendor?: boolean | VendorDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["vendorContract"]>

  export type VendorContractSelectScalar = {
    id?: boolean
    vendorId?: boolean
    startAt?: boolean
    endAt?: boolean
    valueCents?: boolean
    status?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type VendorContractOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "vendorId" | "startAt" | "endAt" | "valueCents" | "status" | "notes" | "createdAt" | "updatedAt", ExtArgs["result"]["vendorContract"]>
  export type VendorContractInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    vendor?: boolean | VendorDefaultArgs<ExtArgs>
  }
  export type VendorContractIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    vendor?: boolean | VendorDefaultArgs<ExtArgs>
  }
  export type VendorContractIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    vendor?: boolean | VendorDefaultArgs<ExtArgs>
  }

  export type $VendorContractPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "VendorContract"
    objects: {
      vendor: Prisma.$VendorPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      vendorId: string
      startAt: Date
      endAt: Date | null
      valueCents: bigint
      status: string
      notes: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["vendorContract"]>
    composites: {}
  }

  type VendorContractGetPayload<S extends boolean | null | undefined | VendorContractDefaultArgs> = $Result.GetResult<Prisma.$VendorContractPayload, S>

  type VendorContractCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<VendorContractFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: VendorContractCountAggregateInputType | true
    }

  export interface VendorContractDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['VendorContract'], meta: { name: 'VendorContract' } }
    /**
     * Find zero or one VendorContract that matches the filter.
     * @param {VendorContractFindUniqueArgs} args - Arguments to find a VendorContract
     * @example
     * // Get one VendorContract
     * const vendorContract = await prisma.vendorContract.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends VendorContractFindUniqueArgs>(args: SelectSubset<T, VendorContractFindUniqueArgs<ExtArgs>>): Prisma__VendorContractClient<$Result.GetResult<Prisma.$VendorContractPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one VendorContract that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {VendorContractFindUniqueOrThrowArgs} args - Arguments to find a VendorContract
     * @example
     * // Get one VendorContract
     * const vendorContract = await prisma.vendorContract.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends VendorContractFindUniqueOrThrowArgs>(args: SelectSubset<T, VendorContractFindUniqueOrThrowArgs<ExtArgs>>): Prisma__VendorContractClient<$Result.GetResult<Prisma.$VendorContractPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first VendorContract that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VendorContractFindFirstArgs} args - Arguments to find a VendorContract
     * @example
     * // Get one VendorContract
     * const vendorContract = await prisma.vendorContract.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends VendorContractFindFirstArgs>(args?: SelectSubset<T, VendorContractFindFirstArgs<ExtArgs>>): Prisma__VendorContractClient<$Result.GetResult<Prisma.$VendorContractPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first VendorContract that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VendorContractFindFirstOrThrowArgs} args - Arguments to find a VendorContract
     * @example
     * // Get one VendorContract
     * const vendorContract = await prisma.vendorContract.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends VendorContractFindFirstOrThrowArgs>(args?: SelectSubset<T, VendorContractFindFirstOrThrowArgs<ExtArgs>>): Prisma__VendorContractClient<$Result.GetResult<Prisma.$VendorContractPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more VendorContracts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VendorContractFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all VendorContracts
     * const vendorContracts = await prisma.vendorContract.findMany()
     * 
     * // Get first 10 VendorContracts
     * const vendorContracts = await prisma.vendorContract.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const vendorContractWithIdOnly = await prisma.vendorContract.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends VendorContractFindManyArgs>(args?: SelectSubset<T, VendorContractFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VendorContractPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a VendorContract.
     * @param {VendorContractCreateArgs} args - Arguments to create a VendorContract.
     * @example
     * // Create one VendorContract
     * const VendorContract = await prisma.vendorContract.create({
     *   data: {
     *     // ... data to create a VendorContract
     *   }
     * })
     * 
     */
    create<T extends VendorContractCreateArgs>(args: SelectSubset<T, VendorContractCreateArgs<ExtArgs>>): Prisma__VendorContractClient<$Result.GetResult<Prisma.$VendorContractPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many VendorContracts.
     * @param {VendorContractCreateManyArgs} args - Arguments to create many VendorContracts.
     * @example
     * // Create many VendorContracts
     * const vendorContract = await prisma.vendorContract.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends VendorContractCreateManyArgs>(args?: SelectSubset<T, VendorContractCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many VendorContracts and returns the data saved in the database.
     * @param {VendorContractCreateManyAndReturnArgs} args - Arguments to create many VendorContracts.
     * @example
     * // Create many VendorContracts
     * const vendorContract = await prisma.vendorContract.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many VendorContracts and only return the `id`
     * const vendorContractWithIdOnly = await prisma.vendorContract.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends VendorContractCreateManyAndReturnArgs>(args?: SelectSubset<T, VendorContractCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VendorContractPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a VendorContract.
     * @param {VendorContractDeleteArgs} args - Arguments to delete one VendorContract.
     * @example
     * // Delete one VendorContract
     * const VendorContract = await prisma.vendorContract.delete({
     *   where: {
     *     // ... filter to delete one VendorContract
     *   }
     * })
     * 
     */
    delete<T extends VendorContractDeleteArgs>(args: SelectSubset<T, VendorContractDeleteArgs<ExtArgs>>): Prisma__VendorContractClient<$Result.GetResult<Prisma.$VendorContractPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one VendorContract.
     * @param {VendorContractUpdateArgs} args - Arguments to update one VendorContract.
     * @example
     * // Update one VendorContract
     * const vendorContract = await prisma.vendorContract.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends VendorContractUpdateArgs>(args: SelectSubset<T, VendorContractUpdateArgs<ExtArgs>>): Prisma__VendorContractClient<$Result.GetResult<Prisma.$VendorContractPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more VendorContracts.
     * @param {VendorContractDeleteManyArgs} args - Arguments to filter VendorContracts to delete.
     * @example
     * // Delete a few VendorContracts
     * const { count } = await prisma.vendorContract.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends VendorContractDeleteManyArgs>(args?: SelectSubset<T, VendorContractDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more VendorContracts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VendorContractUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many VendorContracts
     * const vendorContract = await prisma.vendorContract.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends VendorContractUpdateManyArgs>(args: SelectSubset<T, VendorContractUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more VendorContracts and returns the data updated in the database.
     * @param {VendorContractUpdateManyAndReturnArgs} args - Arguments to update many VendorContracts.
     * @example
     * // Update many VendorContracts
     * const vendorContract = await prisma.vendorContract.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more VendorContracts and only return the `id`
     * const vendorContractWithIdOnly = await prisma.vendorContract.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends VendorContractUpdateManyAndReturnArgs>(args: SelectSubset<T, VendorContractUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VendorContractPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one VendorContract.
     * @param {VendorContractUpsertArgs} args - Arguments to update or create a VendorContract.
     * @example
     * // Update or create a VendorContract
     * const vendorContract = await prisma.vendorContract.upsert({
     *   create: {
     *     // ... data to create a VendorContract
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the VendorContract we want to update
     *   }
     * })
     */
    upsert<T extends VendorContractUpsertArgs>(args: SelectSubset<T, VendorContractUpsertArgs<ExtArgs>>): Prisma__VendorContractClient<$Result.GetResult<Prisma.$VendorContractPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of VendorContracts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VendorContractCountArgs} args - Arguments to filter VendorContracts to count.
     * @example
     * // Count the number of VendorContracts
     * const count = await prisma.vendorContract.count({
     *   where: {
     *     // ... the filter for the VendorContracts we want to count
     *   }
     * })
    **/
    count<T extends VendorContractCountArgs>(
      args?: Subset<T, VendorContractCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], VendorContractCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a VendorContract.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VendorContractAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends VendorContractAggregateArgs>(args: Subset<T, VendorContractAggregateArgs>): Prisma.PrismaPromise<GetVendorContractAggregateType<T>>

    /**
     * Group by VendorContract.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VendorContractGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends VendorContractGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: VendorContractGroupByArgs['orderBy'] }
        : { orderBy?: VendorContractGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, VendorContractGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetVendorContractGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the VendorContract model
   */
  readonly fields: VendorContractFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for VendorContract.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__VendorContractClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    vendor<T extends VendorDefaultArgs<ExtArgs> = {}>(args?: Subset<T, VendorDefaultArgs<ExtArgs>>): Prisma__VendorClient<$Result.GetResult<Prisma.$VendorPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the VendorContract model
   */
  interface VendorContractFieldRefs {
    readonly id: FieldRef<"VendorContract", 'String'>
    readonly vendorId: FieldRef<"VendorContract", 'String'>
    readonly startAt: FieldRef<"VendorContract", 'DateTime'>
    readonly endAt: FieldRef<"VendorContract", 'DateTime'>
    readonly valueCents: FieldRef<"VendorContract", 'BigInt'>
    readonly status: FieldRef<"VendorContract", 'String'>
    readonly notes: FieldRef<"VendorContract", 'String'>
    readonly createdAt: FieldRef<"VendorContract", 'DateTime'>
    readonly updatedAt: FieldRef<"VendorContract", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * VendorContract findUnique
   */
  export type VendorContractFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VendorContract
     */
    select?: VendorContractSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VendorContract
     */
    omit?: VendorContractOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VendorContractInclude<ExtArgs> | null
    /**
     * Filter, which VendorContract to fetch.
     */
    where: VendorContractWhereUniqueInput
  }

  /**
   * VendorContract findUniqueOrThrow
   */
  export type VendorContractFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VendorContract
     */
    select?: VendorContractSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VendorContract
     */
    omit?: VendorContractOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VendorContractInclude<ExtArgs> | null
    /**
     * Filter, which VendorContract to fetch.
     */
    where: VendorContractWhereUniqueInput
  }

  /**
   * VendorContract findFirst
   */
  export type VendorContractFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VendorContract
     */
    select?: VendorContractSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VendorContract
     */
    omit?: VendorContractOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VendorContractInclude<ExtArgs> | null
    /**
     * Filter, which VendorContract to fetch.
     */
    where?: VendorContractWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VendorContracts to fetch.
     */
    orderBy?: VendorContractOrderByWithRelationInput | VendorContractOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for VendorContracts.
     */
    cursor?: VendorContractWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VendorContracts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VendorContracts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VendorContracts.
     */
    distinct?: VendorContractScalarFieldEnum | VendorContractScalarFieldEnum[]
  }

  /**
   * VendorContract findFirstOrThrow
   */
  export type VendorContractFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VendorContract
     */
    select?: VendorContractSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VendorContract
     */
    omit?: VendorContractOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VendorContractInclude<ExtArgs> | null
    /**
     * Filter, which VendorContract to fetch.
     */
    where?: VendorContractWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VendorContracts to fetch.
     */
    orderBy?: VendorContractOrderByWithRelationInput | VendorContractOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for VendorContracts.
     */
    cursor?: VendorContractWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VendorContracts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VendorContracts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VendorContracts.
     */
    distinct?: VendorContractScalarFieldEnum | VendorContractScalarFieldEnum[]
  }

  /**
   * VendorContract findMany
   */
  export type VendorContractFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VendorContract
     */
    select?: VendorContractSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VendorContract
     */
    omit?: VendorContractOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VendorContractInclude<ExtArgs> | null
    /**
     * Filter, which VendorContracts to fetch.
     */
    where?: VendorContractWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VendorContracts to fetch.
     */
    orderBy?: VendorContractOrderByWithRelationInput | VendorContractOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing VendorContracts.
     */
    cursor?: VendorContractWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VendorContracts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VendorContracts.
     */
    skip?: number
    distinct?: VendorContractScalarFieldEnum | VendorContractScalarFieldEnum[]
  }

  /**
   * VendorContract create
   */
  export type VendorContractCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VendorContract
     */
    select?: VendorContractSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VendorContract
     */
    omit?: VendorContractOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VendorContractInclude<ExtArgs> | null
    /**
     * The data needed to create a VendorContract.
     */
    data: XOR<VendorContractCreateInput, VendorContractUncheckedCreateInput>
  }

  /**
   * VendorContract createMany
   */
  export type VendorContractCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many VendorContracts.
     */
    data: VendorContractCreateManyInput | VendorContractCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * VendorContract createManyAndReturn
   */
  export type VendorContractCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VendorContract
     */
    select?: VendorContractSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the VendorContract
     */
    omit?: VendorContractOmit<ExtArgs> | null
    /**
     * The data used to create many VendorContracts.
     */
    data: VendorContractCreateManyInput | VendorContractCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VendorContractIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * VendorContract update
   */
  export type VendorContractUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VendorContract
     */
    select?: VendorContractSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VendorContract
     */
    omit?: VendorContractOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VendorContractInclude<ExtArgs> | null
    /**
     * The data needed to update a VendorContract.
     */
    data: XOR<VendorContractUpdateInput, VendorContractUncheckedUpdateInput>
    /**
     * Choose, which VendorContract to update.
     */
    where: VendorContractWhereUniqueInput
  }

  /**
   * VendorContract updateMany
   */
  export type VendorContractUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update VendorContracts.
     */
    data: XOR<VendorContractUpdateManyMutationInput, VendorContractUncheckedUpdateManyInput>
    /**
     * Filter which VendorContracts to update
     */
    where?: VendorContractWhereInput
    /**
     * Limit how many VendorContracts to update.
     */
    limit?: number
  }

  /**
   * VendorContract updateManyAndReturn
   */
  export type VendorContractUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VendorContract
     */
    select?: VendorContractSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the VendorContract
     */
    omit?: VendorContractOmit<ExtArgs> | null
    /**
     * The data used to update VendorContracts.
     */
    data: XOR<VendorContractUpdateManyMutationInput, VendorContractUncheckedUpdateManyInput>
    /**
     * Filter which VendorContracts to update
     */
    where?: VendorContractWhereInput
    /**
     * Limit how many VendorContracts to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VendorContractIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * VendorContract upsert
   */
  export type VendorContractUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VendorContract
     */
    select?: VendorContractSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VendorContract
     */
    omit?: VendorContractOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VendorContractInclude<ExtArgs> | null
    /**
     * The filter to search for the VendorContract to update in case it exists.
     */
    where: VendorContractWhereUniqueInput
    /**
     * In case the VendorContract found by the `where` argument doesn't exist, create a new VendorContract with this data.
     */
    create: XOR<VendorContractCreateInput, VendorContractUncheckedCreateInput>
    /**
     * In case the VendorContract was found with the provided `where` argument, update it with this data.
     */
    update: XOR<VendorContractUpdateInput, VendorContractUncheckedUpdateInput>
  }

  /**
   * VendorContract delete
   */
  export type VendorContractDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VendorContract
     */
    select?: VendorContractSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VendorContract
     */
    omit?: VendorContractOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VendorContractInclude<ExtArgs> | null
    /**
     * Filter which VendorContract to delete.
     */
    where: VendorContractWhereUniqueInput
  }

  /**
   * VendorContract deleteMany
   */
  export type VendorContractDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which VendorContracts to delete
     */
    where?: VendorContractWhereInput
    /**
     * Limit how many VendorContracts to delete.
     */
    limit?: number
  }

  /**
   * VendorContract without action
   */
  export type VendorContractDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VendorContract
     */
    select?: VendorContractSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VendorContract
     */
    omit?: VendorContractOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VendorContractInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const InvoiceScalarFieldEnum: {
    id: 'id',
    clientId: 'clientId',
    projectId: 'projectId',
    number: 'number',
    description: 'description',
    lineItems: 'lineItems',
    billingPeriod: 'billingPeriod',
    costCenter: 'costCenter',
    amountCents: 'amountCents',
    currency: 'currency',
    status: 'status',
    issuedAt: 'issuedAt',
    dueAt: 'dueAt',
    paidAt: 'paidAt',
    pdfFileId: 'pdfFileId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type InvoiceScalarFieldEnum = (typeof InvoiceScalarFieldEnum)[keyof typeof InvoiceScalarFieldEnum]


  export const PaymentScalarFieldEnum: {
    id: 'id',
    clientId: 'clientId',
    projectId: 'projectId',
    invoiceId: 'invoiceId',
    source: 'source',
    amountCents: 'amountCents',
    status: 'status',
    provider: 'provider',
    transactionRef: 'transactionRef',
    paidAt: 'paidAt',
    receiptFileId: 'receiptFileId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type PaymentScalarFieldEnum = (typeof PaymentScalarFieldEnum)[keyof typeof PaymentScalarFieldEnum]


  export const InvoiceInstallmentScalarFieldEnum: {
    id: 'id',
    invoiceId: 'invoiceId',
    clientId: 'clientId',
    projectId: 'projectId',
    number: 'number',
    name: 'name',
    amountCents: 'amountCents',
    dueAt: 'dueAt',
    paidAt: 'paidAt',
    status: 'status',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type InvoiceInstallmentScalarFieldEnum = (typeof InvoiceInstallmentScalarFieldEnum)[keyof typeof InvoiceInstallmentScalarFieldEnum]


  export const ExpenseScalarFieldEnum: {
    id: 'id',
    clientId: 'clientId',
    category: 'category',
    subcategory: 'subcategory',
    description: 'description',
    amountCents: 'amountCents',
    submittedBy: 'submittedBy',
    status: 'status',
    hasReceipt: 'hasReceipt',
    isBillable: 'isBillable',
    expenseDate: 'expenseDate',
    approvedAt: 'approvedAt',
    rejectedAt: 'rejectedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ExpenseScalarFieldEnum = (typeof ExpenseScalarFieldEnum)[keyof typeof ExpenseScalarFieldEnum]


  export const ExpenseBudgetScalarFieldEnum: {
    id: 'id',
    category: 'category',
    budgetCents: 'budgetCents',
    spentCents: 'spentCents',
    fiscalYear: 'fiscalYear',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ExpenseBudgetScalarFieldEnum = (typeof ExpenseBudgetScalarFieldEnum)[keyof typeof ExpenseBudgetScalarFieldEnum]


  export const LoyaltyAccountScalarFieldEnum: {
    id: 'id',
    clientId: 'clientId',
    tier: 'tier',
    balancePoints: 'balancePoints',
    totalEarned: 'totalEarned',
    lastActivityAt: 'lastActivityAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type LoyaltyAccountScalarFieldEnum = (typeof LoyaltyAccountScalarFieldEnum)[keyof typeof LoyaltyAccountScalarFieldEnum]


  export const CreditTransactionScalarFieldEnum: {
    id: 'id',
    loyaltyAccountId: 'loyaltyAccountId',
    type: 'type',
    points: 'points',
    description: 'description',
    referenceId: 'referenceId',
    createdAt: 'createdAt'
  };

  export type CreditTransactionScalarFieldEnum = (typeof CreditTransactionScalarFieldEnum)[keyof typeof CreditTransactionScalarFieldEnum]


  export const VendorScalarFieldEnum: {
    id: 'id',
    name: 'name',
    category: 'category',
    contactName: 'contactName',
    contactEmail: 'contactEmail',
    status: 'status',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type VendorScalarFieldEnum = (typeof VendorScalarFieldEnum)[keyof typeof VendorScalarFieldEnum]


  export const VendorContractScalarFieldEnum: {
    id: 'id',
    vendorId: 'vendorId',
    startAt: 'startAt',
    endAt: 'endAt',
    valueCents: 'valueCents',
    status: 'status',
    notes: 'notes',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type VendorContractScalarFieldEnum = (typeof VendorContractScalarFieldEnum)[keyof typeof VendorContractScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'BigInt'
   */
  export type BigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt'>
    


  /**
   * Reference to a field of type 'BigInt[]'
   */
  export type ListBigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt[]'>
    


  /**
   * Reference to a field of type 'InvoiceStatus'
   */
  export type EnumInvoiceStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'InvoiceStatus'>
    


  /**
   * Reference to a field of type 'InvoiceStatus[]'
   */
  export type ListEnumInvoiceStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'InvoiceStatus[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'PaymentStatus'
   */
  export type EnumPaymentStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PaymentStatus'>
    


  /**
   * Reference to a field of type 'PaymentStatus[]'
   */
  export type ListEnumPaymentStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PaymentStatus[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type InvoiceWhereInput = {
    AND?: InvoiceWhereInput | InvoiceWhereInput[]
    OR?: InvoiceWhereInput[]
    NOT?: InvoiceWhereInput | InvoiceWhereInput[]
    id?: StringFilter<"Invoice"> | string
    clientId?: StringFilter<"Invoice"> | string
    projectId?: StringNullableFilter<"Invoice"> | string | null
    number?: StringFilter<"Invoice"> | string
    description?: StringNullableFilter<"Invoice"> | string | null
    lineItems?: StringNullableFilter<"Invoice"> | string | null
    billingPeriod?: StringNullableFilter<"Invoice"> | string | null
    costCenter?: StringNullableFilter<"Invoice"> | string | null
    amountCents?: BigIntFilter<"Invoice"> | bigint | number
    currency?: StringFilter<"Invoice"> | string
    status?: EnumInvoiceStatusFilter<"Invoice"> | $Enums.InvoiceStatus
    issuedAt?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    dueAt?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    paidAt?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    pdfFileId?: StringNullableFilter<"Invoice"> | string | null
    createdAt?: DateTimeFilter<"Invoice"> | Date | string
    updatedAt?: DateTimeFilter<"Invoice"> | Date | string
    payments?: PaymentListRelationFilter
    installments?: InvoiceInstallmentListRelationFilter
  }

  export type InvoiceOrderByWithRelationInput = {
    id?: SortOrder
    clientId?: SortOrder
    projectId?: SortOrderInput | SortOrder
    number?: SortOrder
    description?: SortOrderInput | SortOrder
    lineItems?: SortOrderInput | SortOrder
    billingPeriod?: SortOrderInput | SortOrder
    costCenter?: SortOrderInput | SortOrder
    amountCents?: SortOrder
    currency?: SortOrder
    status?: SortOrder
    issuedAt?: SortOrderInput | SortOrder
    dueAt?: SortOrderInput | SortOrder
    paidAt?: SortOrderInput | SortOrder
    pdfFileId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    payments?: PaymentOrderByRelationAggregateInput
    installments?: InvoiceInstallmentOrderByRelationAggregateInput
  }

  export type InvoiceWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    clientId_number?: InvoiceClientIdNumberCompoundUniqueInput
    AND?: InvoiceWhereInput | InvoiceWhereInput[]
    OR?: InvoiceWhereInput[]
    NOT?: InvoiceWhereInput | InvoiceWhereInput[]
    clientId?: StringFilter<"Invoice"> | string
    projectId?: StringNullableFilter<"Invoice"> | string | null
    number?: StringFilter<"Invoice"> | string
    description?: StringNullableFilter<"Invoice"> | string | null
    lineItems?: StringNullableFilter<"Invoice"> | string | null
    billingPeriod?: StringNullableFilter<"Invoice"> | string | null
    costCenter?: StringNullableFilter<"Invoice"> | string | null
    amountCents?: BigIntFilter<"Invoice"> | bigint | number
    currency?: StringFilter<"Invoice"> | string
    status?: EnumInvoiceStatusFilter<"Invoice"> | $Enums.InvoiceStatus
    issuedAt?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    dueAt?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    paidAt?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    pdfFileId?: StringNullableFilter<"Invoice"> | string | null
    createdAt?: DateTimeFilter<"Invoice"> | Date | string
    updatedAt?: DateTimeFilter<"Invoice"> | Date | string
    payments?: PaymentListRelationFilter
    installments?: InvoiceInstallmentListRelationFilter
  }, "id" | "clientId_number">

  export type InvoiceOrderByWithAggregationInput = {
    id?: SortOrder
    clientId?: SortOrder
    projectId?: SortOrderInput | SortOrder
    number?: SortOrder
    description?: SortOrderInput | SortOrder
    lineItems?: SortOrderInput | SortOrder
    billingPeriod?: SortOrderInput | SortOrder
    costCenter?: SortOrderInput | SortOrder
    amountCents?: SortOrder
    currency?: SortOrder
    status?: SortOrder
    issuedAt?: SortOrderInput | SortOrder
    dueAt?: SortOrderInput | SortOrder
    paidAt?: SortOrderInput | SortOrder
    pdfFileId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: InvoiceCountOrderByAggregateInput
    _avg?: InvoiceAvgOrderByAggregateInput
    _max?: InvoiceMaxOrderByAggregateInput
    _min?: InvoiceMinOrderByAggregateInput
    _sum?: InvoiceSumOrderByAggregateInput
  }

  export type InvoiceScalarWhereWithAggregatesInput = {
    AND?: InvoiceScalarWhereWithAggregatesInput | InvoiceScalarWhereWithAggregatesInput[]
    OR?: InvoiceScalarWhereWithAggregatesInput[]
    NOT?: InvoiceScalarWhereWithAggregatesInput | InvoiceScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Invoice"> | string
    clientId?: StringWithAggregatesFilter<"Invoice"> | string
    projectId?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    number?: StringWithAggregatesFilter<"Invoice"> | string
    description?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    lineItems?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    billingPeriod?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    costCenter?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    amountCents?: BigIntWithAggregatesFilter<"Invoice"> | bigint | number
    currency?: StringWithAggregatesFilter<"Invoice"> | string
    status?: EnumInvoiceStatusWithAggregatesFilter<"Invoice"> | $Enums.InvoiceStatus
    issuedAt?: DateTimeNullableWithAggregatesFilter<"Invoice"> | Date | string | null
    dueAt?: DateTimeNullableWithAggregatesFilter<"Invoice"> | Date | string | null
    paidAt?: DateTimeNullableWithAggregatesFilter<"Invoice"> | Date | string | null
    pdfFileId?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Invoice"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Invoice"> | Date | string
  }

  export type PaymentWhereInput = {
    AND?: PaymentWhereInput | PaymentWhereInput[]
    OR?: PaymentWhereInput[]
    NOT?: PaymentWhereInput | PaymentWhereInput[]
    id?: StringFilter<"Payment"> | string
    clientId?: StringFilter<"Payment"> | string
    projectId?: StringNullableFilter<"Payment"> | string | null
    invoiceId?: StringFilter<"Payment"> | string
    source?: StringNullableFilter<"Payment"> | string | null
    amountCents?: BigIntFilter<"Payment"> | bigint | number
    status?: EnumPaymentStatusFilter<"Payment"> | $Enums.PaymentStatus
    provider?: StringNullableFilter<"Payment"> | string | null
    transactionRef?: StringNullableFilter<"Payment"> | string | null
    paidAt?: DateTimeNullableFilter<"Payment"> | Date | string | null
    receiptFileId?: StringNullableFilter<"Payment"> | string | null
    createdAt?: DateTimeFilter<"Payment"> | Date | string
    updatedAt?: DateTimeFilter<"Payment"> | Date | string
    invoice?: XOR<InvoiceScalarRelationFilter, InvoiceWhereInput>
  }

  export type PaymentOrderByWithRelationInput = {
    id?: SortOrder
    clientId?: SortOrder
    projectId?: SortOrderInput | SortOrder
    invoiceId?: SortOrder
    source?: SortOrderInput | SortOrder
    amountCents?: SortOrder
    status?: SortOrder
    provider?: SortOrderInput | SortOrder
    transactionRef?: SortOrderInput | SortOrder
    paidAt?: SortOrderInput | SortOrder
    receiptFileId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    invoice?: InvoiceOrderByWithRelationInput
  }

  export type PaymentWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: PaymentWhereInput | PaymentWhereInput[]
    OR?: PaymentWhereInput[]
    NOT?: PaymentWhereInput | PaymentWhereInput[]
    clientId?: StringFilter<"Payment"> | string
    projectId?: StringNullableFilter<"Payment"> | string | null
    invoiceId?: StringFilter<"Payment"> | string
    source?: StringNullableFilter<"Payment"> | string | null
    amountCents?: BigIntFilter<"Payment"> | bigint | number
    status?: EnumPaymentStatusFilter<"Payment"> | $Enums.PaymentStatus
    provider?: StringNullableFilter<"Payment"> | string | null
    transactionRef?: StringNullableFilter<"Payment"> | string | null
    paidAt?: DateTimeNullableFilter<"Payment"> | Date | string | null
    receiptFileId?: StringNullableFilter<"Payment"> | string | null
    createdAt?: DateTimeFilter<"Payment"> | Date | string
    updatedAt?: DateTimeFilter<"Payment"> | Date | string
    invoice?: XOR<InvoiceScalarRelationFilter, InvoiceWhereInput>
  }, "id">

  export type PaymentOrderByWithAggregationInput = {
    id?: SortOrder
    clientId?: SortOrder
    projectId?: SortOrderInput | SortOrder
    invoiceId?: SortOrder
    source?: SortOrderInput | SortOrder
    amountCents?: SortOrder
    status?: SortOrder
    provider?: SortOrderInput | SortOrder
    transactionRef?: SortOrderInput | SortOrder
    paidAt?: SortOrderInput | SortOrder
    receiptFileId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: PaymentCountOrderByAggregateInput
    _avg?: PaymentAvgOrderByAggregateInput
    _max?: PaymentMaxOrderByAggregateInput
    _min?: PaymentMinOrderByAggregateInput
    _sum?: PaymentSumOrderByAggregateInput
  }

  export type PaymentScalarWhereWithAggregatesInput = {
    AND?: PaymentScalarWhereWithAggregatesInput | PaymentScalarWhereWithAggregatesInput[]
    OR?: PaymentScalarWhereWithAggregatesInput[]
    NOT?: PaymentScalarWhereWithAggregatesInput | PaymentScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Payment"> | string
    clientId?: StringWithAggregatesFilter<"Payment"> | string
    projectId?: StringNullableWithAggregatesFilter<"Payment"> | string | null
    invoiceId?: StringWithAggregatesFilter<"Payment"> | string
    source?: StringNullableWithAggregatesFilter<"Payment"> | string | null
    amountCents?: BigIntWithAggregatesFilter<"Payment"> | bigint | number
    status?: EnumPaymentStatusWithAggregatesFilter<"Payment"> | $Enums.PaymentStatus
    provider?: StringNullableWithAggregatesFilter<"Payment"> | string | null
    transactionRef?: StringNullableWithAggregatesFilter<"Payment"> | string | null
    paidAt?: DateTimeNullableWithAggregatesFilter<"Payment"> | Date | string | null
    receiptFileId?: StringNullableWithAggregatesFilter<"Payment"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Payment"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Payment"> | Date | string
  }

  export type InvoiceInstallmentWhereInput = {
    AND?: InvoiceInstallmentWhereInput | InvoiceInstallmentWhereInput[]
    OR?: InvoiceInstallmentWhereInput[]
    NOT?: InvoiceInstallmentWhereInput | InvoiceInstallmentWhereInput[]
    id?: StringFilter<"InvoiceInstallment"> | string
    invoiceId?: StringFilter<"InvoiceInstallment"> | string
    clientId?: StringFilter<"InvoiceInstallment"> | string
    projectId?: StringNullableFilter<"InvoiceInstallment"> | string | null
    number?: IntFilter<"InvoiceInstallment"> | number
    name?: StringFilter<"InvoiceInstallment"> | string
    amountCents?: BigIntFilter<"InvoiceInstallment"> | bigint | number
    dueAt?: DateTimeNullableFilter<"InvoiceInstallment"> | Date | string | null
    paidAt?: DateTimeNullableFilter<"InvoiceInstallment"> | Date | string | null
    status?: StringFilter<"InvoiceInstallment"> | string
    createdAt?: DateTimeFilter<"InvoiceInstallment"> | Date | string
    updatedAt?: DateTimeFilter<"InvoiceInstallment"> | Date | string
    invoice?: XOR<InvoiceScalarRelationFilter, InvoiceWhereInput>
  }

  export type InvoiceInstallmentOrderByWithRelationInput = {
    id?: SortOrder
    invoiceId?: SortOrder
    clientId?: SortOrder
    projectId?: SortOrderInput | SortOrder
    number?: SortOrder
    name?: SortOrder
    amountCents?: SortOrder
    dueAt?: SortOrderInput | SortOrder
    paidAt?: SortOrderInput | SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    invoice?: InvoiceOrderByWithRelationInput
  }

  export type InvoiceInstallmentWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: InvoiceInstallmentWhereInput | InvoiceInstallmentWhereInput[]
    OR?: InvoiceInstallmentWhereInput[]
    NOT?: InvoiceInstallmentWhereInput | InvoiceInstallmentWhereInput[]
    invoiceId?: StringFilter<"InvoiceInstallment"> | string
    clientId?: StringFilter<"InvoiceInstallment"> | string
    projectId?: StringNullableFilter<"InvoiceInstallment"> | string | null
    number?: IntFilter<"InvoiceInstallment"> | number
    name?: StringFilter<"InvoiceInstallment"> | string
    amountCents?: BigIntFilter<"InvoiceInstallment"> | bigint | number
    dueAt?: DateTimeNullableFilter<"InvoiceInstallment"> | Date | string | null
    paidAt?: DateTimeNullableFilter<"InvoiceInstallment"> | Date | string | null
    status?: StringFilter<"InvoiceInstallment"> | string
    createdAt?: DateTimeFilter<"InvoiceInstallment"> | Date | string
    updatedAt?: DateTimeFilter<"InvoiceInstallment"> | Date | string
    invoice?: XOR<InvoiceScalarRelationFilter, InvoiceWhereInput>
  }, "id">

  export type InvoiceInstallmentOrderByWithAggregationInput = {
    id?: SortOrder
    invoiceId?: SortOrder
    clientId?: SortOrder
    projectId?: SortOrderInput | SortOrder
    number?: SortOrder
    name?: SortOrder
    amountCents?: SortOrder
    dueAt?: SortOrderInput | SortOrder
    paidAt?: SortOrderInput | SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: InvoiceInstallmentCountOrderByAggregateInput
    _avg?: InvoiceInstallmentAvgOrderByAggregateInput
    _max?: InvoiceInstallmentMaxOrderByAggregateInput
    _min?: InvoiceInstallmentMinOrderByAggregateInput
    _sum?: InvoiceInstallmentSumOrderByAggregateInput
  }

  export type InvoiceInstallmentScalarWhereWithAggregatesInput = {
    AND?: InvoiceInstallmentScalarWhereWithAggregatesInput | InvoiceInstallmentScalarWhereWithAggregatesInput[]
    OR?: InvoiceInstallmentScalarWhereWithAggregatesInput[]
    NOT?: InvoiceInstallmentScalarWhereWithAggregatesInput | InvoiceInstallmentScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"InvoiceInstallment"> | string
    invoiceId?: StringWithAggregatesFilter<"InvoiceInstallment"> | string
    clientId?: StringWithAggregatesFilter<"InvoiceInstallment"> | string
    projectId?: StringNullableWithAggregatesFilter<"InvoiceInstallment"> | string | null
    number?: IntWithAggregatesFilter<"InvoiceInstallment"> | number
    name?: StringWithAggregatesFilter<"InvoiceInstallment"> | string
    amountCents?: BigIntWithAggregatesFilter<"InvoiceInstallment"> | bigint | number
    dueAt?: DateTimeNullableWithAggregatesFilter<"InvoiceInstallment"> | Date | string | null
    paidAt?: DateTimeNullableWithAggregatesFilter<"InvoiceInstallment"> | Date | string | null
    status?: StringWithAggregatesFilter<"InvoiceInstallment"> | string
    createdAt?: DateTimeWithAggregatesFilter<"InvoiceInstallment"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"InvoiceInstallment"> | Date | string
  }

  export type ExpenseWhereInput = {
    AND?: ExpenseWhereInput | ExpenseWhereInput[]
    OR?: ExpenseWhereInput[]
    NOT?: ExpenseWhereInput | ExpenseWhereInput[]
    id?: StringFilter<"Expense"> | string
    clientId?: StringNullableFilter<"Expense"> | string | null
    category?: StringFilter<"Expense"> | string
    subcategory?: StringNullableFilter<"Expense"> | string | null
    description?: StringFilter<"Expense"> | string
    amountCents?: BigIntFilter<"Expense"> | bigint | number
    submittedBy?: StringNullableFilter<"Expense"> | string | null
    status?: StringFilter<"Expense"> | string
    hasReceipt?: BoolFilter<"Expense"> | boolean
    isBillable?: BoolFilter<"Expense"> | boolean
    expenseDate?: DateTimeFilter<"Expense"> | Date | string
    approvedAt?: DateTimeNullableFilter<"Expense"> | Date | string | null
    rejectedAt?: DateTimeNullableFilter<"Expense"> | Date | string | null
    createdAt?: DateTimeFilter<"Expense"> | Date | string
    updatedAt?: DateTimeFilter<"Expense"> | Date | string
  }

  export type ExpenseOrderByWithRelationInput = {
    id?: SortOrder
    clientId?: SortOrderInput | SortOrder
    category?: SortOrder
    subcategory?: SortOrderInput | SortOrder
    description?: SortOrder
    amountCents?: SortOrder
    submittedBy?: SortOrderInput | SortOrder
    status?: SortOrder
    hasReceipt?: SortOrder
    isBillable?: SortOrder
    expenseDate?: SortOrder
    approvedAt?: SortOrderInput | SortOrder
    rejectedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ExpenseWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ExpenseWhereInput | ExpenseWhereInput[]
    OR?: ExpenseWhereInput[]
    NOT?: ExpenseWhereInput | ExpenseWhereInput[]
    clientId?: StringNullableFilter<"Expense"> | string | null
    category?: StringFilter<"Expense"> | string
    subcategory?: StringNullableFilter<"Expense"> | string | null
    description?: StringFilter<"Expense"> | string
    amountCents?: BigIntFilter<"Expense"> | bigint | number
    submittedBy?: StringNullableFilter<"Expense"> | string | null
    status?: StringFilter<"Expense"> | string
    hasReceipt?: BoolFilter<"Expense"> | boolean
    isBillable?: BoolFilter<"Expense"> | boolean
    expenseDate?: DateTimeFilter<"Expense"> | Date | string
    approvedAt?: DateTimeNullableFilter<"Expense"> | Date | string | null
    rejectedAt?: DateTimeNullableFilter<"Expense"> | Date | string | null
    createdAt?: DateTimeFilter<"Expense"> | Date | string
    updatedAt?: DateTimeFilter<"Expense"> | Date | string
  }, "id">

  export type ExpenseOrderByWithAggregationInput = {
    id?: SortOrder
    clientId?: SortOrderInput | SortOrder
    category?: SortOrder
    subcategory?: SortOrderInput | SortOrder
    description?: SortOrder
    amountCents?: SortOrder
    submittedBy?: SortOrderInput | SortOrder
    status?: SortOrder
    hasReceipt?: SortOrder
    isBillable?: SortOrder
    expenseDate?: SortOrder
    approvedAt?: SortOrderInput | SortOrder
    rejectedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ExpenseCountOrderByAggregateInput
    _avg?: ExpenseAvgOrderByAggregateInput
    _max?: ExpenseMaxOrderByAggregateInput
    _min?: ExpenseMinOrderByAggregateInput
    _sum?: ExpenseSumOrderByAggregateInput
  }

  export type ExpenseScalarWhereWithAggregatesInput = {
    AND?: ExpenseScalarWhereWithAggregatesInput | ExpenseScalarWhereWithAggregatesInput[]
    OR?: ExpenseScalarWhereWithAggregatesInput[]
    NOT?: ExpenseScalarWhereWithAggregatesInput | ExpenseScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Expense"> | string
    clientId?: StringNullableWithAggregatesFilter<"Expense"> | string | null
    category?: StringWithAggregatesFilter<"Expense"> | string
    subcategory?: StringNullableWithAggregatesFilter<"Expense"> | string | null
    description?: StringWithAggregatesFilter<"Expense"> | string
    amountCents?: BigIntWithAggregatesFilter<"Expense"> | bigint | number
    submittedBy?: StringNullableWithAggregatesFilter<"Expense"> | string | null
    status?: StringWithAggregatesFilter<"Expense"> | string
    hasReceipt?: BoolWithAggregatesFilter<"Expense"> | boolean
    isBillable?: BoolWithAggregatesFilter<"Expense"> | boolean
    expenseDate?: DateTimeWithAggregatesFilter<"Expense"> | Date | string
    approvedAt?: DateTimeNullableWithAggregatesFilter<"Expense"> | Date | string | null
    rejectedAt?: DateTimeNullableWithAggregatesFilter<"Expense"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Expense"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Expense"> | Date | string
  }

  export type ExpenseBudgetWhereInput = {
    AND?: ExpenseBudgetWhereInput | ExpenseBudgetWhereInput[]
    OR?: ExpenseBudgetWhereInput[]
    NOT?: ExpenseBudgetWhereInput | ExpenseBudgetWhereInput[]
    id?: StringFilter<"ExpenseBudget"> | string
    category?: StringFilter<"ExpenseBudget"> | string
    budgetCents?: BigIntFilter<"ExpenseBudget"> | bigint | number
    spentCents?: BigIntFilter<"ExpenseBudget"> | bigint | number
    fiscalYear?: IntFilter<"ExpenseBudget"> | number
    createdAt?: DateTimeFilter<"ExpenseBudget"> | Date | string
    updatedAt?: DateTimeFilter<"ExpenseBudget"> | Date | string
  }

  export type ExpenseBudgetOrderByWithRelationInput = {
    id?: SortOrder
    category?: SortOrder
    budgetCents?: SortOrder
    spentCents?: SortOrder
    fiscalYear?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ExpenseBudgetWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    category_fiscalYear?: ExpenseBudgetCategoryFiscalYearCompoundUniqueInput
    AND?: ExpenseBudgetWhereInput | ExpenseBudgetWhereInput[]
    OR?: ExpenseBudgetWhereInput[]
    NOT?: ExpenseBudgetWhereInput | ExpenseBudgetWhereInput[]
    category?: StringFilter<"ExpenseBudget"> | string
    budgetCents?: BigIntFilter<"ExpenseBudget"> | bigint | number
    spentCents?: BigIntFilter<"ExpenseBudget"> | bigint | number
    fiscalYear?: IntFilter<"ExpenseBudget"> | number
    createdAt?: DateTimeFilter<"ExpenseBudget"> | Date | string
    updatedAt?: DateTimeFilter<"ExpenseBudget"> | Date | string
  }, "id" | "category_fiscalYear">

  export type ExpenseBudgetOrderByWithAggregationInput = {
    id?: SortOrder
    category?: SortOrder
    budgetCents?: SortOrder
    spentCents?: SortOrder
    fiscalYear?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ExpenseBudgetCountOrderByAggregateInput
    _avg?: ExpenseBudgetAvgOrderByAggregateInput
    _max?: ExpenseBudgetMaxOrderByAggregateInput
    _min?: ExpenseBudgetMinOrderByAggregateInput
    _sum?: ExpenseBudgetSumOrderByAggregateInput
  }

  export type ExpenseBudgetScalarWhereWithAggregatesInput = {
    AND?: ExpenseBudgetScalarWhereWithAggregatesInput | ExpenseBudgetScalarWhereWithAggregatesInput[]
    OR?: ExpenseBudgetScalarWhereWithAggregatesInput[]
    NOT?: ExpenseBudgetScalarWhereWithAggregatesInput | ExpenseBudgetScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ExpenseBudget"> | string
    category?: StringWithAggregatesFilter<"ExpenseBudget"> | string
    budgetCents?: BigIntWithAggregatesFilter<"ExpenseBudget"> | bigint | number
    spentCents?: BigIntWithAggregatesFilter<"ExpenseBudget"> | bigint | number
    fiscalYear?: IntWithAggregatesFilter<"ExpenseBudget"> | number
    createdAt?: DateTimeWithAggregatesFilter<"ExpenseBudget"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ExpenseBudget"> | Date | string
  }

  export type LoyaltyAccountWhereInput = {
    AND?: LoyaltyAccountWhereInput | LoyaltyAccountWhereInput[]
    OR?: LoyaltyAccountWhereInput[]
    NOT?: LoyaltyAccountWhereInput | LoyaltyAccountWhereInput[]
    id?: StringFilter<"LoyaltyAccount"> | string
    clientId?: StringFilter<"LoyaltyAccount"> | string
    tier?: StringFilter<"LoyaltyAccount"> | string
    balancePoints?: IntFilter<"LoyaltyAccount"> | number
    totalEarned?: IntFilter<"LoyaltyAccount"> | number
    lastActivityAt?: DateTimeNullableFilter<"LoyaltyAccount"> | Date | string | null
    createdAt?: DateTimeFilter<"LoyaltyAccount"> | Date | string
    updatedAt?: DateTimeFilter<"LoyaltyAccount"> | Date | string
    transactions?: CreditTransactionListRelationFilter
  }

  export type LoyaltyAccountOrderByWithRelationInput = {
    id?: SortOrder
    clientId?: SortOrder
    tier?: SortOrder
    balancePoints?: SortOrder
    totalEarned?: SortOrder
    lastActivityAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    transactions?: CreditTransactionOrderByRelationAggregateInput
  }

  export type LoyaltyAccountWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    clientId?: string
    AND?: LoyaltyAccountWhereInput | LoyaltyAccountWhereInput[]
    OR?: LoyaltyAccountWhereInput[]
    NOT?: LoyaltyAccountWhereInput | LoyaltyAccountWhereInput[]
    tier?: StringFilter<"LoyaltyAccount"> | string
    balancePoints?: IntFilter<"LoyaltyAccount"> | number
    totalEarned?: IntFilter<"LoyaltyAccount"> | number
    lastActivityAt?: DateTimeNullableFilter<"LoyaltyAccount"> | Date | string | null
    createdAt?: DateTimeFilter<"LoyaltyAccount"> | Date | string
    updatedAt?: DateTimeFilter<"LoyaltyAccount"> | Date | string
    transactions?: CreditTransactionListRelationFilter
  }, "id" | "clientId">

  export type LoyaltyAccountOrderByWithAggregationInput = {
    id?: SortOrder
    clientId?: SortOrder
    tier?: SortOrder
    balancePoints?: SortOrder
    totalEarned?: SortOrder
    lastActivityAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: LoyaltyAccountCountOrderByAggregateInput
    _avg?: LoyaltyAccountAvgOrderByAggregateInput
    _max?: LoyaltyAccountMaxOrderByAggregateInput
    _min?: LoyaltyAccountMinOrderByAggregateInput
    _sum?: LoyaltyAccountSumOrderByAggregateInput
  }

  export type LoyaltyAccountScalarWhereWithAggregatesInput = {
    AND?: LoyaltyAccountScalarWhereWithAggregatesInput | LoyaltyAccountScalarWhereWithAggregatesInput[]
    OR?: LoyaltyAccountScalarWhereWithAggregatesInput[]
    NOT?: LoyaltyAccountScalarWhereWithAggregatesInput | LoyaltyAccountScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"LoyaltyAccount"> | string
    clientId?: StringWithAggregatesFilter<"LoyaltyAccount"> | string
    tier?: StringWithAggregatesFilter<"LoyaltyAccount"> | string
    balancePoints?: IntWithAggregatesFilter<"LoyaltyAccount"> | number
    totalEarned?: IntWithAggregatesFilter<"LoyaltyAccount"> | number
    lastActivityAt?: DateTimeNullableWithAggregatesFilter<"LoyaltyAccount"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"LoyaltyAccount"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"LoyaltyAccount"> | Date | string
  }

  export type CreditTransactionWhereInput = {
    AND?: CreditTransactionWhereInput | CreditTransactionWhereInput[]
    OR?: CreditTransactionWhereInput[]
    NOT?: CreditTransactionWhereInput | CreditTransactionWhereInput[]
    id?: StringFilter<"CreditTransaction"> | string
    loyaltyAccountId?: StringFilter<"CreditTransaction"> | string
    type?: StringFilter<"CreditTransaction"> | string
    points?: IntFilter<"CreditTransaction"> | number
    description?: StringNullableFilter<"CreditTransaction"> | string | null
    referenceId?: StringNullableFilter<"CreditTransaction"> | string | null
    createdAt?: DateTimeFilter<"CreditTransaction"> | Date | string
    account?: XOR<LoyaltyAccountScalarRelationFilter, LoyaltyAccountWhereInput>
  }

  export type CreditTransactionOrderByWithRelationInput = {
    id?: SortOrder
    loyaltyAccountId?: SortOrder
    type?: SortOrder
    points?: SortOrder
    description?: SortOrderInput | SortOrder
    referenceId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    account?: LoyaltyAccountOrderByWithRelationInput
  }

  export type CreditTransactionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: CreditTransactionWhereInput | CreditTransactionWhereInput[]
    OR?: CreditTransactionWhereInput[]
    NOT?: CreditTransactionWhereInput | CreditTransactionWhereInput[]
    loyaltyAccountId?: StringFilter<"CreditTransaction"> | string
    type?: StringFilter<"CreditTransaction"> | string
    points?: IntFilter<"CreditTransaction"> | number
    description?: StringNullableFilter<"CreditTransaction"> | string | null
    referenceId?: StringNullableFilter<"CreditTransaction"> | string | null
    createdAt?: DateTimeFilter<"CreditTransaction"> | Date | string
    account?: XOR<LoyaltyAccountScalarRelationFilter, LoyaltyAccountWhereInput>
  }, "id">

  export type CreditTransactionOrderByWithAggregationInput = {
    id?: SortOrder
    loyaltyAccountId?: SortOrder
    type?: SortOrder
    points?: SortOrder
    description?: SortOrderInput | SortOrder
    referenceId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: CreditTransactionCountOrderByAggregateInput
    _avg?: CreditTransactionAvgOrderByAggregateInput
    _max?: CreditTransactionMaxOrderByAggregateInput
    _min?: CreditTransactionMinOrderByAggregateInput
    _sum?: CreditTransactionSumOrderByAggregateInput
  }

  export type CreditTransactionScalarWhereWithAggregatesInput = {
    AND?: CreditTransactionScalarWhereWithAggregatesInput | CreditTransactionScalarWhereWithAggregatesInput[]
    OR?: CreditTransactionScalarWhereWithAggregatesInput[]
    NOT?: CreditTransactionScalarWhereWithAggregatesInput | CreditTransactionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"CreditTransaction"> | string
    loyaltyAccountId?: StringWithAggregatesFilter<"CreditTransaction"> | string
    type?: StringWithAggregatesFilter<"CreditTransaction"> | string
    points?: IntWithAggregatesFilter<"CreditTransaction"> | number
    description?: StringNullableWithAggregatesFilter<"CreditTransaction"> | string | null
    referenceId?: StringNullableWithAggregatesFilter<"CreditTransaction"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"CreditTransaction"> | Date | string
  }

  export type VendorWhereInput = {
    AND?: VendorWhereInput | VendorWhereInput[]
    OR?: VendorWhereInput[]
    NOT?: VendorWhereInput | VendorWhereInput[]
    id?: StringFilter<"Vendor"> | string
    name?: StringFilter<"Vendor"> | string
    category?: StringNullableFilter<"Vendor"> | string | null
    contactName?: StringNullableFilter<"Vendor"> | string | null
    contactEmail?: StringNullableFilter<"Vendor"> | string | null
    status?: StringFilter<"Vendor"> | string
    createdAt?: DateTimeFilter<"Vendor"> | Date | string
    updatedAt?: DateTimeFilter<"Vendor"> | Date | string
    contracts?: VendorContractListRelationFilter
  }

  export type VendorOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    category?: SortOrderInput | SortOrder
    contactName?: SortOrderInput | SortOrder
    contactEmail?: SortOrderInput | SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    contracts?: VendorContractOrderByRelationAggregateInput
  }

  export type VendorWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: VendorWhereInput | VendorWhereInput[]
    OR?: VendorWhereInput[]
    NOT?: VendorWhereInput | VendorWhereInput[]
    name?: StringFilter<"Vendor"> | string
    category?: StringNullableFilter<"Vendor"> | string | null
    contactName?: StringNullableFilter<"Vendor"> | string | null
    contactEmail?: StringNullableFilter<"Vendor"> | string | null
    status?: StringFilter<"Vendor"> | string
    createdAt?: DateTimeFilter<"Vendor"> | Date | string
    updatedAt?: DateTimeFilter<"Vendor"> | Date | string
    contracts?: VendorContractListRelationFilter
  }, "id">

  export type VendorOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    category?: SortOrderInput | SortOrder
    contactName?: SortOrderInput | SortOrder
    contactEmail?: SortOrderInput | SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: VendorCountOrderByAggregateInput
    _max?: VendorMaxOrderByAggregateInput
    _min?: VendorMinOrderByAggregateInput
  }

  export type VendorScalarWhereWithAggregatesInput = {
    AND?: VendorScalarWhereWithAggregatesInput | VendorScalarWhereWithAggregatesInput[]
    OR?: VendorScalarWhereWithAggregatesInput[]
    NOT?: VendorScalarWhereWithAggregatesInput | VendorScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Vendor"> | string
    name?: StringWithAggregatesFilter<"Vendor"> | string
    category?: StringNullableWithAggregatesFilter<"Vendor"> | string | null
    contactName?: StringNullableWithAggregatesFilter<"Vendor"> | string | null
    contactEmail?: StringNullableWithAggregatesFilter<"Vendor"> | string | null
    status?: StringWithAggregatesFilter<"Vendor"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Vendor"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Vendor"> | Date | string
  }

  export type VendorContractWhereInput = {
    AND?: VendorContractWhereInput | VendorContractWhereInput[]
    OR?: VendorContractWhereInput[]
    NOT?: VendorContractWhereInput | VendorContractWhereInput[]
    id?: StringFilter<"VendorContract"> | string
    vendorId?: StringFilter<"VendorContract"> | string
    startAt?: DateTimeFilter<"VendorContract"> | Date | string
    endAt?: DateTimeNullableFilter<"VendorContract"> | Date | string | null
    valueCents?: BigIntFilter<"VendorContract"> | bigint | number
    status?: StringFilter<"VendorContract"> | string
    notes?: StringNullableFilter<"VendorContract"> | string | null
    createdAt?: DateTimeFilter<"VendorContract"> | Date | string
    updatedAt?: DateTimeFilter<"VendorContract"> | Date | string
    vendor?: XOR<VendorScalarRelationFilter, VendorWhereInput>
  }

  export type VendorContractOrderByWithRelationInput = {
    id?: SortOrder
    vendorId?: SortOrder
    startAt?: SortOrder
    endAt?: SortOrderInput | SortOrder
    valueCents?: SortOrder
    status?: SortOrder
    notes?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    vendor?: VendorOrderByWithRelationInput
  }

  export type VendorContractWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: VendorContractWhereInput | VendorContractWhereInput[]
    OR?: VendorContractWhereInput[]
    NOT?: VendorContractWhereInput | VendorContractWhereInput[]
    vendorId?: StringFilter<"VendorContract"> | string
    startAt?: DateTimeFilter<"VendorContract"> | Date | string
    endAt?: DateTimeNullableFilter<"VendorContract"> | Date | string | null
    valueCents?: BigIntFilter<"VendorContract"> | bigint | number
    status?: StringFilter<"VendorContract"> | string
    notes?: StringNullableFilter<"VendorContract"> | string | null
    createdAt?: DateTimeFilter<"VendorContract"> | Date | string
    updatedAt?: DateTimeFilter<"VendorContract"> | Date | string
    vendor?: XOR<VendorScalarRelationFilter, VendorWhereInput>
  }, "id">

  export type VendorContractOrderByWithAggregationInput = {
    id?: SortOrder
    vendorId?: SortOrder
    startAt?: SortOrder
    endAt?: SortOrderInput | SortOrder
    valueCents?: SortOrder
    status?: SortOrder
    notes?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: VendorContractCountOrderByAggregateInput
    _avg?: VendorContractAvgOrderByAggregateInput
    _max?: VendorContractMaxOrderByAggregateInput
    _min?: VendorContractMinOrderByAggregateInput
    _sum?: VendorContractSumOrderByAggregateInput
  }

  export type VendorContractScalarWhereWithAggregatesInput = {
    AND?: VendorContractScalarWhereWithAggregatesInput | VendorContractScalarWhereWithAggregatesInput[]
    OR?: VendorContractScalarWhereWithAggregatesInput[]
    NOT?: VendorContractScalarWhereWithAggregatesInput | VendorContractScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"VendorContract"> | string
    vendorId?: StringWithAggregatesFilter<"VendorContract"> | string
    startAt?: DateTimeWithAggregatesFilter<"VendorContract"> | Date | string
    endAt?: DateTimeNullableWithAggregatesFilter<"VendorContract"> | Date | string | null
    valueCents?: BigIntWithAggregatesFilter<"VendorContract"> | bigint | number
    status?: StringWithAggregatesFilter<"VendorContract"> | string
    notes?: StringNullableWithAggregatesFilter<"VendorContract"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"VendorContract"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"VendorContract"> | Date | string
  }

  export type InvoiceCreateInput = {
    id?: string
    clientId: string
    projectId?: string | null
    number: string
    description?: string | null
    lineItems?: string | null
    billingPeriod?: string | null
    costCenter?: string | null
    amountCents: bigint | number
    currency?: string
    status?: $Enums.InvoiceStatus
    issuedAt?: Date | string | null
    dueAt?: Date | string | null
    paidAt?: Date | string | null
    pdfFileId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    payments?: PaymentCreateNestedManyWithoutInvoiceInput
    installments?: InvoiceInstallmentCreateNestedManyWithoutInvoiceInput
  }

  export type InvoiceUncheckedCreateInput = {
    id?: string
    clientId: string
    projectId?: string | null
    number: string
    description?: string | null
    lineItems?: string | null
    billingPeriod?: string | null
    costCenter?: string | null
    amountCents: bigint | number
    currency?: string
    status?: $Enums.InvoiceStatus
    issuedAt?: Date | string | null
    dueAt?: Date | string | null
    paidAt?: Date | string | null
    pdfFileId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    payments?: PaymentUncheckedCreateNestedManyWithoutInvoiceInput
    installments?: InvoiceInstallmentUncheckedCreateNestedManyWithoutInvoiceInput
  }

  export type InvoiceUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: StringFieldUpdateOperationsInput | string
    projectId?: NullableStringFieldUpdateOperationsInput | string | null
    number?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    lineItems?: NullableStringFieldUpdateOperationsInput | string | null
    billingPeriod?: NullableStringFieldUpdateOperationsInput | string | null
    costCenter?: NullableStringFieldUpdateOperationsInput | string | null
    amountCents?: BigIntFieldUpdateOperationsInput | bigint | number
    currency?: StringFieldUpdateOperationsInput | string
    status?: EnumInvoiceStatusFieldUpdateOperationsInput | $Enums.InvoiceStatus
    issuedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dueAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    pdfFileId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    payments?: PaymentUpdateManyWithoutInvoiceNestedInput
    installments?: InvoiceInstallmentUpdateManyWithoutInvoiceNestedInput
  }

  export type InvoiceUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: StringFieldUpdateOperationsInput | string
    projectId?: NullableStringFieldUpdateOperationsInput | string | null
    number?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    lineItems?: NullableStringFieldUpdateOperationsInput | string | null
    billingPeriod?: NullableStringFieldUpdateOperationsInput | string | null
    costCenter?: NullableStringFieldUpdateOperationsInput | string | null
    amountCents?: BigIntFieldUpdateOperationsInput | bigint | number
    currency?: StringFieldUpdateOperationsInput | string
    status?: EnumInvoiceStatusFieldUpdateOperationsInput | $Enums.InvoiceStatus
    issuedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dueAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    pdfFileId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    payments?: PaymentUncheckedUpdateManyWithoutInvoiceNestedInput
    installments?: InvoiceInstallmentUncheckedUpdateManyWithoutInvoiceNestedInput
  }

  export type InvoiceCreateManyInput = {
    id?: string
    clientId: string
    projectId?: string | null
    number: string
    description?: string | null
    lineItems?: string | null
    billingPeriod?: string | null
    costCenter?: string | null
    amountCents: bigint | number
    currency?: string
    status?: $Enums.InvoiceStatus
    issuedAt?: Date | string | null
    dueAt?: Date | string | null
    paidAt?: Date | string | null
    pdfFileId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type InvoiceUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: StringFieldUpdateOperationsInput | string
    projectId?: NullableStringFieldUpdateOperationsInput | string | null
    number?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    lineItems?: NullableStringFieldUpdateOperationsInput | string | null
    billingPeriod?: NullableStringFieldUpdateOperationsInput | string | null
    costCenter?: NullableStringFieldUpdateOperationsInput | string | null
    amountCents?: BigIntFieldUpdateOperationsInput | bigint | number
    currency?: StringFieldUpdateOperationsInput | string
    status?: EnumInvoiceStatusFieldUpdateOperationsInput | $Enums.InvoiceStatus
    issuedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dueAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    pdfFileId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InvoiceUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: StringFieldUpdateOperationsInput | string
    projectId?: NullableStringFieldUpdateOperationsInput | string | null
    number?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    lineItems?: NullableStringFieldUpdateOperationsInput | string | null
    billingPeriod?: NullableStringFieldUpdateOperationsInput | string | null
    costCenter?: NullableStringFieldUpdateOperationsInput | string | null
    amountCents?: BigIntFieldUpdateOperationsInput | bigint | number
    currency?: StringFieldUpdateOperationsInput | string
    status?: EnumInvoiceStatusFieldUpdateOperationsInput | $Enums.InvoiceStatus
    issuedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dueAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    pdfFileId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PaymentCreateInput = {
    id?: string
    clientId: string
    projectId?: string | null
    source?: string | null
    amountCents: bigint | number
    status?: $Enums.PaymentStatus
    provider?: string | null
    transactionRef?: string | null
    paidAt?: Date | string | null
    receiptFileId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    invoice: InvoiceCreateNestedOneWithoutPaymentsInput
  }

  export type PaymentUncheckedCreateInput = {
    id?: string
    clientId: string
    projectId?: string | null
    invoiceId: string
    source?: string | null
    amountCents: bigint | number
    status?: $Enums.PaymentStatus
    provider?: string | null
    transactionRef?: string | null
    paidAt?: Date | string | null
    receiptFileId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PaymentUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: StringFieldUpdateOperationsInput | string
    projectId?: NullableStringFieldUpdateOperationsInput | string | null
    source?: NullableStringFieldUpdateOperationsInput | string | null
    amountCents?: BigIntFieldUpdateOperationsInput | bigint | number
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    transactionRef?: NullableStringFieldUpdateOperationsInput | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    receiptFileId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    invoice?: InvoiceUpdateOneRequiredWithoutPaymentsNestedInput
  }

  export type PaymentUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: StringFieldUpdateOperationsInput | string
    projectId?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceId?: StringFieldUpdateOperationsInput | string
    source?: NullableStringFieldUpdateOperationsInput | string | null
    amountCents?: BigIntFieldUpdateOperationsInput | bigint | number
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    transactionRef?: NullableStringFieldUpdateOperationsInput | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    receiptFileId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PaymentCreateManyInput = {
    id?: string
    clientId: string
    projectId?: string | null
    invoiceId: string
    source?: string | null
    amountCents: bigint | number
    status?: $Enums.PaymentStatus
    provider?: string | null
    transactionRef?: string | null
    paidAt?: Date | string | null
    receiptFileId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PaymentUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: StringFieldUpdateOperationsInput | string
    projectId?: NullableStringFieldUpdateOperationsInput | string | null
    source?: NullableStringFieldUpdateOperationsInput | string | null
    amountCents?: BigIntFieldUpdateOperationsInput | bigint | number
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    transactionRef?: NullableStringFieldUpdateOperationsInput | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    receiptFileId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PaymentUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: StringFieldUpdateOperationsInput | string
    projectId?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceId?: StringFieldUpdateOperationsInput | string
    source?: NullableStringFieldUpdateOperationsInput | string | null
    amountCents?: BigIntFieldUpdateOperationsInput | bigint | number
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    transactionRef?: NullableStringFieldUpdateOperationsInput | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    receiptFileId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InvoiceInstallmentCreateInput = {
    id?: string
    clientId: string
    projectId?: string | null
    number: number
    name: string
    amountCents: bigint | number
    dueAt?: Date | string | null
    paidAt?: Date | string | null
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    invoice: InvoiceCreateNestedOneWithoutInstallmentsInput
  }

  export type InvoiceInstallmentUncheckedCreateInput = {
    id?: string
    invoiceId: string
    clientId: string
    projectId?: string | null
    number: number
    name: string
    amountCents: bigint | number
    dueAt?: Date | string | null
    paidAt?: Date | string | null
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type InvoiceInstallmentUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: StringFieldUpdateOperationsInput | string
    projectId?: NullableStringFieldUpdateOperationsInput | string | null
    number?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    amountCents?: BigIntFieldUpdateOperationsInput | bigint | number
    dueAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    invoice?: InvoiceUpdateOneRequiredWithoutInstallmentsNestedInput
  }

  export type InvoiceInstallmentUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    invoiceId?: StringFieldUpdateOperationsInput | string
    clientId?: StringFieldUpdateOperationsInput | string
    projectId?: NullableStringFieldUpdateOperationsInput | string | null
    number?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    amountCents?: BigIntFieldUpdateOperationsInput | bigint | number
    dueAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InvoiceInstallmentCreateManyInput = {
    id?: string
    invoiceId: string
    clientId: string
    projectId?: string | null
    number: number
    name: string
    amountCents: bigint | number
    dueAt?: Date | string | null
    paidAt?: Date | string | null
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type InvoiceInstallmentUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: StringFieldUpdateOperationsInput | string
    projectId?: NullableStringFieldUpdateOperationsInput | string | null
    number?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    amountCents?: BigIntFieldUpdateOperationsInput | bigint | number
    dueAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InvoiceInstallmentUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    invoiceId?: StringFieldUpdateOperationsInput | string
    clientId?: StringFieldUpdateOperationsInput | string
    projectId?: NullableStringFieldUpdateOperationsInput | string | null
    number?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    amountCents?: BigIntFieldUpdateOperationsInput | bigint | number
    dueAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ExpenseCreateInput = {
    id?: string
    clientId?: string | null
    category: string
    subcategory?: string | null
    description: string
    amountCents: bigint | number
    submittedBy?: string | null
    status?: string
    hasReceipt?: boolean
    isBillable?: boolean
    expenseDate: Date | string
    approvedAt?: Date | string | null
    rejectedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ExpenseUncheckedCreateInput = {
    id?: string
    clientId?: string | null
    category: string
    subcategory?: string | null
    description: string
    amountCents: bigint | number
    submittedBy?: string | null
    status?: string
    hasReceipt?: boolean
    isBillable?: boolean
    expenseDate: Date | string
    approvedAt?: Date | string | null
    rejectedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ExpenseUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: NullableStringFieldUpdateOperationsInput | string | null
    category?: StringFieldUpdateOperationsInput | string
    subcategory?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    amountCents?: BigIntFieldUpdateOperationsInput | bigint | number
    submittedBy?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    hasReceipt?: BoolFieldUpdateOperationsInput | boolean
    isBillable?: BoolFieldUpdateOperationsInput | boolean
    expenseDate?: DateTimeFieldUpdateOperationsInput | Date | string
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    rejectedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ExpenseUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: NullableStringFieldUpdateOperationsInput | string | null
    category?: StringFieldUpdateOperationsInput | string
    subcategory?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    amountCents?: BigIntFieldUpdateOperationsInput | bigint | number
    submittedBy?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    hasReceipt?: BoolFieldUpdateOperationsInput | boolean
    isBillable?: BoolFieldUpdateOperationsInput | boolean
    expenseDate?: DateTimeFieldUpdateOperationsInput | Date | string
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    rejectedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ExpenseCreateManyInput = {
    id?: string
    clientId?: string | null
    category: string
    subcategory?: string | null
    description: string
    amountCents: bigint | number
    submittedBy?: string | null
    status?: string
    hasReceipt?: boolean
    isBillable?: boolean
    expenseDate: Date | string
    approvedAt?: Date | string | null
    rejectedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ExpenseUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: NullableStringFieldUpdateOperationsInput | string | null
    category?: StringFieldUpdateOperationsInput | string
    subcategory?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    amountCents?: BigIntFieldUpdateOperationsInput | bigint | number
    submittedBy?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    hasReceipt?: BoolFieldUpdateOperationsInput | boolean
    isBillable?: BoolFieldUpdateOperationsInput | boolean
    expenseDate?: DateTimeFieldUpdateOperationsInput | Date | string
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    rejectedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ExpenseUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: NullableStringFieldUpdateOperationsInput | string | null
    category?: StringFieldUpdateOperationsInput | string
    subcategory?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    amountCents?: BigIntFieldUpdateOperationsInput | bigint | number
    submittedBy?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    hasReceipt?: BoolFieldUpdateOperationsInput | boolean
    isBillable?: BoolFieldUpdateOperationsInput | boolean
    expenseDate?: DateTimeFieldUpdateOperationsInput | Date | string
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    rejectedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ExpenseBudgetCreateInput = {
    id?: string
    category: string
    budgetCents: bigint | number
    spentCents?: bigint | number
    fiscalYear: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ExpenseBudgetUncheckedCreateInput = {
    id?: string
    category: string
    budgetCents: bigint | number
    spentCents?: bigint | number
    fiscalYear: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ExpenseBudgetUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    budgetCents?: BigIntFieldUpdateOperationsInput | bigint | number
    spentCents?: BigIntFieldUpdateOperationsInput | bigint | number
    fiscalYear?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ExpenseBudgetUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    budgetCents?: BigIntFieldUpdateOperationsInput | bigint | number
    spentCents?: BigIntFieldUpdateOperationsInput | bigint | number
    fiscalYear?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ExpenseBudgetCreateManyInput = {
    id?: string
    category: string
    budgetCents: bigint | number
    spentCents?: bigint | number
    fiscalYear: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ExpenseBudgetUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    budgetCents?: BigIntFieldUpdateOperationsInput | bigint | number
    spentCents?: BigIntFieldUpdateOperationsInput | bigint | number
    fiscalYear?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ExpenseBudgetUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    budgetCents?: BigIntFieldUpdateOperationsInput | bigint | number
    spentCents?: BigIntFieldUpdateOperationsInput | bigint | number
    fiscalYear?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LoyaltyAccountCreateInput = {
    id?: string
    clientId: string
    tier?: string
    balancePoints?: number
    totalEarned?: number
    lastActivityAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    transactions?: CreditTransactionCreateNestedManyWithoutAccountInput
  }

  export type LoyaltyAccountUncheckedCreateInput = {
    id?: string
    clientId: string
    tier?: string
    balancePoints?: number
    totalEarned?: number
    lastActivityAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    transactions?: CreditTransactionUncheckedCreateNestedManyWithoutAccountInput
  }

  export type LoyaltyAccountUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: StringFieldUpdateOperationsInput | string
    tier?: StringFieldUpdateOperationsInput | string
    balancePoints?: IntFieldUpdateOperationsInput | number
    totalEarned?: IntFieldUpdateOperationsInput | number
    lastActivityAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    transactions?: CreditTransactionUpdateManyWithoutAccountNestedInput
  }

  export type LoyaltyAccountUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: StringFieldUpdateOperationsInput | string
    tier?: StringFieldUpdateOperationsInput | string
    balancePoints?: IntFieldUpdateOperationsInput | number
    totalEarned?: IntFieldUpdateOperationsInput | number
    lastActivityAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    transactions?: CreditTransactionUncheckedUpdateManyWithoutAccountNestedInput
  }

  export type LoyaltyAccountCreateManyInput = {
    id?: string
    clientId: string
    tier?: string
    balancePoints?: number
    totalEarned?: number
    lastActivityAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LoyaltyAccountUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: StringFieldUpdateOperationsInput | string
    tier?: StringFieldUpdateOperationsInput | string
    balancePoints?: IntFieldUpdateOperationsInput | number
    totalEarned?: IntFieldUpdateOperationsInput | number
    lastActivityAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LoyaltyAccountUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: StringFieldUpdateOperationsInput | string
    tier?: StringFieldUpdateOperationsInput | string
    balancePoints?: IntFieldUpdateOperationsInput | number
    totalEarned?: IntFieldUpdateOperationsInput | number
    lastActivityAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CreditTransactionCreateInput = {
    id?: string
    type?: string
    points: number
    description?: string | null
    referenceId?: string | null
    createdAt?: Date | string
    account: LoyaltyAccountCreateNestedOneWithoutTransactionsInput
  }

  export type CreditTransactionUncheckedCreateInput = {
    id?: string
    loyaltyAccountId: string
    type?: string
    points: number
    description?: string | null
    referenceId?: string | null
    createdAt?: Date | string
  }

  export type CreditTransactionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    points?: IntFieldUpdateOperationsInput | number
    description?: NullableStringFieldUpdateOperationsInput | string | null
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    account?: LoyaltyAccountUpdateOneRequiredWithoutTransactionsNestedInput
  }

  export type CreditTransactionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    loyaltyAccountId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    points?: IntFieldUpdateOperationsInput | number
    description?: NullableStringFieldUpdateOperationsInput | string | null
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CreditTransactionCreateManyInput = {
    id?: string
    loyaltyAccountId: string
    type?: string
    points: number
    description?: string | null
    referenceId?: string | null
    createdAt?: Date | string
  }

  export type CreditTransactionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    points?: IntFieldUpdateOperationsInput | number
    description?: NullableStringFieldUpdateOperationsInput | string | null
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CreditTransactionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    loyaltyAccountId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    points?: IntFieldUpdateOperationsInput | number
    description?: NullableStringFieldUpdateOperationsInput | string | null
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VendorCreateInput = {
    id?: string
    name: string
    category?: string | null
    contactName?: string | null
    contactEmail?: string | null
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    contracts?: VendorContractCreateNestedManyWithoutVendorInput
  }

  export type VendorUncheckedCreateInput = {
    id?: string
    name: string
    category?: string | null
    contactName?: string | null
    contactEmail?: string | null
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    contracts?: VendorContractUncheckedCreateNestedManyWithoutVendorInput
  }

  export type VendorUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    category?: NullableStringFieldUpdateOperationsInput | string | null
    contactName?: NullableStringFieldUpdateOperationsInput | string | null
    contactEmail?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    contracts?: VendorContractUpdateManyWithoutVendorNestedInput
  }

  export type VendorUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    category?: NullableStringFieldUpdateOperationsInput | string | null
    contactName?: NullableStringFieldUpdateOperationsInput | string | null
    contactEmail?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    contracts?: VendorContractUncheckedUpdateManyWithoutVendorNestedInput
  }

  export type VendorCreateManyInput = {
    id?: string
    name: string
    category?: string | null
    contactName?: string | null
    contactEmail?: string | null
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type VendorUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    category?: NullableStringFieldUpdateOperationsInput | string | null
    contactName?: NullableStringFieldUpdateOperationsInput | string | null
    contactEmail?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VendorUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    category?: NullableStringFieldUpdateOperationsInput | string | null
    contactName?: NullableStringFieldUpdateOperationsInput | string | null
    contactEmail?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VendorContractCreateInput = {
    id?: string
    startAt: Date | string
    endAt?: Date | string | null
    valueCents: bigint | number
    status?: string
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    vendor: VendorCreateNestedOneWithoutContractsInput
  }

  export type VendorContractUncheckedCreateInput = {
    id?: string
    vendorId: string
    startAt: Date | string
    endAt?: Date | string | null
    valueCents: bigint | number
    status?: string
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type VendorContractUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    startAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    valueCents?: BigIntFieldUpdateOperationsInput | bigint | number
    status?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    vendor?: VendorUpdateOneRequiredWithoutContractsNestedInput
  }

  export type VendorContractUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    vendorId?: StringFieldUpdateOperationsInput | string
    startAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    valueCents?: BigIntFieldUpdateOperationsInput | bigint | number
    status?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VendorContractCreateManyInput = {
    id?: string
    vendorId: string
    startAt: Date | string
    endAt?: Date | string | null
    valueCents: bigint | number
    status?: string
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type VendorContractUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    startAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    valueCents?: BigIntFieldUpdateOperationsInput | bigint | number
    status?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VendorContractUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    vendorId?: StringFieldUpdateOperationsInput | string
    startAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    valueCents?: BigIntFieldUpdateOperationsInput | bigint | number
    status?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type BigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type EnumInvoiceStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.InvoiceStatus | EnumInvoiceStatusFieldRefInput<$PrismaModel>
    in?: $Enums.InvoiceStatus[] | ListEnumInvoiceStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.InvoiceStatus[] | ListEnumInvoiceStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumInvoiceStatusFilter<$PrismaModel> | $Enums.InvoiceStatus
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type PaymentListRelationFilter = {
    every?: PaymentWhereInput
    some?: PaymentWhereInput
    none?: PaymentWhereInput
  }

  export type InvoiceInstallmentListRelationFilter = {
    every?: InvoiceInstallmentWhereInput
    some?: InvoiceInstallmentWhereInput
    none?: InvoiceInstallmentWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type PaymentOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type InvoiceInstallmentOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type InvoiceClientIdNumberCompoundUniqueInput = {
    clientId: string
    number: string
  }

  export type InvoiceCountOrderByAggregateInput = {
    id?: SortOrder
    clientId?: SortOrder
    projectId?: SortOrder
    number?: SortOrder
    description?: SortOrder
    lineItems?: SortOrder
    billingPeriod?: SortOrder
    costCenter?: SortOrder
    amountCents?: SortOrder
    currency?: SortOrder
    status?: SortOrder
    issuedAt?: SortOrder
    dueAt?: SortOrder
    paidAt?: SortOrder
    pdfFileId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InvoiceAvgOrderByAggregateInput = {
    amountCents?: SortOrder
  }

  export type InvoiceMaxOrderByAggregateInput = {
    id?: SortOrder
    clientId?: SortOrder
    projectId?: SortOrder
    number?: SortOrder
    description?: SortOrder
    lineItems?: SortOrder
    billingPeriod?: SortOrder
    costCenter?: SortOrder
    amountCents?: SortOrder
    currency?: SortOrder
    status?: SortOrder
    issuedAt?: SortOrder
    dueAt?: SortOrder
    paidAt?: SortOrder
    pdfFileId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InvoiceMinOrderByAggregateInput = {
    id?: SortOrder
    clientId?: SortOrder
    projectId?: SortOrder
    number?: SortOrder
    description?: SortOrder
    lineItems?: SortOrder
    billingPeriod?: SortOrder
    costCenter?: SortOrder
    amountCents?: SortOrder
    currency?: SortOrder
    status?: SortOrder
    issuedAt?: SortOrder
    dueAt?: SortOrder
    paidAt?: SortOrder
    pdfFileId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InvoiceSumOrderByAggregateInput = {
    amountCents?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type BigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }

  export type EnumInvoiceStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.InvoiceStatus | EnumInvoiceStatusFieldRefInput<$PrismaModel>
    in?: $Enums.InvoiceStatus[] | ListEnumInvoiceStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.InvoiceStatus[] | ListEnumInvoiceStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumInvoiceStatusWithAggregatesFilter<$PrismaModel> | $Enums.InvoiceStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumInvoiceStatusFilter<$PrismaModel>
    _max?: NestedEnumInvoiceStatusFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type EnumPaymentStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentStatus | EnumPaymentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentStatusFilter<$PrismaModel> | $Enums.PaymentStatus
  }

  export type InvoiceScalarRelationFilter = {
    is?: InvoiceWhereInput
    isNot?: InvoiceWhereInput
  }

  export type PaymentCountOrderByAggregateInput = {
    id?: SortOrder
    clientId?: SortOrder
    projectId?: SortOrder
    invoiceId?: SortOrder
    source?: SortOrder
    amountCents?: SortOrder
    status?: SortOrder
    provider?: SortOrder
    transactionRef?: SortOrder
    paidAt?: SortOrder
    receiptFileId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PaymentAvgOrderByAggregateInput = {
    amountCents?: SortOrder
  }

  export type PaymentMaxOrderByAggregateInput = {
    id?: SortOrder
    clientId?: SortOrder
    projectId?: SortOrder
    invoiceId?: SortOrder
    source?: SortOrder
    amountCents?: SortOrder
    status?: SortOrder
    provider?: SortOrder
    transactionRef?: SortOrder
    paidAt?: SortOrder
    receiptFileId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PaymentMinOrderByAggregateInput = {
    id?: SortOrder
    clientId?: SortOrder
    projectId?: SortOrder
    invoiceId?: SortOrder
    source?: SortOrder
    amountCents?: SortOrder
    status?: SortOrder
    provider?: SortOrder
    transactionRef?: SortOrder
    paidAt?: SortOrder
    receiptFileId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PaymentSumOrderByAggregateInput = {
    amountCents?: SortOrder
  }

  export type EnumPaymentStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentStatus | EnumPaymentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentStatusWithAggregatesFilter<$PrismaModel> | $Enums.PaymentStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPaymentStatusFilter<$PrismaModel>
    _max?: NestedEnumPaymentStatusFilter<$PrismaModel>
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type InvoiceInstallmentCountOrderByAggregateInput = {
    id?: SortOrder
    invoiceId?: SortOrder
    clientId?: SortOrder
    projectId?: SortOrder
    number?: SortOrder
    name?: SortOrder
    amountCents?: SortOrder
    dueAt?: SortOrder
    paidAt?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InvoiceInstallmentAvgOrderByAggregateInput = {
    number?: SortOrder
    amountCents?: SortOrder
  }

  export type InvoiceInstallmentMaxOrderByAggregateInput = {
    id?: SortOrder
    invoiceId?: SortOrder
    clientId?: SortOrder
    projectId?: SortOrder
    number?: SortOrder
    name?: SortOrder
    amountCents?: SortOrder
    dueAt?: SortOrder
    paidAt?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InvoiceInstallmentMinOrderByAggregateInput = {
    id?: SortOrder
    invoiceId?: SortOrder
    clientId?: SortOrder
    projectId?: SortOrder
    number?: SortOrder
    name?: SortOrder
    amountCents?: SortOrder
    dueAt?: SortOrder
    paidAt?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InvoiceInstallmentSumOrderByAggregateInput = {
    number?: SortOrder
    amountCents?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type ExpenseCountOrderByAggregateInput = {
    id?: SortOrder
    clientId?: SortOrder
    category?: SortOrder
    subcategory?: SortOrder
    description?: SortOrder
    amountCents?: SortOrder
    submittedBy?: SortOrder
    status?: SortOrder
    hasReceipt?: SortOrder
    isBillable?: SortOrder
    expenseDate?: SortOrder
    approvedAt?: SortOrder
    rejectedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ExpenseAvgOrderByAggregateInput = {
    amountCents?: SortOrder
  }

  export type ExpenseMaxOrderByAggregateInput = {
    id?: SortOrder
    clientId?: SortOrder
    category?: SortOrder
    subcategory?: SortOrder
    description?: SortOrder
    amountCents?: SortOrder
    submittedBy?: SortOrder
    status?: SortOrder
    hasReceipt?: SortOrder
    isBillable?: SortOrder
    expenseDate?: SortOrder
    approvedAt?: SortOrder
    rejectedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ExpenseMinOrderByAggregateInput = {
    id?: SortOrder
    clientId?: SortOrder
    category?: SortOrder
    subcategory?: SortOrder
    description?: SortOrder
    amountCents?: SortOrder
    submittedBy?: SortOrder
    status?: SortOrder
    hasReceipt?: SortOrder
    isBillable?: SortOrder
    expenseDate?: SortOrder
    approvedAt?: SortOrder
    rejectedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ExpenseSumOrderByAggregateInput = {
    amountCents?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type ExpenseBudgetCategoryFiscalYearCompoundUniqueInput = {
    category: string
    fiscalYear: number
  }

  export type ExpenseBudgetCountOrderByAggregateInput = {
    id?: SortOrder
    category?: SortOrder
    budgetCents?: SortOrder
    spentCents?: SortOrder
    fiscalYear?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ExpenseBudgetAvgOrderByAggregateInput = {
    budgetCents?: SortOrder
    spentCents?: SortOrder
    fiscalYear?: SortOrder
  }

  export type ExpenseBudgetMaxOrderByAggregateInput = {
    id?: SortOrder
    category?: SortOrder
    budgetCents?: SortOrder
    spentCents?: SortOrder
    fiscalYear?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ExpenseBudgetMinOrderByAggregateInput = {
    id?: SortOrder
    category?: SortOrder
    budgetCents?: SortOrder
    spentCents?: SortOrder
    fiscalYear?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ExpenseBudgetSumOrderByAggregateInput = {
    budgetCents?: SortOrder
    spentCents?: SortOrder
    fiscalYear?: SortOrder
  }

  export type CreditTransactionListRelationFilter = {
    every?: CreditTransactionWhereInput
    some?: CreditTransactionWhereInput
    none?: CreditTransactionWhereInput
  }

  export type CreditTransactionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type LoyaltyAccountCountOrderByAggregateInput = {
    id?: SortOrder
    clientId?: SortOrder
    tier?: SortOrder
    balancePoints?: SortOrder
    totalEarned?: SortOrder
    lastActivityAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LoyaltyAccountAvgOrderByAggregateInput = {
    balancePoints?: SortOrder
    totalEarned?: SortOrder
  }

  export type LoyaltyAccountMaxOrderByAggregateInput = {
    id?: SortOrder
    clientId?: SortOrder
    tier?: SortOrder
    balancePoints?: SortOrder
    totalEarned?: SortOrder
    lastActivityAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LoyaltyAccountMinOrderByAggregateInput = {
    id?: SortOrder
    clientId?: SortOrder
    tier?: SortOrder
    balancePoints?: SortOrder
    totalEarned?: SortOrder
    lastActivityAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LoyaltyAccountSumOrderByAggregateInput = {
    balancePoints?: SortOrder
    totalEarned?: SortOrder
  }

  export type LoyaltyAccountScalarRelationFilter = {
    is?: LoyaltyAccountWhereInput
    isNot?: LoyaltyAccountWhereInput
  }

  export type CreditTransactionCountOrderByAggregateInput = {
    id?: SortOrder
    loyaltyAccountId?: SortOrder
    type?: SortOrder
    points?: SortOrder
    description?: SortOrder
    referenceId?: SortOrder
    createdAt?: SortOrder
  }

  export type CreditTransactionAvgOrderByAggregateInput = {
    points?: SortOrder
  }

  export type CreditTransactionMaxOrderByAggregateInput = {
    id?: SortOrder
    loyaltyAccountId?: SortOrder
    type?: SortOrder
    points?: SortOrder
    description?: SortOrder
    referenceId?: SortOrder
    createdAt?: SortOrder
  }

  export type CreditTransactionMinOrderByAggregateInput = {
    id?: SortOrder
    loyaltyAccountId?: SortOrder
    type?: SortOrder
    points?: SortOrder
    description?: SortOrder
    referenceId?: SortOrder
    createdAt?: SortOrder
  }

  export type CreditTransactionSumOrderByAggregateInput = {
    points?: SortOrder
  }

  export type VendorContractListRelationFilter = {
    every?: VendorContractWhereInput
    some?: VendorContractWhereInput
    none?: VendorContractWhereInput
  }

  export type VendorContractOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type VendorCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    category?: SortOrder
    contactName?: SortOrder
    contactEmail?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type VendorMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    category?: SortOrder
    contactName?: SortOrder
    contactEmail?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type VendorMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    category?: SortOrder
    contactName?: SortOrder
    contactEmail?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type VendorScalarRelationFilter = {
    is?: VendorWhereInput
    isNot?: VendorWhereInput
  }

  export type VendorContractCountOrderByAggregateInput = {
    id?: SortOrder
    vendorId?: SortOrder
    startAt?: SortOrder
    endAt?: SortOrder
    valueCents?: SortOrder
    status?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type VendorContractAvgOrderByAggregateInput = {
    valueCents?: SortOrder
  }

  export type VendorContractMaxOrderByAggregateInput = {
    id?: SortOrder
    vendorId?: SortOrder
    startAt?: SortOrder
    endAt?: SortOrder
    valueCents?: SortOrder
    status?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type VendorContractMinOrderByAggregateInput = {
    id?: SortOrder
    vendorId?: SortOrder
    startAt?: SortOrder
    endAt?: SortOrder
    valueCents?: SortOrder
    status?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type VendorContractSumOrderByAggregateInput = {
    valueCents?: SortOrder
  }

  export type PaymentCreateNestedManyWithoutInvoiceInput = {
    create?: XOR<PaymentCreateWithoutInvoiceInput, PaymentUncheckedCreateWithoutInvoiceInput> | PaymentCreateWithoutInvoiceInput[] | PaymentUncheckedCreateWithoutInvoiceInput[]
    connectOrCreate?: PaymentCreateOrConnectWithoutInvoiceInput | PaymentCreateOrConnectWithoutInvoiceInput[]
    createMany?: PaymentCreateManyInvoiceInputEnvelope
    connect?: PaymentWhereUniqueInput | PaymentWhereUniqueInput[]
  }

  export type InvoiceInstallmentCreateNestedManyWithoutInvoiceInput = {
    create?: XOR<InvoiceInstallmentCreateWithoutInvoiceInput, InvoiceInstallmentUncheckedCreateWithoutInvoiceInput> | InvoiceInstallmentCreateWithoutInvoiceInput[] | InvoiceInstallmentUncheckedCreateWithoutInvoiceInput[]
    connectOrCreate?: InvoiceInstallmentCreateOrConnectWithoutInvoiceInput | InvoiceInstallmentCreateOrConnectWithoutInvoiceInput[]
    createMany?: InvoiceInstallmentCreateManyInvoiceInputEnvelope
    connect?: InvoiceInstallmentWhereUniqueInput | InvoiceInstallmentWhereUniqueInput[]
  }

  export type PaymentUncheckedCreateNestedManyWithoutInvoiceInput = {
    create?: XOR<PaymentCreateWithoutInvoiceInput, PaymentUncheckedCreateWithoutInvoiceInput> | PaymentCreateWithoutInvoiceInput[] | PaymentUncheckedCreateWithoutInvoiceInput[]
    connectOrCreate?: PaymentCreateOrConnectWithoutInvoiceInput | PaymentCreateOrConnectWithoutInvoiceInput[]
    createMany?: PaymentCreateManyInvoiceInputEnvelope
    connect?: PaymentWhereUniqueInput | PaymentWhereUniqueInput[]
  }

  export type InvoiceInstallmentUncheckedCreateNestedManyWithoutInvoiceInput = {
    create?: XOR<InvoiceInstallmentCreateWithoutInvoiceInput, InvoiceInstallmentUncheckedCreateWithoutInvoiceInput> | InvoiceInstallmentCreateWithoutInvoiceInput[] | InvoiceInstallmentUncheckedCreateWithoutInvoiceInput[]
    connectOrCreate?: InvoiceInstallmentCreateOrConnectWithoutInvoiceInput | InvoiceInstallmentCreateOrConnectWithoutInvoiceInput[]
    createMany?: InvoiceInstallmentCreateManyInvoiceInputEnvelope
    connect?: InvoiceInstallmentWhereUniqueInput | InvoiceInstallmentWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type BigIntFieldUpdateOperationsInput = {
    set?: bigint | number
    increment?: bigint | number
    decrement?: bigint | number
    multiply?: bigint | number
    divide?: bigint | number
  }

  export type EnumInvoiceStatusFieldUpdateOperationsInput = {
    set?: $Enums.InvoiceStatus
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type PaymentUpdateManyWithoutInvoiceNestedInput = {
    create?: XOR<PaymentCreateWithoutInvoiceInput, PaymentUncheckedCreateWithoutInvoiceInput> | PaymentCreateWithoutInvoiceInput[] | PaymentUncheckedCreateWithoutInvoiceInput[]
    connectOrCreate?: PaymentCreateOrConnectWithoutInvoiceInput | PaymentCreateOrConnectWithoutInvoiceInput[]
    upsert?: PaymentUpsertWithWhereUniqueWithoutInvoiceInput | PaymentUpsertWithWhereUniqueWithoutInvoiceInput[]
    createMany?: PaymentCreateManyInvoiceInputEnvelope
    set?: PaymentWhereUniqueInput | PaymentWhereUniqueInput[]
    disconnect?: PaymentWhereUniqueInput | PaymentWhereUniqueInput[]
    delete?: PaymentWhereUniqueInput | PaymentWhereUniqueInput[]
    connect?: PaymentWhereUniqueInput | PaymentWhereUniqueInput[]
    update?: PaymentUpdateWithWhereUniqueWithoutInvoiceInput | PaymentUpdateWithWhereUniqueWithoutInvoiceInput[]
    updateMany?: PaymentUpdateManyWithWhereWithoutInvoiceInput | PaymentUpdateManyWithWhereWithoutInvoiceInput[]
    deleteMany?: PaymentScalarWhereInput | PaymentScalarWhereInput[]
  }

  export type InvoiceInstallmentUpdateManyWithoutInvoiceNestedInput = {
    create?: XOR<InvoiceInstallmentCreateWithoutInvoiceInput, InvoiceInstallmentUncheckedCreateWithoutInvoiceInput> | InvoiceInstallmentCreateWithoutInvoiceInput[] | InvoiceInstallmentUncheckedCreateWithoutInvoiceInput[]
    connectOrCreate?: InvoiceInstallmentCreateOrConnectWithoutInvoiceInput | InvoiceInstallmentCreateOrConnectWithoutInvoiceInput[]
    upsert?: InvoiceInstallmentUpsertWithWhereUniqueWithoutInvoiceInput | InvoiceInstallmentUpsertWithWhereUniqueWithoutInvoiceInput[]
    createMany?: InvoiceInstallmentCreateManyInvoiceInputEnvelope
    set?: InvoiceInstallmentWhereUniqueInput | InvoiceInstallmentWhereUniqueInput[]
    disconnect?: InvoiceInstallmentWhereUniqueInput | InvoiceInstallmentWhereUniqueInput[]
    delete?: InvoiceInstallmentWhereUniqueInput | InvoiceInstallmentWhereUniqueInput[]
    connect?: InvoiceInstallmentWhereUniqueInput | InvoiceInstallmentWhereUniqueInput[]
    update?: InvoiceInstallmentUpdateWithWhereUniqueWithoutInvoiceInput | InvoiceInstallmentUpdateWithWhereUniqueWithoutInvoiceInput[]
    updateMany?: InvoiceInstallmentUpdateManyWithWhereWithoutInvoiceInput | InvoiceInstallmentUpdateManyWithWhereWithoutInvoiceInput[]
    deleteMany?: InvoiceInstallmentScalarWhereInput | InvoiceInstallmentScalarWhereInput[]
  }

  export type PaymentUncheckedUpdateManyWithoutInvoiceNestedInput = {
    create?: XOR<PaymentCreateWithoutInvoiceInput, PaymentUncheckedCreateWithoutInvoiceInput> | PaymentCreateWithoutInvoiceInput[] | PaymentUncheckedCreateWithoutInvoiceInput[]
    connectOrCreate?: PaymentCreateOrConnectWithoutInvoiceInput | PaymentCreateOrConnectWithoutInvoiceInput[]
    upsert?: PaymentUpsertWithWhereUniqueWithoutInvoiceInput | PaymentUpsertWithWhereUniqueWithoutInvoiceInput[]
    createMany?: PaymentCreateManyInvoiceInputEnvelope
    set?: PaymentWhereUniqueInput | PaymentWhereUniqueInput[]
    disconnect?: PaymentWhereUniqueInput | PaymentWhereUniqueInput[]
    delete?: PaymentWhereUniqueInput | PaymentWhereUniqueInput[]
    connect?: PaymentWhereUniqueInput | PaymentWhereUniqueInput[]
    update?: PaymentUpdateWithWhereUniqueWithoutInvoiceInput | PaymentUpdateWithWhereUniqueWithoutInvoiceInput[]
    updateMany?: PaymentUpdateManyWithWhereWithoutInvoiceInput | PaymentUpdateManyWithWhereWithoutInvoiceInput[]
    deleteMany?: PaymentScalarWhereInput | PaymentScalarWhereInput[]
  }

  export type InvoiceInstallmentUncheckedUpdateManyWithoutInvoiceNestedInput = {
    create?: XOR<InvoiceInstallmentCreateWithoutInvoiceInput, InvoiceInstallmentUncheckedCreateWithoutInvoiceInput> | InvoiceInstallmentCreateWithoutInvoiceInput[] | InvoiceInstallmentUncheckedCreateWithoutInvoiceInput[]
    connectOrCreate?: InvoiceInstallmentCreateOrConnectWithoutInvoiceInput | InvoiceInstallmentCreateOrConnectWithoutInvoiceInput[]
    upsert?: InvoiceInstallmentUpsertWithWhereUniqueWithoutInvoiceInput | InvoiceInstallmentUpsertWithWhereUniqueWithoutInvoiceInput[]
    createMany?: InvoiceInstallmentCreateManyInvoiceInputEnvelope
    set?: InvoiceInstallmentWhereUniqueInput | InvoiceInstallmentWhereUniqueInput[]
    disconnect?: InvoiceInstallmentWhereUniqueInput | InvoiceInstallmentWhereUniqueInput[]
    delete?: InvoiceInstallmentWhereUniqueInput | InvoiceInstallmentWhereUniqueInput[]
    connect?: InvoiceInstallmentWhereUniqueInput | InvoiceInstallmentWhereUniqueInput[]
    update?: InvoiceInstallmentUpdateWithWhereUniqueWithoutInvoiceInput | InvoiceInstallmentUpdateWithWhereUniqueWithoutInvoiceInput[]
    updateMany?: InvoiceInstallmentUpdateManyWithWhereWithoutInvoiceInput | InvoiceInstallmentUpdateManyWithWhereWithoutInvoiceInput[]
    deleteMany?: InvoiceInstallmentScalarWhereInput | InvoiceInstallmentScalarWhereInput[]
  }

  export type InvoiceCreateNestedOneWithoutPaymentsInput = {
    create?: XOR<InvoiceCreateWithoutPaymentsInput, InvoiceUncheckedCreateWithoutPaymentsInput>
    connectOrCreate?: InvoiceCreateOrConnectWithoutPaymentsInput
    connect?: InvoiceWhereUniqueInput
  }

  export type EnumPaymentStatusFieldUpdateOperationsInput = {
    set?: $Enums.PaymentStatus
  }

  export type InvoiceUpdateOneRequiredWithoutPaymentsNestedInput = {
    create?: XOR<InvoiceCreateWithoutPaymentsInput, InvoiceUncheckedCreateWithoutPaymentsInput>
    connectOrCreate?: InvoiceCreateOrConnectWithoutPaymentsInput
    upsert?: InvoiceUpsertWithoutPaymentsInput
    connect?: InvoiceWhereUniqueInput
    update?: XOR<XOR<InvoiceUpdateToOneWithWhereWithoutPaymentsInput, InvoiceUpdateWithoutPaymentsInput>, InvoiceUncheckedUpdateWithoutPaymentsInput>
  }

  export type InvoiceCreateNestedOneWithoutInstallmentsInput = {
    create?: XOR<InvoiceCreateWithoutInstallmentsInput, InvoiceUncheckedCreateWithoutInstallmentsInput>
    connectOrCreate?: InvoiceCreateOrConnectWithoutInstallmentsInput
    connect?: InvoiceWhereUniqueInput
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type InvoiceUpdateOneRequiredWithoutInstallmentsNestedInput = {
    create?: XOR<InvoiceCreateWithoutInstallmentsInput, InvoiceUncheckedCreateWithoutInstallmentsInput>
    connectOrCreate?: InvoiceCreateOrConnectWithoutInstallmentsInput
    upsert?: InvoiceUpsertWithoutInstallmentsInput
    connect?: InvoiceWhereUniqueInput
    update?: XOR<XOR<InvoiceUpdateToOneWithWhereWithoutInstallmentsInput, InvoiceUpdateWithoutInstallmentsInput>, InvoiceUncheckedUpdateWithoutInstallmentsInput>
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type CreditTransactionCreateNestedManyWithoutAccountInput = {
    create?: XOR<CreditTransactionCreateWithoutAccountInput, CreditTransactionUncheckedCreateWithoutAccountInput> | CreditTransactionCreateWithoutAccountInput[] | CreditTransactionUncheckedCreateWithoutAccountInput[]
    connectOrCreate?: CreditTransactionCreateOrConnectWithoutAccountInput | CreditTransactionCreateOrConnectWithoutAccountInput[]
    createMany?: CreditTransactionCreateManyAccountInputEnvelope
    connect?: CreditTransactionWhereUniqueInput | CreditTransactionWhereUniqueInput[]
  }

  export type CreditTransactionUncheckedCreateNestedManyWithoutAccountInput = {
    create?: XOR<CreditTransactionCreateWithoutAccountInput, CreditTransactionUncheckedCreateWithoutAccountInput> | CreditTransactionCreateWithoutAccountInput[] | CreditTransactionUncheckedCreateWithoutAccountInput[]
    connectOrCreate?: CreditTransactionCreateOrConnectWithoutAccountInput | CreditTransactionCreateOrConnectWithoutAccountInput[]
    createMany?: CreditTransactionCreateManyAccountInputEnvelope
    connect?: CreditTransactionWhereUniqueInput | CreditTransactionWhereUniqueInput[]
  }

  export type CreditTransactionUpdateManyWithoutAccountNestedInput = {
    create?: XOR<CreditTransactionCreateWithoutAccountInput, CreditTransactionUncheckedCreateWithoutAccountInput> | CreditTransactionCreateWithoutAccountInput[] | CreditTransactionUncheckedCreateWithoutAccountInput[]
    connectOrCreate?: CreditTransactionCreateOrConnectWithoutAccountInput | CreditTransactionCreateOrConnectWithoutAccountInput[]
    upsert?: CreditTransactionUpsertWithWhereUniqueWithoutAccountInput | CreditTransactionUpsertWithWhereUniqueWithoutAccountInput[]
    createMany?: CreditTransactionCreateManyAccountInputEnvelope
    set?: CreditTransactionWhereUniqueInput | CreditTransactionWhereUniqueInput[]
    disconnect?: CreditTransactionWhereUniqueInput | CreditTransactionWhereUniqueInput[]
    delete?: CreditTransactionWhereUniqueInput | CreditTransactionWhereUniqueInput[]
    connect?: CreditTransactionWhereUniqueInput | CreditTransactionWhereUniqueInput[]
    update?: CreditTransactionUpdateWithWhereUniqueWithoutAccountInput | CreditTransactionUpdateWithWhereUniqueWithoutAccountInput[]
    updateMany?: CreditTransactionUpdateManyWithWhereWithoutAccountInput | CreditTransactionUpdateManyWithWhereWithoutAccountInput[]
    deleteMany?: CreditTransactionScalarWhereInput | CreditTransactionScalarWhereInput[]
  }

  export type CreditTransactionUncheckedUpdateManyWithoutAccountNestedInput = {
    create?: XOR<CreditTransactionCreateWithoutAccountInput, CreditTransactionUncheckedCreateWithoutAccountInput> | CreditTransactionCreateWithoutAccountInput[] | CreditTransactionUncheckedCreateWithoutAccountInput[]
    connectOrCreate?: CreditTransactionCreateOrConnectWithoutAccountInput | CreditTransactionCreateOrConnectWithoutAccountInput[]
    upsert?: CreditTransactionUpsertWithWhereUniqueWithoutAccountInput | CreditTransactionUpsertWithWhereUniqueWithoutAccountInput[]
    createMany?: CreditTransactionCreateManyAccountInputEnvelope
    set?: CreditTransactionWhereUniqueInput | CreditTransactionWhereUniqueInput[]
    disconnect?: CreditTransactionWhereUniqueInput | CreditTransactionWhereUniqueInput[]
    delete?: CreditTransactionWhereUniqueInput | CreditTransactionWhereUniqueInput[]
    connect?: CreditTransactionWhereUniqueInput | CreditTransactionWhereUniqueInput[]
    update?: CreditTransactionUpdateWithWhereUniqueWithoutAccountInput | CreditTransactionUpdateWithWhereUniqueWithoutAccountInput[]
    updateMany?: CreditTransactionUpdateManyWithWhereWithoutAccountInput | CreditTransactionUpdateManyWithWhereWithoutAccountInput[]
    deleteMany?: CreditTransactionScalarWhereInput | CreditTransactionScalarWhereInput[]
  }

  export type LoyaltyAccountCreateNestedOneWithoutTransactionsInput = {
    create?: XOR<LoyaltyAccountCreateWithoutTransactionsInput, LoyaltyAccountUncheckedCreateWithoutTransactionsInput>
    connectOrCreate?: LoyaltyAccountCreateOrConnectWithoutTransactionsInput
    connect?: LoyaltyAccountWhereUniqueInput
  }

  export type LoyaltyAccountUpdateOneRequiredWithoutTransactionsNestedInput = {
    create?: XOR<LoyaltyAccountCreateWithoutTransactionsInput, LoyaltyAccountUncheckedCreateWithoutTransactionsInput>
    connectOrCreate?: LoyaltyAccountCreateOrConnectWithoutTransactionsInput
    upsert?: LoyaltyAccountUpsertWithoutTransactionsInput
    connect?: LoyaltyAccountWhereUniqueInput
    update?: XOR<XOR<LoyaltyAccountUpdateToOneWithWhereWithoutTransactionsInput, LoyaltyAccountUpdateWithoutTransactionsInput>, LoyaltyAccountUncheckedUpdateWithoutTransactionsInput>
  }

  export type VendorContractCreateNestedManyWithoutVendorInput = {
    create?: XOR<VendorContractCreateWithoutVendorInput, VendorContractUncheckedCreateWithoutVendorInput> | VendorContractCreateWithoutVendorInput[] | VendorContractUncheckedCreateWithoutVendorInput[]
    connectOrCreate?: VendorContractCreateOrConnectWithoutVendorInput | VendorContractCreateOrConnectWithoutVendorInput[]
    createMany?: VendorContractCreateManyVendorInputEnvelope
    connect?: VendorContractWhereUniqueInput | VendorContractWhereUniqueInput[]
  }

  export type VendorContractUncheckedCreateNestedManyWithoutVendorInput = {
    create?: XOR<VendorContractCreateWithoutVendorInput, VendorContractUncheckedCreateWithoutVendorInput> | VendorContractCreateWithoutVendorInput[] | VendorContractUncheckedCreateWithoutVendorInput[]
    connectOrCreate?: VendorContractCreateOrConnectWithoutVendorInput | VendorContractCreateOrConnectWithoutVendorInput[]
    createMany?: VendorContractCreateManyVendorInputEnvelope
    connect?: VendorContractWhereUniqueInput | VendorContractWhereUniqueInput[]
  }

  export type VendorContractUpdateManyWithoutVendorNestedInput = {
    create?: XOR<VendorContractCreateWithoutVendorInput, VendorContractUncheckedCreateWithoutVendorInput> | VendorContractCreateWithoutVendorInput[] | VendorContractUncheckedCreateWithoutVendorInput[]
    connectOrCreate?: VendorContractCreateOrConnectWithoutVendorInput | VendorContractCreateOrConnectWithoutVendorInput[]
    upsert?: VendorContractUpsertWithWhereUniqueWithoutVendorInput | VendorContractUpsertWithWhereUniqueWithoutVendorInput[]
    createMany?: VendorContractCreateManyVendorInputEnvelope
    set?: VendorContractWhereUniqueInput | VendorContractWhereUniqueInput[]
    disconnect?: VendorContractWhereUniqueInput | VendorContractWhereUniqueInput[]
    delete?: VendorContractWhereUniqueInput | VendorContractWhereUniqueInput[]
    connect?: VendorContractWhereUniqueInput | VendorContractWhereUniqueInput[]
    update?: VendorContractUpdateWithWhereUniqueWithoutVendorInput | VendorContractUpdateWithWhereUniqueWithoutVendorInput[]
    updateMany?: VendorContractUpdateManyWithWhereWithoutVendorInput | VendorContractUpdateManyWithWhereWithoutVendorInput[]
    deleteMany?: VendorContractScalarWhereInput | VendorContractScalarWhereInput[]
  }

  export type VendorContractUncheckedUpdateManyWithoutVendorNestedInput = {
    create?: XOR<VendorContractCreateWithoutVendorInput, VendorContractUncheckedCreateWithoutVendorInput> | VendorContractCreateWithoutVendorInput[] | VendorContractUncheckedCreateWithoutVendorInput[]
    connectOrCreate?: VendorContractCreateOrConnectWithoutVendorInput | VendorContractCreateOrConnectWithoutVendorInput[]
    upsert?: VendorContractUpsertWithWhereUniqueWithoutVendorInput | VendorContractUpsertWithWhereUniqueWithoutVendorInput[]
    createMany?: VendorContractCreateManyVendorInputEnvelope
    set?: VendorContractWhereUniqueInput | VendorContractWhereUniqueInput[]
    disconnect?: VendorContractWhereUniqueInput | VendorContractWhereUniqueInput[]
    delete?: VendorContractWhereUniqueInput | VendorContractWhereUniqueInput[]
    connect?: VendorContractWhereUniqueInput | VendorContractWhereUniqueInput[]
    update?: VendorContractUpdateWithWhereUniqueWithoutVendorInput | VendorContractUpdateWithWhereUniqueWithoutVendorInput[]
    updateMany?: VendorContractUpdateManyWithWhereWithoutVendorInput | VendorContractUpdateManyWithWhereWithoutVendorInput[]
    deleteMany?: VendorContractScalarWhereInput | VendorContractScalarWhereInput[]
  }

  export type VendorCreateNestedOneWithoutContractsInput = {
    create?: XOR<VendorCreateWithoutContractsInput, VendorUncheckedCreateWithoutContractsInput>
    connectOrCreate?: VendorCreateOrConnectWithoutContractsInput
    connect?: VendorWhereUniqueInput
  }

  export type VendorUpdateOneRequiredWithoutContractsNestedInput = {
    create?: XOR<VendorCreateWithoutContractsInput, VendorUncheckedCreateWithoutContractsInput>
    connectOrCreate?: VendorCreateOrConnectWithoutContractsInput
    upsert?: VendorUpsertWithoutContractsInput
    connect?: VendorWhereUniqueInput
    update?: XOR<XOR<VendorUpdateToOneWithWhereWithoutContractsInput, VendorUpdateWithoutContractsInput>, VendorUncheckedUpdateWithoutContractsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedBigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type NestedEnumInvoiceStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.InvoiceStatus | EnumInvoiceStatusFieldRefInput<$PrismaModel>
    in?: $Enums.InvoiceStatus[] | ListEnumInvoiceStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.InvoiceStatus[] | ListEnumInvoiceStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumInvoiceStatusFilter<$PrismaModel> | $Enums.InvoiceStatus
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedEnumInvoiceStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.InvoiceStatus | EnumInvoiceStatusFieldRefInput<$PrismaModel>
    in?: $Enums.InvoiceStatus[] | ListEnumInvoiceStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.InvoiceStatus[] | ListEnumInvoiceStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumInvoiceStatusWithAggregatesFilter<$PrismaModel> | $Enums.InvoiceStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumInvoiceStatusFilter<$PrismaModel>
    _max?: NestedEnumInvoiceStatusFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumPaymentStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentStatus | EnumPaymentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentStatusFilter<$PrismaModel> | $Enums.PaymentStatus
  }

  export type NestedEnumPaymentStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentStatus | EnumPaymentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentStatusWithAggregatesFilter<$PrismaModel> | $Enums.PaymentStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPaymentStatusFilter<$PrismaModel>
    _max?: NestedEnumPaymentStatusFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type PaymentCreateWithoutInvoiceInput = {
    id?: string
    clientId: string
    projectId?: string | null
    source?: string | null
    amountCents: bigint | number
    status?: $Enums.PaymentStatus
    provider?: string | null
    transactionRef?: string | null
    paidAt?: Date | string | null
    receiptFileId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PaymentUncheckedCreateWithoutInvoiceInput = {
    id?: string
    clientId: string
    projectId?: string | null
    source?: string | null
    amountCents: bigint | number
    status?: $Enums.PaymentStatus
    provider?: string | null
    transactionRef?: string | null
    paidAt?: Date | string | null
    receiptFileId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PaymentCreateOrConnectWithoutInvoiceInput = {
    where: PaymentWhereUniqueInput
    create: XOR<PaymentCreateWithoutInvoiceInput, PaymentUncheckedCreateWithoutInvoiceInput>
  }

  export type PaymentCreateManyInvoiceInputEnvelope = {
    data: PaymentCreateManyInvoiceInput | PaymentCreateManyInvoiceInput[]
    skipDuplicates?: boolean
  }

  export type InvoiceInstallmentCreateWithoutInvoiceInput = {
    id?: string
    clientId: string
    projectId?: string | null
    number: number
    name: string
    amountCents: bigint | number
    dueAt?: Date | string | null
    paidAt?: Date | string | null
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type InvoiceInstallmentUncheckedCreateWithoutInvoiceInput = {
    id?: string
    clientId: string
    projectId?: string | null
    number: number
    name: string
    amountCents: bigint | number
    dueAt?: Date | string | null
    paidAt?: Date | string | null
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type InvoiceInstallmentCreateOrConnectWithoutInvoiceInput = {
    where: InvoiceInstallmentWhereUniqueInput
    create: XOR<InvoiceInstallmentCreateWithoutInvoiceInput, InvoiceInstallmentUncheckedCreateWithoutInvoiceInput>
  }

  export type InvoiceInstallmentCreateManyInvoiceInputEnvelope = {
    data: InvoiceInstallmentCreateManyInvoiceInput | InvoiceInstallmentCreateManyInvoiceInput[]
    skipDuplicates?: boolean
  }

  export type PaymentUpsertWithWhereUniqueWithoutInvoiceInput = {
    where: PaymentWhereUniqueInput
    update: XOR<PaymentUpdateWithoutInvoiceInput, PaymentUncheckedUpdateWithoutInvoiceInput>
    create: XOR<PaymentCreateWithoutInvoiceInput, PaymentUncheckedCreateWithoutInvoiceInput>
  }

  export type PaymentUpdateWithWhereUniqueWithoutInvoiceInput = {
    where: PaymentWhereUniqueInput
    data: XOR<PaymentUpdateWithoutInvoiceInput, PaymentUncheckedUpdateWithoutInvoiceInput>
  }

  export type PaymentUpdateManyWithWhereWithoutInvoiceInput = {
    where: PaymentScalarWhereInput
    data: XOR<PaymentUpdateManyMutationInput, PaymentUncheckedUpdateManyWithoutInvoiceInput>
  }

  export type PaymentScalarWhereInput = {
    AND?: PaymentScalarWhereInput | PaymentScalarWhereInput[]
    OR?: PaymentScalarWhereInput[]
    NOT?: PaymentScalarWhereInput | PaymentScalarWhereInput[]
    id?: StringFilter<"Payment"> | string
    clientId?: StringFilter<"Payment"> | string
    projectId?: StringNullableFilter<"Payment"> | string | null
    invoiceId?: StringFilter<"Payment"> | string
    source?: StringNullableFilter<"Payment"> | string | null
    amountCents?: BigIntFilter<"Payment"> | bigint | number
    status?: EnumPaymentStatusFilter<"Payment"> | $Enums.PaymentStatus
    provider?: StringNullableFilter<"Payment"> | string | null
    transactionRef?: StringNullableFilter<"Payment"> | string | null
    paidAt?: DateTimeNullableFilter<"Payment"> | Date | string | null
    receiptFileId?: StringNullableFilter<"Payment"> | string | null
    createdAt?: DateTimeFilter<"Payment"> | Date | string
    updatedAt?: DateTimeFilter<"Payment"> | Date | string
  }

  export type InvoiceInstallmentUpsertWithWhereUniqueWithoutInvoiceInput = {
    where: InvoiceInstallmentWhereUniqueInput
    update: XOR<InvoiceInstallmentUpdateWithoutInvoiceInput, InvoiceInstallmentUncheckedUpdateWithoutInvoiceInput>
    create: XOR<InvoiceInstallmentCreateWithoutInvoiceInput, InvoiceInstallmentUncheckedCreateWithoutInvoiceInput>
  }

  export type InvoiceInstallmentUpdateWithWhereUniqueWithoutInvoiceInput = {
    where: InvoiceInstallmentWhereUniqueInput
    data: XOR<InvoiceInstallmentUpdateWithoutInvoiceInput, InvoiceInstallmentUncheckedUpdateWithoutInvoiceInput>
  }

  export type InvoiceInstallmentUpdateManyWithWhereWithoutInvoiceInput = {
    where: InvoiceInstallmentScalarWhereInput
    data: XOR<InvoiceInstallmentUpdateManyMutationInput, InvoiceInstallmentUncheckedUpdateManyWithoutInvoiceInput>
  }

  export type InvoiceInstallmentScalarWhereInput = {
    AND?: InvoiceInstallmentScalarWhereInput | InvoiceInstallmentScalarWhereInput[]
    OR?: InvoiceInstallmentScalarWhereInput[]
    NOT?: InvoiceInstallmentScalarWhereInput | InvoiceInstallmentScalarWhereInput[]
    id?: StringFilter<"InvoiceInstallment"> | string
    invoiceId?: StringFilter<"InvoiceInstallment"> | string
    clientId?: StringFilter<"InvoiceInstallment"> | string
    projectId?: StringNullableFilter<"InvoiceInstallment"> | string | null
    number?: IntFilter<"InvoiceInstallment"> | number
    name?: StringFilter<"InvoiceInstallment"> | string
    amountCents?: BigIntFilter<"InvoiceInstallment"> | bigint | number
    dueAt?: DateTimeNullableFilter<"InvoiceInstallment"> | Date | string | null
    paidAt?: DateTimeNullableFilter<"InvoiceInstallment"> | Date | string | null
    status?: StringFilter<"InvoiceInstallment"> | string
    createdAt?: DateTimeFilter<"InvoiceInstallment"> | Date | string
    updatedAt?: DateTimeFilter<"InvoiceInstallment"> | Date | string
  }

  export type InvoiceCreateWithoutPaymentsInput = {
    id?: string
    clientId: string
    projectId?: string | null
    number: string
    description?: string | null
    lineItems?: string | null
    billingPeriod?: string | null
    costCenter?: string | null
    amountCents: bigint | number
    currency?: string
    status?: $Enums.InvoiceStatus
    issuedAt?: Date | string | null
    dueAt?: Date | string | null
    paidAt?: Date | string | null
    pdfFileId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    installments?: InvoiceInstallmentCreateNestedManyWithoutInvoiceInput
  }

  export type InvoiceUncheckedCreateWithoutPaymentsInput = {
    id?: string
    clientId: string
    projectId?: string | null
    number: string
    description?: string | null
    lineItems?: string | null
    billingPeriod?: string | null
    costCenter?: string | null
    amountCents: bigint | number
    currency?: string
    status?: $Enums.InvoiceStatus
    issuedAt?: Date | string | null
    dueAt?: Date | string | null
    paidAt?: Date | string | null
    pdfFileId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    installments?: InvoiceInstallmentUncheckedCreateNestedManyWithoutInvoiceInput
  }

  export type InvoiceCreateOrConnectWithoutPaymentsInput = {
    where: InvoiceWhereUniqueInput
    create: XOR<InvoiceCreateWithoutPaymentsInput, InvoiceUncheckedCreateWithoutPaymentsInput>
  }

  export type InvoiceUpsertWithoutPaymentsInput = {
    update: XOR<InvoiceUpdateWithoutPaymentsInput, InvoiceUncheckedUpdateWithoutPaymentsInput>
    create: XOR<InvoiceCreateWithoutPaymentsInput, InvoiceUncheckedCreateWithoutPaymentsInput>
    where?: InvoiceWhereInput
  }

  export type InvoiceUpdateToOneWithWhereWithoutPaymentsInput = {
    where?: InvoiceWhereInput
    data: XOR<InvoiceUpdateWithoutPaymentsInput, InvoiceUncheckedUpdateWithoutPaymentsInput>
  }

  export type InvoiceUpdateWithoutPaymentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: StringFieldUpdateOperationsInput | string
    projectId?: NullableStringFieldUpdateOperationsInput | string | null
    number?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    lineItems?: NullableStringFieldUpdateOperationsInput | string | null
    billingPeriod?: NullableStringFieldUpdateOperationsInput | string | null
    costCenter?: NullableStringFieldUpdateOperationsInput | string | null
    amountCents?: BigIntFieldUpdateOperationsInput | bigint | number
    currency?: StringFieldUpdateOperationsInput | string
    status?: EnumInvoiceStatusFieldUpdateOperationsInput | $Enums.InvoiceStatus
    issuedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dueAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    pdfFileId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    installments?: InvoiceInstallmentUpdateManyWithoutInvoiceNestedInput
  }

  export type InvoiceUncheckedUpdateWithoutPaymentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: StringFieldUpdateOperationsInput | string
    projectId?: NullableStringFieldUpdateOperationsInput | string | null
    number?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    lineItems?: NullableStringFieldUpdateOperationsInput | string | null
    billingPeriod?: NullableStringFieldUpdateOperationsInput | string | null
    costCenter?: NullableStringFieldUpdateOperationsInput | string | null
    amountCents?: BigIntFieldUpdateOperationsInput | bigint | number
    currency?: StringFieldUpdateOperationsInput | string
    status?: EnumInvoiceStatusFieldUpdateOperationsInput | $Enums.InvoiceStatus
    issuedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dueAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    pdfFileId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    installments?: InvoiceInstallmentUncheckedUpdateManyWithoutInvoiceNestedInput
  }

  export type InvoiceCreateWithoutInstallmentsInput = {
    id?: string
    clientId: string
    projectId?: string | null
    number: string
    description?: string | null
    lineItems?: string | null
    billingPeriod?: string | null
    costCenter?: string | null
    amountCents: bigint | number
    currency?: string
    status?: $Enums.InvoiceStatus
    issuedAt?: Date | string | null
    dueAt?: Date | string | null
    paidAt?: Date | string | null
    pdfFileId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    payments?: PaymentCreateNestedManyWithoutInvoiceInput
  }

  export type InvoiceUncheckedCreateWithoutInstallmentsInput = {
    id?: string
    clientId: string
    projectId?: string | null
    number: string
    description?: string | null
    lineItems?: string | null
    billingPeriod?: string | null
    costCenter?: string | null
    amountCents: bigint | number
    currency?: string
    status?: $Enums.InvoiceStatus
    issuedAt?: Date | string | null
    dueAt?: Date | string | null
    paidAt?: Date | string | null
    pdfFileId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    payments?: PaymentUncheckedCreateNestedManyWithoutInvoiceInput
  }

  export type InvoiceCreateOrConnectWithoutInstallmentsInput = {
    where: InvoiceWhereUniqueInput
    create: XOR<InvoiceCreateWithoutInstallmentsInput, InvoiceUncheckedCreateWithoutInstallmentsInput>
  }

  export type InvoiceUpsertWithoutInstallmentsInput = {
    update: XOR<InvoiceUpdateWithoutInstallmentsInput, InvoiceUncheckedUpdateWithoutInstallmentsInput>
    create: XOR<InvoiceCreateWithoutInstallmentsInput, InvoiceUncheckedCreateWithoutInstallmentsInput>
    where?: InvoiceWhereInput
  }

  export type InvoiceUpdateToOneWithWhereWithoutInstallmentsInput = {
    where?: InvoiceWhereInput
    data: XOR<InvoiceUpdateWithoutInstallmentsInput, InvoiceUncheckedUpdateWithoutInstallmentsInput>
  }

  export type InvoiceUpdateWithoutInstallmentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: StringFieldUpdateOperationsInput | string
    projectId?: NullableStringFieldUpdateOperationsInput | string | null
    number?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    lineItems?: NullableStringFieldUpdateOperationsInput | string | null
    billingPeriod?: NullableStringFieldUpdateOperationsInput | string | null
    costCenter?: NullableStringFieldUpdateOperationsInput | string | null
    amountCents?: BigIntFieldUpdateOperationsInput | bigint | number
    currency?: StringFieldUpdateOperationsInput | string
    status?: EnumInvoiceStatusFieldUpdateOperationsInput | $Enums.InvoiceStatus
    issuedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dueAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    pdfFileId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    payments?: PaymentUpdateManyWithoutInvoiceNestedInput
  }

  export type InvoiceUncheckedUpdateWithoutInstallmentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: StringFieldUpdateOperationsInput | string
    projectId?: NullableStringFieldUpdateOperationsInput | string | null
    number?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    lineItems?: NullableStringFieldUpdateOperationsInput | string | null
    billingPeriod?: NullableStringFieldUpdateOperationsInput | string | null
    costCenter?: NullableStringFieldUpdateOperationsInput | string | null
    amountCents?: BigIntFieldUpdateOperationsInput | bigint | number
    currency?: StringFieldUpdateOperationsInput | string
    status?: EnumInvoiceStatusFieldUpdateOperationsInput | $Enums.InvoiceStatus
    issuedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dueAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    pdfFileId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    payments?: PaymentUncheckedUpdateManyWithoutInvoiceNestedInput
  }

  export type CreditTransactionCreateWithoutAccountInput = {
    id?: string
    type?: string
    points: number
    description?: string | null
    referenceId?: string | null
    createdAt?: Date | string
  }

  export type CreditTransactionUncheckedCreateWithoutAccountInput = {
    id?: string
    type?: string
    points: number
    description?: string | null
    referenceId?: string | null
    createdAt?: Date | string
  }

  export type CreditTransactionCreateOrConnectWithoutAccountInput = {
    where: CreditTransactionWhereUniqueInput
    create: XOR<CreditTransactionCreateWithoutAccountInput, CreditTransactionUncheckedCreateWithoutAccountInput>
  }

  export type CreditTransactionCreateManyAccountInputEnvelope = {
    data: CreditTransactionCreateManyAccountInput | CreditTransactionCreateManyAccountInput[]
    skipDuplicates?: boolean
  }

  export type CreditTransactionUpsertWithWhereUniqueWithoutAccountInput = {
    where: CreditTransactionWhereUniqueInput
    update: XOR<CreditTransactionUpdateWithoutAccountInput, CreditTransactionUncheckedUpdateWithoutAccountInput>
    create: XOR<CreditTransactionCreateWithoutAccountInput, CreditTransactionUncheckedCreateWithoutAccountInput>
  }

  export type CreditTransactionUpdateWithWhereUniqueWithoutAccountInput = {
    where: CreditTransactionWhereUniqueInput
    data: XOR<CreditTransactionUpdateWithoutAccountInput, CreditTransactionUncheckedUpdateWithoutAccountInput>
  }

  export type CreditTransactionUpdateManyWithWhereWithoutAccountInput = {
    where: CreditTransactionScalarWhereInput
    data: XOR<CreditTransactionUpdateManyMutationInput, CreditTransactionUncheckedUpdateManyWithoutAccountInput>
  }

  export type CreditTransactionScalarWhereInput = {
    AND?: CreditTransactionScalarWhereInput | CreditTransactionScalarWhereInput[]
    OR?: CreditTransactionScalarWhereInput[]
    NOT?: CreditTransactionScalarWhereInput | CreditTransactionScalarWhereInput[]
    id?: StringFilter<"CreditTransaction"> | string
    loyaltyAccountId?: StringFilter<"CreditTransaction"> | string
    type?: StringFilter<"CreditTransaction"> | string
    points?: IntFilter<"CreditTransaction"> | number
    description?: StringNullableFilter<"CreditTransaction"> | string | null
    referenceId?: StringNullableFilter<"CreditTransaction"> | string | null
    createdAt?: DateTimeFilter<"CreditTransaction"> | Date | string
  }

  export type LoyaltyAccountCreateWithoutTransactionsInput = {
    id?: string
    clientId: string
    tier?: string
    balancePoints?: number
    totalEarned?: number
    lastActivityAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LoyaltyAccountUncheckedCreateWithoutTransactionsInput = {
    id?: string
    clientId: string
    tier?: string
    balancePoints?: number
    totalEarned?: number
    lastActivityAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LoyaltyAccountCreateOrConnectWithoutTransactionsInput = {
    where: LoyaltyAccountWhereUniqueInput
    create: XOR<LoyaltyAccountCreateWithoutTransactionsInput, LoyaltyAccountUncheckedCreateWithoutTransactionsInput>
  }

  export type LoyaltyAccountUpsertWithoutTransactionsInput = {
    update: XOR<LoyaltyAccountUpdateWithoutTransactionsInput, LoyaltyAccountUncheckedUpdateWithoutTransactionsInput>
    create: XOR<LoyaltyAccountCreateWithoutTransactionsInput, LoyaltyAccountUncheckedCreateWithoutTransactionsInput>
    where?: LoyaltyAccountWhereInput
  }

  export type LoyaltyAccountUpdateToOneWithWhereWithoutTransactionsInput = {
    where?: LoyaltyAccountWhereInput
    data: XOR<LoyaltyAccountUpdateWithoutTransactionsInput, LoyaltyAccountUncheckedUpdateWithoutTransactionsInput>
  }

  export type LoyaltyAccountUpdateWithoutTransactionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: StringFieldUpdateOperationsInput | string
    tier?: StringFieldUpdateOperationsInput | string
    balancePoints?: IntFieldUpdateOperationsInput | number
    totalEarned?: IntFieldUpdateOperationsInput | number
    lastActivityAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LoyaltyAccountUncheckedUpdateWithoutTransactionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: StringFieldUpdateOperationsInput | string
    tier?: StringFieldUpdateOperationsInput | string
    balancePoints?: IntFieldUpdateOperationsInput | number
    totalEarned?: IntFieldUpdateOperationsInput | number
    lastActivityAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VendorContractCreateWithoutVendorInput = {
    id?: string
    startAt: Date | string
    endAt?: Date | string | null
    valueCents: bigint | number
    status?: string
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type VendorContractUncheckedCreateWithoutVendorInput = {
    id?: string
    startAt: Date | string
    endAt?: Date | string | null
    valueCents: bigint | number
    status?: string
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type VendorContractCreateOrConnectWithoutVendorInput = {
    where: VendorContractWhereUniqueInput
    create: XOR<VendorContractCreateWithoutVendorInput, VendorContractUncheckedCreateWithoutVendorInput>
  }

  export type VendorContractCreateManyVendorInputEnvelope = {
    data: VendorContractCreateManyVendorInput | VendorContractCreateManyVendorInput[]
    skipDuplicates?: boolean
  }

  export type VendorContractUpsertWithWhereUniqueWithoutVendorInput = {
    where: VendorContractWhereUniqueInput
    update: XOR<VendorContractUpdateWithoutVendorInput, VendorContractUncheckedUpdateWithoutVendorInput>
    create: XOR<VendorContractCreateWithoutVendorInput, VendorContractUncheckedCreateWithoutVendorInput>
  }

  export type VendorContractUpdateWithWhereUniqueWithoutVendorInput = {
    where: VendorContractWhereUniqueInput
    data: XOR<VendorContractUpdateWithoutVendorInput, VendorContractUncheckedUpdateWithoutVendorInput>
  }

  export type VendorContractUpdateManyWithWhereWithoutVendorInput = {
    where: VendorContractScalarWhereInput
    data: XOR<VendorContractUpdateManyMutationInput, VendorContractUncheckedUpdateManyWithoutVendorInput>
  }

  export type VendorContractScalarWhereInput = {
    AND?: VendorContractScalarWhereInput | VendorContractScalarWhereInput[]
    OR?: VendorContractScalarWhereInput[]
    NOT?: VendorContractScalarWhereInput | VendorContractScalarWhereInput[]
    id?: StringFilter<"VendorContract"> | string
    vendorId?: StringFilter<"VendorContract"> | string
    startAt?: DateTimeFilter<"VendorContract"> | Date | string
    endAt?: DateTimeNullableFilter<"VendorContract"> | Date | string | null
    valueCents?: BigIntFilter<"VendorContract"> | bigint | number
    status?: StringFilter<"VendorContract"> | string
    notes?: StringNullableFilter<"VendorContract"> | string | null
    createdAt?: DateTimeFilter<"VendorContract"> | Date | string
    updatedAt?: DateTimeFilter<"VendorContract"> | Date | string
  }

  export type VendorCreateWithoutContractsInput = {
    id?: string
    name: string
    category?: string | null
    contactName?: string | null
    contactEmail?: string | null
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type VendorUncheckedCreateWithoutContractsInput = {
    id?: string
    name: string
    category?: string | null
    contactName?: string | null
    contactEmail?: string | null
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type VendorCreateOrConnectWithoutContractsInput = {
    where: VendorWhereUniqueInput
    create: XOR<VendorCreateWithoutContractsInput, VendorUncheckedCreateWithoutContractsInput>
  }

  export type VendorUpsertWithoutContractsInput = {
    update: XOR<VendorUpdateWithoutContractsInput, VendorUncheckedUpdateWithoutContractsInput>
    create: XOR<VendorCreateWithoutContractsInput, VendorUncheckedCreateWithoutContractsInput>
    where?: VendorWhereInput
  }

  export type VendorUpdateToOneWithWhereWithoutContractsInput = {
    where?: VendorWhereInput
    data: XOR<VendorUpdateWithoutContractsInput, VendorUncheckedUpdateWithoutContractsInput>
  }

  export type VendorUpdateWithoutContractsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    category?: NullableStringFieldUpdateOperationsInput | string | null
    contactName?: NullableStringFieldUpdateOperationsInput | string | null
    contactEmail?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VendorUncheckedUpdateWithoutContractsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    category?: NullableStringFieldUpdateOperationsInput | string | null
    contactName?: NullableStringFieldUpdateOperationsInput | string | null
    contactEmail?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PaymentCreateManyInvoiceInput = {
    id?: string
    clientId: string
    projectId?: string | null
    source?: string | null
    amountCents: bigint | number
    status?: $Enums.PaymentStatus
    provider?: string | null
    transactionRef?: string | null
    paidAt?: Date | string | null
    receiptFileId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type InvoiceInstallmentCreateManyInvoiceInput = {
    id?: string
    clientId: string
    projectId?: string | null
    number: number
    name: string
    amountCents: bigint | number
    dueAt?: Date | string | null
    paidAt?: Date | string | null
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PaymentUpdateWithoutInvoiceInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: StringFieldUpdateOperationsInput | string
    projectId?: NullableStringFieldUpdateOperationsInput | string | null
    source?: NullableStringFieldUpdateOperationsInput | string | null
    amountCents?: BigIntFieldUpdateOperationsInput | bigint | number
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    transactionRef?: NullableStringFieldUpdateOperationsInput | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    receiptFileId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PaymentUncheckedUpdateWithoutInvoiceInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: StringFieldUpdateOperationsInput | string
    projectId?: NullableStringFieldUpdateOperationsInput | string | null
    source?: NullableStringFieldUpdateOperationsInput | string | null
    amountCents?: BigIntFieldUpdateOperationsInput | bigint | number
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    transactionRef?: NullableStringFieldUpdateOperationsInput | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    receiptFileId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PaymentUncheckedUpdateManyWithoutInvoiceInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: StringFieldUpdateOperationsInput | string
    projectId?: NullableStringFieldUpdateOperationsInput | string | null
    source?: NullableStringFieldUpdateOperationsInput | string | null
    amountCents?: BigIntFieldUpdateOperationsInput | bigint | number
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    transactionRef?: NullableStringFieldUpdateOperationsInput | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    receiptFileId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InvoiceInstallmentUpdateWithoutInvoiceInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: StringFieldUpdateOperationsInput | string
    projectId?: NullableStringFieldUpdateOperationsInput | string | null
    number?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    amountCents?: BigIntFieldUpdateOperationsInput | bigint | number
    dueAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InvoiceInstallmentUncheckedUpdateWithoutInvoiceInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: StringFieldUpdateOperationsInput | string
    projectId?: NullableStringFieldUpdateOperationsInput | string | null
    number?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    amountCents?: BigIntFieldUpdateOperationsInput | bigint | number
    dueAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InvoiceInstallmentUncheckedUpdateManyWithoutInvoiceInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: StringFieldUpdateOperationsInput | string
    projectId?: NullableStringFieldUpdateOperationsInput | string | null
    number?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    amountCents?: BigIntFieldUpdateOperationsInput | bigint | number
    dueAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CreditTransactionCreateManyAccountInput = {
    id?: string
    type?: string
    points: number
    description?: string | null
    referenceId?: string | null
    createdAt?: Date | string
  }

  export type CreditTransactionUpdateWithoutAccountInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    points?: IntFieldUpdateOperationsInput | number
    description?: NullableStringFieldUpdateOperationsInput | string | null
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CreditTransactionUncheckedUpdateWithoutAccountInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    points?: IntFieldUpdateOperationsInput | number
    description?: NullableStringFieldUpdateOperationsInput | string | null
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CreditTransactionUncheckedUpdateManyWithoutAccountInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    points?: IntFieldUpdateOperationsInput | number
    description?: NullableStringFieldUpdateOperationsInput | string | null
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VendorContractCreateManyVendorInput = {
    id?: string
    startAt: Date | string
    endAt?: Date | string | null
    valueCents: bigint | number
    status?: string
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type VendorContractUpdateWithoutVendorInput = {
    id?: StringFieldUpdateOperationsInput | string
    startAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    valueCents?: BigIntFieldUpdateOperationsInput | bigint | number
    status?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VendorContractUncheckedUpdateWithoutVendorInput = {
    id?: StringFieldUpdateOperationsInput | string
    startAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    valueCents?: BigIntFieldUpdateOperationsInput | bigint | number
    status?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VendorContractUncheckedUpdateManyWithoutVendorInput = {
    id?: StringFieldUpdateOperationsInput | string
    startAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    valueCents?: BigIntFieldUpdateOperationsInput | bigint | number
    status?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}