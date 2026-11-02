import { sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

// El teclado del celular (sobre todo el de Samsung en Android) pone la primera
// letra del email en mayúscula y a veces le agrega un espacio al final. Para
// la base "Juan@gmail.com" y "juan@gmail.com" eran cuentas distintas, así que
// la persona no podía entrar. Todo email se guarda y se busca así.
export function normalizarEmail(email: unknown): string {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

// Compara sin importar mayúsculas ni espacios: también encuentra las cuentas
// que se crearon antes, cuando el email se guardaba tal cual se escribió.
export function mismoEmail(columna: AnyPgColumn, email: string): SQL {
  return sql`lower(trim(${columna})) = ${normalizarEmail(email)}`;
}
