import { Config } from "@remotion/cli/config";
import path from "path";

// Resolve o alias "@" usado nos imports (apontando para /src)
// Necessário para o Remotion Studio. A rota /api/render faz o
// mesmo registro programaticamente em webpackOverride.
Config.overrideWebpackConfig((config) => {
  return {
    ...config,
    resolve: {
      ...(config.resolve ?? {}),
      alias: {
        ...((config.resolve && config.resolve.alias) || {}),
        "@": path.join(process.cwd(), "src"),
      },
    },
  };
});
