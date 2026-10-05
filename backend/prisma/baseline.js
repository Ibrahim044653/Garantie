/**
 * Amorcage de l'historique de migrations.
 *
 * La base de demonstration a ete creee avec `prisma db push`, qui ne laisse
 * aucune trace dans `_prisma_migrations`. `migrate deploy` echouerait donc
 * avec P3005 : schema non vide, historique absent.
 *
 * Ce script marque les migrations deja refletees par le schema comme
 * appliquees, uniquement lorsque les deux conditions sont reunies :
 *   - aucun historique de migrations,
 *   - mais des tables applicatives presentes.
 *
 * Sur une base vierge il ne fait rien et `migrate deploy` cree tout.
 * Sur une base deja suivie il ne fait rien non plus. Il est donc sans effet
 * passe le premier deploiement.
 *
 * Limite assumee : il suppose que le schema en place correspond bien a ces
 * migrations, ce qui est le cas lorsqu'il resulte d'un `db push` du meme
 * schema. Ne pas l'utiliser pour rattraper une base divergente.
 */
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const DEJA_REFLETEES = [
  '20260819000000_postgresql_init',
  '20260819100000_v2_crm_loans_workflow',
  '20260820000000_ged_file_content_in_db',
  '20260822000000_add_login_lockout',
];

async function existe(prisma, table) {
  const r = await prisma.$queryRawUnsafe(
    `SELECT count(*)::int AS n FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1`,
    table,
  );
  return r[0].n > 0;
}

async function main() {
  const prisma = new PrismaClient();
  try {
    if (await existe(prisma, '_prisma_migrations')) {
      console.log('Baseline : historique de migrations deja present, rien a faire.');
      return;
    }
    if (!(await existe(prisma, 'User'))) {
      console.log('Baseline : base vierge, migrate deploy appliquera tout.');
      return;
    }

    console.log('Baseline : schema existant sans historique, marquage des migrations.');
    for (const migration of DEJA_REFLETEES) {
      execSync(`npx prisma migrate resolve --applied ${migration}`, { stdio: 'inherit' });
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Baseline echoue :', err);
  process.exit(1);
});
