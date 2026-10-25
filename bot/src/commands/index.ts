import { acessos } from "./acessos.js";
import { consultarkey } from "./consultarkey.js";
import { entregar } from "./entregar.js";
import { gerarkey } from "./gerarkey.js";
import { resgatar } from "./resgatar.js";
import type { Command } from "./types.js";

export const commands: Command[] = [gerarkey, entregar, consultarkey, acessos, resgatar];

export const commandMap = new Map(commands.map((c) => [c.data.name, c]));
