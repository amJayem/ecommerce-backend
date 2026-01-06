import { Prisma } from '@prisma/client';

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
        if (['Product', 'Category'].includes(model)) {
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
            const softArgs = args as any;
            softArgs.where = {
              ...softArgs.where,
              deletedAt: null,
            };
          }
        }

        // Apply filters to relations in include/select recursively
        const applyRelationalFilter = (obj: any) => {
          if (!obj || typeof obj !== 'object') return;

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
              ].includes(key)
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
            } else if (key === 'include' || key === 'select') {
              applyRelationalFilter(obj[key]);
            }
          }
        };

        applyRelationalFilter(args);
        return query(args);
      },
    },
  },
});
