
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
 * Model FileRecord
 * 
 */
export type FileRecord = $Result.DefaultSelection<Prisma.$FileRecordPayload>
/**
 * Model VaultDocument
 * Admin Document Vault — structured metadata for uploaded company documents.
 * Documents are stored in S3 (storageKey) and tracked here with rich metadata.
 * clientId is optional: null means the document belongs to the company (admin-only).
 */
export type VaultDocument = $Result.DefaultSelection<Prisma.$VaultDocumentPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more FileRecords
 * const fileRecords = await prisma.fileRecord.findMany()
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
   * // Fetch zero or more FileRecords
   * const fileRecords = await prisma.fileRecord.findMany()
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
   * `prisma.fileRecord`: Exposes CRUD operations for the **FileRecord** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more FileRecords
    * const fileRecords = await prisma.fileRecord.findMany()
    * ```
    */
  get fileRecord(): Prisma.FileRecordDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.vaultDocument`: Exposes CRUD operations for the **VaultDocument** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more VaultDocuments
    * const vaultDocuments = await prisma.vaultDocument.findMany()
    * ```
    */
  get vaultDocument(): Prisma.VaultDocumentDelegate<ExtArgs, ClientOptions>;
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
    FileRecord: 'FileRecord',
    VaultDocument: 'VaultDocument'
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
      modelProps: "fileRecord" | "vaultDocument"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      FileRecord: {
        payload: Prisma.$FileRecordPayload<ExtArgs>
        fields: Prisma.FileRecordFieldRefs
        operations: {
          findUnique: {
            args: Prisma.FileRecordFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FileRecordPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.FileRecordFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FileRecordPayload>
          }
          findFirst: {
            args: Prisma.FileRecordFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FileRecordPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.FileRecordFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FileRecordPayload>
          }
          findMany: {
            args: Prisma.FileRecordFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FileRecordPayload>[]
          }
          create: {
            args: Prisma.FileRecordCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FileRecordPayload>
          }
          createMany: {
            args: Prisma.FileRecordCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.FileRecordCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FileRecordPayload>[]
          }
          delete: {
            args: Prisma.FileRecordDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FileRecordPayload>
          }
          update: {
            args: Prisma.FileRecordUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FileRecordPayload>
          }
          deleteMany: {
            args: Prisma.FileRecordDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.FileRecordUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.FileRecordUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FileRecordPayload>[]
          }
          upsert: {
            args: Prisma.FileRecordUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FileRecordPayload>
          }
          aggregate: {
            args: Prisma.FileRecordAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateFileRecord>
          }
          groupBy: {
            args: Prisma.FileRecordGroupByArgs<ExtArgs>
            result: $Utils.Optional<FileRecordGroupByOutputType>[]
          }
          count: {
            args: Prisma.FileRecordCountArgs<ExtArgs>
            result: $Utils.Optional<FileRecordCountAggregateOutputType> | number
          }
        }
      }
      VaultDocument: {
        payload: Prisma.$VaultDocumentPayload<ExtArgs>
        fields: Prisma.VaultDocumentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.VaultDocumentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VaultDocumentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.VaultDocumentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VaultDocumentPayload>
          }
          findFirst: {
            args: Prisma.VaultDocumentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VaultDocumentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.VaultDocumentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VaultDocumentPayload>
          }
          findMany: {
            args: Prisma.VaultDocumentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VaultDocumentPayload>[]
          }
          create: {
            args: Prisma.VaultDocumentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VaultDocumentPayload>
          }
          createMany: {
            args: Prisma.VaultDocumentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.VaultDocumentCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VaultDocumentPayload>[]
          }
          delete: {
            args: Prisma.VaultDocumentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VaultDocumentPayload>
          }
          update: {
            args: Prisma.VaultDocumentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VaultDocumentPayload>
          }
          deleteMany: {
            args: Prisma.VaultDocumentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.VaultDocumentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.VaultDocumentUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VaultDocumentPayload>[]
          }
          upsert: {
            args: Prisma.VaultDocumentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VaultDocumentPayload>
          }
          aggregate: {
            args: Prisma.VaultDocumentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateVaultDocument>
          }
          groupBy: {
            args: Prisma.VaultDocumentGroupByArgs<ExtArgs>
            result: $Utils.Optional<VaultDocumentGroupByOutputType>[]
          }
          count: {
            args: Prisma.VaultDocumentCountArgs<ExtArgs>
            result: $Utils.Optional<VaultDocumentCountAggregateOutputType> | number
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
    fileRecord?: FileRecordOmit
    vaultDocument?: VaultDocumentOmit
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
   * Models
   */

  /**
   * Model FileRecord
   */

  export type AggregateFileRecord = {
    _count: FileRecordCountAggregateOutputType | null
    _avg: FileRecordAvgAggregateOutputType | null
    _sum: FileRecordSumAggregateOutputType | null
    _min: FileRecordMinAggregateOutputType | null
    _max: FileRecordMaxAggregateOutputType | null
  }

  export type FileRecordAvgAggregateOutputType = {
    sizeBytes: number | null
  }

  export type FileRecordSumAggregateOutputType = {
    sizeBytes: bigint | null
  }

  export type FileRecordMinAggregateOutputType = {
    id: string | null
    clientId: string | null
    fileName: string | null
    storageKey: string | null
    mimeType: string | null
    sizeBytes: bigint | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type FileRecordMaxAggregateOutputType = {
    id: string | null
    clientId: string | null
    fileName: string | null
    storageKey: string | null
    mimeType: string | null
    sizeBytes: bigint | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type FileRecordCountAggregateOutputType = {
    id: number
    clientId: number
    fileName: number
    storageKey: number
    mimeType: number
    sizeBytes: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type FileRecordAvgAggregateInputType = {
    sizeBytes?: true
  }

  export type FileRecordSumAggregateInputType = {
    sizeBytes?: true
  }

  export type FileRecordMinAggregateInputType = {
    id?: true
    clientId?: true
    fileName?: true
    storageKey?: true
    mimeType?: true
    sizeBytes?: true
    createdAt?: true
    updatedAt?: true
  }

  export type FileRecordMaxAggregateInputType = {
    id?: true
    clientId?: true
    fileName?: true
    storageKey?: true
    mimeType?: true
    sizeBytes?: true
    createdAt?: true
    updatedAt?: true
  }

  export type FileRecordCountAggregateInputType = {
    id?: true
    clientId?: true
    fileName?: true
    storageKey?: true
    mimeType?: true
    sizeBytes?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type FileRecordAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which FileRecord to aggregate.
     */
    where?: FileRecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FileRecords to fetch.
     */
    orderBy?: FileRecordOrderByWithRelationInput | FileRecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: FileRecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FileRecords from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FileRecords.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned FileRecords
    **/
    _count?: true | FileRecordCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: FileRecordAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: FileRecordSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: FileRecordMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: FileRecordMaxAggregateInputType
  }

  export type GetFileRecordAggregateType<T extends FileRecordAggregateArgs> = {
        [P in keyof T & keyof AggregateFileRecord]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateFileRecord[P]>
      : GetScalarType<T[P], AggregateFileRecord[P]>
  }




  export type FileRecordGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FileRecordWhereInput
    orderBy?: FileRecordOrderByWithAggregationInput | FileRecordOrderByWithAggregationInput[]
    by: FileRecordScalarFieldEnum[] | FileRecordScalarFieldEnum
    having?: FileRecordScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: FileRecordCountAggregateInputType | true
    _avg?: FileRecordAvgAggregateInputType
    _sum?: FileRecordSumAggregateInputType
    _min?: FileRecordMinAggregateInputType
    _max?: FileRecordMaxAggregateInputType
  }

  export type FileRecordGroupByOutputType = {
    id: string
    clientId: string
    fileName: string
    storageKey: string
    mimeType: string
    sizeBytes: bigint
    createdAt: Date
    updatedAt: Date
    _count: FileRecordCountAggregateOutputType | null
    _avg: FileRecordAvgAggregateOutputType | null
    _sum: FileRecordSumAggregateOutputType | null
    _min: FileRecordMinAggregateOutputType | null
    _max: FileRecordMaxAggregateOutputType | null
  }

  type GetFileRecordGroupByPayload<T extends FileRecordGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<FileRecordGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof FileRecordGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], FileRecordGroupByOutputType[P]>
            : GetScalarType<T[P], FileRecordGroupByOutputType[P]>
        }
      >
    >


  export type FileRecordSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    clientId?: boolean
    fileName?: boolean
    storageKey?: boolean
    mimeType?: boolean
    sizeBytes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["fileRecord"]>

  export type FileRecordSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    clientId?: boolean
    fileName?: boolean
    storageKey?: boolean
    mimeType?: boolean
    sizeBytes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["fileRecord"]>

  export type FileRecordSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    clientId?: boolean
    fileName?: boolean
    storageKey?: boolean
    mimeType?: boolean
    sizeBytes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["fileRecord"]>

  export type FileRecordSelectScalar = {
    id?: boolean
    clientId?: boolean
    fileName?: boolean
    storageKey?: boolean
    mimeType?: boolean
    sizeBytes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type FileRecordOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "clientId" | "fileName" | "storageKey" | "mimeType" | "sizeBytes" | "createdAt" | "updatedAt", ExtArgs["result"]["fileRecord"]>

  export type $FileRecordPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "FileRecord"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      clientId: string
      fileName: string
      storageKey: string
      mimeType: string
      sizeBytes: bigint
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["fileRecord"]>
    composites: {}
  }

  type FileRecordGetPayload<S extends boolean | null | undefined | FileRecordDefaultArgs> = $Result.GetResult<Prisma.$FileRecordPayload, S>

  type FileRecordCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<FileRecordFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: FileRecordCountAggregateInputType | true
    }

  export interface FileRecordDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['FileRecord'], meta: { name: 'FileRecord' } }
    /**
     * Find zero or one FileRecord that matches the filter.
     * @param {FileRecordFindUniqueArgs} args - Arguments to find a FileRecord
     * @example
     * // Get one FileRecord
     * const fileRecord = await prisma.fileRecord.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends FileRecordFindUniqueArgs>(args: SelectSubset<T, FileRecordFindUniqueArgs<ExtArgs>>): Prisma__FileRecordClient<$Result.GetResult<Prisma.$FileRecordPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one FileRecord that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {FileRecordFindUniqueOrThrowArgs} args - Arguments to find a FileRecord
     * @example
     * // Get one FileRecord
     * const fileRecord = await prisma.fileRecord.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends FileRecordFindUniqueOrThrowArgs>(args: SelectSubset<T, FileRecordFindUniqueOrThrowArgs<ExtArgs>>): Prisma__FileRecordClient<$Result.GetResult<Prisma.$FileRecordPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first FileRecord that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FileRecordFindFirstArgs} args - Arguments to find a FileRecord
     * @example
     * // Get one FileRecord
     * const fileRecord = await prisma.fileRecord.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends FileRecordFindFirstArgs>(args?: SelectSubset<T, FileRecordFindFirstArgs<ExtArgs>>): Prisma__FileRecordClient<$Result.GetResult<Prisma.$FileRecordPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first FileRecord that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FileRecordFindFirstOrThrowArgs} args - Arguments to find a FileRecord
     * @example
     * // Get one FileRecord
     * const fileRecord = await prisma.fileRecord.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends FileRecordFindFirstOrThrowArgs>(args?: SelectSubset<T, FileRecordFindFirstOrThrowArgs<ExtArgs>>): Prisma__FileRecordClient<$Result.GetResult<Prisma.$FileRecordPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more FileRecords that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FileRecordFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all FileRecords
     * const fileRecords = await prisma.fileRecord.findMany()
     * 
     * // Get first 10 FileRecords
     * const fileRecords = await prisma.fileRecord.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const fileRecordWithIdOnly = await prisma.fileRecord.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends FileRecordFindManyArgs>(args?: SelectSubset<T, FileRecordFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FileRecordPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a FileRecord.
     * @param {FileRecordCreateArgs} args - Arguments to create a FileRecord.
     * @example
     * // Create one FileRecord
     * const FileRecord = await prisma.fileRecord.create({
     *   data: {
     *     // ... data to create a FileRecord
     *   }
     * })
     * 
     */
    create<T extends FileRecordCreateArgs>(args: SelectSubset<T, FileRecordCreateArgs<ExtArgs>>): Prisma__FileRecordClient<$Result.GetResult<Prisma.$FileRecordPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many FileRecords.
     * @param {FileRecordCreateManyArgs} args - Arguments to create many FileRecords.
     * @example
     * // Create many FileRecords
     * const fileRecord = await prisma.fileRecord.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends FileRecordCreateManyArgs>(args?: SelectSubset<T, FileRecordCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many FileRecords and returns the data saved in the database.
     * @param {FileRecordCreateManyAndReturnArgs} args - Arguments to create many FileRecords.
     * @example
     * // Create many FileRecords
     * const fileRecord = await prisma.fileRecord.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many FileRecords and only return the `id`
     * const fileRecordWithIdOnly = await prisma.fileRecord.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends FileRecordCreateManyAndReturnArgs>(args?: SelectSubset<T, FileRecordCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FileRecordPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a FileRecord.
     * @param {FileRecordDeleteArgs} args - Arguments to delete one FileRecord.
     * @example
     * // Delete one FileRecord
     * const FileRecord = await prisma.fileRecord.delete({
     *   where: {
     *     // ... filter to delete one FileRecord
     *   }
     * })
     * 
     */
    delete<T extends FileRecordDeleteArgs>(args: SelectSubset<T, FileRecordDeleteArgs<ExtArgs>>): Prisma__FileRecordClient<$Result.GetResult<Prisma.$FileRecordPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one FileRecord.
     * @param {FileRecordUpdateArgs} args - Arguments to update one FileRecord.
     * @example
     * // Update one FileRecord
     * const fileRecord = await prisma.fileRecord.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends FileRecordUpdateArgs>(args: SelectSubset<T, FileRecordUpdateArgs<ExtArgs>>): Prisma__FileRecordClient<$Result.GetResult<Prisma.$FileRecordPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more FileRecords.
     * @param {FileRecordDeleteManyArgs} args - Arguments to filter FileRecords to delete.
     * @example
     * // Delete a few FileRecords
     * const { count } = await prisma.fileRecord.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends FileRecordDeleteManyArgs>(args?: SelectSubset<T, FileRecordDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more FileRecords.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FileRecordUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many FileRecords
     * const fileRecord = await prisma.fileRecord.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends FileRecordUpdateManyArgs>(args: SelectSubset<T, FileRecordUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more FileRecords and returns the data updated in the database.
     * @param {FileRecordUpdateManyAndReturnArgs} args - Arguments to update many FileRecords.
     * @example
     * // Update many FileRecords
     * const fileRecord = await prisma.fileRecord.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more FileRecords and only return the `id`
     * const fileRecordWithIdOnly = await prisma.fileRecord.updateManyAndReturn({
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
    updateManyAndReturn<T extends FileRecordUpdateManyAndReturnArgs>(args: SelectSubset<T, FileRecordUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FileRecordPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one FileRecord.
     * @param {FileRecordUpsertArgs} args - Arguments to update or create a FileRecord.
     * @example
     * // Update or create a FileRecord
     * const fileRecord = await prisma.fileRecord.upsert({
     *   create: {
     *     // ... data to create a FileRecord
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the FileRecord we want to update
     *   }
     * })
     */
    upsert<T extends FileRecordUpsertArgs>(args: SelectSubset<T, FileRecordUpsertArgs<ExtArgs>>): Prisma__FileRecordClient<$Result.GetResult<Prisma.$FileRecordPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of FileRecords.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FileRecordCountArgs} args - Arguments to filter FileRecords to count.
     * @example
     * // Count the number of FileRecords
     * const count = await prisma.fileRecord.count({
     *   where: {
     *     // ... the filter for the FileRecords we want to count
     *   }
     * })
    **/
    count<T extends FileRecordCountArgs>(
      args?: Subset<T, FileRecordCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], FileRecordCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a FileRecord.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FileRecordAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends FileRecordAggregateArgs>(args: Subset<T, FileRecordAggregateArgs>): Prisma.PrismaPromise<GetFileRecordAggregateType<T>>

    /**
     * Group by FileRecord.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FileRecordGroupByArgs} args - Group by arguments.
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
      T extends FileRecordGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: FileRecordGroupByArgs['orderBy'] }
        : { orderBy?: FileRecordGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, FileRecordGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFileRecordGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the FileRecord model
   */
  readonly fields: FileRecordFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for FileRecord.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__FileRecordClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
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
   * Fields of the FileRecord model
   */
  interface FileRecordFieldRefs {
    readonly id: FieldRef<"FileRecord", 'String'>
    readonly clientId: FieldRef<"FileRecord", 'String'>
    readonly fileName: FieldRef<"FileRecord", 'String'>
    readonly storageKey: FieldRef<"FileRecord", 'String'>
    readonly mimeType: FieldRef<"FileRecord", 'String'>
    readonly sizeBytes: FieldRef<"FileRecord", 'BigInt'>
    readonly createdAt: FieldRef<"FileRecord", 'DateTime'>
    readonly updatedAt: FieldRef<"FileRecord", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * FileRecord findUnique
   */
  export type FileRecordFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FileRecord
     */
    select?: FileRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FileRecord
     */
    omit?: FileRecordOmit<ExtArgs> | null
    /**
     * Filter, which FileRecord to fetch.
     */
    where: FileRecordWhereUniqueInput
  }

  /**
   * FileRecord findUniqueOrThrow
   */
  export type FileRecordFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FileRecord
     */
    select?: FileRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FileRecord
     */
    omit?: FileRecordOmit<ExtArgs> | null
    /**
     * Filter, which FileRecord to fetch.
     */
    where: FileRecordWhereUniqueInput
  }

  /**
   * FileRecord findFirst
   */
  export type FileRecordFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FileRecord
     */
    select?: FileRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FileRecord
     */
    omit?: FileRecordOmit<ExtArgs> | null
    /**
     * Filter, which FileRecord to fetch.
     */
    where?: FileRecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FileRecords to fetch.
     */
    orderBy?: FileRecordOrderByWithRelationInput | FileRecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for FileRecords.
     */
    cursor?: FileRecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FileRecords from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FileRecords.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of FileRecords.
     */
    distinct?: FileRecordScalarFieldEnum | FileRecordScalarFieldEnum[]
  }

  /**
   * FileRecord findFirstOrThrow
   */
  export type FileRecordFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FileRecord
     */
    select?: FileRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FileRecord
     */
    omit?: FileRecordOmit<ExtArgs> | null
    /**
     * Filter, which FileRecord to fetch.
     */
    where?: FileRecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FileRecords to fetch.
     */
    orderBy?: FileRecordOrderByWithRelationInput | FileRecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for FileRecords.
     */
    cursor?: FileRecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FileRecords from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FileRecords.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of FileRecords.
     */
    distinct?: FileRecordScalarFieldEnum | FileRecordScalarFieldEnum[]
  }

  /**
   * FileRecord findMany
   */
  export type FileRecordFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FileRecord
     */
    select?: FileRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FileRecord
     */
    omit?: FileRecordOmit<ExtArgs> | null
    /**
     * Filter, which FileRecords to fetch.
     */
    where?: FileRecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FileRecords to fetch.
     */
    orderBy?: FileRecordOrderByWithRelationInput | FileRecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing FileRecords.
     */
    cursor?: FileRecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FileRecords from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FileRecords.
     */
    skip?: number
    distinct?: FileRecordScalarFieldEnum | FileRecordScalarFieldEnum[]
  }

  /**
   * FileRecord create
   */
  export type FileRecordCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FileRecord
     */
    select?: FileRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FileRecord
     */
    omit?: FileRecordOmit<ExtArgs> | null
    /**
     * The data needed to create a FileRecord.
     */
    data: XOR<FileRecordCreateInput, FileRecordUncheckedCreateInput>
  }

  /**
   * FileRecord createMany
   */
  export type FileRecordCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many FileRecords.
     */
    data: FileRecordCreateManyInput | FileRecordCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * FileRecord createManyAndReturn
   */
  export type FileRecordCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FileRecord
     */
    select?: FileRecordSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the FileRecord
     */
    omit?: FileRecordOmit<ExtArgs> | null
    /**
     * The data used to create many FileRecords.
     */
    data: FileRecordCreateManyInput | FileRecordCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * FileRecord update
   */
  export type FileRecordUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FileRecord
     */
    select?: FileRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FileRecord
     */
    omit?: FileRecordOmit<ExtArgs> | null
    /**
     * The data needed to update a FileRecord.
     */
    data: XOR<FileRecordUpdateInput, FileRecordUncheckedUpdateInput>
    /**
     * Choose, which FileRecord to update.
     */
    where: FileRecordWhereUniqueInput
  }

  /**
   * FileRecord updateMany
   */
  export type FileRecordUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update FileRecords.
     */
    data: XOR<FileRecordUpdateManyMutationInput, FileRecordUncheckedUpdateManyInput>
    /**
     * Filter which FileRecords to update
     */
    where?: FileRecordWhereInput
    /**
     * Limit how many FileRecords to update.
     */
    limit?: number
  }

  /**
   * FileRecord updateManyAndReturn
   */
  export type FileRecordUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FileRecord
     */
    select?: FileRecordSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the FileRecord
     */
    omit?: FileRecordOmit<ExtArgs> | null
    /**
     * The data used to update FileRecords.
     */
    data: XOR<FileRecordUpdateManyMutationInput, FileRecordUncheckedUpdateManyInput>
    /**
     * Filter which FileRecords to update
     */
    where?: FileRecordWhereInput
    /**
     * Limit how many FileRecords to update.
     */
    limit?: number
  }

  /**
   * FileRecord upsert
   */
  export type FileRecordUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FileRecord
     */
    select?: FileRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FileRecord
     */
    omit?: FileRecordOmit<ExtArgs> | null
    /**
     * The filter to search for the FileRecord to update in case it exists.
     */
    where: FileRecordWhereUniqueInput
    /**
     * In case the FileRecord found by the `where` argument doesn't exist, create a new FileRecord with this data.
     */
    create: XOR<FileRecordCreateInput, FileRecordUncheckedCreateInput>
    /**
     * In case the FileRecord was found with the provided `where` argument, update it with this data.
     */
    update: XOR<FileRecordUpdateInput, FileRecordUncheckedUpdateInput>
  }

  /**
   * FileRecord delete
   */
  export type FileRecordDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FileRecord
     */
    select?: FileRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FileRecord
     */
    omit?: FileRecordOmit<ExtArgs> | null
    /**
     * Filter which FileRecord to delete.
     */
    where: FileRecordWhereUniqueInput
  }

  /**
   * FileRecord deleteMany
   */
  export type FileRecordDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which FileRecords to delete
     */
    where?: FileRecordWhereInput
    /**
     * Limit how many FileRecords to delete.
     */
    limit?: number
  }

  /**
   * FileRecord without action
   */
  export type FileRecordDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FileRecord
     */
    select?: FileRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FileRecord
     */
    omit?: FileRecordOmit<ExtArgs> | null
  }


  /**
   * Model VaultDocument
   */

  export type AggregateVaultDocument = {
    _count: VaultDocumentCountAggregateOutputType | null
    _avg: VaultDocumentAvgAggregateOutputType | null
    _sum: VaultDocumentSumAggregateOutputType | null
    _min: VaultDocumentMinAggregateOutputType | null
    _max: VaultDocumentMaxAggregateOutputType | null
  }

  export type VaultDocumentAvgAggregateOutputType = {
    sizeBytes: number | null
    version: number | null
  }

  export type VaultDocumentSumAggregateOutputType = {
    sizeBytes: bigint | null
    version: number | null
  }

  export type VaultDocumentMinAggregateOutputType = {
    id: string | null
    title: string | null
    category: string | null
    description: string | null
    status: string | null
    clientId: string | null
    fileName: string | null
    mimeType: string | null
    sizeBytes: bigint | null
    storageKey: string | null
    uploadedBy: string | null
    version: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type VaultDocumentMaxAggregateOutputType = {
    id: string | null
    title: string | null
    category: string | null
    description: string | null
    status: string | null
    clientId: string | null
    fileName: string | null
    mimeType: string | null
    sizeBytes: bigint | null
    storageKey: string | null
    uploadedBy: string | null
    version: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type VaultDocumentCountAggregateOutputType = {
    id: number
    title: number
    category: number
    description: number
    status: number
    clientId: number
    fileName: number
    mimeType: number
    sizeBytes: number
    storageKey: number
    uploadedBy: number
    version: number
    tags: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type VaultDocumentAvgAggregateInputType = {
    sizeBytes?: true
    version?: true
  }

  export type VaultDocumentSumAggregateInputType = {
    sizeBytes?: true
    version?: true
  }

  export type VaultDocumentMinAggregateInputType = {
    id?: true
    title?: true
    category?: true
    description?: true
    status?: true
    clientId?: true
    fileName?: true
    mimeType?: true
    sizeBytes?: true
    storageKey?: true
    uploadedBy?: true
    version?: true
    createdAt?: true
    updatedAt?: true
  }

  export type VaultDocumentMaxAggregateInputType = {
    id?: true
    title?: true
    category?: true
    description?: true
    status?: true
    clientId?: true
    fileName?: true
    mimeType?: true
    sizeBytes?: true
    storageKey?: true
    uploadedBy?: true
    version?: true
    createdAt?: true
    updatedAt?: true
  }

  export type VaultDocumentCountAggregateInputType = {
    id?: true
    title?: true
    category?: true
    description?: true
    status?: true
    clientId?: true
    fileName?: true
    mimeType?: true
    sizeBytes?: true
    storageKey?: true
    uploadedBy?: true
    version?: true
    tags?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type VaultDocumentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which VaultDocument to aggregate.
     */
    where?: VaultDocumentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VaultDocuments to fetch.
     */
    orderBy?: VaultDocumentOrderByWithRelationInput | VaultDocumentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: VaultDocumentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VaultDocuments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VaultDocuments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned VaultDocuments
    **/
    _count?: true | VaultDocumentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: VaultDocumentAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: VaultDocumentSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: VaultDocumentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: VaultDocumentMaxAggregateInputType
  }

  export type GetVaultDocumentAggregateType<T extends VaultDocumentAggregateArgs> = {
        [P in keyof T & keyof AggregateVaultDocument]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateVaultDocument[P]>
      : GetScalarType<T[P], AggregateVaultDocument[P]>
  }




  export type VaultDocumentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VaultDocumentWhereInput
    orderBy?: VaultDocumentOrderByWithAggregationInput | VaultDocumentOrderByWithAggregationInput[]
    by: VaultDocumentScalarFieldEnum[] | VaultDocumentScalarFieldEnum
    having?: VaultDocumentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: VaultDocumentCountAggregateInputType | true
    _avg?: VaultDocumentAvgAggregateInputType
    _sum?: VaultDocumentSumAggregateInputType
    _min?: VaultDocumentMinAggregateInputType
    _max?: VaultDocumentMaxAggregateInputType
  }

  export type VaultDocumentGroupByOutputType = {
    id: string
    title: string
    category: string
    description: string | null
    status: string
    clientId: string | null
    fileName: string
    mimeType: string
    sizeBytes: bigint
    storageKey: string
    uploadedBy: string
    version: number
    tags: string[]
    createdAt: Date
    updatedAt: Date
    _count: VaultDocumentCountAggregateOutputType | null
    _avg: VaultDocumentAvgAggregateOutputType | null
    _sum: VaultDocumentSumAggregateOutputType | null
    _min: VaultDocumentMinAggregateOutputType | null
    _max: VaultDocumentMaxAggregateOutputType | null
  }

  type GetVaultDocumentGroupByPayload<T extends VaultDocumentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<VaultDocumentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof VaultDocumentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], VaultDocumentGroupByOutputType[P]>
            : GetScalarType<T[P], VaultDocumentGroupByOutputType[P]>
        }
      >
    >


  export type VaultDocumentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    category?: boolean
    description?: boolean
    status?: boolean
    clientId?: boolean
    fileName?: boolean
    mimeType?: boolean
    sizeBytes?: boolean
    storageKey?: boolean
    uploadedBy?: boolean
    version?: boolean
    tags?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["vaultDocument"]>

  export type VaultDocumentSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    category?: boolean
    description?: boolean
    status?: boolean
    clientId?: boolean
    fileName?: boolean
    mimeType?: boolean
    sizeBytes?: boolean
    storageKey?: boolean
    uploadedBy?: boolean
    version?: boolean
    tags?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["vaultDocument"]>

  export type VaultDocumentSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    category?: boolean
    description?: boolean
    status?: boolean
    clientId?: boolean
    fileName?: boolean
    mimeType?: boolean
    sizeBytes?: boolean
    storageKey?: boolean
    uploadedBy?: boolean
    version?: boolean
    tags?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["vaultDocument"]>

  export type VaultDocumentSelectScalar = {
    id?: boolean
    title?: boolean
    category?: boolean
    description?: boolean
    status?: boolean
    clientId?: boolean
    fileName?: boolean
    mimeType?: boolean
    sizeBytes?: boolean
    storageKey?: boolean
    uploadedBy?: boolean
    version?: boolean
    tags?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type VaultDocumentOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "title" | "category" | "description" | "status" | "clientId" | "fileName" | "mimeType" | "sizeBytes" | "storageKey" | "uploadedBy" | "version" | "tags" | "createdAt" | "updatedAt", ExtArgs["result"]["vaultDocument"]>

  export type $VaultDocumentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "VaultDocument"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      title: string
      category: string
      description: string | null
      status: string
      clientId: string | null
      fileName: string
      mimeType: string
      sizeBytes: bigint
      storageKey: string
      uploadedBy: string
      version: number
      tags: string[]
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["vaultDocument"]>
    composites: {}
  }

  type VaultDocumentGetPayload<S extends boolean | null | undefined | VaultDocumentDefaultArgs> = $Result.GetResult<Prisma.$VaultDocumentPayload, S>

  type VaultDocumentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<VaultDocumentFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: VaultDocumentCountAggregateInputType | true
    }

  export interface VaultDocumentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['VaultDocument'], meta: { name: 'VaultDocument' } }
    /**
     * Find zero or one VaultDocument that matches the filter.
     * @param {VaultDocumentFindUniqueArgs} args - Arguments to find a VaultDocument
     * @example
     * // Get one VaultDocument
     * const vaultDocument = await prisma.vaultDocument.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends VaultDocumentFindUniqueArgs>(args: SelectSubset<T, VaultDocumentFindUniqueArgs<ExtArgs>>): Prisma__VaultDocumentClient<$Result.GetResult<Prisma.$VaultDocumentPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one VaultDocument that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {VaultDocumentFindUniqueOrThrowArgs} args - Arguments to find a VaultDocument
     * @example
     * // Get one VaultDocument
     * const vaultDocument = await prisma.vaultDocument.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends VaultDocumentFindUniqueOrThrowArgs>(args: SelectSubset<T, VaultDocumentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__VaultDocumentClient<$Result.GetResult<Prisma.$VaultDocumentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first VaultDocument that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VaultDocumentFindFirstArgs} args - Arguments to find a VaultDocument
     * @example
     * // Get one VaultDocument
     * const vaultDocument = await prisma.vaultDocument.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends VaultDocumentFindFirstArgs>(args?: SelectSubset<T, VaultDocumentFindFirstArgs<ExtArgs>>): Prisma__VaultDocumentClient<$Result.GetResult<Prisma.$VaultDocumentPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first VaultDocument that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VaultDocumentFindFirstOrThrowArgs} args - Arguments to find a VaultDocument
     * @example
     * // Get one VaultDocument
     * const vaultDocument = await prisma.vaultDocument.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends VaultDocumentFindFirstOrThrowArgs>(args?: SelectSubset<T, VaultDocumentFindFirstOrThrowArgs<ExtArgs>>): Prisma__VaultDocumentClient<$Result.GetResult<Prisma.$VaultDocumentPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more VaultDocuments that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VaultDocumentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all VaultDocuments
     * const vaultDocuments = await prisma.vaultDocument.findMany()
     * 
     * // Get first 10 VaultDocuments
     * const vaultDocuments = await prisma.vaultDocument.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const vaultDocumentWithIdOnly = await prisma.vaultDocument.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends VaultDocumentFindManyArgs>(args?: SelectSubset<T, VaultDocumentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VaultDocumentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a VaultDocument.
     * @param {VaultDocumentCreateArgs} args - Arguments to create a VaultDocument.
     * @example
     * // Create one VaultDocument
     * const VaultDocument = await prisma.vaultDocument.create({
     *   data: {
     *     // ... data to create a VaultDocument
     *   }
     * })
     * 
     */
    create<T extends VaultDocumentCreateArgs>(args: SelectSubset<T, VaultDocumentCreateArgs<ExtArgs>>): Prisma__VaultDocumentClient<$Result.GetResult<Prisma.$VaultDocumentPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many VaultDocuments.
     * @param {VaultDocumentCreateManyArgs} args - Arguments to create many VaultDocuments.
     * @example
     * // Create many VaultDocuments
     * const vaultDocument = await prisma.vaultDocument.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends VaultDocumentCreateManyArgs>(args?: SelectSubset<T, VaultDocumentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many VaultDocuments and returns the data saved in the database.
     * @param {VaultDocumentCreateManyAndReturnArgs} args - Arguments to create many VaultDocuments.
     * @example
     * // Create many VaultDocuments
     * const vaultDocument = await prisma.vaultDocument.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many VaultDocuments and only return the `id`
     * const vaultDocumentWithIdOnly = await prisma.vaultDocument.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends VaultDocumentCreateManyAndReturnArgs>(args?: SelectSubset<T, VaultDocumentCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VaultDocumentPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a VaultDocument.
     * @param {VaultDocumentDeleteArgs} args - Arguments to delete one VaultDocument.
     * @example
     * // Delete one VaultDocument
     * const VaultDocument = await prisma.vaultDocument.delete({
     *   where: {
     *     // ... filter to delete one VaultDocument
     *   }
     * })
     * 
     */
    delete<T extends VaultDocumentDeleteArgs>(args: SelectSubset<T, VaultDocumentDeleteArgs<ExtArgs>>): Prisma__VaultDocumentClient<$Result.GetResult<Prisma.$VaultDocumentPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one VaultDocument.
     * @param {VaultDocumentUpdateArgs} args - Arguments to update one VaultDocument.
     * @example
     * // Update one VaultDocument
     * const vaultDocument = await prisma.vaultDocument.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends VaultDocumentUpdateArgs>(args: SelectSubset<T, VaultDocumentUpdateArgs<ExtArgs>>): Prisma__VaultDocumentClient<$Result.GetResult<Prisma.$VaultDocumentPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more VaultDocuments.
     * @param {VaultDocumentDeleteManyArgs} args - Arguments to filter VaultDocuments to delete.
     * @example
     * // Delete a few VaultDocuments
     * const { count } = await prisma.vaultDocument.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends VaultDocumentDeleteManyArgs>(args?: SelectSubset<T, VaultDocumentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more VaultDocuments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VaultDocumentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many VaultDocuments
     * const vaultDocument = await prisma.vaultDocument.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends VaultDocumentUpdateManyArgs>(args: SelectSubset<T, VaultDocumentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more VaultDocuments and returns the data updated in the database.
     * @param {VaultDocumentUpdateManyAndReturnArgs} args - Arguments to update many VaultDocuments.
     * @example
     * // Update many VaultDocuments
     * const vaultDocument = await prisma.vaultDocument.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more VaultDocuments and only return the `id`
     * const vaultDocumentWithIdOnly = await prisma.vaultDocument.updateManyAndReturn({
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
    updateManyAndReturn<T extends VaultDocumentUpdateManyAndReturnArgs>(args: SelectSubset<T, VaultDocumentUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VaultDocumentPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one VaultDocument.
     * @param {VaultDocumentUpsertArgs} args - Arguments to update or create a VaultDocument.
     * @example
     * // Update or create a VaultDocument
     * const vaultDocument = await prisma.vaultDocument.upsert({
     *   create: {
     *     // ... data to create a VaultDocument
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the VaultDocument we want to update
     *   }
     * })
     */
    upsert<T extends VaultDocumentUpsertArgs>(args: SelectSubset<T, VaultDocumentUpsertArgs<ExtArgs>>): Prisma__VaultDocumentClient<$Result.GetResult<Prisma.$VaultDocumentPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of VaultDocuments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VaultDocumentCountArgs} args - Arguments to filter VaultDocuments to count.
     * @example
     * // Count the number of VaultDocuments
     * const count = await prisma.vaultDocument.count({
     *   where: {
     *     // ... the filter for the VaultDocuments we want to count
     *   }
     * })
    **/
    count<T extends VaultDocumentCountArgs>(
      args?: Subset<T, VaultDocumentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], VaultDocumentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a VaultDocument.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VaultDocumentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends VaultDocumentAggregateArgs>(args: Subset<T, VaultDocumentAggregateArgs>): Prisma.PrismaPromise<GetVaultDocumentAggregateType<T>>

    /**
     * Group by VaultDocument.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VaultDocumentGroupByArgs} args - Group by arguments.
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
      T extends VaultDocumentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: VaultDocumentGroupByArgs['orderBy'] }
        : { orderBy?: VaultDocumentGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, VaultDocumentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetVaultDocumentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the VaultDocument model
   */
  readonly fields: VaultDocumentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for VaultDocument.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__VaultDocumentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
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
   * Fields of the VaultDocument model
   */
  interface VaultDocumentFieldRefs {
    readonly id: FieldRef<"VaultDocument", 'String'>
    readonly title: FieldRef<"VaultDocument", 'String'>
    readonly category: FieldRef<"VaultDocument", 'String'>
    readonly description: FieldRef<"VaultDocument", 'String'>
    readonly status: FieldRef<"VaultDocument", 'String'>
    readonly clientId: FieldRef<"VaultDocument", 'String'>
    readonly fileName: FieldRef<"VaultDocument", 'String'>
    readonly mimeType: FieldRef<"VaultDocument", 'String'>
    readonly sizeBytes: FieldRef<"VaultDocument", 'BigInt'>
    readonly storageKey: FieldRef<"VaultDocument", 'String'>
    readonly uploadedBy: FieldRef<"VaultDocument", 'String'>
    readonly version: FieldRef<"VaultDocument", 'Int'>
    readonly tags: FieldRef<"VaultDocument", 'String[]'>
    readonly createdAt: FieldRef<"VaultDocument", 'DateTime'>
    readonly updatedAt: FieldRef<"VaultDocument", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * VaultDocument findUnique
   */
  export type VaultDocumentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VaultDocument
     */
    select?: VaultDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VaultDocument
     */
    omit?: VaultDocumentOmit<ExtArgs> | null
    /**
     * Filter, which VaultDocument to fetch.
     */
    where: VaultDocumentWhereUniqueInput
  }

  /**
   * VaultDocument findUniqueOrThrow
   */
  export type VaultDocumentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VaultDocument
     */
    select?: VaultDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VaultDocument
     */
    omit?: VaultDocumentOmit<ExtArgs> | null
    /**
     * Filter, which VaultDocument to fetch.
     */
    where: VaultDocumentWhereUniqueInput
  }

  /**
   * VaultDocument findFirst
   */
  export type VaultDocumentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VaultDocument
     */
    select?: VaultDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VaultDocument
     */
    omit?: VaultDocumentOmit<ExtArgs> | null
    /**
     * Filter, which VaultDocument to fetch.
     */
    where?: VaultDocumentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VaultDocuments to fetch.
     */
    orderBy?: VaultDocumentOrderByWithRelationInput | VaultDocumentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for VaultDocuments.
     */
    cursor?: VaultDocumentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VaultDocuments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VaultDocuments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VaultDocuments.
     */
    distinct?: VaultDocumentScalarFieldEnum | VaultDocumentScalarFieldEnum[]
  }

  /**
   * VaultDocument findFirstOrThrow
   */
  export type VaultDocumentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VaultDocument
     */
    select?: VaultDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VaultDocument
     */
    omit?: VaultDocumentOmit<ExtArgs> | null
    /**
     * Filter, which VaultDocument to fetch.
     */
    where?: VaultDocumentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VaultDocuments to fetch.
     */
    orderBy?: VaultDocumentOrderByWithRelationInput | VaultDocumentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for VaultDocuments.
     */
    cursor?: VaultDocumentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VaultDocuments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VaultDocuments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VaultDocuments.
     */
    distinct?: VaultDocumentScalarFieldEnum | VaultDocumentScalarFieldEnum[]
  }

  /**
   * VaultDocument findMany
   */
  export type VaultDocumentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VaultDocument
     */
    select?: VaultDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VaultDocument
     */
    omit?: VaultDocumentOmit<ExtArgs> | null
    /**
     * Filter, which VaultDocuments to fetch.
     */
    where?: VaultDocumentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VaultDocuments to fetch.
     */
    orderBy?: VaultDocumentOrderByWithRelationInput | VaultDocumentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing VaultDocuments.
     */
    cursor?: VaultDocumentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VaultDocuments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VaultDocuments.
     */
    skip?: number
    distinct?: VaultDocumentScalarFieldEnum | VaultDocumentScalarFieldEnum[]
  }

  /**
   * VaultDocument create
   */
  export type VaultDocumentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VaultDocument
     */
    select?: VaultDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VaultDocument
     */
    omit?: VaultDocumentOmit<ExtArgs> | null
    /**
     * The data needed to create a VaultDocument.
     */
    data: XOR<VaultDocumentCreateInput, VaultDocumentUncheckedCreateInput>
  }

  /**
   * VaultDocument createMany
   */
  export type VaultDocumentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many VaultDocuments.
     */
    data: VaultDocumentCreateManyInput | VaultDocumentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * VaultDocument createManyAndReturn
   */
  export type VaultDocumentCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VaultDocument
     */
    select?: VaultDocumentSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the VaultDocument
     */
    omit?: VaultDocumentOmit<ExtArgs> | null
    /**
     * The data used to create many VaultDocuments.
     */
    data: VaultDocumentCreateManyInput | VaultDocumentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * VaultDocument update
   */
  export type VaultDocumentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VaultDocument
     */
    select?: VaultDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VaultDocument
     */
    omit?: VaultDocumentOmit<ExtArgs> | null
    /**
     * The data needed to update a VaultDocument.
     */
    data: XOR<VaultDocumentUpdateInput, VaultDocumentUncheckedUpdateInput>
    /**
     * Choose, which VaultDocument to update.
     */
    where: VaultDocumentWhereUniqueInput
  }

  /**
   * VaultDocument updateMany
   */
  export type VaultDocumentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update VaultDocuments.
     */
    data: XOR<VaultDocumentUpdateManyMutationInput, VaultDocumentUncheckedUpdateManyInput>
    /**
     * Filter which VaultDocuments to update
     */
    where?: VaultDocumentWhereInput
    /**
     * Limit how many VaultDocuments to update.
     */
    limit?: number
  }

  /**
   * VaultDocument updateManyAndReturn
   */
  export type VaultDocumentUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VaultDocument
     */
    select?: VaultDocumentSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the VaultDocument
     */
    omit?: VaultDocumentOmit<ExtArgs> | null
    /**
     * The data used to update VaultDocuments.
     */
    data: XOR<VaultDocumentUpdateManyMutationInput, VaultDocumentUncheckedUpdateManyInput>
    /**
     * Filter which VaultDocuments to update
     */
    where?: VaultDocumentWhereInput
    /**
     * Limit how many VaultDocuments to update.
     */
    limit?: number
  }

  /**
   * VaultDocument upsert
   */
  export type VaultDocumentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VaultDocument
     */
    select?: VaultDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VaultDocument
     */
    omit?: VaultDocumentOmit<ExtArgs> | null
    /**
     * The filter to search for the VaultDocument to update in case it exists.
     */
    where: VaultDocumentWhereUniqueInput
    /**
     * In case the VaultDocument found by the `where` argument doesn't exist, create a new VaultDocument with this data.
     */
    create: XOR<VaultDocumentCreateInput, VaultDocumentUncheckedCreateInput>
    /**
     * In case the VaultDocument was found with the provided `where` argument, update it with this data.
     */
    update: XOR<VaultDocumentUpdateInput, VaultDocumentUncheckedUpdateInput>
  }

  /**
   * VaultDocument delete
   */
  export type VaultDocumentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VaultDocument
     */
    select?: VaultDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VaultDocument
     */
    omit?: VaultDocumentOmit<ExtArgs> | null
    /**
     * Filter which VaultDocument to delete.
     */
    where: VaultDocumentWhereUniqueInput
  }

  /**
   * VaultDocument deleteMany
   */
  export type VaultDocumentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which VaultDocuments to delete
     */
    where?: VaultDocumentWhereInput
    /**
     * Limit how many VaultDocuments to delete.
     */
    limit?: number
  }

  /**
   * VaultDocument without action
   */
  export type VaultDocumentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VaultDocument
     */
    select?: VaultDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VaultDocument
     */
    omit?: VaultDocumentOmit<ExtArgs> | null
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


  export const FileRecordScalarFieldEnum: {
    id: 'id',
    clientId: 'clientId',
    fileName: 'fileName',
    storageKey: 'storageKey',
    mimeType: 'mimeType',
    sizeBytes: 'sizeBytes',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type FileRecordScalarFieldEnum = (typeof FileRecordScalarFieldEnum)[keyof typeof FileRecordScalarFieldEnum]


  export const VaultDocumentScalarFieldEnum: {
    id: 'id',
    title: 'title',
    category: 'category',
    description: 'description',
    status: 'status',
    clientId: 'clientId',
    fileName: 'fileName',
    mimeType: 'mimeType',
    sizeBytes: 'sizeBytes',
    storageKey: 'storageKey',
    uploadedBy: 'uploadedBy',
    version: 'version',
    tags: 'tags',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type VaultDocumentScalarFieldEnum = (typeof VaultDocumentScalarFieldEnum)[keyof typeof VaultDocumentScalarFieldEnum]


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
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


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


  export type FileRecordWhereInput = {
    AND?: FileRecordWhereInput | FileRecordWhereInput[]
    OR?: FileRecordWhereInput[]
    NOT?: FileRecordWhereInput | FileRecordWhereInput[]
    id?: StringFilter<"FileRecord"> | string
    clientId?: StringFilter<"FileRecord"> | string
    fileName?: StringFilter<"FileRecord"> | string
    storageKey?: StringFilter<"FileRecord"> | string
    mimeType?: StringFilter<"FileRecord"> | string
    sizeBytes?: BigIntFilter<"FileRecord"> | bigint | number
    createdAt?: DateTimeFilter<"FileRecord"> | Date | string
    updatedAt?: DateTimeFilter<"FileRecord"> | Date | string
  }

  export type FileRecordOrderByWithRelationInput = {
    id?: SortOrder
    clientId?: SortOrder
    fileName?: SortOrder
    storageKey?: SortOrder
    mimeType?: SortOrder
    sizeBytes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type FileRecordWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: FileRecordWhereInput | FileRecordWhereInput[]
    OR?: FileRecordWhereInput[]
    NOT?: FileRecordWhereInput | FileRecordWhereInput[]
    clientId?: StringFilter<"FileRecord"> | string
    fileName?: StringFilter<"FileRecord"> | string
    storageKey?: StringFilter<"FileRecord"> | string
    mimeType?: StringFilter<"FileRecord"> | string
    sizeBytes?: BigIntFilter<"FileRecord"> | bigint | number
    createdAt?: DateTimeFilter<"FileRecord"> | Date | string
    updatedAt?: DateTimeFilter<"FileRecord"> | Date | string
  }, "id">

  export type FileRecordOrderByWithAggregationInput = {
    id?: SortOrder
    clientId?: SortOrder
    fileName?: SortOrder
    storageKey?: SortOrder
    mimeType?: SortOrder
    sizeBytes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: FileRecordCountOrderByAggregateInput
    _avg?: FileRecordAvgOrderByAggregateInput
    _max?: FileRecordMaxOrderByAggregateInput
    _min?: FileRecordMinOrderByAggregateInput
    _sum?: FileRecordSumOrderByAggregateInput
  }

  export type FileRecordScalarWhereWithAggregatesInput = {
    AND?: FileRecordScalarWhereWithAggregatesInput | FileRecordScalarWhereWithAggregatesInput[]
    OR?: FileRecordScalarWhereWithAggregatesInput[]
    NOT?: FileRecordScalarWhereWithAggregatesInput | FileRecordScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"FileRecord"> | string
    clientId?: StringWithAggregatesFilter<"FileRecord"> | string
    fileName?: StringWithAggregatesFilter<"FileRecord"> | string
    storageKey?: StringWithAggregatesFilter<"FileRecord"> | string
    mimeType?: StringWithAggregatesFilter<"FileRecord"> | string
    sizeBytes?: BigIntWithAggregatesFilter<"FileRecord"> | bigint | number
    createdAt?: DateTimeWithAggregatesFilter<"FileRecord"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"FileRecord"> | Date | string
  }

  export type VaultDocumentWhereInput = {
    AND?: VaultDocumentWhereInput | VaultDocumentWhereInput[]
    OR?: VaultDocumentWhereInput[]
    NOT?: VaultDocumentWhereInput | VaultDocumentWhereInput[]
    id?: StringFilter<"VaultDocument"> | string
    title?: StringFilter<"VaultDocument"> | string
    category?: StringFilter<"VaultDocument"> | string
    description?: StringNullableFilter<"VaultDocument"> | string | null
    status?: StringFilter<"VaultDocument"> | string
    clientId?: StringNullableFilter<"VaultDocument"> | string | null
    fileName?: StringFilter<"VaultDocument"> | string
    mimeType?: StringFilter<"VaultDocument"> | string
    sizeBytes?: BigIntFilter<"VaultDocument"> | bigint | number
    storageKey?: StringFilter<"VaultDocument"> | string
    uploadedBy?: StringFilter<"VaultDocument"> | string
    version?: IntFilter<"VaultDocument"> | number
    tags?: StringNullableListFilter<"VaultDocument">
    createdAt?: DateTimeFilter<"VaultDocument"> | Date | string
    updatedAt?: DateTimeFilter<"VaultDocument"> | Date | string
  }

  export type VaultDocumentOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrder
    category?: SortOrder
    description?: SortOrderInput | SortOrder
    status?: SortOrder
    clientId?: SortOrderInput | SortOrder
    fileName?: SortOrder
    mimeType?: SortOrder
    sizeBytes?: SortOrder
    storageKey?: SortOrder
    uploadedBy?: SortOrder
    version?: SortOrder
    tags?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type VaultDocumentWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: VaultDocumentWhereInput | VaultDocumentWhereInput[]
    OR?: VaultDocumentWhereInput[]
    NOT?: VaultDocumentWhereInput | VaultDocumentWhereInput[]
    title?: StringFilter<"VaultDocument"> | string
    category?: StringFilter<"VaultDocument"> | string
    description?: StringNullableFilter<"VaultDocument"> | string | null
    status?: StringFilter<"VaultDocument"> | string
    clientId?: StringNullableFilter<"VaultDocument"> | string | null
    fileName?: StringFilter<"VaultDocument"> | string
    mimeType?: StringFilter<"VaultDocument"> | string
    sizeBytes?: BigIntFilter<"VaultDocument"> | bigint | number
    storageKey?: StringFilter<"VaultDocument"> | string
    uploadedBy?: StringFilter<"VaultDocument"> | string
    version?: IntFilter<"VaultDocument"> | number
    tags?: StringNullableListFilter<"VaultDocument">
    createdAt?: DateTimeFilter<"VaultDocument"> | Date | string
    updatedAt?: DateTimeFilter<"VaultDocument"> | Date | string
  }, "id">

  export type VaultDocumentOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrder
    category?: SortOrder
    description?: SortOrderInput | SortOrder
    status?: SortOrder
    clientId?: SortOrderInput | SortOrder
    fileName?: SortOrder
    mimeType?: SortOrder
    sizeBytes?: SortOrder
    storageKey?: SortOrder
    uploadedBy?: SortOrder
    version?: SortOrder
    tags?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: VaultDocumentCountOrderByAggregateInput
    _avg?: VaultDocumentAvgOrderByAggregateInput
    _max?: VaultDocumentMaxOrderByAggregateInput
    _min?: VaultDocumentMinOrderByAggregateInput
    _sum?: VaultDocumentSumOrderByAggregateInput
  }

  export type VaultDocumentScalarWhereWithAggregatesInput = {
    AND?: VaultDocumentScalarWhereWithAggregatesInput | VaultDocumentScalarWhereWithAggregatesInput[]
    OR?: VaultDocumentScalarWhereWithAggregatesInput[]
    NOT?: VaultDocumentScalarWhereWithAggregatesInput | VaultDocumentScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"VaultDocument"> | string
    title?: StringWithAggregatesFilter<"VaultDocument"> | string
    category?: StringWithAggregatesFilter<"VaultDocument"> | string
    description?: StringNullableWithAggregatesFilter<"VaultDocument"> | string | null
    status?: StringWithAggregatesFilter<"VaultDocument"> | string
    clientId?: StringNullableWithAggregatesFilter<"VaultDocument"> | string | null
    fileName?: StringWithAggregatesFilter<"VaultDocument"> | string
    mimeType?: StringWithAggregatesFilter<"VaultDocument"> | string
    sizeBytes?: BigIntWithAggregatesFilter<"VaultDocument"> | bigint | number
    storageKey?: StringWithAggregatesFilter<"VaultDocument"> | string
    uploadedBy?: StringWithAggregatesFilter<"VaultDocument"> | string
    version?: IntWithAggregatesFilter<"VaultDocument"> | number
    tags?: StringNullableListFilter<"VaultDocument">
    createdAt?: DateTimeWithAggregatesFilter<"VaultDocument"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"VaultDocument"> | Date | string
  }

  export type FileRecordCreateInput = {
    id?: string
    clientId: string
    fileName: string
    storageKey: string
    mimeType: string
    sizeBytes: bigint | number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type FileRecordUncheckedCreateInput = {
    id?: string
    clientId: string
    fileName: string
    storageKey: string
    mimeType: string
    sizeBytes: bigint | number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type FileRecordUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: StringFieldUpdateOperationsInput | string
    fileName?: StringFieldUpdateOperationsInput | string
    storageKey?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    sizeBytes?: BigIntFieldUpdateOperationsInput | bigint | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FileRecordUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: StringFieldUpdateOperationsInput | string
    fileName?: StringFieldUpdateOperationsInput | string
    storageKey?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    sizeBytes?: BigIntFieldUpdateOperationsInput | bigint | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FileRecordCreateManyInput = {
    id?: string
    clientId: string
    fileName: string
    storageKey: string
    mimeType: string
    sizeBytes: bigint | number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type FileRecordUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: StringFieldUpdateOperationsInput | string
    fileName?: StringFieldUpdateOperationsInput | string
    storageKey?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    sizeBytes?: BigIntFieldUpdateOperationsInput | bigint | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FileRecordUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    clientId?: StringFieldUpdateOperationsInput | string
    fileName?: StringFieldUpdateOperationsInput | string
    storageKey?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    sizeBytes?: BigIntFieldUpdateOperationsInput | bigint | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VaultDocumentCreateInput = {
    id?: string
    title: string
    category?: string
    description?: string | null
    status?: string
    clientId?: string | null
    fileName: string
    mimeType: string
    sizeBytes?: bigint | number
    storageKey: string
    uploadedBy?: string
    version?: number
    tags?: VaultDocumentCreatetagsInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type VaultDocumentUncheckedCreateInput = {
    id?: string
    title: string
    category?: string
    description?: string | null
    status?: string
    clientId?: string | null
    fileName: string
    mimeType: string
    sizeBytes?: bigint | number
    storageKey: string
    uploadedBy?: string
    version?: number
    tags?: VaultDocumentCreatetagsInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type VaultDocumentUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    clientId?: NullableStringFieldUpdateOperationsInput | string | null
    fileName?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    sizeBytes?: BigIntFieldUpdateOperationsInput | bigint | number
    storageKey?: StringFieldUpdateOperationsInput | string
    uploadedBy?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    tags?: VaultDocumentUpdatetagsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VaultDocumentUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    clientId?: NullableStringFieldUpdateOperationsInput | string | null
    fileName?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    sizeBytes?: BigIntFieldUpdateOperationsInput | bigint | number
    storageKey?: StringFieldUpdateOperationsInput | string
    uploadedBy?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    tags?: VaultDocumentUpdatetagsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VaultDocumentCreateManyInput = {
    id?: string
    title: string
    category?: string
    description?: string | null
    status?: string
    clientId?: string | null
    fileName: string
    mimeType: string
    sizeBytes?: bigint | number
    storageKey: string
    uploadedBy?: string
    version?: number
    tags?: VaultDocumentCreatetagsInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type VaultDocumentUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    clientId?: NullableStringFieldUpdateOperationsInput | string | null
    fileName?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    sizeBytes?: BigIntFieldUpdateOperationsInput | bigint | number
    storageKey?: StringFieldUpdateOperationsInput | string
    uploadedBy?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    tags?: VaultDocumentUpdatetagsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VaultDocumentUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    clientId?: NullableStringFieldUpdateOperationsInput | string | null
    fileName?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    sizeBytes?: BigIntFieldUpdateOperationsInput | bigint | number
    storageKey?: StringFieldUpdateOperationsInput | string
    uploadedBy?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    tags?: VaultDocumentUpdatetagsInput | string[]
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

  export type FileRecordCountOrderByAggregateInput = {
    id?: SortOrder
    clientId?: SortOrder
    fileName?: SortOrder
    storageKey?: SortOrder
    mimeType?: SortOrder
    sizeBytes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type FileRecordAvgOrderByAggregateInput = {
    sizeBytes?: SortOrder
  }

  export type FileRecordMaxOrderByAggregateInput = {
    id?: SortOrder
    clientId?: SortOrder
    fileName?: SortOrder
    storageKey?: SortOrder
    mimeType?: SortOrder
    sizeBytes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type FileRecordMinOrderByAggregateInput = {
    id?: SortOrder
    clientId?: SortOrder
    fileName?: SortOrder
    storageKey?: SortOrder
    mimeType?: SortOrder
    sizeBytes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type FileRecordSumOrderByAggregateInput = {
    sizeBytes?: SortOrder
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

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    has?: string | StringFieldRefInput<$PrismaModel> | null
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type VaultDocumentCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    category?: SortOrder
    description?: SortOrder
    status?: SortOrder
    clientId?: SortOrder
    fileName?: SortOrder
    mimeType?: SortOrder
    sizeBytes?: SortOrder
    storageKey?: SortOrder
    uploadedBy?: SortOrder
    version?: SortOrder
    tags?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type VaultDocumentAvgOrderByAggregateInput = {
    sizeBytes?: SortOrder
    version?: SortOrder
  }

  export type VaultDocumentMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    category?: SortOrder
    description?: SortOrder
    status?: SortOrder
    clientId?: SortOrder
    fileName?: SortOrder
    mimeType?: SortOrder
    sizeBytes?: SortOrder
    storageKey?: SortOrder
    uploadedBy?: SortOrder
    version?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type VaultDocumentMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    category?: SortOrder
    description?: SortOrder
    status?: SortOrder
    clientId?: SortOrder
    fileName?: SortOrder
    mimeType?: SortOrder
    sizeBytes?: SortOrder
    storageKey?: SortOrder
    uploadedBy?: SortOrder
    version?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type VaultDocumentSumOrderByAggregateInput = {
    sizeBytes?: SortOrder
    version?: SortOrder
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

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type BigIntFieldUpdateOperationsInput = {
    set?: bigint | number
    increment?: bigint | number
    decrement?: bigint | number
    multiply?: bigint | number
    divide?: bigint | number
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type VaultDocumentCreatetagsInput = {
    set: string[]
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type VaultDocumentUpdatetagsInput = {
    set?: string[]
    push?: string | string[]
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