import { Prisma } from '@prisma/client';

// Export Symbol for bypassing Prisma 6 runtime validation
export const INCLUDE_DELETED = Symbol('includeDeleted');

export const softDeleteExtension = Prisma.defineExtension({
  name: 'softDelete',
  model: {
    $allModels: {
      async delete<T, A>(
        this: T,
        args: Prisma.Exact<A, Prisma.Args<T, 'delete'>>,
      ): Promise<Prisma.Result<T, A, 'delete'>> {
        const context = Prisma.getExtensionContext(this);
        const modelName = (context as any).name;

        if (['Product', 'Category'].includes(modelName)) {
          const timestamp = Math.floor(Date.now() / 1000);
          const safeArgs = args as any;

          const record = await (context as any).findUnique({
            where: safeArgs.where,
            select: { slug: true },
          });

          if (!record) {
            return (context as any).update(args);
          }

          return (context as any).update({
            where: safeArgs.where,
            data: {
              deletedAt: new Date(),
              isActive: false,
              slug: `${record.slug}-deleted-${timestamp}`,
            },
          });
        }

        return (context as any).delete(args);
      },

      async deleteMany<T, A>(
        this: T,
        args?: Prisma.Exact<A, Prisma.Args<T, 'deleteMany'>>,
      ): Promise<Prisma.Result<T, A, 'deleteMany'>> {
        const context = Prisma.getExtensionContext(this);
        const modelName = (context as any).name;

        if (['Product', 'Category'].includes(modelName)) {
          const safeArgs = args as any;
          return (context as any).updateMany({
            where: safeArgs?.where,
            data: {
              deletedAt: new Date(),
              isActive: false,
            },
          });
        }

        return (context as any).deleteMany(args);
      },
    },
  },
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        try {
          const softArgs = { ...(args || {}) } as any;
          const isSoftDeleteModel = ['product', 'category'].includes(
            model.toLowerCase(),
          );

          if (isSoftDeleteModel) {
            if (
              [
                'findMany',
                'findFirst',
                'findUnique',
                'count',
                'aggregate',
                'groupBy',
              ].includes(operation)
            ) {
              const includeDeleted = softArgs[INCLUDE_DELETED] === true;
              delete softArgs[INCLUDE_DELETED]; // Always clean up for Prisma

              if (includeDeleted) {
                return query(softArgs);
              }

              if (softArgs.where?.deletedAt === undefined) {
                softArgs.where = {
                  ...softArgs.where,
                  deletedAt: null,
                };
              }
            }
          }

          // Apply filters to relations in include/select recursively
          const applyRelationalFilter = (obj: any) => {
            if (!obj || typeof obj !== 'object') return;

            if (obj[INCLUDE_DELETED] === true) {
              delete obj[INCLUDE_DELETED];
              return; // Don't filter relations if includeDeleted is set at this level
            }

            for (const key in obj) {
              // Check if this key corresponds to a soft-delete model in relations
              if (
                [
                  'product',
                  'category',
                  'children',
                  'parent',
                  'products',
                  'items',
                ].includes(key.toLowerCase())
              ) {
                if (obj[key] === true) {
                  obj[key] = { where: { deletedAt: null } };
                } else if (typeof obj[key] === 'object') {
                  obj[key].where = {
                    ...obj[key].where,
                    deletedAt: null,
                  };
                  applyRelationalFilter(obj[key].include || obj[key].select);
                }
              } else if (
                key === 'include' ||
                key === 'select' ||
                key === '_count'
              ) {
                applyRelationalFilter(obj[key]);
              }
            }
          };

          applyRelationalFilter(softArgs);
          return query(softArgs);
        } catch (error: any) {
          console.error(
            `SoftDelete Extension Error on ${model}.${operation}:`,
            error,
          );
          throw error;
        }
      },
    },
  },
});
