#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/2144ef8fb2f1307e7d64fad79f33620f030134386ec647ab77554c82bfee2080/contract';
import endContract from '../../snapshots/2144ef8fb2f1307e7d64fad79f33620f030134386ec647ab77554c82bfee2080/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/46a672765714e51959cbcf58f48342cf76dc3704ea3eff443a181a8f25308614/contract';
import startContract from '../../snapshots/46a672765714e51959cbcf58f48342cf76dc3704ea3eff443a181a8f25308614/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, placeholder } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'User',
        column: col('password', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.dataTransform(endContract, 'backfill-User-password', {
        check: () => placeholder('backfill-User-password:check'),
        run: () => placeholder('backfill-User-password:run'),
      }),
      this.setNotNull({ schema: 'public', table: 'User', column: 'password' }),
      this.dataTransform(endContract, 'handle-nulls-User-username', {
        check: () => placeholder('handle-nulls-User-username:check'),
        run: () => placeholder('handle-nulls-User-username:run'),
      }),
      this.setNotNull({ schema: 'public', table: 'User', column: 'username' }),
      this.addUnique({
        schema: 'public',
        table: 'User',
        constraint: 'User_password_key',
        columns: ['password'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
